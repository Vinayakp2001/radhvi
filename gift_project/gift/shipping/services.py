"""
Shipping Service Layer
Business logic for shipping operations
Integrates Shiprocket with Django models
"""
import logging
from typing import Dict, List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.db import transaction

from gift.models import Order, OrderItem, Product
from gift.shipping.models import Shipment, ShippingRate
from gift.shipping.shiprocket_client import (
    ShiprocketClient,
    ShiprocketError,
    AuthenticationError,
    ValidationError,
    ServiceabilityError,
    APIError
)

logger = logging.getLogger('shiprocket')


class ShippingService:
    """
    High-level service for shipping operations
    Integrates Shiprocket with Django models
    """
    
    def __init__(self):
        """Initialize shipping service with Shiprocket client"""
        self.client = ShiprocketClient()
        self.pickup_location = settings.SHIPROCKET_PICKUP_LOCATION
        self.default_weight = settings.SHIPROCKET_DEFAULT_WEIGHT
        self.default_dimensions = settings.SHIPROCKET_DEFAULT_DIMENSIONS
        self.rate_cache_ttl = settings.SHIPROCKET_RATE_CACHE_TTL
        self.courier_preference = settings.SHIPROCKET_COURIER_PREFERENCE
    
    # ==================== HELPER METHODS ====================
    
    def _format_phone(self, phone: str) -> str:
        """
        Format phone number to 10 digits
        
        Args:
            phone: Phone number string
            
        Returns:
            Formatted 10-digit phone number
        """
        # Remove all non-digit characters
        digits = ''.join(filter(str.isdigit, phone))
        
        # Take last 10 digits
        if len(digits) >= 10:
            return digits[-10:]
        
        return digits
    
    def _format_address(self, address: str) -> str:
        """
        Format address to fit Shiprocket requirements
        
        Args:
            address: Address string
            
        Returns:
            Formatted address (max 200 chars)
        """
        return address[:200] if address else ''
    
    def _parse_dimensions(self, dimensions_str: str) -> Dict[str, float]:
        """
        Parse dimensions string (LxWxH) to dictionary
        
        Args:
            dimensions_str: Dimensions in format "20x15x10"
            
        Returns:
            Dictionary with length, breadth, height
        """
        try:
            if dimensions_str and 'x' in dimensions_str.lower():
                parts = dimensions_str.lower().replace('cm', '').strip().split('x')
                if len(parts) >= 3:
                    return {
                        'length': float(parts[0].strip()),
                        'breadth': float(parts[1].strip()),
                        'height': float(parts[2].strip())
                    }
        except (ValueError, AttributeError):
            pass
        
        # Return defaults if parsing fails
        return self.default_dimensions.copy()
    
    def _convert_weight_to_kg(self, weight_grams: Optional[Decimal]) -> float:
        """
        Convert weight from grams to kilograms
        
        Args:
            weight_grams: Weight in grams
            
        Returns:
            Weight in kilograms
        """
        if weight_grams and weight_grams > 0:
            return float(weight_grams) / 1000
        return self.default_weight

    
    # ==================== ORDER SYNCHRONIZATION ====================
    
    def sync_order_to_shiprocket(self, order: Order) -> Shipment:
        """
        Synchronize order to Shiprocket
        Creates order in Shiprocket and creates local Shipment record
        
        Args:
            order: Order instance to sync
            
        Returns:
            Created Shipment instance
            
        Raises:
            ValidationError: If order data is invalid
            ShiprocketError: If API call fails
        """
        logger.info(f"Syncing order {order.order_id} to Shiprocket...")
        
        # Check if already synced
        if hasattr(order, 'shipment') and order.shipment:
            logger.warning(f"Order {order.order_id} already has a shipment")
            return order.shipment
        
        try:
            # Validate order
            self._validate_order(order)
            
            # Prepare order payload
            order_payload = self._prepare_order_payload(order)
            
            # Create order in Shiprocket
            response = self.client.create_order(order_payload)
            
            # Extract response data
            shiprocket_order_id = response.get('order_id')
            shiprocket_shipment_id = response.get('shipment_id')
            
            if not shiprocket_order_id:
                raise ValidationError("No order_id in Shiprocket response")
            
            # Create Shipment record
            with transaction.atomic():
                shipment = Shipment.objects.create(
                    order=order,
                    shiprocket_order_id=str(shiprocket_order_id),
                    shiprocket_shipment_id=str(shiprocket_shipment_id) if shiprocket_shipment_id else '',
                    sync_status='synced',
                    status='pending'
                )
                
                # Update order
                order.shiprocket_synced = True
                order.shiprocket_sync_error = ''
                order.save(update_fields=['shiprocket_synced', 'shiprocket_sync_error'])
            
            logger.info(f"✓ Order {order.order_id} synced successfully. Shiprocket Order ID: {shiprocket_order_id}")
            return shipment
            
        except ValidationError as e:
            logger.error(f"✗ Validation error for order {order.order_id}: {str(e)}")
            order.shiprocket_sync_error = str(e)
            order.save(update_fields=['shiprocket_sync_error'])
            raise
            
        except ShiprocketError as e:
            logger.error(f"✗ Shiprocket error for order {order.order_id}: {str(e)}")
            order.shiprocket_sync_error = str(e)
            order.save(update_fields=['shiprocket_sync_error'])
            
            # Create failed shipment record for tracking
            if not hasattr(order, 'shipment'):
                Shipment.objects.create(
                    order=order,
                    shiprocket_order_id=f"FAILED_{order.order_id}",
                    sync_status='failed',
                    error_message=str(e),
                    retry_count=0
                )
            
            raise
    
    def _validate_order(self, order: Order) -> None:
        """
        Validate order has all required fields for Shiprocket
        
        Args:
            order: Order instance to validate
            
        Raises:
            ValidationError: If validation fails
        """
        errors = []
        
        # Check required fields
        if not order.customer_name:
            errors.append("Customer name is required")
        
        if not order.customer_phone:
            errors.append("Customer phone is required")
        
        if not order.customer_email:
            errors.append("Customer email is required")
        
        if not order.shipping_address:
            errors.append("Shipping address is required")
        
        if not order.shipping_city:
            errors.append("Shipping city is required")
        
        if not order.shipping_state:
            errors.append("Shipping state is required")
        
        if not order.shipping_pincode:
            errors.append("Shipping pincode is required")
        
        # Validate pincode format
        if order.shipping_pincode:
            pincode = ''.join(filter(str.isdigit, order.shipping_pincode))
            if len(pincode) != 6:
                errors.append("Pincode must be 6 digits")
        
        # Check order has items
        if not order.items.exists():
            errors.append("Order must have at least one item")
        
        # Check payment status
        if order.payment_status != 'paid' and order.payment_method != 'cod':
            errors.append("Order must be paid or COD")
        
        if errors:
            raise ValidationError("; ".join(errors))
    
    def _prepare_order_payload(self, order: Order) -> Dict:
        """
        Prepare order data payload for Shiprocket API
        
        Args:
            order: Order instance
            
        Returns:
            Dictionary with order data for Shiprocket
        """
        # Format phone number
        phone = self._format_phone(order.customer_phone)
        
        # Format address
        address = self._format_address(order.shipping_address)
        
        # Prepare order items
        order_items = self._prepare_order_items(order)
        
        # Calculate package dimensions and weight
        total_weight = self._calculate_order_weight(order)
        dimensions = self._calculate_order_dimensions(order)
        
        # Determine payment method
        payment_method = 'COD' if order.payment_method == 'cod' else 'Prepaid'
        
        # Build payload
        payload = {
            'order_id': order.order_id,
            'order_date': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'pickup_location': self.pickup_location,
            'channel_id': '',
            'comment': f'Order from Gift Shop - {order.order_id}',
            'billing_customer_name': order.customer_name,
            'billing_last_name': '',
            'billing_address': address,
            'billing_address_2': '',
            'billing_city': order.shipping_city,
            'billing_pincode': order.shipping_pincode,
            'billing_state': order.shipping_state,
            'billing_country': order.shipping_country,
            'billing_email': order.customer_email,
            'billing_phone': phone,
            'shipping_is_billing': True,
            'order_items': order_items,
            'payment_method': payment_method,
            'shipping_charges': str(order.shipping_charge),
            'giftwrap_charges': '0',
            'transaction_charges': '0',
            'total_discount': str(order.discount_amount),
            'sub_total': str(order.subtotal),
            'length': str(dimensions['length']),
            'breadth': str(dimensions['breadth']),
            'height': str(dimensions['height']),
            'weight': str(total_weight)
        }
        
        return payload
    
    def _prepare_order_items(self, order: Order) -> List[Dict]:
        """
        Transform order items to Shiprocket format
        
        Args:
            order: Order instance
            
        Returns:
            List of order items in Shiprocket format
        """
        items = []
        
        for item in order.items.all():
            items.append({
                'name': item.product_name[:100],  # Max 100 chars
                'sku': item.product.sku if item.product else 'UNKNOWN',
                'units': item.quantity,
                'selling_price': str(item.product_price),
                'discount': '0',
                'tax': '',
                'hsn': ''
            })
        
        return items
    
    def _calculate_order_weight(self, order: Order) -> float:
        """
        Calculate total weight of order in kg
        
        Args:
            order: Order instance
            
        Returns:
            Total weight in kilograms
        """
        total_weight = 0.0
        
        for item in order.items.all():
            if item.product and item.product.weight:
                # Weight is in grams, convert to kg
                item_weight = self._convert_weight_to_kg(item.product.weight)
                total_weight += item_weight * item.quantity
            else:
                # Use default weight per item
                total_weight += self.default_weight * item.quantity
        
        # Minimum weight 0.1 kg
        return max(total_weight, 0.1)
    
    def _calculate_order_dimensions(self, order: Order) -> Dict[str, float]:
        """
        Calculate package dimensions for order
        Uses largest item dimensions or defaults
        
        Args:
            order: Order instance
            
        Returns:
            Dictionary with length, breadth, height in cm
        """
        max_length = 0
        max_breadth = 0
        max_height = 0
        
        for item in order.items.all():
            if item.product and item.product.dimensions:
                dims = self._parse_dimensions(item.product.dimensions)
                max_length = max(max_length, dims['length'])
                max_breadth = max(max_breadth, dims['breadth'])
                max_height = max(max_height, dims['height'])
        
        # Use defaults if no dimensions found
        if max_length == 0:
            return self.default_dimensions.copy()
        
        return {
            'length': max_length,
            'breadth': max_breadth,
            'height': max_height
        }

    
    # ==================== SHIPPING RATE CALCULATION ====================
    
    def get_shipping_rates(self, cart, delivery_pincode: str, 
                          cod: bool = False) -> List[Dict]:
        """
        Get available shipping rates for cart
        Checks cache first, then fetches from Shiprocket
        
        Args:
            cart: Cart instance or list of cart items
            delivery_pincode: Delivery pincode
            cod: Whether Cash on Delivery
            
        Returns:
            List of courier options with rates
        """
        logger.info(f"Getting shipping rates for pincode {delivery_pincode}")
        
        # Validate pincode
        pincode = ''.join(filter(str.isdigit, delivery_pincode))
        if len(pincode) != 6:
            raise ValidationError("Invalid pincode format")
        
        # Calculate cart weight
        weight = self._calculate_package_weight(cart)
        
        # Calculate declared value
        if hasattr(cart, 'subtotal'):
            declared_value = float(cart.subtotal)
        else:
            declared_value = sum(float(item.total_price) for item in cart)
        
        # Get pickup pincode from settings
        pickup_pincode = getattr(settings, 'SHIPROCKET_PICKUP_PINCODE', '110001')
        
        # Check cache first
        cache_key = f"shipping_rates:{pickup_pincode}:{pincode}:{weight}:{cod}"
        cached_rates = cache.get(cache_key)
        
        if cached_rates:
            logger.info(f"✓ Using cached rates ({len(cached_rates)} couriers)")
            return cached_rates
        
        # Check database cache
        db_rates = ShippingRate.get_cached_rates(pickup_pincode, pincode, weight)
        if db_rates.exists():
            rates = self._format_cached_rates(db_rates)
            # Cache in memory too
            cache.set(cache_key, rates, self.rate_cache_ttl)
            logger.info(f"✓ Using database cached rates ({len(rates)} couriers)")
            return rates
        
        # Fetch from Shiprocket
        try:
            response = self.client.get_courier_serviceability(
                pickup_pincode=pickup_pincode,
                delivery_pincode=pincode,
                weight=weight,
                cod=cod,
                declared_value=declared_value
            )
            
            # Parse response
            couriers = response.get('data', {}).get('available_courier_companies', [])
            
            if not couriers:
                logger.warning(f"No couriers available for pincode {pincode}")
                return []
            
            # Format rates
            rates = self._format_shiprocket_rates(couriers)
            
            # Cache rates
            self._cache_rates(pickup_pincode, pincode, weight, couriers)
            cache.set(cache_key, rates, self.rate_cache_ttl)
            
            logger.info(f"✓ Fetched {len(rates)} courier rates from Shiprocket")
            return rates
            
        except ServiceabilityError as e:
            logger.warning(f"Serviceability error: {str(e)}")
            return []
        
        except ShiprocketError as e:
            logger.error(f"Error fetching rates: {str(e)}")
            # Return empty list instead of raising to not block checkout
            return []
    
    def _calculate_package_weight(self, cart) -> float:
        """
        Calculate total package weight from cart items
        
        Args:
            cart: Cart instance or list of items
            
        Returns:
            Total weight in kilograms
        """
        total_weight = 0.0
        
        # Handle Cart model instance
        if hasattr(cart, 'items'):
            items = cart.items.all()
        else:
            # Handle list of items
            items = cart
        
        for item in items:
            product = item.product
            quantity = item.quantity
            
            if product and product.weight:
                item_weight = self._convert_weight_to_kg(product.weight)
                total_weight += item_weight * quantity
            else:
                # Use default weight
                total_weight += self.default_weight * quantity
        
        # Minimum weight 0.1 kg
        return max(total_weight, 0.1)
    
    def _get_package_dimensions(self, cart) -> Dict[str, float]:
        """
        Get package dimensions from cart items
        Uses largest item dimensions
        
        Args:
            cart: Cart instance or list of items
            
        Returns:
            Dictionary with length, breadth, height
        """
        max_length = 0
        max_breadth = 0
        max_height = 0
        
        # Handle Cart model instance
        if hasattr(cart, 'items'):
            items = cart.items.all()
        else:
            items = cart
        
        for item in items:
            product = item.product
            if product and product.dimensions:
                dims = self._parse_dimensions(product.dimensions)
                max_length = max(max_length, dims['length'])
                max_breadth = max(max_breadth, dims['breadth'])
                max_height = max(max_height, dims['height'])
        
        # Use defaults if no dimensions found
        if max_length == 0:
            return self.default_dimensions.copy()
        
        return {
            'length': max_length,
            'breadth': max_breadth,
            'height': max_height
        }
    
    def _format_shiprocket_rates(self, couriers: List[Dict]) -> List[Dict]:
        """
        Format Shiprocket courier data to standardized format
        
        Args:
            couriers: List of courier data from Shiprocket
            
        Returns:
            List of formatted rate dictionaries
        """
        rates = []
        
        for courier in couriers:
            rates.append({
                'courier_id': courier.get('courier_company_id'),
                'courier_name': courier.get('courier_name', 'Unknown'),
                'rate': float(courier.get('rate', 0)),
                'estimated_delivery_days': courier.get('estimated_delivery_days', 'N/A'),
                'cod_available': bool(courier.get('cod', 0)),
                'rating': float(courier.get('rating', 0)),
                'etd': courier.get('etd', '')
            })
        
        return rates
    
    def _format_cached_rates(self, db_rates) -> List[Dict]:
        """
        Format database cached rates to standardized format
        
        Args:
            db_rates: QuerySet of ShippingRate objects
            
        Returns:
            List of formatted rate dictionaries
        """
        rates = []
        
        for rate in db_rates:
            rates.append({
                'courier_id': rate.courier_id,
                'courier_name': rate.courier_name,
                'rate': float(rate.rate),
                'estimated_delivery_days': str(rate.estimated_delivery_days),
                'cod_available': rate.cod_available,
                'rating': rate.rating,
                'etd': f"{rate.estimated_delivery_days} days"
            })
        
        return rates
    
    def _cache_rates(self, pickup_pincode: str, delivery_pincode: str,
                    weight: float, couriers: List[Dict]) -> None:
        """
        Cache shipping rates in database
        
        Args:
            pickup_pincode: Pickup pincode
            delivery_pincode: Delivery pincode
            weight: Package weight
            couriers: List of courier data from Shiprocket
        """
        expires_at = timezone.now() + timedelta(seconds=self.rate_cache_ttl)
        
        for courier in couriers:
            try:
                # Parse estimated delivery days
                etd_str = courier.get('estimated_delivery_days', '3-5')
                if '-' in str(etd_str):
                    # Take average of range
                    parts = str(etd_str).split('-')
                    etd = (int(parts[0]) + int(parts[1])) // 2
                else:
                    etd = int(etd_str) if str(etd_str).isdigit() else 3
                
                ShippingRate.objects.create(
                    pickup_pincode=pickup_pincode,
                    delivery_pincode=delivery_pincode,
                    weight=weight,
                    courier_id=courier.get('courier_company_id'),
                    courier_name=courier.get('courier_name', 'Unknown'),
                    rate=courier.get('rate', 0),
                    estimated_delivery_days=etd,
                    cod_available=bool(courier.get('cod', 0)),
                    rating=float(courier.get('rating', 0)),
                    expires_at=expires_at
                )
            except Exception as e:
                logger.warning(f"Failed to cache rate for {courier.get('courier_name')}: {str(e)}")
    
    def calculate_best_rate(self, rates: List[Dict], 
                           preference: str = None) -> Optional[Dict]:
        """
        Calculate best rate based on preference
        
        Args:
            rates: List of rate dictionaries
            preference: 'cost', 'speed', or 'rating'
            
        Returns:
            Best rate dictionary or None
        """
        if not rates:
            return None
        
        preference = preference or self.courier_preference
        
        if preference == 'cost':
            # Lowest cost
            return min(rates, key=lambda x: x['rate'])
        
        elif preference == 'speed':
            # Fastest delivery
            def get_days(rate):
                etd = rate.get('estimated_delivery_days', '5')
                if '-' in str(etd):
                    return int(str(etd).split('-')[0])
                return int(etd) if str(etd).isdigit() else 5
            
            return min(rates, key=get_days)
        
        elif preference == 'rating':
            # Highest rating
            return max(rates, key=lambda x: x.get('rating', 0))
        
        else:
            # Default to lowest cost
            return min(rates, key=lambda x: x['rate'])

    
    # ==================== SHIPMENT CREATION ====================
    
    def create_shipment_for_order(self, order: Order, 
                                  courier_id: Optional[int] = None) -> Shipment:
        """
        Create shipment for order with AWB and label generation
        
        Args:
            order: Order instance
            courier_id: Optional specific courier ID to use
            
        Returns:
            Updated Shipment instance with AWB and label
            
        Raises:
            ValidationError: If order validation fails
            ShiprocketError: If API calls fail
        """
        logger.info(f"Creating shipment for order {order.order_id}")
        
        # Get or create shipment
        try:
            shipment = order.shipment
            if shipment.awb_code:
                logger.warning(f"Shipment already has AWB: {shipment.awb_code}")
                return shipment
        except Shipment.DoesNotExist:
            # Need to sync order first
            logger.info("Order not synced, syncing first...")
            shipment = self.sync_order_to_shiprocket(order)
        
        try:
            # Select courier if not provided
            if not courier_id:
                courier_id = self._select_courier(order, shipment)
            
            # Prepare shipment payload
            shipment_payload = self._prepare_shipment_payload(order, courier_id)
            
            # Create shipment in Shiprocket (if not already created)
            if not shipment.shiprocket_shipment_id:
                response = self.client.create_shipment(shipment_payload)
                shipment.shiprocket_shipment_id = str(response.get('shipment_id', ''))
                shipment.save(update_fields=['shiprocket_shipment_id'])
            
            # Generate AWB
            awb_response = self.client.generate_awb(
                shipment_id=int(shipment.shiprocket_shipment_id),
                courier_id=courier_id
            )
            
            # Extract AWB data
            awb_code = awb_response.get('response', {}).get('data', {}).get('awb_code')
            courier_name = awb_response.get('response', {}).get('data', {}).get('courier_name')
            
            if not awb_code:
                raise APIError("No AWB code in response")
            
            # Generate label
            label_response = self.client.generate_label([int(shipment.shiprocket_shipment_id)])
            label_url = label_response.get('label_url', '')
            
            # Update shipment
            with transaction.atomic():
                shipment.awb_code = awb_code
                shipment.courier_id = courier_id
                shipment.courier_name = courier_name or 'Unknown'
                shipment.label_url = label_url
                shipment.status = 'ready_to_ship'
                shipment.sync_status = 'synced'
                shipment.error_message = ''
                shipment.save()
                
                # Update order status
                order.status = 'processing'
                order.save(update_fields=['status'])
            
            logger.info(f"✓ Shipment created successfully. AWB: {awb_code}")
            return shipment
            
        except ShiprocketError as e:
            logger.error(f"✗ Shipment creation failed: {str(e)}")
            shipment.sync_status = 'failed'
            shipment.error_message = str(e)
            shipment.retry_count += 1
            shipment.save(update_fields=['sync_status', 'error_message', 'retry_count'])
            raise
    
    def _select_courier(self, order: Order, shipment: Shipment) -> int:
        """
        Select best courier for order
        
        Args:
            order: Order instance
            shipment: Shipment instance
            
        Returns:
            Selected courier ID
        """
        # Check if courier already selected in order
        if order.courier_id:
            logger.info(f"Using pre-selected courier: {order.courier_id}")
            return order.courier_id
        
        # Get available rates
        try:
            # Create a mock cart from order items
            rates = self.get_shipping_rates(
                cart=list(order.items.all()),
                delivery_pincode=order.shipping_pincode,
                cod=(order.payment_method == 'cod')
            )
            
            if not rates:
                raise ServiceabilityError("No couriers available")
            
            # Select best rate
            best_rate = self.calculate_best_rate(rates, self.courier_preference)
            
            if not best_rate:
                raise ServiceabilityError("Could not determine best courier")
            
            logger.info(f"Selected courier: {best_rate['courier_name']} (₹{best_rate['rate']})")
            return best_rate['courier_id']
            
        except Exception as e:
            logger.warning(f"Could not auto-select courier: {str(e)}")
            # Use first available courier from preferred list or raise error
            preferred = getattr(settings, 'SHIPROCKET_PREFERRED_COURIERS', [])
            if preferred:
                return preferred[0]
            raise ValidationError("No courier available for this order")
    
    def _prepare_shipment_payload(self, order: Order, courier_id: int) -> Dict:
        """
        Prepare shipment payload for Shiprocket
        
        Args:
            order: Order instance
            courier_id: Courier company ID
            
        Returns:
            Shipment payload dictionary
        """
        # Get shipment
        shipment = order.shipment
        
        payload = {
            'order_id': shipment.shiprocket_order_id,
            'courier_id': courier_id,
            'status': 'READY TO SHIP'
        }
        
        return payload
    
    def generate_shipping_label(self, shipment: Shipment) -> str:
        """
        Generate shipping label for existing shipment
        
        Args:
            shipment: Shipment instance
            
        Returns:
            Label URL
        """
        logger.info(f"Generating label for shipment {shipment.shiprocket_shipment_id}")
        
        if not shipment.shiprocket_shipment_id:
            raise ValidationError("Shipment ID not found")
        
        try:
            response = self.client.generate_label([int(shipment.shiprocket_shipment_id)])
            label_url = response.get('label_url', '')
            
            if label_url:
                shipment.label_url = label_url
                shipment.save(update_fields=['label_url'])
                logger.info(f"✓ Label generated: {label_url}")
            
            return label_url
            
        except ShiprocketError as e:
            logger.error(f"✗ Label generation failed: {str(e)}")
            raise

    
    # ==================== TRACKING FUNCTIONALITY ====================
    
    def get_tracking_info(self, shipment: Shipment, force_refresh: bool = False) -> Dict:
        """
        Get tracking information for shipment
        Uses cache unless force_refresh is True
        
        Args:
            shipment: Shipment instance
            force_refresh: Force fetch from API instead of cache
            
        Returns:
            Dictionary with tracking information
        """
        logger.info(f"Getting tracking info for AWB: {shipment.awb_code}")
        
        if not shipment.awb_code:
            return {
                'status': 'pending',
                'message': 'Tracking not available yet',
                'scans': []
            }
        
        # Check cache unless force refresh
        if not force_refresh:
            cache_key = f"tracking:{shipment.awb_code}"
            cached_data = cache.get(cache_key)
            if cached_data:
                logger.info("✓ Using cached tracking data")
                return cached_data
        
        # Fetch from Shiprocket
        try:
            response = self.client.track_shipment(shipment.awb_code)
            
            # Parse tracking data
            tracking_data = self._parse_tracking_response(response)
            
            # Update shipment
            self.update_shipment_status(shipment, tracking_data)
            
            # Cache for 30 minutes
            cache_key = f"tracking:{shipment.awb_code}"
            cache.set(cache_key, tracking_data, 1800)
            
            logger.info(f"✓ Tracking data updated: {tracking_data.get('status')}")
            return tracking_data
            
        except ShiprocketError as e:
            logger.error(f"✗ Tracking fetch failed: {str(e)}")
            # Return last known data
            if shipment.tracking_data:
                return shipment.tracking_data
            return {
                'status': shipment.status,
                'message': 'Tracking information unavailable',
                'scans': []
            }
    
    def update_shipment_status(self, shipment: Shipment, 
                              tracking_data: Optional[Dict] = None) -> bool:
        """
        Update shipment status from tracking data
        
        Args:
            shipment: Shipment instance
            tracking_data: Optional tracking data (fetches if not provided)
            
        Returns:
            True if updated successfully
        """
        logger.info(f"Updating status for shipment {shipment.shiprocket_order_id}")
        
        # Fetch tracking data if not provided
        if not tracking_data:
            tracking_data = self.get_tracking_info(shipment, force_refresh=True)
        
        try:
            with transaction.atomic():
                # Update shipment
                old_status = shipment.status
                new_status = tracking_data.get('status', shipment.status)
                
                shipment.status = new_status
                shipment.current_status = tracking_data.get('current_status', '')
                shipment.tracking_data = tracking_data
                shipment.last_tracking_update = timezone.now()
                
                # Update delivery dates
                if tracking_data.get('estimated_delivery_date'):
                    try:
                        edd = datetime.strptime(
                            tracking_data['estimated_delivery_date'], 
                            '%Y-%m-%d'
                        ).date()
                        shipment.estimated_delivery_date = edd
                    except:
                        pass
                
                if new_status == 'delivered' and tracking_data.get('delivered_date'):
                    try:
                        delivered = datetime.strptime(
                            tracking_data['delivered_date'],
                            '%Y-%m-%d %H:%M:%S'
                        )
                        shipment.actual_delivery_date = delivered
                    except:
                        shipment.actual_delivery_date = timezone.now()
                
                shipment.save()
                
                # Update order status based on shipment status
                order = shipment.order
                order_status_map = {
                    'picked_up': 'processing',
                    'in_transit': 'shipped',
                    'out_for_delivery': 'shipped',
                    'delivered': 'delivered',
                    'cancelled': 'cancelled',
                    'rto': 'cancelled'
                }
                
                new_order_status = order_status_map.get(new_status)
                if new_order_status and order.status != new_order_status:
                    order.status = new_order_status
                    order.save(update_fields=['status'])
                    logger.info(f"Order status updated: {old_status} → {new_order_status}")
                
                if old_status != new_status:
                    logger.info(f"✓ Shipment status updated: {old_status} → {new_status}")
                
                return True
                
        except Exception as e:
            logger.error(f"✗ Status update failed: {str(e)}")
            return False
    
    def _parse_tracking_response(self, response: Dict) -> Dict:
        """
        Parse Shiprocket tracking response to standardized format
        
        Args:
            response: Raw tracking response from Shiprocket
            
        Returns:
            Formatted tracking dictionary
        """
        tracking_data = response.get('tracking_data', {})
        
        if not tracking_data:
            return {
                'status': 'pending',
                'current_status': 'Tracking not available',
                'scans': [],
                'message': 'No tracking data available'
            }
        
        # Get shipment track info
        shipment_track = tracking_data.get('shipment_track', [])
        if not shipment_track:
            return {
                'status': 'pending',
                'current_status': 'Tracking not available',
                'scans': []
            }
        
        track_info = shipment_track[0] if isinstance(shipment_track, list) else shipment_track
        
        # Map Shiprocket status to our status
        shiprocket_status = track_info.get('shipment_status', '').lower()
        status_map = {
            'picked up': 'picked_up',
            'in transit': 'in_transit',
            'out for delivery': 'out_for_delivery',
            'delivered': 'delivered',
            'cancelled': 'cancelled',
            'rto': 'rto',
            'pending': 'pending'
        }
        
        status = status_map.get(shiprocket_status, 'pending')
        
        # Parse scans
        scans = []
        scan_data = track_info.get('scans', [])
        
        for scan in scan_data:
            scans.append({
                'date': scan.get('date', ''),
                'activity': scan.get('activity', ''),
                'location': scan.get('location', ''),
                'status': scan.get('status', '')
            })
        
        # Build tracking data
        parsed_data = {
            'status': status,
            'current_status': track_info.get('shipment_status', 'Unknown'),
            'awb_code': track_info.get('awb_code', ''),
            'courier_name': track_info.get('courier_name', ''),
            'estimated_delivery_date': track_info.get('edd', ''),
            'scans': scans,
            'last_update': track_info.get('current_timestamp', ''),
            'track_url': track_info.get('track_url', '')
        }
        
        # Add delivered date if delivered
        if status == 'delivered' and scans:
            # Get last scan date as delivered date
            parsed_data['delivered_date'] = scans[-1]['date']
        
        return parsed_data

    
    # ==================== RETURN MANAGEMENT ====================
    
    def create_return_shipment(self, return_request) -> Dict:
        """
        Create return shipment in Shiprocket
        
        Args:
            return_request: ReturnRequest instance
            
        Returns:
            Return shipment data
            
        Raises:
            ValidationError: If validation fails
            ShiprocketError: If API call fails
        """
        logger.info(f"Creating return shipment for request {return_request.request_id}")
        
        order = return_request.order
        
        # Validate return request
        if not hasattr(order, 'shipment'):
            raise ValidationError("Order has no shipment")
        
        shipment = order.shipment
        if not shipment.shiprocket_order_id:
            raise ValidationError("Order not synced to Shiprocket")
        
        try:
            # Prepare return payload
            return_payload = self._prepare_return_payload(return_request)
            
            # Create return in Shiprocket
            response = self.client.create_return(return_payload)
            
            # Extract return order ID
            return_order_id = response.get('order_id')
            
            if not return_order_id:
                raise APIError("No return order_id in response")
            
            # Schedule pickup
            pickup_response = self._schedule_return_pickup(return_order_id)
            
            # Update return request
            return_request.tracking_number = str(return_order_id)
            return_request.status = 'approved'
            
            if pickup_response.get('pickup_scheduled_date'):
                try:
                    pickup_date = datetime.strptime(
                        pickup_response['pickup_scheduled_date'],
                        '%Y-%m-%d'
                    ).date()
                    return_request.pickup_date = pickup_date
                except:
                    pass
            
            return_request.save()
            
            logger.info(f"✓ Return shipment created: {return_order_id}")
            
            return {
                'return_order_id': return_order_id,
                'pickup_scheduled': pickup_response.get('pickup_scheduled', False),
                'pickup_date': pickup_response.get('pickup_scheduled_date', ''),
                'message': 'Return pickup scheduled successfully'
            }
            
        except ShiprocketError as e:
            logger.error(f"✗ Return creation failed: {str(e)}")
            return_request.status = 'rejected'
            return_request.save()
            raise
    
    def _prepare_return_payload(self, return_request) -> Dict:
        """
        Prepare return order payload for Shiprocket
        
        Args:
            return_request: ReturnRequest instance
            
        Returns:
            Return payload dictionary
        """
        order = return_request.order
        
        # Format phone
        phone = self._format_phone(order.customer_phone)
        
        # Get pickup address (customer's shipping address)
        pickup_address = self._format_address(order.shipping_address)
        
        # Prepare return items
        return_items = []
        for item in order.items.all():
            return_items.append({
                'name': item.product_name[:100],
                'sku': item.product.sku if item.product else 'UNKNOWN',
                'units': item.quantity,
                'selling_price': str(item.product_price),
                'discount': '0',
                'tax': '',
                'hsn': ''
            })
        
        # Build return payload
        payload = {
            'order_id': f"{order.order_id}_RETURN",
            'order_date': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            'channel_id': '',
            'pickup_customer_name': order.customer_name,
            'pickup_last_name': '',
            'pickup_address': pickup_address,
            'pickup_address_2': '',
            'pickup_city': order.shipping_city,
            'pickup_state': order.shipping_state,
            'pickup_country': order.shipping_country,
            'pickup_pincode': order.shipping_pincode,
            'pickup_email': order.customer_email,
            'pickup_phone': phone,
            'pickup_isd_code': '91',
            'shipping_customer_name': 'Gift Shop',
            'shipping_last_name': '',
            'shipping_address': getattr(settings, 'SHIPROCKET_WAREHOUSE_ADDRESS', 'Warehouse'),
            'shipping_address_2': '',
            'shipping_city': getattr(settings, 'SHIPROCKET_WAREHOUSE_CITY', 'Delhi'),
            'shipping_state': getattr(settings, 'SHIPROCKET_WAREHOUSE_STATE', 'Delhi'),
            'shipping_country': 'India',
            'shipping_pincode': getattr(settings, 'SHIPROCKET_WAREHOUSE_PINCODE', '110001'),
            'shipping_email': getattr(settings, 'SHIPROCKET_EMAIL', ''),
            'shipping_phone': getattr(settings, 'SHIPROCKET_WAREHOUSE_PHONE', '9999999999'),
            'shipping_isd_code': '91',
            'order_items': return_items,
            'payment_method': 'Prepaid',
            'total_discount': '0',
            'sub_total': str(order.subtotal),
            'length': str(self.default_dimensions['length']),
            'breadth': str(self.default_dimensions['breadth']),
            'height': str(self.default_dimensions['height']),
            'weight': str(self._calculate_order_weight(order))
        }
        
        return payload
    
    def _schedule_return_pickup(self, return_order_id: str) -> Dict:
        """
        Schedule pickup for return order
        
        Args:
            return_order_id: Return order ID from Shiprocket
            
        Returns:
            Pickup scheduling response
        """
        try:
            # Note: Shiprocket may auto-schedule pickup for returns
            # This is a placeholder for explicit pickup scheduling if needed
            logger.info(f"Return pickup auto-scheduled for order {return_order_id}")
            
            return {
                'pickup_scheduled': True,
                'pickup_scheduled_date': (timezone.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                'message': 'Pickup will be scheduled automatically'
            }
            
        except Exception as e:
            logger.warning(f"Pickup scheduling info unavailable: {str(e)}")
            return {
                'pickup_scheduled': False,
                'message': 'Pickup scheduling pending'
            }

    
    # ==================== CANCELLATION LOGIC ====================
    
    def cancel_shipment(self, shipment: Shipment, reason: str = '') -> bool:
        """
        Cancel shipment in Shiprocket
        
        Args:
            shipment: Shipment instance to cancel
            reason: Cancellation reason
            
        Returns:
            True if cancelled successfully
            
        Raises:
            ValidationError: If shipment cannot be cancelled
            ShiprocketError: If API call fails
        """
        logger.info(f"Cancelling shipment {shipment.shiprocket_order_id}")
        
        # Validate cancellation is possible
        if shipment.status in ['delivered', 'cancelled']:
            raise ValidationError(f"Cannot cancel shipment with status: {shipment.status}")
        
        if not shipment.shiprocket_order_id:
            raise ValidationError("Shipment not synced to Shiprocket")
        
        try:
            # Cancel in Shiprocket
            order_id = int(shipment.shiprocket_order_id)
            response = self.client.cancel_order([order_id])
            
            # Update shipment
            with transaction.atomic():
                shipment.status = 'cancelled'
                shipment.current_status = f'Cancelled: {reason}' if reason else 'Cancelled'
                shipment.error_message = reason
                shipment.save()
                
                # Update order
                order = shipment.order
                order.status = 'cancelled'
                order.save(update_fields=['status'])
            
            logger.info(f"✓ Shipment cancelled successfully")
            return True
            
        except ShiprocketError as e:
            logger.error(f"✗ Cancellation failed: {str(e)}")
            
            # If already cancelled in Shiprocket, update local status
            if 'already cancelled' in str(e).lower():
                shipment.status = 'cancelled'
                shipment.save(update_fields=['status'])
                return True
            
            shipment.error_message = f"Cancellation failed: {str(e)}"
            shipment.save(update_fields=['error_message'])
            raise
        
        except Exception as e:
            logger.error(f"✗ Unexpected error during cancellation: {str(e)}")
            raise ShiprocketError(f"Cancellation failed: {str(e)}")
