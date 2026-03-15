# gift/api.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Product, Category, Cart, CartItem, Order, Wishlist
from .serializers import (
    ProductSerializer, CategorySerializer,
    CartSerializer, CartItemSerializer,
    OrderSerializer, WishlistSerializer
)

@api_view(['GET'])
def product_list_api(request):
    """API endpoint for product listing"""
    products = Product.objects.all()
    
    # Apply filters
    category = request.GET.get('category')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    search = request.GET.get('search')
    sort = request.GET.get('sort', 'newest')
    
    if category:
        products = products.filter(category__slug=category)
    
    if min_price:
        products = products.filter(price__gte=min_price)
    
    if max_price:
        products = products.filter(price__lte=max_price)
    
    if search:
        products = products.filter(name__icontains=search)
    
    # Sorting
    if sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')
    elif sort == 'rating':
        products = products.order_by('-rating')
    elif sort == 'popular':
        products = products.order_by('-sold_count')
    else:
        products = products.order_by('-created_at')
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 12))
    start = (page - 1) * page_size
    end = start + page_size
    
    serializer = ProductSerializer(products[start:end], many=True, context={'request': request})
    
    return Response({
        'products': serializer.data,
        'total': products.count(),
        'page': page,
        'page_size': page_size,
        'total_pages': (products.count() + page_size - 1) // page_size
    })

@api_view(['GET'])
def product_detail_api(request, slug):
    """API endpoint for product details"""
    product = get_object_or_404(Product, slug=slug)
    serializer = ProductSerializer(product, context={'request': request})
    
    # Get related products
    related_products = Product.objects.filter(
        category=product.category
    ).exclude(id=product.id)[:4]
    related_serializer = ProductSerializer(related_products, many=True, context={'request': request})
    
    return Response({
        'product': serializer.data,
        'related_products': related_serializer.data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_to_cart_api(request):
    """API endpoint for adding to cart"""
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))
    
    if not product_id:
        return Response(
            {'error': 'Product ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    product = get_object_or_404(Product, id=product_id)
    
    if product.stock < quantity:
        return Response(
            {'error': f'Only {product.stock} items in stock'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={'quantity': quantity}
    )
    
    if not created:
        cart_item.quantity += quantity
        cart_item.save()
    
    serializer = CartItemSerializer(cart_item)
    return Response({
        'success': True,
        'message': 'Product added to cart',
        'cart_item': serializer.data,
        'cart_count': cart.total_items
    })

@api_view(['GET'])
def get_cart_api(request):
    """API endpoint for cart"""
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
    else:
        # Handle guest cart
        cart = None
        # You can implement guest cart logic here
    
    if cart:
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)
    
    return Response({'items': [], 'total': 0})

# Add more API endpoints as needed

# views.py में नया function add करें

@csrf_exempt
def get_cart_count(request):
    """Get cart item count (AJAX)"""
    try:
        cart = get_or_create_cart(request)
        return JsonResponse({
            'success': True,
            'cart_count': cart.total_items
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'cart_count': 0,
            'message': str(e)
        })