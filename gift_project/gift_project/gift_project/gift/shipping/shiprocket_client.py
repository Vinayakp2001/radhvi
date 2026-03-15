"""
Shiprocket API Client
Low-level wrapper for Shiprocket API interactions
"""
import requests
import logging
import time
from typing import Dict, List, Optional
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger('shiprocket')


# Custom Exceptions
class ShiprocketError(Exception):
    """Base exception for Shiprocket errors"""
    pass


class AuthenticationError(ShiprocketError):
    """Authentication failed"""
    pass


class RateLimitError(ShiprocketError):
    """Rate limit exceeded"""
    pass


class ValidationError(ShiprocketError):
    """Invalid data provided"""
    pass


class ServiceabilityError(ShiprocketError):
    """Delivery not available to pincode"""
    pass


class APIError(ShiprocketError):
    """General API error"""
    pass


class ShiprocketClient:
    """
    Low-level API client for Shiprocket
    Handles authentication, requests, and error handling
    """
    
    def __init__(self):
        """Initialize Shiprocket client with configuration"""
        self.base_url = settings.SHIPROCKET_API_URL
        self.email = settings.SHIPROCKET_EMAIL
        self.password = settings.SHIPROCKET_PASSWORD
        self.timeout = settings.SHIPROCKET_TIMEOUT
        self.max_retries = settings.SHIPROCKET_MAX_RETRIES
        self.retry_delay = settings.SHIPROCKET_RETRY_DELAY
        
        # Session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Token management
        self.token = None
        self.token_expiry = None
    
    def __del__(self):
        """Close session on cleanup"""
        if hasattr(self, 'session'):
            self.session.close()

    
    # ==================== AUTHENTICATION METHODS ====================
    
    def authenticate(self) -> str:
        """
        Authenticate with Shiprocket and get access token
        Returns: Access token string
        """
        try:
            url = f"{self.base_url}/auth/login"
            payload = {
                'email': self.email,
                'password': self.password
            }
            
            logger.info("Authenticating with Shiprocket...")
            response = requests.post(url, json=payload, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                
                # Cache token (Shiprocket tokens typically last 10 days)
                cache.set('shiprocket_auth_token', self.token, timeout=864000)  # 10 days
                
                logger.info("✓ Authentication successful")
                return self.token
            else:
                error_msg = response.json().get('message', 'Authentication failed')
                logger.error(f"✗ Authentication failed: {error_msg}")
                raise AuthenticationError(f"Authentication failed: {error_msg}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"✗ Authentication request failed: {str(e)}")
            raise AuthenticationError(f"Authentication request failed: {str(e)}")
    
    def refresh_token(self) -> str:
        """
        Refresh authentication token
        Returns: New access token
        """
        logger.info("Refreshing authentication token...")
        return self.authenticate()
    
    def _ensure_authenticated(self) -> None:
        """
        Ensure we have a valid authentication token
        Checks cache first, then authenticates if needed
        """
        # Check cache first
        cached_token = cache.get('shiprocket_auth_token')
        if cached_token:
            self.token = cached_token
            logger.debug("Using cached authentication token")
            return
        
        # No cached token, authenticate
        if not self.token:
            self.authenticate()
    
    def _get_headers(self) -> Dict[str, str]:
        """
        Get headers with authentication token
        Returns: Dictionary of headers
        """
        self._ensure_authenticated()
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }

    
    # ==================== ERROR HANDLING & RETRY LOGIC ====================
    
    def _make_request(self, method: str, endpoint: str, 
                     data: Optional[Dict] = None, 
                     params: Optional[Dict] = None,
                     retry_count: int = 0) -> Dict:
        """
        Make HTTP request with retry logic and error handling
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            data: Request body data
            params: Query parameters
            retry_count: Current retry attempt
            
        Returns:
            Response data as dictionary
        """
        url = f"{self.base_url}/{endpoint}"
        headers = self._get_headers()
        
        try:
            # Log request if debugging enabled
            if settings.SHIPROCKET_LOG_REQUESTS:
                logger.debug(f"{method} {url}")
                if data:
                    logger.debug(f"Payload: {data}")
            
            # Make request
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                headers=headers,
                timeout=self.timeout
            )
            
            # Log response if debugging enabled
            if settings.SHIPROCKET_LOG_RESPONSES:
                logger.debug(f"Response {response.status_code}: {response.text[:500]}")
            
            # Handle response
            if response.status_code == 200 or response.status_code == 201:
                return response.json()
            
            elif response.status_code == 401:
                # Token expired, refresh and retry once
                if retry_count == 0:
                    logger.warning("Token expired, refreshing...")
                    self.refresh_token()
                    return self._make_request(method, endpoint, data, params, retry_count + 1)
                else:
                    raise AuthenticationError("Authentication failed after token refresh")
            
            elif response.status_code == 429:
                # Rate limit exceeded
                if retry_count < self.max_retries:
                    wait_time = self.retry_delay * (2 ** retry_count)  # Exponential backoff
                    logger.warning(f"Rate limit exceeded, waiting {wait_time}s...")
                    time.sleep(wait_time)
                    return self._make_request(method, endpoint, data, params, retry_count + 1)
                else:
                    raise RateLimitError("Rate limit exceeded, max retries reached")
            
            elif response.status_code == 400:
                # Validation error
                error_data = response.json()
                error_msg = error_data.get('message', 'Validation error')
                logger.error(f"Validation error: {error_msg}")
                raise ValidationError(f"Validation error: {error_msg}")
            
            elif response.status_code >= 500:
                # Server error, retry
                if retry_count < self.max_retries:
                    wait_time = self.retry_delay * (2 ** retry_count)
                    logger.warning(f"Server error {response.status_code}, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    return self._make_request(method, endpoint, data, params, retry_count + 1)
                else:
                    raise APIError(f"Server error {response.status_code}, max retries reached")
            
            else:
                # Other errors
                error_data = response.json() if response.text else {}
                error_msg = error_data.get('message', f'HTTP {response.status_code}')
                raise APIError(f"API error: {error_msg}")
        
        except requests.exceptions.Timeout:
            if retry_count < self.max_retries:
                logger.warning(f"Request timeout, retrying...")
                time.sleep(self.retry_delay)
                return self._make_request(method, endpoint, data, params, retry_count + 1)
            else:
                raise APIError("Request timeout, max retries reached")
        
        except requests.exceptions.ConnectionError as e:
            if retry_count < self.max_retries:
                logger.warning(f"Connection error, retrying...")
                time.sleep(self.retry_delay)
                return self._make_request(method, endpoint, data, params, retry_count + 1)
            else:
                raise APIError(f"Connection error: {str(e)}")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
            raise APIError(f"Request failed: {str(e)}")
    
    def _handle_error(self, response: requests.Response) -> None:
        """
        Handle error responses
        
        Args:
            response: Response object
        """
        try:
            error_data = response.json()
            error_msg = error_data.get('message', 'Unknown error')
        except:
            error_msg = response.text or f'HTTP {response.status_code}'
        
        logger.error(f"API Error {response.status_code}: {error_msg}")
        raise APIError(f"API Error: {error_msg}")

    
    # ==================== ORDER MANAGEMENT METHODS ====================
    
    def create_order(self, order_data: Dict) -> Dict:
        """
        Create order in Shiprocket
        
        Args:
            order_data: Order details dictionary
            
        Returns:
            Response with order_id and shipment_id
        """
        logger.info(f"Creating order in Shiprocket: {order_data.get('order_id')}")
        response = self._make_request('POST', 'orders/create/adhoc', data=order_data)
        logger.info(f"✓ Order created: {response.get('order_id')}")
        return response
    
    def get_order(self, order_id: str) -> Dict:
        """
        Get order details from Shiprocket
        
        Args:
            order_id: Shiprocket order ID
            
        Returns:
            Order details
        """
        logger.info(f"Fetching order: {order_id}")
        response = self._make_request('GET', f'orders/show/{order_id}')
        return response
    
    def cancel_order(self, order_ids: List[int]) -> Dict:
        """
        Cancel orders in Shiprocket
        
        Args:
            order_ids: List of Shiprocket order IDs
            
        Returns:
            Cancellation response
        """
        logger.info(f"Cancelling orders: {order_ids}")
        data = {'ids': order_ids}
        response = self._make_request('POST', 'orders/cancel', data=data)
        logger.info(f"✓ Orders cancelled")
        return response

    
    # ==================== SHIPPING RATE METHODS ====================
    
    def get_courier_serviceability(self, pickup_pincode: str, delivery_pincode: str,
                                   weight: float, cod: bool = False,
                                   declared_value: float = 0) -> Dict:
        """
        Get available courier services and rates
        
        Args:
            pickup_pincode: Pickup location pincode
            delivery_pincode: Delivery location pincode
            weight: Package weight in kg
            cod: Cash on Delivery (1 for yes, 0 for no)
            declared_value: Declared value of shipment
            
        Returns:
            Available courier companies with rates
        """
        logger.info(f"Checking serviceability: {pickup_pincode} → {delivery_pincode}, {weight}kg")
        
        params = {
            'pickup_postcode': pickup_pincode,
            'delivery_postcode': delivery_pincode,
            'weight': weight,
            'cod': 1 if cod else 0,
        }
        
        if declared_value > 0:
            params['declared_value'] = declared_value
        
        try:
            response = self._make_request('GET', 'courier/serviceability', params=params)
            
            # Check if delivery is available
            if response.get('data') and response['data'].get('available_courier_companies'):
                couriers = response['data']['available_courier_companies']
                logger.info(f"✓ Found {len(couriers)} available couriers")
                return response
            else:
                logger.warning(f"✗ No couriers available for {delivery_pincode}")
                raise ServiceabilityError(f"Delivery not available to pincode {delivery_pincode}")
                
        except APIError as e:
            logger.error(f"Serviceability check failed: {str(e)}")
            raise ServiceabilityError(f"Serviceability check failed: {str(e)}")

    
    # ==================== SHIPMENT MANAGEMENT METHODS ====================
    
    def create_shipment(self, shipment_data: Dict) -> Dict:
        """
        Create forward shipment
        
        Args:
            shipment_data: Shipment details
            
        Returns:
            Shipment creation response
        """
        logger.info(f"Creating shipment for order: {shipment_data.get('order_id')}")
        response = self._make_request('POST', 'shipments/create/forward-shipment', data=shipment_data)
        logger.info(f"✓ Shipment created: {response.get('shipment_id')}")
        return response
    
    def generate_awb(self, shipment_id: int, courier_id: int) -> Dict:
        """
        Generate AWB (Air Waybill) number for shipment
        
        Args:
            shipment_id: Shiprocket shipment ID
            courier_id: Selected courier company ID
            
        Returns:
            AWB generation response
        """
        logger.info(f"Generating AWB for shipment: {shipment_id}")
        data = {
            'shipment_id': shipment_id,
            'courier_id': courier_id
        }
        response = self._make_request('POST', 'courier/assign/awb', data=data)
        logger.info(f"✓ AWB generated: {response.get('awb_code')}")
        return response
    
    def generate_label(self, shipment_ids: List[int]) -> Dict:
        """
        Generate shipping label PDF
        
        Args:
            shipment_ids: List of shipment IDs
            
        Returns:
            Label URL
        """
        logger.info(f"Generating labels for shipments: {shipment_ids}")
        data = {'shipment_id': shipment_ids}
        response = self._make_request('POST', 'courier/generate/label', data=data)
        logger.info(f"✓ Label generated")
        return response
    
    def generate_manifest(self, shipment_ids: List[int]) -> Dict:
        """
        Generate manifest for shipments
        
        Args:
            shipment_ids: List of shipment IDs
            
        Returns:
            Manifest URL
        """
        logger.info(f"Generating manifest for shipments: {shipment_ids}")
        data = {'shipment_id': shipment_ids}
        response = self._make_request('POST', 'manifests/generate', data=data)
        logger.info(f"✓ Manifest generated")
        return response
    
    def schedule_pickup(self, shipment_ids: List[int]) -> Dict:
        """
        Schedule pickup for shipments
        
        Args:
            shipment_ids: List of shipment IDs
            
        Returns:
            Pickup scheduling response
        """
        logger.info(f"Scheduling pickup for shipments: {shipment_ids}")
        data = {'shipment_id': shipment_ids}
        response = self._make_request('POST', 'courier/generate/pickup', data=data)
        logger.info(f"✓ Pickup scheduled")
        return response

    
    # ==================== TRACKING METHODS ====================
    
    def track_shipment(self, awb_code: str) -> Dict:
        """
        Track shipment by AWB code
        
        Args:
            awb_code: Air Waybill tracking number
            
        Returns:
            Tracking information
        """
        logger.info(f"Tracking shipment: {awb_code}")
        response = self._make_request('GET', f'courier/track/awb/{awb_code}')
        return response
    
    def track_by_order_id(self, order_id: str) -> Dict:
        """
        Track shipment by order ID
        
        Args:
            order_id: Shiprocket order ID
            
        Returns:
            Tracking information
        """
        logger.info(f"Tracking by order ID: {order_id}")
        response = self._make_request('GET', f'courier/track/{order_id}')
        return response

    
    # ==================== RETURN MANAGEMENT METHODS ====================
    
    def create_return(self, return_data: Dict) -> Dict:
        """
        Create return order
        
        Args:
            return_data: Return order details
            
        Returns:
            Return order response
        """
        logger.info(f"Creating return for order: {return_data.get('order_id')}")
        response = self._make_request('POST', 'orders/create/return', data=return_data)
        logger.info(f"✓ Return created: {response.get('order_id')}")
        return response
