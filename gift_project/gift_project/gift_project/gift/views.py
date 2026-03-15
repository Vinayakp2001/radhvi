from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.db.models import Q, F, Count, Avg, Sum
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
from decimal import Decimal
import uuid

from .models import (
    Product, Category, Brand, ProductReview,
    Cart, CartItem, Order, OrderItem,
    Wishlist, Coupon
)
from .forms import CheckoutForm

# ==================== HOME & PRODUCTS ====================
def home(request):
    """Home page with all sections"""
    featured_products = Product.objects.filter(is_featured=True)[:8]
    trending_products = Product.objects.filter(is_trending=True)[:8]
    best_sellers = Product.objects.filter(is_best_seller=True)[:8]
    new_arrivals = Product.objects.filter(is_new_arrival=True)[:8]
    deal_of_day = Product.objects.filter(is_deal_of_day=True).first()
    
    categories = Category.objects.filter(is_active=True)[:6]
    
    context = {
        'featured_products': featured_products,
        'trending_products': trending_products,
        'best_sellers': best_sellers,
        'new_arrivals': new_arrivals,
        'deal_of_day': deal_of_day,
        'categories': categories,
    }
    return render(request, 'gift/home.html', context)

def product_list(request):
    """All products with filters"""
    products = Product.objects.all()
    categories = Category.objects.filter(is_active=True)
    brands = Brand.objects.all()
    
    # Filtering
    category_slug = request.GET.get('category')
    brand_slug = request.GET.get('brand')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    search = request.GET.get('search')
    sort = request.GET.get('sort', 'newest')
    condition = request.GET.get('condition')
    in_stock = request.GET.get('in_stock')
    
    if category_slug:
        products = products.filter(category__slug=category_slug)
    
    if brand_slug:
        products = products.filter(brand__slug=brand_slug)
    
    if min_price:
        products = products.filter(price__gte=min_price)
    
    if max_price:
        products = products.filter(price__lte=max_price)
    
    if condition:
        products = products.filter(condition=condition)
    
    if in_stock == 'true':
        products = products.filter(stock__gt=0)
    
    if search:
        products = products.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search) |
            Q(short_description__icontains=search) |
            Q(category__name__icontains=search) |
            Q(brand__name__icontains=search)
        )
    
    # Sorting
    if sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')
    elif sort == 'rating':
        products = products.order_by('-rating')
    elif sort == 'popular':
        products = products.order_by('-sold_count')
    elif sort == 'discount':
        products = products.filter(discounted_price__isnull=False).order_by('-discounted_price')
    else:  # newest
        products = products.order_by('-created_at')
    
    # Pagination
    paginator = Paginator(products, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'products': page_obj,
        'categories': categories,
        'brands': brands,
        'selected_category': category_slug,
        'selected_brand': brand_slug,
        'search_query': search or '',
        'sort_by': sort,
        'page_obj': page_obj,
    }
    return render(request, 'gift/product_list.html', context)

def product_detail(request, slug):
    """Single product page"""
    product = get_object_or_404(Product, slug=slug)
    related_products = Product.objects.filter(
        category=product.category
    ).exclude(id=product.id)[:4]
    
    reviews = product.reviews.all().order_by('-created_at')[:5]
    
    # Calculate average rating
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
    
    # Check if user has reviewed
    user_review = None
    if request.user.is_authenticated:
        user_review = product.reviews.filter(user=request.user).first()
    
    # Check if in wishlist
    in_wishlist = False
    if request.user.is_authenticated:
        in_wishlist = Wishlist.objects.filter(user=request.user, product=product).exists()
    
    context = {
        'product': product,
        'related_products': related_products,
        'reviews': reviews,
        'avg_rating': round(avg_rating, 1),
        'rating_percentage': (avg_rating / 5) * 100,
        'user_review': user_review,
        'in_wishlist': in_wishlist,
    }
    return render(request, 'gift/product_detail.html', context)

# ==================== CART FUNCTIONALITY ====================
def get_or_create_cart(request):
    """Get or create cart for user or guest - FIXED VERSION"""
    # For logged in users - simple and reliable
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(
            user=request.user,
            defaults={'session_key': ''}
        )
        print(f"✓ User cart: {cart.id} (Created: {created})")
        return cart
    
    # For guest users - ensure session exists
    if not request.session.session_key:
        request.session.create()
        request.session.save()  # Important: save the session
        print(f"✓ New session created: {request.session.session_key}")
    
    session_key = request.session.session_key
    print(f"✓ Using session: {session_key}")
    
    # Find or create cart for this session
    cart, created = Cart.objects.get_or_create(
        session_key=session_key,
        user=None
    )
    
    # Ensure session_key is set (in case it was None)
    if not cart.session_key or cart.session_key != session_key:
        cart.session_key = session_key
        cart.save()
        print(f"✓ Updated cart session key")
    
    print(f"✓ Guest cart: {cart.id} (Created: {created}, Session: {cart.session_key})")
    return cart

@csrf_exempt
def get_cart_count(request):
    """Get cart count - SIMPLE VERSION"""
    try:
        cart = get_or_create_cart(request)
        count = CartItem.objects.filter(cart=cart).count()
        
        return JsonResponse({
            'success': True,
            'cart_count': count
        })
    except:
        return JsonResponse({
            'success': False,
            'cart_count': 0
        })

def cart_view(request):
    """Simple cart page - WORKING VERSION"""
    cart = get_or_create_cart(request)
    cart_items = CartItem.objects.filter(cart=cart).select_related('product')
    
    # Calculate total
    subtotal = 0
    for item in cart_items:
        if item.product.discounted_price:
            price = item.product.discounted_price
        else:
            price = item.product.price
        subtotal += price * item.quantity
    
    context = {
        'cart': cart,
        'cart_items': cart_items,
        'subtotal': subtotal,
        'shipping': 0 if subtotal > 1000 else 50,
        'total': subtotal + (0 if subtotal > 1000 else 50)
    }
    
    return render(request, 'gift/cart.html', context)

@csrf_exempt
def add_to_cart(request):
    """Simple add to cart - WORKING VERSION"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = JsonResponse({'status': 'ok'})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken, X-Requested-With"
        return response
    
    if request.method == 'POST':
        try:
            # Get product ID
            if request.headers.get('Content-Type') == 'application/json':
                data = json.loads(request.body)
                product_id = data.get('product_id')
            else:
                product_id = request.POST.get('product_id')
            
            quantity = 1  # Default
            
            if not product_id:
                return JsonResponse({
                    'success': False,
                    'message': 'Product ID missing'
                })
            
            # Get product
            product = Product.objects.filter(id=product_id).first()
            if not product:
                return JsonResponse({
                    'success': False, 
                    'message': 'Product not found'
                })
            
            # Get cart
            cart = get_or_create_cart(request)
            
            # Check if item already exists
            cart_item = CartItem.objects.filter(cart=cart, product=product).first()
            
            if cart_item:
                # Update quantity
                cart_item.quantity += quantity
                cart_item.save()
            else:
                # Create new item
                cart_item = CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=quantity
                )
            
            # Get updated count
            cart_count = CartItem.objects.filter(cart=cart).count()
            
            response = JsonResponse({
                'success': True,
                'message': 'Added to cart!',
                'cart_count': cart_count,
                'product_name': product.name
            })
            response["Access-Control-Allow-Origin"] = "*"
            return response
            
        except Exception as e:
            response = JsonResponse({
                'success': False,
                'message': f'Error: {str(e)}'
            })
            response["Access-Control-Allow-Origin"] = "*"
            return response
    
    response = JsonResponse({'success': False, 'message': 'Invalid request'})
    response["Access-Control-Allow-Origin"] = "*"
    return response



@login_required
def wishlist(request):
    """User's wishlist"""
    wishlist_items = Wishlist.objects.filter(user=request.user).select_related('product')
    
    # Calculate in-stock items count
    in_stock_count = 0
    for item in wishlist_items:
        if hasattr(item, 'product') and hasattr(item.product, 'stock'):
            if item.product.stock > 0:
                in_stock_count += 1
    
    # Get recommended products (products from same categories)
    if wishlist_items.exists():
        # Get categories from wishlist items
        categories = set(item.product.category for item in wishlist_items)
        
        # Get recommended products (not already in wishlist)
        recommended_products = Product.objects.filter(
            category__in=categories
        ).exclude(
            id__in=[item.product.id for item in wishlist_items]
        )[:8]
    else:
        recommended_products = Product.objects.filter(is_featured=True)[:8]
    
    context = {
        'wishlist_items': wishlist_items,
        'in_stock_count': in_stock_count,  # ये नया variable add किया
        'recommended_products': recommended_products,
    }
    return render(request, 'gift/wishlist.html', context)

@csrf_exempt
def update_cart_item(request):
    """Update cart item quantity (AJAX)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            quantity = int(data.get('quantity', 1))
            
            cart = get_or_create_cart(request)
            cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
            
            if quantity <= 0:
                cart_item.delete()
            else:
                if cart_item.product.stock < quantity:
                    return JsonResponse({
                        'success': False,
                        'message': f'Only {cart_item.product.stock} items in stock'
                    })
                cart_item.quantity = quantity
                cart_item.save()
            
            # Recalculate totals
            cart_items = cart.items.all()
            subtotal = sum(item.total_price for item in cart_items)
            item_total = cart_item.total_price if quantity > 0 else 0
            
            return JsonResponse({
                'success': True,
                'item_total': float(item_total),
                'subtotal': float(subtotal),
                'cart_count': cart.total_items
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
    return JsonResponse({'success': False, 'message': 'Invalid request'})

@csrf_exempt
def remove_from_cart(request):
    """Remove item from cart (AJAX)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            
            cart = get_or_create_cart(request)
            cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
            cart_item.delete()
            
            cart_items = cart.items.all()
            subtotal = sum(item.total_price for item in cart_items)
            
            return JsonResponse({
                'success': True,
                'subtotal': float(subtotal),
                'cart_count': cart.total_items
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
    return JsonResponse({'success': False, 'message': 'Invalid request'})

# ==================== CHECKOUT & ORDERS ====================

@login_required
def checkout(request):
    """Checkout page"""
    from gift.shipping.services import ShippingService
    from gift.shipping.shiprocket_client import ShiprocketError
    
    cart = get_or_create_cart(request)
    cart_items = cart.items.select_related('product').all()
    
    if not cart_items:
        messages.warning(request, "Your cart is empty")
        return redirect('cart')
    
    # Check stock
    for item in cart_items:
        if item.quantity > item.product.stock:
            messages.error(request, f"{item.product.name} has only {item.product.stock} items in stock")
            return redirect('cart')
    
    # Calculate totals
    subtotal = sum(item.total_price for item in cart_items)
    
    # Initialize shipping rates
    shipping_rates = []
    selected_courier_id = None
    shipping = Decimal('50')  # Default shipping
    
    # Get pincode from session or form
    delivery_pincode = request.session.get('delivery_pincode', '')
    
    # If pincode is provided, fetch shipping rates
    if delivery_pincode and len(delivery_pincode) == 6:
        try:
            service = ShippingService()
            shipping_rates = service.get_shipping_rates(
                cart=list(cart_items),
                delivery_pincode=delivery_pincode,
                cod=(request.POST.get('payment_method') == 'cod')
            )
            
            # Get selected courier from form or use best rate
            if request.POST.get('courier_id'):
                selected_courier_id = int(request.POST.get('courier_id'))
                selected_rate = next((r for r in shipping_rates if r['courier_id'] == selected_courier_id), None)
                if selected_rate:
                    shipping = Decimal(str(selected_rate['rate']))
            elif shipping_rates:
                # Use best rate by default
                best_rate = service.calculate_best_rate(shipping_rates)
                if best_rate:
                    shipping = Decimal(str(best_rate['rate']))
                    selected_courier_id = best_rate['courier_id']
        except ShiprocketError as e:
            messages.warning(request, f"Could not fetch shipping rates: {str(e)}")
        except Exception as e:
            messages.warning(request, "Using default shipping rates")
    
    tax = subtotal * Decimal('0.18')  # 18% GST
    total = subtotal + shipping + tax
    
    # Simplify payment methods
    PAYMENT_CHOICES = [
        ('cod', 'Cash on Delivery'),
        ('upi', 'UPI/QR Code'),
    ]
    
    if request.method == 'POST':
        form = CheckoutForm(request.POST)
        form.fields['payment_method'].choices = PAYMENT_CHOICES
        
        if form.is_valid():
            # Store pincode in session for rate calculation
            delivery_pincode = form.cleaned_data['pincode']
            request.session['delivery_pincode'] = delivery_pincode
            
            # Get selected courier
            selected_courier_id = request.POST.get('courier_id')
            if selected_courier_id:
                selected_courier_id = int(selected_courier_id)
            
            # Create order
            order = Order.objects.create(
                user=request.user,
                status='pending',
                payment_status='pending',
                payment_method=form.cleaned_data['payment_method'],
                customer_name=form.cleaned_data['name'],
                customer_email=form.cleaned_data['email'],
                customer_phone=form.cleaned_data['phone'],
                shipping_address=form.cleaned_data['address'],
                shipping_city=form.cleaned_data['city'],
                shipping_state=form.cleaned_data['state'],
                shipping_pincode=form.cleaned_data['pincode'],
                subtotal=subtotal,
                shipping_charge=shipping,
                tax_amount=tax,
                discount_amount=Decimal('0'),
                total_amount=total,
                courier_id=selected_courier_id,  # Store selected courier
            )
            
            # Create order items
            for cart_item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    product_name=cart_item.product.name,
                    product_price=cart_item.product.final_price,
                    quantity=cart_item.quantity,
                    total_price=cart_item.total_price,
                )
                
                # Update product stock
                cart_item.product.stock -= cart_item.quantity
                cart_item.product.sold_count += cart_item.quantity
                cart_item.product.save()
            
            # Clear cart
            cart.items.all().delete()
            
            # Process payment
            if form.cleaned_data['payment_method'] == 'cod':
                order.payment_status = 'pending'
                order.status = 'confirmed'
                order.save()
                
                # Trigger Shiprocket sync asynchronously
                try:
                    from gift.shipping.tasks import sync_order_to_shiprocket_task
                    sync_order_to_shiprocket_task.delay(order.id)
                except Exception as e:
                    # If Celery is not running, log the error
                    import logging
                    logger = logging.getLogger('shiprocket')
                    logger.warning(f"Could not trigger async sync: {str(e)}")
                
                messages.success(request, "Order placed successfully! Pay on delivery.")
                return redirect('order_success', order_id=order.order_id)
            else:  # UPI
                # Generate QR code or redirect to UPI payment
                order.save()
                return redirect('process_upi_payment', order_id=order.order_id)
    else:
        # Pre-fill form with user data
        initial_data = {
            'name': request.user.get_full_name() or request.user.username,
            'email': request.user.email,
        }
        form = CheckoutForm(initial=initial_data)
        form.fields['payment_method'].choices = PAYMENT_CHOICES
    
    context = {
        'form': form,
        'cart_items': cart_items,
        'subtotal': subtotal,
        'shipping': shipping,
        'tax': tax,
        'total': total,
        'payment_choices': PAYMENT_CHOICES,
        'shipping_rates': shipping_rates,
        'selected_courier_id': selected_courier_id,
        'delivery_pincode': delivery_pincode,
    }
    return render(request, 'gift/checkout.html', context)

# views.py में checkout function के बाद ये function add करें

@login_required
def process_upi_payment(request, order_id):
    """Process UPI payment"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    if order.payment_status == 'paid':
        messages.success(request, "Payment already completed!")
        return redirect('order_success', order_id=order.order_id)
    
    # Generate mock UPI ID (real implementation में payment gateway integrate करें)
    upi_id = "giftshop@upi"
    amount = order.total_amount
    
    if request.method == 'POST':
        # In real app, verify with payment gateway
        transaction_id = request.POST.get('transaction_id', '').strip()
        
        if transaction_id:
            # Mark payment as paid
            order.payment_status = 'paid'
            order.status = 'confirmed'
            order.transaction_id = transaction_id
            order.payment_date = timezone.now()
            order.save()
            
            # Trigger Shiprocket sync asynchronously
            try:
                from gift.shipping.tasks import sync_order_to_shiprocket_task
                sync_order_to_shiprocket_task.delay(order.id)
            except Exception as e:
                # If Celery is not running, log the error
                import logging
                logger = logging.getLogger('shiprocket')
                logger.warning(f"Could not trigger async sync: {str(e)}")
            
            messages.success(request, "Payment successful! Your order is confirmed.")
            return redirect('order_success', order_id=order.order_id)
        else:
            messages.error(request, "Please enter transaction ID")
    
    context = {
        'order': order,
        'upi_id': upi_id,
        'amount': amount,
    }
    return render(request, 'gift/upipayment.html', context)

@login_required
def order_success(request, order_id):
    """Order success page"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    return render(request, 'gift/order_success.html', {'order': order})

@login_required
def order_history(request):
    """User's order history"""
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'gift/order_history.html', {'orders': orders})

@login_required
def order_detail(request, order_id):
    """Order detail page"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    return render(request, 'gift/order_detail.html', {'order': order})

@login_required
def order_tracking(request, order_id):
    """Order tracking page with shipment details"""
    from gift.shipping.services import ShippingService
    from gift.shipping.models import Shipment
    
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    # Get shipment if exists
    try:
        shipment = order.shipment
        
        # Refresh tracking data
        service = ShippingService()
        tracking_info = service.get_tracking_info(shipment, force_refresh=True)
        
        # Format tracking scans for timeline
        scans = tracking_info.get('scans', [])
        
        context = {
            'order': order,
            'shipment': shipment,
            'tracking_info': tracking_info,
            'scans': scans,
            'has_tracking': bool(shipment.awb_code),
        }
        
    except Shipment.DoesNotExist:
        # Order not yet synced to Shiprocket
        context = {
            'order': order,
            'shipment': None,
            'tracking_info': None,
            'scans': [],
            'has_tracking': False,
        }
    except Exception as e:
        # Error fetching tracking
        import logging
        logger = logging.getLogger('shiprocket')
        logger.error(f"Error fetching tracking for order {order_id}: {str(e)}")
        
        context = {
            'order': order,
            'shipment': order.shipment if hasattr(order, 'shipment') else None,
            'tracking_info': None,
            'scans': [],
            'has_tracking': False,
            'error': 'Could not fetch tracking information'
        }
    
    return render(request, 'gift/order_tracking.html', context)

# ==================== WISHLIST ====================
@login_required
def wishlist(request):
    """User's wishlist"""
    wishlist_items = Wishlist.objects.filter(user=request.user).select_related('product')
    return render(request, 'gift/wishlist.html', {'wishlist_items': wishlist_items})

@login_required
@csrf_exempt
def toggle_wishlist(request):
    """Add/remove from wishlist (AJAX)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            
            product = get_object_or_404(Product, id=product_id)
            wishlist_item, created = Wishlist.objects.get_or_create(
                user=request.user,
                product=product
            )
            
            if not created:
                wishlist_item.delete()
                is_in_wishlist = False
            else:
                is_in_wishlist = True
            
            return JsonResponse({
                'success': True,
                'is_in_wishlist': is_in_wishlist,
                'message': 'Added to wishlist' if created else 'Removed from wishlist'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
    return JsonResponse({'success': False, 'message': 'Invalid request'})

# ==================== REVIEWS ====================
@login_required
def add_review(request, product_id):
    """Add product review"""
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        rating = request.POST.get('rating')
        title = request.POST.get('title')
        comment = request.POST.get('comment')
        
        if not all([rating, title, comment]):
            messages.error(request, "Please fill all fields")
            return redirect('product_detail', slug=product.slug)
        
        # Check if user already reviewed
        existing_review = ProductReview.objects.filter(
            product=product,
            user=request.user
        ).first()
        
        if existing_review:
            existing_review.rating = rating
            existing_review.title = title
            existing_review.comment = comment
            existing_review.save()
            messages.success(request, "Review updated successfully")
        else:
            ProductReview.objects.create(
                product=product,
                user=request.user,
                rating=rating,
                title=title,
                comment=comment
            )
            messages.success(request, "Review added successfully")
        
        # Update product rating
        reviews = product.reviews.all()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        product.rating = avg_rating
        product.review_count = reviews.count()
        product.save()
        
        return redirect('product_detail', slug=product.slug)
    
    return redirect('product_detail', slug=product.slug)

# ==================== COUPONS ====================
def validate_coupon(request):
    """Validate coupon code (AJAX)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            coupon_code = data.get('coupon_code')
            order_amount = Decimal(data.get('order_amount', 0))
            
            coupon = get_object_or_404(Coupon, code=coupon_code)
            
            if not coupon.is_valid(order_amount):
                return JsonResponse({
                    'success': False,
                    'message': 'Coupon is not valid'
                })
            
            if coupon.discount_type == 'percentage':
                discount = order_amount * (coupon.discount_value / 100)
                if coupon.max_discount_amount:
                    discount = min(discount, coupon.max_discount_amount)
            else:  # fixed amount
                discount = coupon.discount_value
            
            return JsonResponse({
                'success': True,
                'discount': float(discount),
                'message': f'Coupon applied! Discount: ₹{discount}'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
    return JsonResponse({'success': False, 'message': 'Invalid request'})

# ==================== SEARCH ====================
def search_autocomplete(request):
    """Search autocomplete (AJAX)"""
    query = request.GET.get('q', '')
    if query:
        products = Product.objects.filter(
            Q(name__icontains=query) |
            Q(short_description__icontains=query) |
            Q(category__name__icontains=query)
        )[:5]
        
        results = []
        for product in products:
            results.append({
                'id': product.id,
                'name': product.name,
                'slug': product.slug,
                'price': float(product.final_price),
                'image': product.images.first().image.url if product.images.first() else '',
                'category': product.category.name,
            })
        
        return JsonResponse({'results': results})
    return JsonResponse({'results': []})

# ==================== UTILITY VIEWS ====================
def about_us(request):
    """About us page"""
    return render(request, 'gift/about.html')

def contact_us(request):
    """Contact us page"""
    return render(request, 'gift/contact.html')

def privacy_policy(request):
    """Privacy policy page"""
    return render(request, 'gift/privacy.html')

def terms_conditions(request):
    """Terms & conditions page"""
    return render(request, 'gift/terms.html')

def faq(request):
    """FAQ page"""
    return render(request, 'gift/faq.html')


@login_required
def order_history(request):
    """User's order history with filters"""
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    
    # Apply filters
    status_filter = request.GET.get('status')
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    min_amount = request.GET.get('min_amount')
    max_amount = request.GET.get('max_amount')
    
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    if from_date:
        orders = orders.filter(created_at__date__gte=from_date)
    
    if to_date:
        orders = orders.filter(created_at__date__lte=to_date)
    
    if min_amount:
        orders = orders.filter(total_amount__gte=min_amount)
    
    if max_amount:
        orders = orders.filter(total_amount__lte=max_amount)
    
    # Pagination
    paginator = Paginator(orders, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Calculate total spent
    total_spent = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    context = {
        'orders': page_obj,
        'page_obj': page_obj,
        'is_paginated': paginator.num_pages > 1,
        'total_spent': total_spent,
    }
    return render(request, 'gift/order_history.html', context)

@login_required
def order_tracking(request, order_id):
    """Order tracking page"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    # Mock tracking data (in real app, integrate with shipping provider)
    tracking_data = [
        {
            'status': 'Order Placed',
            'date': order.created_at,
            'description': 'Your order has been received',
            'completed': True,
        },
        {
            'status': 'Order Confirmed',
            'date': order.created_at + timedelta(hours=1),
            'description': 'Seller has confirmed your order',
            'completed': order.status in ['confirmed', 'processing', 'shipped', 'delivered'],
        },
        {
            'status': 'Processing',
            'date': order.created_at + timedelta(hours=2),
            'description': 'Seller is preparing your order',
            'completed': order.status in ['processing', 'shipped', 'delivered'],
        },
        {
            'status': 'Shipped',
            'date': order.created_at + timedelta(days=1),
            'description': 'Your order has been shipped',
            'completed': order.status in ['shipped', 'delivered'],
        },
        {
            'status': 'Out for Delivery',
            'date': order.created_at + timedelta(days=3),
            'description': 'Your order is out for delivery',
            'completed': order.status == 'delivered',
        },
        {
            'status': 'Delivered',
            'date': order.updated_at if order.status == 'delivered' else None,
            'description': 'Your order has been delivered',
            'completed': order.status == 'delivered',
        },
    ]
    
    context = {
        'order': order,
        'tracking_data': tracking_data,
    }
    return render(request, 'gift/order_tracking.html', context)


# ==================== ORDER MANAGEMENT ====================
@login_required
def order_tracking(request, order_id):
    """Order tracking page"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    # Mock tracking data (in real app, integrate with shipping provider)
    from datetime import timedelta
    tracking_data = [
        {
            'status': 'Order Placed',
            'date': order.created_at,
            'description': 'Your order has been received',
            'completed': True,
        },
        {
            'status': 'Order Confirmed',
            'date': order.created_at + timedelta(hours=1),
            'description': 'Seller has confirmed your order',
            'completed': order.status in ['confirmed', 'processing', 'shipped', 'delivered'],
        },
        {
            'status': 'Processing',
            'date': order.created_at + timedelta(hours=2),
            'description': 'Seller is preparing your order',
            'completed': order.status in ['processing', 'shipped', 'delivered'],
        },
        {
            'status': 'Shipped',
            'date': order.created_at + timedelta(days=1),
            'description': 'Your order has been shipped',
            'completed': order.status in ['shipped', 'delivered'],
        },
        {
            'status': 'Out for Delivery',
            'date': order.created_at + timedelta(days=3),
            'description': 'Your order is out for delivery',
            'completed': order.status == 'delivered',
        },
        {
            'status': 'Delivered',
            'date': order.updated_at if order.status == 'delivered' else None,
            'description': 'Your order has been delivered',
            'completed': order.status == 'delivered',
        },
    ]
    
    context = {
        'order': order,
        'tracking_data': tracking_data,
    }
    return render(request, 'gift/order_tracking.html', context)

@login_required
@csrf_exempt
def cancel_order(request, order_id):
    """Cancel an order (AJAX)"""
    if request.method == 'POST':
        try:
            order = get_object_or_404(Order, order_id=order_id, user=request.user)
            
            # Check if order can be cancelled
            if order.status not in ['pending', 'confirmed']:
                return JsonResponse({
                    'success': False,
                    'message': f'Order cannot be cancelled. Current status: {order.get_status_display()}'
                })
            
            # Update order status
            order.status = 'cancelled'
            
            # Restore product stock
            for item in order.items.all():
                item.product.stock += item.quantity
                item.product.sold_count -= item.quantity
                item.product.save()
            
            order.save()
            
            messages.success(request, f"Order {order.order_id} has been cancelled successfully.")
            
            return JsonResponse({
                'success': True,
                'message': 'Order cancelled successfully',
                'redirect': reverse('order_detail', args=[order.order_id])
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
def download_invoice(request, order_id):
    """Generate and download invoice"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    # For now, create a simple HTML invoice
    # In production, use a library like reportlab for PDF generation
    
    invoice_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - {order.order_id}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .invoice-details {{ margin-bottom: 20px; }}
            .table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            .table th, .table td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            .table th {{ background-color: #f4f4f4; }}
            .totals {{ float: right; margin-top: 20px; }}
            .footer {{ margin-top: 50px; text-align: center; color: #666; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>GiftShop Invoice</h1>
            <p>Order ID: {order.order_id}</p>
            <p>Date: {order.created_at.strftime("%d %B, %Y")}</p>
        </div>
        
        <div class="invoice-details">
            <h3>Billed To:</h3>
            <p>{order.customer_name}<br>
            {order.customer_email}<br>
            {order.customer_phone}</p>
            
            <h3>Shipping Address:</h3>
            <p>{order.shipping_address}<br>
            {order.shipping_city}, {order.shipping_state}<br>
            {order.shipping_pincode}, {order.shipping_country}</p>
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                {"".join(f'''
                <tr>
                    <td>{item.product_name}</td>
                    <td>₹{item.product_price}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.total_price}</td>
                </tr>
                ''' for item in order.items.all())}
            </tbody>
        </table>
        
        <div class="totals">
            <p><strong>Subtotal:</strong> ₹{order.subtotal}</p>
            <p><strong>Shipping:</strong> ₹{order.shipping_charge}</p>
            <p><strong>Tax:</strong> ₹{order.tax_amount}</p>
            <p><strong>Discount:</strong> -₹{order.discount_amount}</p>
            <h3><strong>Total:</strong> ₹{order.total_amount}</h3>
        </div>
        
        <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>GiftShop | support@giftshop.com | +91 9876543210</p>
        </div>
    </body>
    </html>
    """
    
    # Return as HTML (you can change to PDF later)
    response = HttpResponse(invoice_html, content_type='text/html')
    response['Content-Disposition'] = f'attachment; filename="invoice_{order.order_id}.html"'
    return response

@login_required
def start_return(request, order_id):
    """Start return/exchange process"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    if order.status != 'delivered':
        messages.error(request, "Only delivered orders can be returned/exchanged.")
        return redirect('order_detail', order_id=order.order_id)
    
    if request.method == 'POST':
        # Process return request
        return_type = request.POST.get('return_type')
        reason = request.POST.get('reason')
        description = request.POST.get('description')
        
        # Here you would create a ReturnRequest model entry
        # For now, just show a success message
        messages.success(request, "Return request submitted successfully. We'll contact you soon.")
        return redirect('order_detail', order_id=order.order_id)
    
    context = {
        'order': order,
    }
    return render(request, 'gift/return_request.html', context)

@login_required
def write_review_for_order(request, order_id):
    """Write review for order items"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    if order.status != 'delivered':
        messages.error(request, "You can only review delivered orders.")
        return redirect('order_detail', order_id=order.order_id)
    
    if request.method == 'POST':
        product_id = request.POST.get('product_id')
        rating = request.POST.get('rating')
        title = request.POST.get('title')
        comment = request.POST.get('comment')
        
        if product_id and rating and title and comment:
            product = get_object_or_404(Product, id=product_id)
            
            # Check if user already reviewed this product
            existing_review = ProductReview.objects.filter(
                product=product,
                user=request.user
            ).first()
            
            if existing_review:
                existing_review.rating = rating
                existing_review.title = title
                existing_review.comment = comment
                existing_review.is_verified_purchase = True
                existing_review.save()
            else:
                ProductReview.objects.create(
                    product=product,
                    user=request.user,
                    rating=rating,
                    title=title,
                    comment=comment,
                    is_verified_purchase=True
                )
            
            # Update product rating
            reviews = product.reviews.all()
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
            product.rating = avg_rating
            product.review_count = reviews.count()
            product.save()
            
            messages.success(request, f"Review submitted for {product.name}")
            return redirect('order_detail', order_id=order.order_id)
    
    context = {
        'order': order,
    }
    return render(request, 'gift/write_review.html', context)


@login_required
def start_return(request, order_id):
    """Start return/exchange process"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    if order.status != 'delivered':
        messages.error(request, "Only delivered orders can be returned/exchanged.")
        return redirect('order_detail', order_id=order.order_id)
    
    if request.method == 'POST':
        # Process return request
        return_type = request.POST.get('return_type')
        reason = request.POST.get('reason')
        description = request.POST.get('description')
        
        # Here you would create a ReturnRequest model entry
        # For now, just show a success message
        messages.success(request, "Return request submitted successfully. We'll contact you soon.")
        return redirect('order_detail', order_id=order.order_id)
    
    context = {
        'order': order,
    }
    return render(request, 'gift/return_request.html', context)

@login_required
def write_review_for_order(request, order_id):
    """Write review for order items"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    if order.status != 'delivered':
        messages.error(request, "You can only review delivered orders.")
        return redirect('order_detail', order_id=order.order_id)
    
    if request.method == 'POST':
        product_id = request.POST.get('product_id')
        rating = request.POST.get('rating')
        title = request.POST.get('title')
        comment = request.POST.get('comment')
        
        if product_id and rating and title and comment:
            product = get_object_or_404(Product, id=product_id)
            
            # Check if user already reviewed this product
            existing_review = ProductReview.objects.filter(
                product=product,
                user=request.user
            ).first()
            
            if existing_review:
                existing_review.rating = rating
                existing_review.title = title
                existing_review.comment = comment
                existing_review.is_verified_purchase = True
                existing_review.save()
            else:
                ProductReview.objects.create(
                    product=product,
                    user=request.user,
                    rating=rating,
                    title=title,
                    comment=comment,
                    is_verified_purchase=True
                )
            
            # Update product rating
            reviews = product.reviews.all()
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
            product.rating = avg_rating
            product.review_count = reviews.count()
            product.save()
            
            messages.success(request, f"Review submitted for {product.name}")
            return redirect('order_detail', order_id=order.order_id)
    
    context = {
        'order': order,
    }
    return render(request, 'gift/write_review.html', context)


@login_required
def start_return(request, order_id):
    """Start return/exchange process"""
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    if order.status != 'delivered':
        messages.error(request, "Only delivered orders can be returned/exchanged.")
        return redirect('order_detail', order_id=order.order_id)
    
    # Check if within return window (7 days from delivery)
    from datetime import timedelta
    return_window = order.updated_at + timedelta(days=7)
    if timezone.now() > return_window:
        messages.error(request, "Return window has expired. Returns only accepted within 7 days of delivery.")
        return redirect('order_detail', order_id=order.order_id)
    
    if request.method == 'POST':
        # Process return request
        return_type = request.POST.get('return_type')
        reason = request.POST.get('reason')
        description = request.POST.get('description')
        items = request.POST.getlist('items[]')
        
        if not items:
            messages.error(request, "Please select at least one item to return.")
            return redirect('start_return', order_id=order.order_id)
        
        # Here you would create a ReturnRequest model entry
        # For now, just show a success message
        messages.success(request, "Return request submitted successfully. We'll contact you within 24 hours.")
        return redirect('order_detail', order_id=order.order_id)
    
    context = {
        'order': order,
        'return_window': return_window,
    }
    return render(request, 'gift/return_request.html', context)


# views.py में ये views जोड़ें

from django.contrib.auth.forms import UserChangeForm

@login_required
def user_profile(request):
    """User profile with basic update form"""
    user = request.user
    
    if request.method == 'POST':
        form = UserChangeForm(request.POST, instance=user)
        if form.is_valid():
            form.save()
            messages.success(request, "Profile updated successfully!")
            return redirect('profile')
    else:
        form = UserChangeForm(instance=user)
    
    # Get user stats
    orders_count = Order.objects.filter(user=user).count()
    wishlist_count = Wishlist.objects.filter(user=user).count()
    total_spent = Order.objects.filter(user=user, payment_status='paid').aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    context = {
        'form': form,
        'user': user,
        'orders_count': orders_count,
        'wishlist_count': wishlist_count,
        'total_spent': total_spent,
    }
    return render(request, 'gift/profile.html', context)

# views.py में ये function add करो (order tracking के functions के पास)

def track_order(request):
    """Track order page - simple form"""
    order_id = request.GET.get('order_id', '')
    order = None
    
    if request.method == 'POST':
        order_id = request.POST.get('order_id', '').strip()
        if order_id:
            try:
                order = Order.objects.get(order_id=order_id)
            except Order.DoesNotExist:
                messages.error(request, "Order not found. Please check your order ID.")
    
    context = {
        'order': order,
        'order_id': order_id,
    }
    return render(request, 'gift/track_order.html', context)

def compare_products(request):
    """Compare products page - placeholder"""
    messages.info(request, "Compare products feature coming soon!")
    return redirect('home')

def notifications(request):
    """Notifications page - placeholder"""
    messages.info(request, "Notifications feature coming soon!")
    return redirect('home')

# Already existing functions (ensure these are in your views.py)
def address_book(request):
    """Address book page - placeholder"""
    messages.info(request, "Address book feature coming soon!")
    return redirect('profile')

def change_password(request):
    """Change password page - placeholder"""
    messages.info(request, "Change password feature coming soon!")
    return redirect('profile')

from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required

@login_required
def logout_view(request):
    """Custom logout view"""
    auth_logout(request)
    messages.success(request, "Logged out successfully!")
    return redirect('home')

# views.py में ये function add करो या update करो
from .models import Notification  # ये line important है

@login_required
def notifications(request):
    """User notifications"""
    try:
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    except:
        # अगर Notification model नहीं है, तो dummy data use करो
        notifications = []
    
    # Mark all as read if requested
    if request.GET.get('mark_all_read'):
        if notifications:
            notifications.update(is_read=True)
        messages.success(request, "All notifications marked as read!")
        return redirect('notifications')
    
    context = {
        'notifications': notifications,
        'unread_count': notifications.filter(is_read=False).count() if notifications else 0,
    }
    return render(request, 'gift/notifications.html', context)

@login_required
def address_book(request):
    """User's address book"""
    addresses = Address.objects.filter(user=request.user).order_by('-is_default')
    
    if request.method == 'POST' and 'delete' in request.POST:
        address_id = request.POST.get('address_id')
        address = get_object_or_404(Address, id=address_id, user=request.user)
        
        if address.is_default:
            messages.error(request, "Cannot delete default address. Set another address as default first.")
        else:
            address.delete()
            messages.success(request, "Address deleted successfully!")
        
        return redirect('address_book')
    
    context = {
        'addresses': addresses,
    }
    return render(request, 'gift/address_book.html', context)

@login_required
def add_address(request):
    """Add new address"""
    if request.method == 'POST':
        form = AddressForm(request.POST)
        if form.is_valid():
            address = form.save(commit=False)
            address.user = request.user
            
            # If this is set as default, update other addresses
            if address.is_default:
                Address.objects.filter(user=request.user).update(is_default=False)
            
            address.save()
            messages.success(request, "Address added successfully!")
            
            if request.GET.get('next') == 'checkout':
                return redirect('checkout')
            return redirect('address_book')
    else:
        form = AddressForm()
    
    context = {
        'form': form,
        'next': request.GET.get('next', '')
    }
    return render(request, 'gift/add_address.html', context)

@login_required
def edit_address(request, address_id):
    """Edit existing address"""
    address = get_object_or_404(Address, id=address_id, user=request.user)
    
    if request.method == 'POST':
        form = AddressForm(request.POST, instance=address)
        if form.is_valid():
            address = form.save(commit=False)
            
            # If this is set as default, update other addresses
            if address.is_default:
                Address.objects.filter(user=request.user).exclude(id=address_id).update(is_default=False)
            
            address.save()
            messages.success(request, "Address updated successfully!")
            return redirect('address_book')
    else:
        form = AddressForm(instance=address)
    
    context = {
        'form': form,
        'address': address,
    }
    return render(request, 'gift/edit_address.html', context)

@login_required
def set_default_address(request, address_id):
    """Set address as default"""
    address = get_object_or_404(Address, id=address_id, user=request.user)
    
    # Update all addresses to not default
    Address.objects.filter(user=request.user).update(is_default=False)
    
    # Set this address as default
    address.is_default = True
    address.save()
    
    messages.success(request, "Default address updated successfully!")
    return redirect('address_book')

@login_required
def change_password(request):
    """Change user password"""
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, "Password changed successfully!")
            return redirect('user_profile')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = PasswordChangeForm(request.user)
    
    context = {
        'form': form,
    }
    return render(request, 'gift/change_password.html', context)

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages

def user_login(request):
    """User login view"""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        remember = request.POST.get('remember')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            
            # Set session expiry based on remember me
            if remember:
                request.session.set_expiry(1209600)  # 2 weeks
            else:
                request.session.set_expiry(0)  # Browser close
            
            messages.success(request, f"Welcome back, {user.username}!")
            next_url = request.GET.get('next', 'home')
            return redirect(next_url)
        else:
            messages.error(request, "Invalid username or password.")
    
    return render(request, 'gift/login.html')

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import render, redirect
from django.db import IntegrityError  # Add this import
from .models import UserProfile  # Add this import

def user_register(request):
    """User registration view"""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        # Get form data
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')
        username = request.POST.get('username')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        phone = request.POST.get('phone')
        
        # Validation
        errors = []
        
        # Check if username exists
        if User.objects.filter(username=username).exists():
            errors.append("Username already exists.")
        
        # Check if email exists
        if User.objects.filter(email=email).exists():
            errors.append("Email already registered.")
        
        # Password validation
        if password1 != password2:
            errors.append("Passwords do not match.")
        
        if len(password1) < 8:
            errors.append("Password must be at least 8 characters long.")
        
        if errors:
            for error in errors:
                messages.error(request, error)
        else:
            try:
                # First check if user already exists (just in case)
                if User.objects.filter(username=username).exists():
                    messages.error(request, "Username already exists.")
                    return render(request, 'gift/register.html')
                
                # Create user
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password1,
                    first_name=first_name,
                    last_name=last_name
                )
                
                # Create or get user profile
                # Use get_or_create to avoid IntegrityError
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'phone': phone} if phone else {}
                )
                
                # If profile already existed (unlikely), update phone
                if not created and phone:
                    profile.phone = phone
                    profile.save()
                
                # Log the user in
                login(request, user)
                messages.success(request, "Account created successfully! Welcome to GiftShop!")
                
                return redirect('home')
                
            except IntegrityError as e:
                # Handle database integrity errors
                if 'UNIQUE constraint' in str(e):
                    messages.error(request, "Account already exists. Please login instead.")
                else:
                    messages.error(request, f"Database error: {str(e)}")
            except Exception as e:
                messages.error(request, f"Error creating account: {str(e)}")
    
    return render(request, 'gift/register.html')

def add_to_compare(request):
    """Add product to comparison list"""
    if request.method == 'POST':
        product_id = request.POST.get('product_id')
        
        # Initialize compare list in session
        if 'compare_list' not in request.session:
            request.session['compare_list'] = []
        
        # Add product if not already in list and limit to 4
        compare_list = request.session['compare_list']
        if product_id not in compare_list and len(compare_list) < 4:
            compare_list.append(product_id)
            request.session['compare_list'] = compare_list
            request.session.modified = True
            
            return JsonResponse({
                'success': True,
                'message': 'Product added to comparison',
                'compare_count': len(compare_list)
            })
        
        return JsonResponse({
            'success': False,
            'message': 'Cannot add more than 4 products to comparison'
        })
    
    return JsonResponse({'success': False, 'message': 'Invalid request'})

def remove_from_compare(request):
    """Remove product from comparison list"""
    if request.method == 'POST':
        product_id = request.POST.get('product_id')
        
        if 'compare_list' in request.session:
            compare_list = request.session['compare_list']
            if product_id in compare_list:
                compare_list.remove(product_id)
                request.session['compare_list'] = compare_list
                request.session.modified = True
                
                return JsonResponse({
                    'success': True,
                    'message': 'Product removed from comparison',
                    'compare_count': len(compare_list)
                })
        
        return JsonResponse({'success': False, 'message': 'Product not in comparison'})
    
    return JsonResponse({'success': False, 'message': 'Invalid request'})

def clear_comparison(request):
    """Clear all products from comparison"""
    if 'compare_list' in request.session:
        request.session['compare_list'] = []
        request.session.modified = True
    
    return JsonResponse({'success': True, 'message': 'Comparison cleared'})

@login_required
def notifications(request):
    """User notifications"""
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    
    # Mark all as read if requested
    if request.GET.get('mark_all_read'):
        notifications.update(is_read=True)
        messages.success(request, "All notifications marked as read!")
        return redirect('notifications')
    
    context = {
        'notifications': notifications,
        'unread_count': notifications.filter(is_read=False).count(),
    }
    return render(request, 'gift/notifications.html', context)

@login_required
def mark_notification_read(request, notification_id):
    """Mark notification as read"""
    notification = get_object_or_404(Notification, id=notification_id, user=request.user)
    notification.is_read = True
    notification.save()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    
    return redirect('notifications')

@login_required
def browsing_history(request):
    """User's browsing history"""
    history = BrowsingHistory.objects.filter(user=request.user).select_related('product')[:50]
    
    # Clear history if requested
    if request.method == 'POST' and request.POST.get('clear_history'):
        history.delete()
        messages.success(request, "Browsing history cleared!")
        return redirect('browsing_history')
    
    context = {
        'history': history,
    }
    return render(request, 'gift/browsing_history.html', context)

@login_required
def compare_products(request):
    """Compare products"""
    product_ids = request.GET.getlist('products[]')
    products = Product.objects.filter(id__in=product_ids)[:4]  # Limit to 4 products
    
    # Get all attributes for comparison
    attributes = {}
    for product in products:
        for attr in product.attributes.all():
            if attr.name not in attributes:
                attributes[attr.name] = []
            attributes[attr.name].append((product.id, attr.value))
    
    context = {
        'products': products,
        'attributes': attributes,
    }
    return render(request, 'gift/compare.html', context)



from django.contrib.auth import logout as auth_logout
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import update_session_auth_hash

# Add these functions before the end of views.py

@login_required
def address_book(request):
    """Simple address book placeholder"""
    messages.info(request, "Address book feature coming soon!")
    return redirect('profile')

@login_required
def change_password(request):
    """Change password"""
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, "Password changed successfully!")
            return redirect('profile')
    else:
        form = PasswordChangeForm(request.user)
    
    return render(request, 'gift/change_password.html', {'form': form})

def logout_view(request):
    """Custom logout view"""
    auth_logout(request)
    messages.success(request, "Logged out successfully!")
    return redirect('home')


# ==================== BULK ORDERS / B2B ====================
def bulk_orders(request):
    """Bulk orders and corporate gifting page"""
    from .models import BulkInquiry
    
    if request.method == 'POST':
        try:
            # Create bulk inquiry
            inquiry = BulkInquiry.objects.create(
                company_name=request.POST.get('company_name'),
                contact_person=request.POST.get('contact_person'),
                email=request.POST.get('email'),
                phone=request.POST.get('phone'),
                inquiry_type=request.POST.get('inquiry_type'),
                quantity=request.POST.get('quantity'),
                product_interest=request.POST.get('product_interest'),
                budget_range=request.POST.get('budget_range', ''),
                delivery_timeline=request.POST.get('delivery_timeline', ''),
                message=request.POST.get('message', ''),
                gst_number=request.POST.get('gst_number', ''),
            )
            
            messages.success(
                request,
                'Thank you for your inquiry! Our B2B team will contact you within 24 hours.'
            )
            
            # TODO: Send email notification to admin
            # TODO: Send confirmation email to customer
            
            return redirect('bulk_orders')
            
        except Exception as e:
            messages.error(request, f'Error submitting inquiry: {str(e)}')
    
    return render(request, 'gift/bulk_orders.html')


# ==================== WISHLIST ====================

@login_required
def wishlist(request):
    """Display user's wishlist"""
    wishlist_items = Wishlist.objects.filter(user=request.user).select_related('product')
    
    context = {
        'wishlist_items': wishlist_items,
    }
    return render(request, 'gift/wishlist.html', context)


@login_required
def toggle_wishlist(request):
    """Add or remove product from wishlist via AJAX"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            
            if not product_id:
                return JsonResponse({
                    'success': False,
                    'message': 'Product ID is required'
                })
            
            product = get_object_or_404(Product, id=product_id)
            
            # Check if product is already in wishlist
            wishlist_item = Wishlist.objects.filter(
                user=request.user,
                product=product
            ).first()
            
            if wishlist_item:
                # Remove from wishlist
                wishlist_item.delete()
                message = f'{product.name} removed from wishlist'
                in_wishlist = False
            else:
                # Add to wishlist
                Wishlist.objects.create(
                    user=request.user,
                    product=product
                )
                message = f'{product.name} added to wishlist'
                in_wishlist = True
            
            # Get updated wishlist count
            wishlist_count = Wishlist.objects.filter(user=request.user).count()
            
            return JsonResponse({
                'success': True,
                'message': message,
                'in_wishlist': in_wishlist,
                'wishlist_count': wishlist_count
            })
            
        except Product.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Product not found'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Invalid request method'
    })
