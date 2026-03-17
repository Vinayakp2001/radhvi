# API Views for Next.js Frontend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend

from gift.models import Product, Category, Occasion, Testimonial, Wishlist, Cart, CartItem, Address, Order, OrderItem
from .serializers import (
    ProductSerializer, CategorySerializer, OccasionSerializer, 
    TestimonialSerializer, WishlistSerializer, AddressSerializer,
    CheckoutSerializer, PaymentVerificationSerializer,
    OrderListSerializer, OrderDetailSerializer, OrderItemSerializer
)
from rest_framework.pagination import PageNumberPagination
from gift.payment.razorpay_service import RazorpayService, RazorpayError, PaymentVerificationError
from gift.payment.phonepe_service import PhonePeService, PhonePeError, PaymentInitiationError, PaymentVerificationError as PhonePeVerificationError, RefundError, get_phonepe_configuration_status
from gift.shipping.tasks import sync_order_to_shiprocket_task
from gift.shipping.services import ShippingService
from decimal import Decimal


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for products
    
    list: Get all products
    retrieve: Get single product by slug
    bestsellers: Get bestseller products
    """
    queryset = Product.objects.all()  # Using existing model fields
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_best_seller', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']
    
    # Force PageNumberPagination
    pagination_class = PageNumberPagination
    
    def list(self, request, *args, **kwargs):
        """Override list to ensure pagination works correctly"""
        return super().list(request, *args, **kwargs)
    
    def get_queryset(self):
        """Override to add price range filtering"""
        queryset = super().get_queryset()
        
        # Price range filtering
        price_range = self.request.query_params.get('price_range', None)
        if price_range:
            ranges = price_range.split(',')
            from django.db.models import Q
            query = Q()
            
            for range_str in ranges:
                if '-' in range_str:
                    min_price, max_price = range_str.split('-')
                    query |= Q(price__gte=min_price, price__lte=max_price)
            
            if query:
                queryset = queryset.filter(query)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def bestsellers(self, request):
        """Get bestseller products"""
        products = self.get_queryset().filter(is_best_seller=True)[:8]
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured product"""
        product = self.get_queryset().filter(is_featured=True).first()
        if product:
            serializer = self.get_serializer(product)
            return Response(serializer.data)
        return Response({})


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for categories/occasions
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'


class OccasionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for occasions (Shop by Occasion section)
    """
    queryset = Occasion.objects.filter(is_active=True)
    serializer_class = OccasionSerializer
    lookup_field = 'slug'
    ordering = ['order', 'name']


class TestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for testimonials
    """
    queryset = Testimonial.objects.filter(is_active=True)
    serializer_class = TestimonialSerializer
    ordering = ['order', '-created_at']


class WishlistViewSet(viewsets.ModelViewSet):
    """
    API endpoint for wishlist
    
    list: Get user's wishlist
    create: Add product to wishlist
    destroy: Remove product from wishlist
    """
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get wishlist for authenticated user"""
        if self.request.user.is_authenticated:
            return Wishlist.objects.filter(user=self.request.user).select_related('product')
        return Wishlist.objects.none()
    
    @action(detail=False, methods=['post'])
    def add(self, request):
        """Add product to wishlist"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        wishlist_item = serializer.save()
        
        return Response(
            self.get_serializer(wishlist_item).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def remove(self, request):
        """Remove product from wishlist by product_id"""
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count, _ = Wishlist.objects.filter(
            user=request.user,
            product_id=product_id
        ).delete()
        
        if deleted_count > 0:
            return Response(
                {'message': 'Product removed from wishlist'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            return Response(
                {'error': 'Product not in wishlist'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check if product is in wishlist"""
        product_id = request.query_params.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exists = Wishlist.objects.filter(
            user=request.user,
            product_id=product_id
        ).exists()
        
        return Response({'in_wishlist': exists})


class AddressViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user addresses
    
    list: Get all addresses for authenticated user
    create: Create new address
    retrieve: Get single address
    update: Update address
    destroy: Delete address
    set_default: Set address as default
    """
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get addresses for authenticated user"""
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create address for authenticated user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set address as default"""
        address = self.get_object()
        
        # Unset other default addresses
        Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
        
        # Set this address as default
        address.is_default = True
        address.save()
        
        return Response(
            {'message': 'Address set as default'},
            status=status.HTTP_200_OK
        )



class CartViewSet(viewsets.ModelViewSet):
    """
    API endpoint for cart management
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)
    
    def list(self, request):
        """Get user's cart items"""
        try:
            cart, created = Cart.objects.get_or_create(user=request.user)
            cart_items = CartItem.objects.filter(cart=cart).select_related('product').prefetch_related('product__images')
            
            items_data = []
            total_amount = 0
            
            for item in cart_items:
                # Get the effective price (discounted or regular)
                effective_price = item.product.discounted_price if item.product.discounted_price else item.product.price
                item_total = float(effective_price) * item.quantity
                total_amount += item_total
                
                items_data.append({
                    'id': item.id,
                    'product': {
                        'id': item.product.id,
                        'name': item.product.name,
                        'slug': item.product.slug,
                        'price': str(item.product.price),
                        'discounted_price': str(item.product.discounted_price) if item.product.discounted_price else None,
                        'image_url': item.product.image_url,
                    },
                    'quantity': item.quantity,
                    'item_total': item_total,
                })
            
            return Response({
                'items': items_data,
                'total_items': sum(item['quantity'] for item in items_data),
                'total_amount': total_amount,
            })
        except Exception as e:
            return Response({
                'error': str(e),
                'items': [],
                'total_items': 0,
                'total_amount': 0,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def add(self, request):
        """Add item to cart"""
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        cart, created = Cart.objects.get_or_create(user=request.user)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        return Response({
            'message': 'Item added to cart',
            'cart_item_id': cart_item.id,
            'quantity': cart_item.quantity
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['put'])
    def update_quantity(self, request):
        """Update item quantity in cart"""
        cart_item_id = request.data.get('cart_item_id')
        quantity = request.data.get('quantity')
        
        if not cart_item_id or quantity is None:
            return Response({'error': 'Cart item ID and quantity are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart = Cart.objects.get(user=request.user)
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            
            if int(quantity) <= 0:
                cart_item.delete()
                return Response({'message': 'Item removed from cart'}, status=status.HTTP_200_OK)
            else:
                cart_item.quantity = int(quantity)
                cart_item.save()
                return Response({
                    'message': 'Quantity updated',
                    'quantity': cart_item.quantity
                }, status=status.HTTP_200_OK)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        """Remove item from cart"""
        cart_item_id = request.data.get('cart_item_id')
        
        if not cart_item_id:
            return Response({'error': 'Cart item ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart = Cart.objects.get(user=request.user)
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            cart_item.delete()
            return Response({'message': 'Item removed from cart'}, status=status.HTTP_200_OK)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear all items from cart"""
        try:
            cart = Cart.objects.get(user=request.user)
            CartItem.objects.filter(cart=cart).delete()
            return Response({'message': 'Cart cleared'}, status=status.HTTP_200_OK)
        except Cart.DoesNotExist:
            return Response({'message': 'Cart is already empty'}, status=status.HTTP_200_OK)


# Authentication endpoints
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not username or not email or not password:
        return Response({'error': 'Username, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'User created successfully',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user - accepts username or email"""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Try username first, then email lookup
    user = authenticate(username=username, password=password)
    if not user:
        # Try treating input as email
        try:
            user_obj = User.objects.get(email__iexact=username)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'message': 'Login successful',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user"""
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Logout successful'})
    except:
        return Response({'message': 'Logout successful'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user info"""
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def guest_checkout(request):
    """
    Guest checkout — auto-registers user if not logged in, then places order.
    Accepts all checkout fields + optional email/password for account creation.
    """
    import logging
    logger = logging.getLogger(__name__)

    email = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()
    full_name = request.data.get('full_name', '').strip()
    phone = request.data.get('phone', '').strip()
    address_line1 = request.data.get('address_line1', '').strip()
    city = request.data.get('city', '').strip()
    state = request.data.get('state', '').strip()
    pincode = request.data.get('pincode', '').strip()
    country = request.data.get('country', 'India')
    payment_method = request.data.get('payment_method', 'cod')
    courier_id = request.data.get('courier_id')

    if not all([email, full_name, phone, address_line1, city, state, pincode]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Get or create user
    user = None
    token_key = None
    if request.user.is_authenticated:
        user = request.user
    else:
        existing = User.objects.filter(email__iexact=email).first()
        if existing:
            # User exists — try to authenticate
            if password:
                from django.contrib.auth import authenticate as auth_fn
                user = auth_fn(username=existing.username, password=password)
                if not user:
                    return Response({'error': 'An account with this email already exists. Please enter the correct password.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'An account with this email already exists. Please enter your password to continue.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Create new account
            if not password or len(password) < 6:
                return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
            username = email.split('@')[0] + str(User.objects.count())
            name_parts = full_name.split(' ', 1)
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=name_parts[0],
                last_name=name_parts[1] if len(name_parts) > 1 else '',
            )

        token, _ = Token.objects.get_or_create(user=user)
        token_key = token.key

    # Now place the order using the same logic as initiate_checkout
    try:
        # For guests, accept cart_items from request body (from localStorage)
        guest_cart_items = request.data.get('cart_items', [])  # [{product_id, quantity}]

        cart, _ = Cart.objects.get_or_create(user=user)

        # If guest_cart_items provided, add them to the user's cart first
        if guest_cart_items:
            CartItem.objects.filter(cart=cart).delete()  # clear any existing
            for item_data in guest_cart_items:
                try:
                    product = Product.objects.get(id=item_data['product_id'])
                    CartItem.objects.create(cart=cart, product=product, quantity=item_data.get('quantity', 1))
                except Product.DoesNotExist:
                    pass

        cart_items = CartItem.objects.filter(cart=cart).select_related('product')
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = sum(
            (item.product.discounted_price or item.product.price) * item.quantity
            for item in cart_items
        )

        shipping_data = {
            'customer_name': full_name,
            'customer_phone': phone,
            'shipping_address': address_line1,
            'shipping_city': city,
            'shipping_state': state,
            'shipping_pincode': pincode,
            'shipping_country': country,
        }

        shipping_charge = Decimal('50')
        selected_courier_id = courier_id
        try:
            _ss = ShippingService()
            _rates = _ss.get_shipping_rates(cart=list(cart_items), delivery_pincode=pincode, cod=(payment_method == 'cod'))
            if _rates:
                _matched = next((r for r in _rates if r['courier_id'] == courier_id), None)
                _best = _matched or _ss.calculate_best_rate(_rates)
                if _best:
                    shipping_charge = Decimal(str(_best['rate']))
                    selected_courier_id = _best['courier_id']
        except Exception as _e:
            logger.warning(f"Could not fetch Shiprocket rates: {_e}")

        total_amount = subtotal + shipping_charge

        order = Order.objects.create(
            user=user,
            status='pending',
            payment_status='pending',
            payment_method=payment_method,
            customer_email=email,
            subtotal=subtotal,
            shipping_charge=shipping_charge,
            total_amount=total_amount,
            courier_id=selected_courier_id,
            **shipping_data
        )

        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_price=cart_item.product.discounted_price or cart_item.product.price,
                quantity=cart_item.quantity
            )

        if payment_method == 'cod':
            order.status = 'confirmed'
            order.save(update_fields=['status'])
            cart.delete()
            try:
                sync_order_to_shiprocket_task.delay(order.id)
            except Exception as _e:
                logger.warning(f"Shiprocket sync failed: {_e}")
                try:
                    _ss2 = ShippingService()
                    _ss2.sync_order_to_shiprocket(order)
                except Exception as _e2:
                    logger.warning(f"Direct sync also failed: {_e2}")

            response_data = {
                'order_id': order.order_id,
                'payment_method': 'cod',
                'amount': float(total_amount),
            }
            if token_key:
                response_data['token'] = token_key
                response_data['user'] = {'email': user.email, 'first_name': user.first_name}
            return Response(response_data, status=status.HTTP_201_CREATED)

        # Online payment
        phonepe_service = PhonePeService()
        user_info = {'user_id': user.id, 'name': full_name, 'email': email, 'phone': phone}
        payment_request = phonepe_service.create_payment_request(
            amount=float(total_amount), order_id=order.order_id, user_info=user_info
        )
        order.phonepe_merchant_transaction_id = payment_request['merchant_transaction_id']
        order.save()
        response_data = {
            'order_id': order.order_id,
            'payment_url': payment_request['payment_url'],
            'amount': float(total_amount),
        }
        if token_key:
            response_data['token'] = token_key
        return Response(response_data, status=status.HTTP_201_CREATED)

    except Cart.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)
    except PaymentInitiationError as e:
        if 'order' in locals():
            order.delete()
        return Response({'error': 'Online payment unavailable. Please use Cash on Delivery.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        if 'order' in locals():
            order.delete()
        return Response({'error': f'Checkout failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Checkout and Payment endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_checkout(request):
    """
    Initiate checkout - create order and PhonePe payment request
    
    POST /api/checkout/initiate/
    Body: {
        "shipping_address_id": 1,  // OR provide full address for guest
        "courier_id": 123,  // Optional - selected courier
        "full_name": "John Doe",  // For guest checkout
        "phone": "9876543210",
        "address_line1": "123 Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
    }
    """
    serializer = CheckoutSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get user's cart
        cart = Cart.objects.get(user=request.user)
        cart_items = CartItem.objects.filter(cart=cart).select_related('product')
        
        if not cart_items.exists():
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate order totals
        subtotal = sum(
            (item.product.discounted_price or item.product.price) * item.quantity
            for item in cart_items
        )
        
        # Get shipping address
        address_id = serializer.validated_data.get('shipping_address_id')
        if address_id:
            # Use saved address
            try:
                address = Address.objects.get(id=address_id, user=request.user)
                shipping_data = {
                    'customer_name': address.full_name,
                    'customer_phone': address.phone,
                    'shipping_address': address.address_line1,
                    'shipping_city': address.city,
                    'shipping_state': address.state,
                    'shipping_pincode': address.pincode,
                    'shipping_country': address.country,
                }
            except Address.DoesNotExist:
                return Response(
                    {'error': 'Address not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Guest checkout - use provided address
            shipping_data = {
                'customer_name': serializer.validated_data['full_name'],
                'customer_phone': serializer.validated_data['phone'],
                'shipping_address': serializer.validated_data['address_line1'],
                'shipping_city': serializer.validated_data['city'],
                'shipping_state': serializer.validated_data['state'],
                'shipping_pincode': serializer.validated_data['pincode'],
                'shipping_country': serializer.validated_data.get('country', 'India'),
            }
        
        payment_method = serializer.validated_data.get('payment_method', 'phonepe')
        requested_courier_id = serializer.validated_data.get('courier_id')

        # Fetch live shipping rate from Shiprocket, fall back to ₹50
        shipping_charge = Decimal('50')
        selected_courier_id = requested_courier_id
        try:
            _shipping_service = ShippingService()
            _rates = _shipping_service.get_shipping_rates(
                cart=list(cart_items),
                delivery_pincode=shipping_data['shipping_pincode'],
                cod=(payment_method == 'cod'),
            )
            if _rates:
                # If customer pre-selected a courier, use that rate; otherwise pick best
                _matched = next((r for r in _rates if r['courier_id'] == requested_courier_id), None)
                _best = _matched or _shipping_service.calculate_best_rate(_rates)
                if _best:
                    shipping_charge = Decimal(str(_best['rate']))
                    selected_courier_id = _best['courier_id']
        except Exception as _e:
            import logging as _logging
            _logging.getLogger(__name__).warning(f"Could not fetch Shiprocket rates, using default: {_e}")

        # Calculate total
        total_amount = subtotal + shipping_charge

        # Create Order
        order = Order.objects.create(
            user=request.user,
            status='pending',
            payment_status='pending',
            payment_method=payment_method,
            customer_email=request.user.email,
            subtotal=subtotal,
            shipping_charge=shipping_charge,
            total_amount=total_amount,
            courier_id=selected_courier_id,
            **shipping_data
        )

        # Create Order Items
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_price=cart_item.product.discounted_price or cart_item.product.price,
                quantity=cart_item.quantity
            )

        # COD flow: confirm order immediately and trigger Shiprocket sync
        if payment_method == 'cod':
            order.payment_status = 'pending'
            order.status = 'confirmed'
            order.save(update_fields=['payment_status', 'status'])

            # Clear cart
            cart.delete()

            try:
                sync_order_to_shiprocket_task.delay(order.id)
            except Exception as e:
                import logging as _logging
                _logging.getLogger(__name__).warning(f"Could not trigger Shiprocket sync for COD order: {str(e)}")
                # Fallback: sync directly
                try:
                    from gift.shipping.services import ShippingService as _SS
                    _ss = _SS()
                    _ss.sync_order_to_shiprocket(order)
                except Exception as _e2:
                    _logging.getLogger(__name__).warning(f"Direct Shiprocket sync also failed: {_e2}")

            return Response({
                'message': 'Order placed successfully',
                'order_id': order.order_id,
                'payment_method': 'cod',
                'amount': float(total_amount),
                'currency': 'INR',
                'customer_name': shipping_data['customer_name'],
                'customer_email': request.user.email,
                'customer_phone': shipping_data['customer_phone'],
            }, status=status.HTTP_201_CREATED)

        # Online payment flow: create PhonePe payment request
        phonepe_service = PhonePeService()

        user_info = {
            'user_id': request.user.id,
            'name': shipping_data['customer_name'],
            'email': request.user.email,
            'phone': shipping_data['customer_phone'],
        }

        payment_request = phonepe_service.create_payment_request(
            amount=float(total_amount),
            order_id=order.order_id,
            user_info=user_info
        )

        # Update order with PhonePe transaction ID
        order.phonepe_merchant_transaction_id = payment_request['merchant_transaction_id']
        order.save()

        return Response({
            'message': 'Checkout initiated successfully',
            'order_id': order.order_id,
            'merchant_transaction_id': payment_request['merchant_transaction_id'],
            'payment_url': payment_request['payment_url'],
            'amount': float(total_amount),
            'currency': 'INR',
            'customer_name': shipping_data['customer_name'],
            'customer_email': request.user.email,
            'customer_phone': shipping_data['customer_phone'],
        }, status=status.HTTP_201_CREATED)

    except Cart.DoesNotExist:
        return Response(
            {'error': 'Cart not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except PaymentInitiationError as e:
        # If PhonePe payment request fails, delete the order
        if 'order' in locals():
            order.delete()
        return Response(
            {'error': f'Online payment is currently unavailable. Please try Cash on Delivery.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except Exception as e:
        # If any error occurs, delete the order
        if 'order' in locals():
            order.delete()
        return Response(
            {'error': f'Checkout failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """
    Verify payment and confirm order
    
    POST /api/checkout/verify-payment/
    Body: {
        "merchant_transaction_id": "MT_xxx",
        "order_id": "ORD12345678"
    }
    """
    # Updated serializer validation for PhonePe
    order_id = request.data.get('order_id')
    merchant_transaction_id = request.data.get('merchant_transaction_id')
    
    if not order_id or not merchant_transaction_id:
        return Response(
            {'error': 'order_id and merchant_transaction_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get order
        order = Order.objects.get(
            order_id=order_id,
            user=request.user
        )
        
        # Verify payment with PhonePe
        phonepe_service = PhonePeService()
        verification_result = phonepe_service.verify_payment(merchant_transaction_id)
        
        if verification_result['payment_status'] == 'SUCCESS':
            # Update order with PhonePe payment details
            order.payment_status = 'paid'
            order.status = 'confirmed'
            order.phonepe_transaction_id = verification_result['transaction_id']
            order.phonepe_response_code = verification_result['response_code']
            order.phonepe_payment_instrument = verification_result['payment_instrument']
            order.save()
            
            # Clear user's cart
            try:
                cart = Cart.objects.get(user=request.user)
                CartItem.objects.filter(cart=cart).delete()
            except Cart.DoesNotExist:
                pass
            
            # Trigger Shiprocket sync (async task)
            try:
                sync_order_to_shiprocket_task.delay(order.id)
            except Exception as e:
                # Log the error but don't fail the payment verification
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Could not trigger Shiprocket sync: {str(e)}")
            
            return Response({
                'message': 'Payment verified successfully',
                'order_id': order.order_id,
                'status': order.status,
                'payment_status': order.payment_status,
                'transaction_id': verification_result['transaction_id'],
            }, status=status.HTTP_200_OK)
            
        elif verification_result['payment_status'] == 'FAILED':
            # Mark order as failed
            order.payment_status = 'failed'
            order.status = 'cancelled'
            order.phonepe_response_code = verification_result['response_code']
            order.save()
            
            return Response({
                'error': 'Payment failed',
                'order_id': order.order_id,
                'status': order.status,
                'payment_status': order.payment_status,
            }, status=status.HTTP_400_BAD_REQUEST)
            
        else:  # PENDING
            return Response({
                'message': 'Payment is still pending',
                'order_id': order.order_id,
                'status': order.status,
                'payment_status': 'pending',
            }, status=status.HTTP_202_ACCEPTED)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except PhonePeVerificationError as e:
        # Mark order as failed
        if 'order' in locals():
            order.payment_status = 'failed'
            order.save()
        return Response(
            {'error': f'Payment verification failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Verification failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_failed(request):
    """
    Handle payment failure
    
    POST /api/checkout/payment-failed/
    Body: {
        "order_id": "ORD12345678",
        "merchant_transaction_id": "MT_xxx",  // For PhonePe
        "error_code": "PAYMENT_ERROR",
        "error_description": "Payment failed"
    }
    """
    from gift.payment.phonepe_service import get_error_message
    
    order_id = request.data.get('order_id')
    merchant_transaction_id = request.data.get('merchant_transaction_id')
    error_code = request.data.get('error_code', 'UNKNOWN')
    error_description = request.data.get('error_description', 'Payment failed')
    
    if not order_id:
        return Response(
            {'error': 'order_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
        
        # Update order status
        order.payment_status = 'failed'
        order.status = 'cancelled'
        
        # Store PhonePe error details if available
        if merchant_transaction_id and order.phonepe_merchant_transaction_id == merchant_transaction_id:
            order.phonepe_response_code = error_code
        
        order.save()
        
        # Get user-friendly error message
        user_friendly_message = get_error_message(error_code)
        
        # Log the error with more details
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(
            f"Payment failed for order {order_id}: {error_code} - {error_description}"
        )
        
        return Response({
            'message': 'Payment failure recorded',
            'order_id': order.order_id,
            'status': order.status,
            'error_code': error_code,
            'user_message': user_friendly_message,
        }, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to process payment failure: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_shipping_rates(request):
    """
    Get shipping rates for delivery pincode
    
    POST /api/checkout/shipping-rates/
    Body: {
        "delivery_pincode": "400001",
        "cod": false  // Optional, default false
    }
    """
    delivery_pincode = request.data.get('delivery_pincode')
    cod = request.data.get('cod', False)
    
    if not delivery_pincode:
        return Response(
            {'error': 'delivery_pincode is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get user's cart
        cart = Cart.objects.get(user=request.user)
        cart_items = list(CartItem.objects.filter(cart=cart).select_related('product'))
        
        if not cart_items:
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get shipping rates from Shiprocket
        shipping_service = ShippingService()
        rates = shipping_service.get_shipping_rates(
            cart=cart_items,
            delivery_pincode=delivery_pincode,
            cod=cod
        )
        
        if not rates:
            return Response({
                'message': 'Delivery not available to this pincode',
                'rates': [],
                'available': False
            }, status=status.HTTP_200_OK)
        
        # Format rates for frontend
        formatted_rates = []
        for rate in rates:
            formatted_rates.append({
                'courier_id': rate['courier_id'],
                'courier_name': rate['courier_name'],
                'rate': rate['rate'],
                'estimated_delivery_days': rate['estimated_delivery_days'],
                'cod_available': rate['cod_available'],
                'rating': rate.get('rating', 0),
                'etd': rate.get('etd', ''),
            })
        
        # Get best rate based on preference
        best_rate = shipping_service.calculate_best_rate(rates)
        
        return Response({
            'message': 'Shipping rates fetched successfully',
            'rates': formatted_rates,
            'available': True,
            'best_rate': {
                'courier_id': best_rate['courier_id'],
                'courier_name': best_rate['courier_name'],
                'rate': best_rate['rate'],
            } if best_rate else None
        }, status=status.HTTP_200_OK)
        
    except Cart.DoesNotExist:
        return Response(
            {'error': 'Cart not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching shipping rates: {str(e)}")
        
        return Response(
            {'error': f'Failed to fetch shipping rates: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



# Order Management endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_orders(request):
    """
    List all orders for authenticated user
    
    GET /api/orders/
    Query params:
        - page: Page number (default: 1)
        - page_size: Items per page (default: 10)
    """
    from django.core.paginator import Paginator
    
    # Get user's orders
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    
    # Pagination
    page_number = request.query_params.get('page', 1)
    page_size = request.query_params.get('page_size', 10)
    
    paginator = Paginator(orders, page_size)
    page_obj = paginator.get_page(page_number)
    
    # Serialize orders
    serializer = OrderListSerializer(page_obj, many=True, context={'request': request})
    
    return Response({
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'results': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_detail(request, order_id):
    """
    Get order details
    
    GET /api/orders/{order_id}/
    """
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
        serializer = OrderDetailSerializer(order, context={'request': request})
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_tracking(request, order_id):
    """
    Get live tracking info for an order

    GET /api/orders/{order_id}/tracking/
    """
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        from gift.shipping.models import Shipment
        shipment = Shipment.objects.get(order=order)
    except Exception:
        return Response({'tracking_available': False, 'order_id': order_id})

    if not shipment.awb_code:
        return Response({'tracking_available': False, 'order_id': order_id})

    tracking = ShippingService().get_tracking_info(shipment)

    return Response({
        'tracking_available': True,
        'order_id': order_id,
        'awb_code': shipment.awb_code,
        'courier_name': shipment.courier_name,
        'status': tracking.get('status'),
        'current_status': tracking.get('current_status'),
        'estimated_delivery_date': tracking.get('estimated_delivery_date'),
        'scans': tracking.get('scans', []),
        'last_updated': shipment.last_tracking_update,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """
    Cancel an order

    POST /api/orders/{order_id}/cancel/
    """
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
        
        # Check if order can be cancelled
        if order.status not in ['pending', 'confirmed']:
            return Response(
                {'error': f'Cannot cancel order with status: {order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order status
        order.status = 'cancelled'
        order.save()
        
        # If order was synced to Shiprocket, cancel shipment
        if order.shiprocket_synced:
            try:
                from gift.shipping.services import ShippingService
                shipping_service = ShippingService()
                
                # Get shipment
                from gift.shipping.models import Shipment
                shipment = Shipment.objects.get(order=order)
                
                # Cancel in Shiprocket
                if shipment.shiprocket_order_id:
                    shipping_service.client.cancel_order([int(shipment.shiprocket_order_id)])
                    shipment.status = 'cancelled'
                    shipment.save()
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to cancel Shiprocket shipment: {str(e)}")
        
        # TODO: Initiate refund if payment was made
        if order.payment_status == 'paid':
            # Add refund logic here when implementing refunds
            pass
        
        return Response({
            'message': 'Order cancelled successfully',
            'order_id': order.order_id,
            'status': order.status
        }, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to cancel order: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])  # PhonePe webhooks don't use user authentication
def phonepe_webhook(request):
    """
    Handle PhonePe webhook notifications
    
    POST /api/webhooks/phonepe/
    Headers: {
        "X-VERIFY": "checksum###salt_index"
    }
    Body: {
        "response": {
            "merchantTransactionId": "MT_xxx",
            "transactionId": "T_xxx",
            "amount": 10000,
            "state": "COMPLETED",
            "responseCode": "SUCCESS",
            "paymentInstrument": {
                "type": "UPI"
            }
        }
    }
    """
    from gift.payment.phonepe_service import PhonePeService, WebhookVerificationError
    from django.views.decorators.csrf import csrf_exempt
    from django.utils.decorators import method_decorator
    import json
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Get X-VERIFY header
        x_verify_header = request.META.get('HTTP_X_VERIFY')
        if not x_verify_header:
            logger.warning("PhonePe webhook received without X-VERIFY header")
            return Response(
                {'error': 'X-VERIFY header missing'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get request body
        request_body = request.body.decode('utf-8')
        request_data = json.loads(request_body)
        
        logger.info(f"PhonePe webhook received: {request_data.get('response', {}).get('merchantTransactionId', 'Unknown')}")
        
        # Initialize PhonePe service and process webhook
        phonepe_service = PhonePeService()
        webhook_result = phonepe_service.handle_webhook(request_data, x_verify_header)
        
        # Find the order by merchant transaction ID
        merchant_transaction_id = webhook_result['merchant_transaction_id']
        
        try:
            order = Order.objects.get(phonepe_merchant_transaction_id=merchant_transaction_id)
        except Order.DoesNotExist:
            logger.error(f"Order not found for merchant transaction ID: {merchant_transaction_id}")
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update order based on webhook data
        if webhook_result['state'] == 'COMPLETED':
            order.payment_status = 'paid'
            order.status = 'confirmed'
            order.phonepe_transaction_id = webhook_result['transaction_id']
            order.phonepe_response_code = webhook_result['response_code']
            order.phonepe_payment_instrument = webhook_result['payment_instrument']
            order.save()
            
            logger.info(f"✓ Order {order.order_id} payment confirmed via webhook")
            
            # Trigger Shiprocket sync (async task)
            try:
                sync_order_to_shiprocket_task.delay(order.id)
            except Exception as e:
                logger.warning(f"Failed to trigger Shiprocket sync: {str(e)}")
            
        elif webhook_result['state'] == 'FAILED':
            order.payment_status = 'failed'
            order.status = 'cancelled'
            order.phonepe_response_code = webhook_result['response_code']
            order.save()
            
            logger.info(f"✗ Order {order.order_id} payment failed via webhook")
        
        else:
            # Handle other states (PENDING, etc.)
            logger.info(f"⏳ Order {order.order_id} payment state: {webhook_result['state']}")
        
        # Return success response to PhonePe
        return Response({
            'message': 'Webhook processed successfully',
            'order_id': order.order_id,
            'status': order.status
        }, status=status.HTTP_200_OK)
        
    except WebhookVerificationError as e:
        logger.error(f"PhonePe webhook verification failed: {str(e)}")
        return Response(
            {'error': 'Webhook verification failed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except json.JSONDecodeError:
        logger.error("Invalid JSON in PhonePe webhook")
        return Response(
            {'error': 'Invalid JSON'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error processing PhonePe webhook: {str(e)}")
        return Response(
            {'error': 'Webhook processing failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_refund(request):
    """
    Initiate refund for a PhonePe payment
    
    POST /api/refunds/initiate/
    Body: {
        "order_id": "ORD12345678",
        "refund_amount": 1000,  // Optional - amount in rupees (full refund if not provided)
        "reason": "Customer request"  // Optional
    }
    """
    order_id = request.data.get('order_id')
    refund_amount = request.data.get('refund_amount')  # In rupees
    reason = request.data.get('reason', 'Customer request')
    
    if not order_id:
        return Response(
            {'error': 'order_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get order
        order = Order.objects.get(order_id=order_id, user=request.user)
        
        # Check if order is eligible for refund
        if order.payment_status != 'paid':
            return Response(
                {'error': 'Order payment is not completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not order.phonepe_transaction_id:
            return Response(
                {'error': 'PhonePe transaction ID not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert refund amount to paise if provided
        refund_amount_paise = None
        if refund_amount:
            refund_amount_paise = int(Decimal(str(refund_amount)) * 100)
            
            # Validate refund amount
            order_amount_paise = int(order.total_amount * 100)
            if refund_amount_paise > order_amount_paise:
                return Response(
                    {'error': 'Refund amount cannot exceed order amount'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Initiate refund with PhonePe
        phonepe_service = PhonePeService()
        refund_result = phonepe_service.initiate_refund(
            transaction_id=order.phonepe_transaction_id,
            refund_amount=refund_amount_paise,
            reason=reason
        )
        
        # TODO: Create RefundRequest model to track refund status
        # For now, just return the result
        
        return Response({
            'message': 'Refund initiated successfully',
            'order_id': order.order_id,
            'refund_transaction_id': refund_result['refund_transaction_id'],
            'refund_amount': refund_amount or float(order.total_amount),
            'status': refund_result['state'],
            'response_code': refund_result['response_code'],
        }, status=status.HTTP_201_CREATED)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except RefundError as e:
        return Response(
            {'error': f'Refund initiation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Refund processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_refund_status(request, refund_transaction_id):
    """
    Check status of a PhonePe refund
    
    GET /api/refunds/status/<refund_transaction_id>/
    """
    try:
        # Check refund status with PhonePe
        phonepe_service = PhonePeService()
        status_result = phonepe_service.check_refund_status(refund_transaction_id)
        
        return Response({
            'refund_transaction_id': status_result['refund_transaction_id'],
            'original_transaction_id': status_result['original_transaction_id'],
            'amount': status_result['amount'],
            'status': status_result['refund_status'],
            'state': status_result['state'],
            'response_code': status_result['response_code'],
        }, status=status.HTTP_200_OK)
        
    except RefundError as e:
        return Response(
            {'error': f'Refund status check failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Status check failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_configuration_status(request):
    """
    Get PhonePe configuration status (for admin/debugging)
    
    GET /api/admin/phonepe-status/
    """
    # Check if user is admin (optional security check)
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        config_status = get_phonepe_configuration_status()
        return Response(config_status, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Configuration check failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )