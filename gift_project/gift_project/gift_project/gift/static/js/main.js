// static/js/main.js

$(document).ready(function() {
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Initialize popovers
    $('[data-bs-toggle="popover"]').popover();
    
    // Form validation
    $('form.needs-validation').on('submit', function(e) {
        if (!this.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }
        $(this).addClass('was-validated');
    });
    
    // Quantity input control
    $('.quantity-input').on('change', function() {
        let value = parseInt($(this).val());
        let min = parseInt($(this).attr('min')) || 1;
        let max = parseInt($(this).attr('max')) || 999;
        
        if (value < min) value = min;
        if (value > max) value = max;
        
        $(this).val(value);
    });
    
    $('.quantity-btn-minus').click(function() {
        let input = $(this).siblings('.quantity-input');
        let value = parseInt(input.val());
        let min = parseInt(input.attr('min')) || 1;
        
        if (value > min) {
            input.val(value - 1).trigger('change');
        }
    });
    
    $('.quantity-btn-plus').click(function() {
        let input = $(this).siblings('.quantity-input');
        let value = parseInt(input.val());
        let max = parseInt(input.attr('max')) || 999;
        
        if (value < max) {
            input.val(value + 1).trigger('change');
        }
    });
    
    // Image zoom on hover
    $('.product-image-zoom').hover(function() {
        $(this).addClass('zoomed');
    }, function() {
        $(this).removeClass('zoomed');
    });
    
    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(e) {
        if (this.hash !== "") {
            e.preventDefault();
            
            const hash = this.hash;
            $('html, body').animate({
                scrollTop: $(hash).offset().top - 100
            }, 800);
        }
    });
    
    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        $('.alert:not(.alert-permanent)').fadeOut('slow', function() {
            $(this).remove();
        });
    }, 5000);
    
    // Close alert on click
    $('.alert .btn-close').click(function() {
        $(this).closest('.alert').fadeOut();
    });
    
    // Mobile menu toggle
    $('.navbar-toggler').click(function() {
        $('.navbar-collapse').toggleClass('show');
    });
    
    // Close mobile menu when clicking outside
    $(document).click(function(e) {
        if (!$(e.target).closest('.navbar').length) {
            $('.navbar-collapse').removeClass('show');
        }
    });
    
    // Lazy loading images - Removed (plugin not loaded)
    // $('img.lazy').lazy();
    
    // Initialize AOS (Animate on Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });
    }
    
    // Initialize Swiper carousels
    if (typeof Swiper !== 'undefined') {
        // Hero slider
        var heroSwiper = new Swiper('.hero-swiper', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
        
        // Product carousel
        var productSwiper = new Swiper('.product-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            breakpoints: {
                640: {
                    slidesPerView: 2,
                },
                768: {
                    slidesPerView: 3,
                },
                1024: {
                    slidesPerView: 4,
                },
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }
    
    // Back to top button
    var backToTop = $('#backToTop');
    if (backToTop.length) {
        $(window).scroll(function() {
            if ($(this).scrollTop() > 300) {
                backToTop.fadeIn();
            } else {
                backToTop.fadeOut();
            }
        });
        
        backToTop.click(function() {
            $('html, body').animate({ scrollTop: 0 }, 800);
            return false;
        });
    }
    
    // Add to cart animation
    $('.add-to-cart').click(function(e) {
        e.preventDefault();
        
        var $btn = $(this);
        var productId = $btn.data('product-id');
        var productName = $btn.data('product-name');
        var quantity = $btn.closest('.product-actions').find('.quantity-input').val() || 1;
        
        // Add loading state
        $btn.addClass('loading');
        $btn.html('<span class="loading-spinner"></span> Adding...');
        
        // Make AJAX request
        $.ajax({
            url: '/api/add-to-cart/',
            type: 'POST',
            data: JSON.stringify({
                product_id: productId,
                quantity: quantity
            }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (response.success) {
                    // Update cart count
                    updateCartCount(response.cart_count);
                    
                    // Show success message
                    showToast(response.message || 'Product added to cart!', 'success');
                    
                    // Animate button
                    $btn.removeClass('loading').addClass('success');
                    $btn.html('<i class="fas fa-check"></i> Added!');
                    
                    // Reset button after 2 seconds
                    setTimeout(function() {
                        $btn.removeClass('success');
                        $btn.html('<i class="fas fa-shopping-cart"></i> Add to Cart');
                    }, 2000);
                    
                    // Animation removed to prevent errors
                } else {
                    showToast(response.message || 'Error adding to cart', 'error');
                    resetButton($btn);
                }
            },
            error: function() {
                showToast('Network error. Please try again.', 'error');
                resetButton($btn);
            }
        });
    });
    
    // Wishlist toggle
    $('.wishlist-toggle').click(function(e) {
        e.preventDefault();
        
        var $btn = $(this);
        var productId = $btn.data('product-id');
        
        // Toggle heart icon
        var $icon = $btn.find('i');
        $icon.toggleClass('far fas');
        
        // Make AJAX request
        $.ajax({
            url: '/api/toggle-wishlist/',
            type: 'POST',
            data: JSON.stringify({
                product_id: productId
            }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.message, 'success');
                    updateWishlistCount(response.wishlist_count);
                } else {
                    // Revert icon if error
                    $icon.toggleClass('far fas');
                    showToast(response.message, 'error');
                }
            },
            error: function() {
                // Revert icon on error
                $icon.toggleClass('far fas');
                showToast('Network error. Please try again.', 'error');
            }
        });
    });
    
    // Quick view modal
    $('.quick-view-btn').click(function(e) {
        e.preventDefault();
        
        var productId = $(this).data('product-id');
        var modalId = '#quickViewModal' + productId;
        
        // Load product data via AJAX
        $.ajax({
            url: '/api/product/' + productId + '/quick-view/',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    $(modalId + ' .modal-body').html(response.html);
                    $(modalId).modal('show');
                } else {
                    showToast('Error loading product details', 'error');
                }
            },
            error: function() {
                showToast('Network error. Please try again.', 'error');
            }
        });
    });
    
    // Product image gallery
    $('.product-thumbnail').click(function() {
        var mainImage = $(this).data('main-image');
        $('.product-main-image').attr('src', mainImage);
        $('.product-thumbnail').removeClass('active');
        $(this).addClass('active');
    });
    
    // Coupon code apply
    $('#applyCouponBtn').click(function() {
        var couponCode = $('#couponCode').val();
        
        if (!couponCode.trim()) {
            showToast('Please enter a coupon code', 'warning');
            return;
        }
        
        var $btn = $(this);
        $btn.addClass('loading');
        $btn.html('<span class="loading-spinner"></span> Applying...');
        
        $.ajax({
            url: '/api/validate-coupon/',
            type: 'POST',
            data: JSON.stringify({
                coupon_code: couponCode,
                order_amount: parseFloat($('#subtotal').text().replace('₹', ''))
            }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (response.success) {
                    // Update UI with discount
                    $('#discountSection').show();
                    $('#discountAmount').text('-₹' + response.discount.toFixed(2));
                    
                    // Update total
                    var subtotal = parseFloat($('#subtotal').text().replace('₹', ''));
                    var shipping = parseFloat($('#shipping').text().replace('₹', '') || 0);
                    var tax = parseFloat($('#tax').text().replace('₹', '') || 0);
                    var discount = response.discount;
                    
                    var total = subtotal + shipping + tax - discount;
                    $('#cartTotal').text('₹' + total.toFixed(2));
                    
                    showToast(response.message, 'success');
                } else {
                    showToast(response.message, 'error');
                }
                resetButton($btn);
                $btn.text('Apply');
            },
            error: function() {
                showToast('Network error. Please try again.', 'error');
                resetButton($btn);
                $btn.text('Apply');
            }
        });
    });
    
    // Address selection
    $('.address-select-btn').click(function() {
        var addressId = $(this).data('address-id');
        $('.address-item').removeClass('selected');
        $(this).closest('.address-item').addClass('selected');
        $('#selectedAddressId').val(addressId);
    });
    
    // Payment method selection
    $('.payment-method').click(function() {
        $('.payment-method').removeClass('selected');
        $(this).addClass('selected');
        $('#paymentMethod').val($(this).data('method'));
    });
    
    // Newsletter subscription
    $('#newsletterForm').submit(function(e) {
        e.preventDefault();
        
        var email = $('#newsletterEmail').val();
        
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'warning');
            return;
        }
        
        var $form = $(this);
        $form.find('button').addClass('loading');
        
        $.ajax({
            url: '/api/subscribe-newsletter/',
            type: 'POST',
            data: JSON.stringify({ email: email }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.message, 'success');
                    $form[0].reset();
                } else {
                    showToast(response.message, 'error');
                }
                resetButton($form.find('button'));
            },
            error: function() {
                showToast('Network error. Please try again.', 'error');
                resetButton($form.find('button'));
            }
        });
    });
    
    // Product comparison
    $('.compare-btn').click(function() {
        var productId = $(this).data('product-id');
        var compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
        
        if (compareList.includes(productId)) {
            // Remove from comparison
            compareList = compareList.filter(id => id !== productId);
            $(this).removeClass('active');
            showToast('Product removed from comparison', 'info');
        } else {
            // Add to comparison (max 4 products)
            if (compareList.length >= 4) {
                showToast('You can compare up to 4 products only', 'warning');
                return;
            }
            compareList.push(productId);
            $(this).addClass('active');
            showToast('Product added to comparison', 'success');
        }
        
        localStorage.setItem('compareProducts', JSON.stringify(compareList));
        updateCompareCount(compareList.length);
    });
    
    // Initialize compare count
    var compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
    updateCompareCount(compareList.length);
    
    // Theme toggle (light/dark mode)
    $('#themeToggle').click(function() {
        $('html').attr('data-bs-theme', 
            $('html').attr('data-bs-theme') === 'dark' ? 'light' : 'dark'
        );
        localStorage.setItem('theme', $('html').attr('data-bs-theme'));
    });
    
    // Load saved theme
    var savedTheme = localStorage.getItem('theme') || 'light';
    $('html').attr('data-bs-theme', savedTheme);
});

// Helper functions
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    $('.toast-container').remove();
    
    var icon = 'info-circle';
    var bgColor = 'info';
    
    switch(type) {
        case 'success':
            icon = 'check-circle';
            bgColor = 'success';
            break;
        case 'error':
            icon = 'times-circle';
            bgColor = 'danger';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            bgColor = 'warning';
            break;
    }
    
    // Simple toast without Bootstrap dependency
    var toastHtml = `
        <div class="toast-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <div class="simple-toast bg-${bgColor} text-white" style="
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease-out;
            ">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
                <button onclick="this.closest('.toast-container').remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 10px;
                ">&times;</button>
            </div>
        </div>
    `;
    
    $('body').append(toastHtml);
    
    // Auto remove after 5 seconds
    setTimeout(function() {
        $('.toast-container').fadeOut(300, function() {
            $(this).remove();
        });
    }, 5000);
}

function updateCartCount(count) {
    $('.cart-count').text(count);
    if (count > 0) {
        $('.cart-count').addClass('pulse-animation');
        setTimeout(function() {
            $('.cart-count').removeClass('pulse-animation');
        }, 1000);
    }
}

function updateWishlistCount(count) {
    $('.wishlist-count').text(count);
    if (count > 0) {
        $('.wishlist-count').show();
    } else {
        $('.wishlist-count').hide();
    }
}

function updateCompareCount(count) {
    $('.compare-count').text(count);
    if (count > 0) {
        $('.compare-count').show();
    } else {
        $('.compare-count').hide();
    }
}

function resetButton($btn) {
    $btn.removeClass('loading success error');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format price
function formatPrice(price) {
    return '₹' + parseFloat(price).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Calculate discount percentage
function calculateDiscount(original, discounted) {
    return Math.round(((original - discounted) / original) * 100);
}

// Get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Set URL parameter without reload
function setUrlParameter(key, value) {
    var url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

// Remove URL parameter without reload
function removeUrlParameter(key) {
    var url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showToast('Copied to clipboard!', 'success');
    }, function(err) {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy', 'error');
    });
}

// Share product
function shareProduct(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        });
    } else {
        copyToClipboard(url);
    }
}

// Load more products (infinite scroll)
function setupInfiniteScroll() {
    var loading = false;
    var page = 2;
    var hasMore = true;
    
    $(window).scroll(throttle(function() {
        if (!hasMore || loading) return;
        
        var scrollTop = $(window).scrollTop();
        var windowHeight = $(window).height();
        var documentHeight = $(document).height();
        
        if (scrollTop + windowHeight >= documentHeight - 100) {
            loadMoreProducts();
        }
    }, 200));
    
    function loadMoreProducts() {
        loading = true;
        $('#loadingSpinner').show();
        
        $.ajax({
            url: window.location.pathname,
            type: 'GET',
            data: {
                page: page,
                ...Object.fromEntries(new URLSearchParams(window.location.search))
            },
            success: function(response) {
                var $html = $(response);
                var $products = $html.find('.product-card');
                
                if ($products.length === 0) {
                    hasMore = false;
                    $('#loadMoreBtn').hide();
                } else {
                    $('.products-grid').append($products);
                    page++;
                }
            },
            error: function() {
                showToast('Error loading more products', 'error');
            },
            complete: function() {
                loading = false;
                $('#loadingSpinner').hide();
            }
        });
    }
}

// Initialize infinite scroll if on product list page
if ($('.products-grid').length) {
    setupInfiniteScroll();
}


// ============================================
// PRODUCT CARD INTERACTIVE STATES
// ============================================

$(document).ready(function() {
    // Enhanced Add to Cart with states
    function enhancedAddToCart($btn, productId, quantity) {
        // Add loading state
        $btn.addClass('loading').prop('disabled', true);
        const originalText = $btn.html();
        
        // Simulate AJAX call (replace with actual endpoint)
        setTimeout(function() {
            const success = Math.random() > 0.1; // 90% success rate for demo
            
            if (success) {
                // Success state
                $btn.removeClass('loading').addClass('success');
                $btn.html('<i class="fas fa-check"></i> Added!');
                
                // Update cart count with pulse
                const currentCount = parseInt($('.cart-count').text()) || 0;
                $('.cart-count').text(currentCount + 1).addClass('pulse');
                setTimeout(() => $('.cart-count').removeClass('pulse'), 500);
                
                // Reset button after 2 seconds
                setTimeout(function() {
                    $btn.removeClass('success').prop('disabled', false);
                    $btn.html(originalText);
                }, 2000);
            } else {
                // Error state
                $btn.removeClass('loading').addClass('error error-shake');
                $btn.html('<i class="fas fa-times"></i> Failed');
                
                setTimeout(function() {
                    $btn.removeClass('error error-shake').prop('disabled', false);
                    $btn.html(originalText);
                }, 2000);
            }
        }, 1000);
    }
    
    // Ripple effect on button clicks
    function createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');
        
        const rippleContainer = button.querySelector('.ripple-container');
        if (rippleContainer) {
            rippleContainer.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        }
    }
    
    // Add ripple containers to buttons
    $('.btn, .btn-action, .btn-add-to-cart').each(function() {
        if (!$(this).find('.ripple-container').length) {
            $(this).addClass('ripple').prepend('<span class="ripple-container" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; pointer-events: none;"></span>');
        }
    });
    
    // Attach ripple effect
    $('.ripple').on('click', createRipple);
    
    // Enhanced wishlist toggle with animation
    $(document).on('click', '.btn-wishlist', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $btn = $(this);
        const productId = $btn.data('product-id');
        const isActive = $btn.hasClass('active');
        
        // Toggle active state with animation
        $btn.toggleClass('active');
        
        // Update icon
        const $icon = $btn.find('i');
        if ($icon.hasClass('far')) {
            $icon.removeClass('far').addClass('fas');
        } else {
            $icon.removeClass('fas').addClass('far');
        }
        
        // Show toast notification
        if (!isActive) {
            showToast('Added to wishlist', 'success');
        } else {
            showToast('Removed from wishlist', 'info');
        }
        
        // Here you would make an AJAX call to update the backend
        // $.ajax({ ... });
    });
    
    // Enhanced add to cart with all states
    $(document).on('click', '.btn-add-to-cart:not(.loading):not(.disabled)', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $btn = $(this);
        const productId = $btn.data('product-id') || $btn.closest('.product-card').data('product-id');
        const quantity = $btn.closest('.product-card').find('.quantity-input').val() || 1;
        
        enhancedAddToCart($btn, productId, quantity);
    });
    
    // Mark out of stock products
    $('.product-card[data-stock="0"], .product-card.out-of-stock').each(function() {
        $(this).addClass('out-of-stock');
        
        if (!$(this).find('.out-of-stock-badge').length) {
            $(this).append('<div class="out-of-stock-badge">Out of Stock</div>');
        }
        
        $(this).find('.btn-add-to-cart').prop('disabled', true).text('Out of Stock');
    });
    
    // Quick view button enhancement
    $(document).on('click', '.btn-quick-view', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const productId = $(this).data('product-id');
        // Trigger quick view modal
        showToast('Quick view coming soon!', 'info');
    });
    
    // Prevent card click when interacting with buttons
    $('.product-card').on('click', function(e) {
        if ($(e.target).closest('.btn, .btn-action, .btn-wishlist, .btn-add-to-cart').length) {
            e.stopPropagation();
        }
    });
});

// CSS for ripple effect (add to polish.css if not already there)
const rippleStyles = `
.ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(2);
        opacity: 0;
    }
}
`;

// Inject ripple styles if not present
if (!document.getElementById('ripple-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'ripple-styles';
    styleSheet.textContent = rippleStyles;
    document.head.appendChild(styleSheet);
}


// ============================================
// STICKY NAVIGATION WITH SCROLL EFFECTS
// ============================================

$(document).ready(function() {
    let lastScrollTop = 0;
    let scrollThreshold = 50;
    const navbar = $('.navbar');
    
    // Throttled scroll handler for better performance
    const handleNavbarScroll = throttle(function() {
        const scrollTop = $(window).scrollTop();
        
        // Add scrolled class when past threshold
        if (scrollTop > scrollThreshold) {
            navbar.addClass('scrolled');
            $('body').addClass('navbar-scrolled');
        } else {
            navbar.removeClass('scrolled');
            $('body').removeClass('navbar-scrolled');
        }
        
        // Hide on scroll down, show on scroll up
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.addClass('hide').removeClass('show');
        } else {
            // Scrolling up
            navbar.removeClass('hide').addClass('show');
        }
        
        lastScrollTop = scrollTop;
    }, 100);
    
    // Attach scroll event
    $(window).on('scroll', handleNavbarScroll);
    
    // Initial check
    handleNavbarScroll();
    
    // Ensure navbar is visible when at top
    $(window).on('scroll', function() {
        if ($(window).scrollTop() === 0) {
            navbar.removeClass('hide').addClass('show');
        }
    });
    
    // Smooth scroll to top on logo click
    $('.navbar-brand').on('click', function(e) {
        if ($(this).attr('href') === '#' || $(this).attr('href') === '#top') {
            e.preventDefault();
            $('html, body').animate({ scrollTop: 0 }, 600);
        }
    });
    
    // Add active state to current page nav item
    const currentPath = window.location.pathname;
    $('.navbar-nav .nav-link').each(function() {
        const linkPath = $(this).attr('href');
        if (linkPath && currentPath.includes(linkPath) && linkPath !== '/') {
            $(this).addClass('active');
        }
    });
});


// ============================================
// ENHANCED NAVIGATION INTERACTIONS
// ============================================

$(document).ready(function() {
    // Mobile menu toggle with overlay
    $('.navbar-toggler').on('click', function(e) {
        e.stopPropagation();
        $('.navbar-collapse').toggleClass('show');
        $('.mobile-menu-overlay').toggleClass('active');
        $('body').toggleClass('menu-open');
    });
    
    // Close mobile menu
    $('.mobile-menu-close, .mobile-menu-overlay').on('click', function() {
        $('.navbar-collapse').removeClass('show');
        $('.mobile-menu-overlay').removeClass('active');
        $('body').removeClass('menu-open');
    });
    
    // Prevent body scroll when mobile menu is open
    $('body.menu-open').css('overflow', 'hidden');
    
    // Close mobile menu on nav link click
    $('.navbar-nav .nav-link').on('click', function() {
        if ($(window).width() <= 768) {
            $('.navbar-collapse').removeClass('show');
            $('.mobile-menu-overlay').removeClass('active');
            $('body').removeClass('menu-open');
        }
    });
    
    // Dropdown hover for desktop
    if ($(window).width() > 768) {
        $('.navbar-nav .dropdown').hover(
            function() {
                $(this).find('.dropdown-menu').addClass('show');
            },
            function() {
                $(this).find('.dropdown-menu').removeClass('show');
            }
        );
    }
    
    // Mobile dropdown toggle
    $('.navbar-nav .dropdown-toggle').on('click', function(e) {
        if ($(window).width() <= 768) {
            e.preventDefault();
            $(this).next('.dropdown-menu').slideToggle(300);
            $(this).toggleClass('active');
        }
    });
    
    // Search bar expansion
    $('.navbar-search .search-input').on('focus', function() {
        $(this).closest('.navbar-search').addClass('expanded');
    }).on('blur', function() {
        if (!$(this).val()) {
            $(this).closest('.navbar-search').removeClass('expanded');
        }
    });
    
    // Search form submission
    $('.navbar-search form').on('submit', function(e) {
        const searchValue = $(this).find('.search-input').val().trim();
        if (!searchValue) {
            e.preventDefault();
            $(this).find('.search-input').focus();
        }
    });
    
    // Add mobile menu close button if not exists
    if (!$('.mobile-menu-close').length && $(window).width() <= 768) {
        $('.navbar-collapse').prepend('<button class="mobile-menu-close"><i class="fas fa-times"></i></button>');
    }
    
    // Add mobile overlay if not exists
    if (!$('.mobile-menu-overlay').length) {
        $('body').append('<div class="mobile-menu-overlay"></div>');
    }
    
    // Handle window resize
    $(window).on('resize', debounce(function() {
        if ($(window).width() > 768) {
            $('.navbar-collapse').removeClass('show');
            $('.mobile-menu-overlay').removeClass('active');
            $('body').removeClass('menu-open').css('overflow', '');
        }
    }, 250));
    
    // Keyboard navigation support
    $('.navbar-nav .nav-link, .dropdown-item').on('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this)[0].click();
        }
    });
    
    // Close dropdowns when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.navbar-nav .dropdown').length) {
            $('.navbar-nav .dropdown-menu').removeClass('show');
        }
    });
    
    // Smooth scroll for anchor links in nav
    $('.navbar-nav a[href^="#"]').on('click', function(e) {
        const target = $(this).attr('href');
        if (target !== '#' && $(target).length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: $(target).offset().top - 80
            }, 600);
        }
    });
});


// ============================================
// LOADING STATES SYSTEM
// ============================================

$(document).ready(function() {
    // Create skeleton loaders for product cards
    function createSkeletonCard() {
        return `
            <div class="skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text medium"></div>
                <div class="skeleton skeleton-text short"></div>
                <div class="skeleton skeleton-button"></div>
            </div>
        `;
    }
    
    // Show skeleton loaders while content loads
    function showSkeletonLoaders(container, count = 4) {
        const skeletons = Array(count).fill(null).map(() => createSkeletonCard()).join('');
        $(container).html(skeletons);
    }
    
    // Image lazy loading with fade-in
    function lazyLoadImages() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        document.querySelectorAll('img.lazy-load').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Initialize lazy loading
    if ('IntersectionObserver' in window) {
        lazyLoadImages();
    } else {
        // Fallback for older browsers
        $('img.lazy-load').each(function() {
            const src = $(this).data('src');
            if (src) {
                $(this).attr('src', src).addClass('loaded');
            }
        });
    }
    
    // Image placeholder with fade-in
    $('.image-placeholder img').on('load', function() {
        $(this).addClass('loaded');
    });
    
    // Page loading indicator
    function showPageLoader() {
        if (!$('.page-loader').length) {
            $('body').prepend('<div class="page-loader"><div class="page-loader-bar"></div></div>');
        }
        $('.page-loader').fadeIn(200);
    }
    
    function hidePageLoader() {
        $('.page-loader').fadeOut(300, function() {
            $(this).remove();
        });
    }
    
    // Show page loader on AJAX requests
    $(document).ajaxStart(function() {
        showPageLoader();
    }).ajaxStop(function() {
        hidePageLoader();
    });
    
    // Button loading state helper
    window.setButtonLoading = function($button, loading = true) {
        if (loading) {
            $button.addClass('loading').prop('disabled', true);
            $button.data('original-text', $button.html());
        } else {
            $button.removeClass('loading').prop('disabled', false);
            const originalText = $button.data('original-text');
            if (originalText) {
                $button.html(originalText);
            }
        }
    };
    
    // Loading overlay helper
    window.showLoadingOverlay = function(container) {
        const $container = $(container);
        if (!$container.find('.loading-overlay').length) {
            $container.css('position', 'relative').append(`
                <div class="loading-overlay">
                    <div class="spinner-lg"></div>
                </div>
            `);
        }
        $container.find('.loading-overlay').addClass('active');
    };
    
    window.hideLoadingOverlay = function(container) {
        $(container).find('.loading-overlay').removeClass('active');
    };
    
    // Skeleton loader helper
    window.showSkeletonLoader = function(container, count = 4) {
        showSkeletonLoaders(container, count);
    };
    
    // Auto-hide page loader on page load
    $(window).on('load', function() {
        hidePageLoader();
    });
    
    // Handle image loading errors
    $('img').on('error', function() {
        $(this).attr('src', '/static/images/placeholder.png');
        $(this).addClass('loaded');
    });
    
    // Preload critical images
    function preloadImages(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }
    
    // Example: preload hero images
    const criticalImages = $('[data-preload]').map(function() {
        return $(this).data('preload');
    }).get();
    
    if (criticalImages.length) {
        preloadImages(criticalImages);
    }
});


// ============================================
// SUCCESS AND ERROR FEEDBACK SYSTEM
// ============================================

$(document).ready(function() {
    // Enhanced toast notification system
    window.showToastNotification = function(message, type = 'info', title = '', duration = 5000) {
        // Create toast container if it doesn't exist
        if (!$('.toast-container').length) {
            $('body').append('<div class="toast-container"></div>');
        }
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const titles = {
            success: title || 'Success',
            error: title || 'Error',
            warning: title || 'Warning',
            info: title || 'Info'
        };
        
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast-notification ${type}">
                <div class="toast-icon">
                    <i class="fas ${icons[type]}"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${titles[type]}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close" onclick="closeToast('${toastId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        $('.toast-container').append(toastHtml);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                closeToast(toastId);
            }, duration);
        }
        
        return toastId;
    };
    
    // Close toast function
    window.closeToast = function(toastId) {
        const $toast = $('#' + toastId);
        $toast.addClass('hiding');
        setTimeout(() => {
            $toast.remove();
        }, 300);
    };
    
    // Success animation
    window.showSuccessAnimation = function(container, callback) {
        const $container = $(container);
        const successHtml = `
            <div class="success-animation">
                <i class="fas fa-check"></i>
            </div>
        `;
        
        $container.html(successHtml);
        
        if (callback) {
            setTimeout(callback, 1000);
        }
    };
    
    // Error message with retry
    window.showErrorMessage = function(container, message, retryCallback) {
        const $container = $(container);
        const errorHtml = `
            <div class="error-message">
                <div class="error-icon">
                    <i class="fas fa-exclamation"></i>
                </div>
                <div class="error-content">
                    <div class="error-title">Something went wrong</div>
                    <div class="error-text">${message}</div>
                    ${retryCallback ? '<div class="error-actions"><button class="btn-retry">Try Again</button></div>' : ''}
                </div>
            </div>
        `;
        
        $container.html(errorHtml);
        
        if (retryCallback) {
            $container.find('.btn-retry').on('click', retryCallback);
        }
    };
    
    // Form validation
    window.validateForm = function(formSelector) {
        const $form = $(formSelector);
        let isValid = true;
        
        $form.find('input[required], textarea[required], select[required]').each(function() {
            const $field = $(this);
            const value = $field.val().trim();
            
            if (!value) {
                $field.addClass('is-invalid').removeClass('is-valid');
                isValid = false;
            } else {
                $field.addClass('is-valid').removeClass('is-invalid');
            }
        });
        
        // Email validation
        $form.find('input[type="email"]').each(function() {
            const $field = $(this);
            const email = $field.val().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                $field.addClass('is-invalid').removeClass('is-valid');
                isValid = false;
            }
        });
        
        return isValid;
    };
    
    // Real-time validation
    $('input, textarea, select').on('blur', function() {
        const $field = $(this);
        
        if ($field.attr('required')) {
            const value = $field.val().trim();
            
            if (!value) {
                $field.addClass('is-invalid').removeClass('is-valid');
            } else {
                $field.addClass('is-valid').removeClass('is-invalid');
            }
        }
        
        // Email validation
        if ($field.attr('type') === 'email') {
            const email = $field.val().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                $field.addClass('is-invalid').removeClass('is-valid');
            } else if (email) {
                $field.addClass('is-valid').removeClass('is-invalid');
            }
        }
    });
    
    // Clear validation on input
    $('input, textarea, select').on('input', function() {
        $(this).removeClass('is-invalid is-valid');
    });
    
    // Form submission with validation
    $('form[data-validate]').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        
        if (validateForm($form)) {
            showToastNotification('Form submitted successfully!', 'success');
            // Proceed with form submission
            // $form[0].submit();
        } else {
            showToastNotification('Please fill in all required fields correctly.', 'error');
        }
    });
    
    // Override the old showToast function to use the new one
    const oldShowToast = window.showToast;
    window.showToast = function(message, type = 'info') {
        return showToastNotification(message, type);
    };
});


// ============================================
// HOMEPAGE SECTION ANIMATIONS
// ============================================

$(document).ready(function() {
    // Scroll-triggered animations using Intersection Observer
    const animateOnScroll = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optionally unobserve after animation
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe all elements with animation classes
        document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .scale-in, .section-reveal').forEach(el => {
            observer.observe(el);
        });
    };
    
    // Initialize scroll animations
    if ('IntersectionObserver' in window) {
        animateOnScroll();
    } else {
        // Fallback for older browsers
        $('.fade-in, .fade-in-left, .fade-in-right, .scale-in, .section-reveal').addClass('visible');
    }
    
    // Testimonial carousel
    let currentTestimonial = 0;
    const testimonials = $('.testimonial-slide');
    const totalTestimonials = testimonials.length;
    
    function showTestimonial(index) {
        testimonials.removeClass('active prev');
        
        const prevIndex = currentTestimonial;
        currentTestimonial = (index + totalTestimonials) % totalTestimonials;
        
        $(testimonials[prevIndex]).addClass('prev');
        $(testimonials[currentTestimonial]).addClass('active');
        
        // Update dots
        $('.carousel-dot').removeClass('active');
        $(`.carousel-dot[data-index="${currentTestimonial}"]`).addClass('active');
    }
    
    // Auto-rotate testimonials
    if (testimonials.length > 0) {
        setInterval(() => {
            showTestimonial(currentTestimonial + 1);
        }, 5000);
        
        // Initialize first testimonial
        showTestimonial(0);
    }
    
    // Carousel dot controls
    $(document).on('click', '.carousel-dot', function() {
        const index = $(this).data('index');
        showTestimonial(index);
    });
    
    // Category card interactions
    $('.category-card').on('mouseenter', function() {
        $(this).find('.category-card-description').css('opacity', 1);
    }).on('mouseleave', function() {
        if ($(window).width() > 768) {
            $(this).find('.category-card-description').css('opacity', 0);
        }
    });
    
    // CTA button ripple effect
    $('.cta-button').on('click', function(e) {
        const $button = $(this);
        const x = e.pageX - $button.offset().left;
        const y = e.pageY - $button.offset().top;
        
        const $ripple = $('<span class="cta-ripple"></span>');
        $ripple.css({
            left: x + 'px',
            top: y + 'px'
        });
        
        $button.append($ripple);
        
        setTimeout(() => {
            $ripple.remove();
        }, 600);
    });
    
    // Parallax effect for hero sections (subtle)
    $(window).on('scroll', throttle(function() {
        const scrolled = $(window).scrollTop();
        $('.parallax-bg').css('transform', `translateY(${scrolled * 0.5}px)`);
    }, 50));
    
    // Counter animation for statistics
    function animateCounter($element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            $element.text(Math.floor(current).toLocaleString());
        }, 16);
    }
    
    // Trigger counter animation on scroll
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const $counter = $(entry.target);
                const target = parseInt($counter.data('target'));
                animateCounter($counter, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    $('.counter').each(function() {
        counterObserver.observe(this);
    });
    
    // Smooth reveal for sections
    $('.section-reveal').each(function(index) {
        $(this).css('transition-delay', `${index * 0.1}s`);
    });
    
    // Feature card hover effects
    $('.feature-card').on('mouseenter', function() {
        $(this).find('.feature-icon').addClass('animated');
    }).on('mouseleave', function() {
        $(this).find('.feature-icon').removeClass('animated');
    });
    
    // Add animation classes to elements on page load
    setTimeout(() => {
        $('.hero-content').addClass('fade-in visible');
    }, 100);
});

// Add CSS for CTA ripple effect
const ctaRippleStyles = `
.cta-ripple {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: translate(-50%, -50%);
    animation: cta-ripple-animation 0.6s ease-out;
    pointer-events: none;
}

@keyframes cta-ripple-animation {
    to {
        width: 200px;
        height: 200px;
        opacity: 0;
    }
}
`;

if (!document.getElementById('cta-ripple-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'cta-ripple-styles';
    styleSheet.textContent = ctaRippleStyles;
    document.head.appendChild(styleSheet);
}


// ============================================
// HOMEPAGE VISUAL ENHANCEMENTS
// ============================================

$(document).ready(function() {
    // Smooth image fade-in on load
    $('img.image-fade-in').each(function() {
        const img = this;
        if (img.complete) {
            $(img).addClass('loaded');
        } else {
            $(img).on('load', function() {
                $(this).addClass('loaded');
            });
        }
    });
    
    // Progressive image loading
    $('.progressive-image').each(function() {
        const $container = $(this);
        const $mainImg = $container.find('.progressive-image-main');
        const mainSrc = $mainImg.data('src');
        
        if (mainSrc) {
            const img = new Image();
            img.onload = function() {
                $mainImg.attr('src', mainSrc).addClass('loaded');
            };
            img.src = mainSrc;
        }
    });
    
    // Enhanced parallax effect
    const parallaxElements = $('.parallax-bg');
    
    if (parallaxElements.length > 0) {
        $(window).on('scroll', throttle(function() {
            const scrolled = $(window).scrollTop();
            
            parallaxElements.each(function() {
                const $el = $(this);
                const speed = $el.data('speed') || 0.5;
                const offset = $el.offset().top;
                const yPos = -(scrolled - offset) * speed;
                
                $el.css('transform', `translateY(${yPos}px)`);
            });
        }, 16));
    }
    
    // Counter animation with easing
    function animateCounterWithEasing($element, target, duration = 2000) {
        const start = 0;
        const startTime = Date.now();
        
        function easeOutQuad(t) {
            return t * (2 - t);
        }
        
        function update() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutQuad(progress);
            const current = Math.floor(start + (target - start) * eased);
            
            $element.text(current.toLocaleString());
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                $element.text(target.toLocaleString());
            }
        }
        
        update();
    }
    
    // Initialize counters with Intersection Observer
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const $counter = $(entry.target);
                const target = parseInt($counter.data('target'));
                const duration = parseInt($counter.data('duration')) || 2000;
                
                if (!$counter.hasClass('counted')) {
                    $counter.addClass('counted');
                    animateCounterWithEasing($counter, target, duration);
                }
                
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    $('.stat-counter, .counter').each(function() {
        counterObserver.observe(this);
    });
    
    // Tilt effect on cards
    $('.tilt-card').on('mousemove', function(e) {
        const $card = $(this);
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        $card.css('transform', `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    }).on('mouseleave', function() {
        $(this).css('transform', 'perspective(1000px) rotateX(0) rotateY(0)');
    });
    
    // Gradient animation control
    const $animatedGradients = $('.animated-gradient');
    
    // Pause animation when not in viewport for performance
    const gradientObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            } else {
                entry.target.style.animationPlayState = 'paused';
            }
        });
    });
    
    $animatedGradients.each(function() {
        gradientObserver.observe(this);
    });
    
    // Decorative elements animation
    $('.decorative-circle').each(function(index) {
        $(this).css('animation-delay', `${index * 2}s`);
    });
    
    // Image preloading for hero sections
    function preloadHeroImages() {
        const heroImages = $('[data-hero-image]');
        
        heroImages.each(function() {
            const src = $(this).data('hero-image');
            const img = new Image();
            img.src = src;
        });
    }
    
    preloadHeroImages();
    
    // Lazy load background images
    const bgImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const $el = $(entry.target);
                const bgImage = $el.data('bg-image');
                
                if (bgImage) {
                    $el.css('background-image', `url(${bgImage})`);
                    $el.addClass('bg-loaded');
                }
                
                bgImageObserver.unobserve(entry.target);
            }
        });
    });
    
    $('[data-bg-image]').each(function() {
        bgImageObserver.observe(this);
    });
    
    // Stacked cards hover effect
    $('.stacked-card').on('mouseenter', function() {
        $(this).css('z-index', 10);
    }).on('mouseleave', function() {
        $(this).css('z-index', 'auto');
    });
    
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Disable animations for users who prefer reduced motion
        $('*').css({
            'animation-duration': '0.01ms !important',
            'animation-iteration-count': '1 !important',
            'transition-duration': '0.01ms !important'
        });
    }
    
    // Add loaded class to body when everything is ready
    $(window).on('load', function() {
        $('body').addClass('page-loaded');
        
        // Trigger any entrance animations
        setTimeout(() => {
            $('.hero-content').addClass('visible');
        }, 100);
    });
    
    // Smooth scroll reveal for sections
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    });
    
    $('.fade-in, .scale-in, .section-reveal').each(function() {
        revealObserver.observe(this);
    });
});


// ============================================
// CART ADD-TO-CART ANIMATION
// ============================================

$(document).ready(function() {
    // Flying product animation to cart
    function flyProductToCart($productCard, productImage) {
        const $cartIcon = $('.cart-icon, .navbar-cart');
        
        if (!$cartIcon.length) return;
        
        // Get positions
        const productRect = $productCard[0].getBoundingClientRect();
        const cartRect = $cartIcon[0].getBoundingClientRect();
        
        // Create flying element
        const $flyingProduct = $('<div class="flying-product"></div>');
        $flyingProduct.css({
            'background-image': `url(${productImage})`,
            'background-size': 'cover',
            'background-position': 'center',
            'left': productRect.left + 'px',
            'top': productRect.top + 'px'
        });
        
        $('body').append($flyingProduct);
        
        // Animate to cart
        setTimeout(() => {
            $flyingProduct.css({
                'left': cartRect.left + cartRect.width / 2 + 'px',
                'top': cartRect.top + cartRect.height / 2 + 'px'
            });
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            $flyingProduct.remove();
            animateCartIcon();
            updateCartBadge();
        }, 800);
    }
    
    // Cart icon bounce animation
    function animateCartIcon() {
        const $cartIcon = $('.cart-icon, .navbar-cart');
        $cartIcon.addClass('bounce');
        
        setTimeout(() => {
            $cartIcon.removeClass('bounce');
        }, 600);
    }
    
    // Update cart badge with animation
    function updateCartBadge(count) {
        const $badge = $('.cart-count-badge, .cart-count');
        
        if (count !== undefined) {
            $badge.text(count);
        } else {
            const currentCount = parseInt($badge.text()) || 0;
            $badge.text(currentCount + 1);
        }
        
        $badge.addClass('update');
        
        setTimeout(() => {
            $badge.removeClass('update');
        }, 500);
    }
    
    // Show mini cart preview
    function showMiniCart(productData) {
        let $miniCart = $('.mini-cart');
        
        // Create mini cart if it doesn't exist
        if (!$miniCart.length) {
            $miniCart = createMiniCart();
            $('body').append($miniCart);
        }
        
        // Add new item to mini cart
        if (productData) {
            addItemToMiniCart(productData);
        }
        
        // Show mini cart
        $miniCart.addClass('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            $miniCart.removeClass('show');
        }, 3000);
    }
    
    // Create mini cart structure
    function createMiniCart() {
        return $(`
            <div class="mini-cart">
                <div class="mini-cart-header">
                    <div class="mini-cart-title">Shopping Cart</div>
                    <button class="mini-cart-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mini-cart-body">
                    <div class="mini-cart-items"></div>
                </div>
                <div class="mini-cart-footer">
                    <div class="mini-cart-total">
                        <span class="mini-cart-total-label">Total:</span>
                        <span class="mini-cart-total-amount">$0.00</span>
                    </div>
                    <div class="mini-cart-actions">
                        <a href="/cart/" class="mini-cart-btn mini-cart-btn-secondary">View Cart</a>
                        <a href="/checkout/" class="mini-cart-btn mini-cart-btn-primary">Checkout</a>
                    </div>
                </div>
            </div>
        `);
    }
    
    // Add item to mini cart
    function addItemToMiniCart(productData) {
        const $miniCartItems = $('.mini-cart-items');
        
        const itemHtml = `
            <div class="mini-cart-item new">
                <img src="${productData.image}" alt="${productData.name}" class="mini-cart-item-image">
                <div class="mini-cart-item-details">
                    <div class="mini-cart-item-name">${productData.name}</div>
                    <div class="mini-cart-item-price">$${productData.price}</div>
                    <div class="mini-cart-item-quantity">Qty: ${productData.quantity || 1}</div>
                </div>
            </div>
        `;
        
        $miniCartItems.prepend(itemHtml);
        
        // Remove 'new' class after animation
        setTimeout(() => {
            $('.mini-cart-item.new').removeClass('new');
        }, 1000);
        
        // Update total
        updateMiniCartTotal();
    }
    
    // Update mini cart total
    function updateMiniCartTotal() {
        let total = 0;
        $('.mini-cart-item').each(function() {
            const price = parseFloat($(this).find('.mini-cart-item-price').text().replace('$', ''));
            const qty = parseInt($(this).find('.mini-cart-item-quantity').text().replace('Qty: ', ''));
            total += price * qty;
        });
        
        $('.mini-cart-total-amount').text('$' + total.toFixed(2));
    }
    
    // Close mini cart
    $(document).on('click', '.mini-cart-close', function() {
        $('.mini-cart').removeClass('show');
    });
    
    // Close mini cart when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.mini-cart, .btn-add-to-cart, .cart-icon').length) {
            $('.mini-cart').removeClass('show');
        }
    });
    
    // Enhanced add to cart with animation
    $(document).on('click', '.btn-add-to-cart:not(.loading)', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $btn = $(this);
        const $productCard = $btn.closest('.product-card');
        const productImage = $productCard.find('img').first().attr('src');
        const productName = $productCard.find('.product-title').text() || 'Product';
        const productPrice = $productCard.find('.price-current').text().replace('$', '') || '0.00';
        
        // Start flying animation
        flyProductToCart($productCard, productImage);
        
        // Show mini cart with product data
        setTimeout(() => {
            showMiniCart({
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            });
        }, 400);
        
        // Show success toast
        setTimeout(() => {
            showToastNotification('Product added to cart!', 'success');
        }, 800);
    });
    
    // Cart icon click to show mini cart
    $(document).on('click', '.cart-icon, .navbar-cart', function(e) {
        e.preventDefault();
        const $miniCart = $('.mini-cart');
        
        if ($miniCart.length) {
            $miniCart.toggleClass('show');
        }
    });
    
    // Initialize cart count from localStorage or server
    function initializeCartCount() {
        const savedCount = localStorage.getItem('cartCount');
        if (savedCount) {
            $('.cart-count-badge, .cart-count').text(savedCount);
        }
    }
    
    initializeCartCount();
    
    // Save cart count to localStorage
    function saveCartCount(count) {
        localStorage.setItem('cartCount', count);
    }
    
    // Update cart count and save
    const originalUpdateCartBadge = updateCartBadge;
    updateCartBadge = function(count) {
        originalUpdateCartBadge(count);
        const newCount = $('.cart-count-badge, .cart-count').text();
        saveCartCount(newCount);
    };
});


// ============================================
// MICRO-INTERACTIONS SYSTEM
// ============================================

$(document).ready(function() {
    // Add ripple effect to all buttons
    function addRippleEffect() {
        $('.btn, button, .btn-primary, .btn-secondary').addClass('btn-ripple btn-press');
    }
    
    addRippleEffect();
    
    // Tooltip system
    function initTooltips() {
        $('[data-tooltip]').each(function() {
            const $element = $(this);
            const tooltipText = $element.data('tooltip');
            const position = $element.data('tooltip-position') || 'top';
            
            $element.css('position', 'relative');
            
            const $tooltip = $(`<div class="tooltip tooltip-${position}">${tooltipText}</div>`);
            $element.append($tooltip);
            
            $element.on('mouseenter', function() {
                $tooltip.addClass('show');
            }).on('mouseleave', function() {
                $tooltip.removeClass('show');
            });
        });
    }
    
    initTooltips();
    
    // Modal animations
    function openModal(modalId) {
        const $modal = $(modalId);
        $modal.addClass('show');
        $('body').css('overflow', 'hidden');
        
        // Add backdrop
        if (!$('.modal-backdrop').length) {
            $('body').append('<div class="modal-backdrop"></div>');
        }
        setTimeout(() => {
            $('.modal-backdrop').addClass('show');
        }, 10);
    }
    
    function closeModal(modalId) {
        const $modal = $(modalId);
        $modal.addClass('hiding');
        $('.modal-backdrop').removeClass('show');
        
        setTimeout(() => {
            $modal.removeClass('show hiding');
            $('.modal-backdrop').remove();
            $('body').css('overflow', '');
        }, 300);
    }
    
    // Modal triggers
    $('[data-modal-open]').on('click', function(e) {
        e.preventDefault();
        const modalId = $(this).data('modal-open');
        openModal(modalId);
    });
    
    $('[data-modal-close], .modal-backdrop').on('click', function() {
        const $modal = $('.modal.show');
        if ($modal.length) {
            closeModal('#' + $modal.attr('id'));
        }
    });
    
    // Prevent modal close when clicking inside modal content
    $('.modal-content').on('click', function(e) {
        e.stopPropagation();
    });
    
    // ESC key to close modal
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            const $modal = $('.modal.show');
            if ($modal.length) {
                closeModal('#' + $modal.attr('id'));
            }
        }
    });
    
    // Notification system
    window.showNotification = function(message, type = 'info', duration = 5000) {
        const notificationId = 'notification-' + Date.now();
        const $notification = $(`
            <div id="${notificationId}" class="notification notification-${type}">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="flex: 1;">${message}</div>
                    <button onclick="closeNotification('${notificationId}')" style="background: none; border: none; cursor: pointer; color: #999;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `);
        
        $('body').append($notification);
        
        setTimeout(() => {
            $notification.addClass('show');
        }, 10);
        
        if (duration > 0) {
            setTimeout(() => {
                closeNotification(notificationId);
            }, duration);
        }
        
        return notificationId;
    };
    
    window.closeNotification = function(notificationId) {
        const $notification = $('#' + notificationId);
        $notification.removeClass('show').addClass('slide-out');
        
        setTimeout(() => {
            $notification.remove();
        }, 300);
    };
    
    // Checkbox animations
    $('input[type="checkbox"]').each(function() {
        if (!$(this).parent().hasClass('checkbox-animated')) {
            $(this).wrap('<label class="checkbox-animated"></label>');
            $(this).after('<span class="checkmark"></span>');
        }
    });
    
    // Toggle switch functionality
    $('.toggle-switch input').on('change', function() {
        const isChecked = $(this).is(':checked');
        $(this).closest('.toggle-switch').toggleClass('active', isChecked);
    });
    
    // Input focus effects
    $('input, textarea, select').addClass('input-glow');
    
    // Hover lift effect on cards
    $('.card, .product-card, .feature-card').addClass('hover-lift');
    
    // Smooth scroll for internal links
    $('a[href^="#"]').on('click', function(e) {
        const target = $(this).attr('href');
        if (target !== '#' && $(target).length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: $(target).offset().top - 80
            }, 600, 'swing');
        }
    });
    
    // Copy to clipboard with feedback
    window.copyToClipboard = function(text, $button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = $button.html();
            $button.html('<i class="fas fa-check"></i> Copied!');
            $button.addClass('success');
            
            setTimeout(() => {
                $button.html(originalText);
                $button.removeClass('success');
            }, 2000);
            
            showNotification('Copied to clipboard!', 'success', 2000);
        }).catch(() => {
            showNotification('Failed to copy', 'error', 2000);
        });
    };
    
    // Image lazy load with fade-in
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                
                if (src) {
                    img.src = src;
                    img.classList.add('fade-in-up');
                    imageObserver.unobserve(img);
                }
            }
        });
    });
    
    $('img[data-src]').each(function() {
        imageObserver.observe(this);
    });
    
    // Accordion animation
    $('.accordion-header').on('click', function() {
        const $header = $(this);
        const $content = $header.next('.accordion-content');
        const $accordion = $header.closest('.accordion');
        
        // Close other items if single-open
        if ($accordion.hasClass('accordion-single')) {
            $accordion.find('.accordion-content').not($content).slideUp(300);
            $accordion.find('.accordion-header').not($header).removeClass('active');
        }
        
        $header.toggleClass('active');
        $content.slideToggle(300);
    });
    
    // Dropdown animation
    $('.dropdown-toggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const $dropdown = $(this).next('.dropdown-menu');
        
        // Close other dropdowns
        $('.dropdown-menu').not($dropdown).removeClass('show');
        
        $dropdown.toggleClass('show');
    });
    
    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.dropdown').length) {
            $('.dropdown-menu').removeClass('show');
        }
    });
    
    // Tab switching animation
    $('.tab-link').on('click', function(e) {
        e.preventDefault();
        
        const $tab = $(this);
        const target = $tab.data('tab');
        
        // Update active states
        $tab.siblings().removeClass('active');
        $tab.addClass('active');
        
        // Show target content
        const $tabContent = $(target);
        $tabContent.siblings('.tab-pane').removeClass('active').addClass('fade-out-down');
        
        setTimeout(() => {
            $tabContent.addClass('active fade-in-up').removeClass('fade-out-down');
        }, 100);
    });
    
    // Progress bar animation
    $('.progress-bar').each(function() {
        const $bar = $(this);
        const width = $bar.data('width') || '0%';
        
        const progressObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        $bar.css('width', width);
                    }, 100);
                    progressObserver.unobserve(entry.target);
                }
            });
        });
        
        progressObserver.observe(this);
    });
    
    // Star rating interaction
    $('.star-rating').on('click', '.star', function() {
        const $star = $(this);
        const rating = $star.data('rating');
        const $rating = $star.closest('.star-rating');
        
        $rating.find('.star').removeClass('active');
        $rating.find('.star').each(function() {
            if ($(this).data('rating') <= rating) {
                $(this).addClass('active');
            }
        });
        
        $rating.data('selected-rating', rating);
    });
    
    // Initialize all micro-interactions
    console.log('Micro-interactions system initialized');
});


// ============================================
// MOBILE DEVICE OPTIMIZATION
// ============================================

$(document).ready(function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isMobile) {
        $('body').addClass('is-mobile');
    }
    
    if (isIOS) {
        $('body').addClass('is-ios');
    }
    
    if (isAndroid) {
        $('body').addClass('is-android');
    }
    
    // Mobile menu toggle
    $('.mobile-menu-toggle, .navbar-toggler').on('click', function(e) {
        e.preventDefault();
        $('.mobile-menu, .navbar-collapse').toggleClass('open show');
        $('.mobile-menu-overlay').toggleClass('active');
        $('body').toggleClass('menu-open');
    });
    
    // Close mobile menu
    $('.mobile-menu-close, .mobile-menu-overlay').on('click', function() {
        $('.mobile-menu, .navbar-collapse').removeClass('open show');
        $('.mobile-menu-overlay').removeClass('active');
        $('body').removeClass('menu-open');
    });
    
    // Prevent body scroll when menu is open
    $('body').on('touchmove', function(e) {
        if ($('body').hasClass('menu-open') && !$(e.target).closest('.mobile-menu').length) {
            e.preventDefault();
        }
    });
    
    // Mobile filters toggle
    $('.mobile-filters-toggle').on('click', function() {
        $('.mobile-filters').toggleClass('open');
        $('.mobile-menu-overlay').toggleClass('active');
    });
    
    $('.mobile-filters-close').on('click', function() {
        $('.mobile-filters').removeClass('open');
        $('.mobile-menu-overlay').removeClass('active');
    });
    
    // Handle keyboard appearance on mobile
    if (isMobile) {
        let originalHeight = window.innerHeight;
        
        $('input, textarea').on('focus', function() {
            setTimeout(() => {
                if (window.innerHeight < originalHeight) {
                    // Keyboard is visible
                    $('body').addClass('keyboard-visible');
                    
                    // Scroll input into view
                    const $input = $(this);
                    const inputTop = $input.offset().top;
                    const scrollTop = $(window).scrollTop();
                    const windowHeight = window.innerHeight;
                    
                    if (inputTop > scrollTop + windowHeight - 100) {
                        $('html, body').animate({
                            scrollTop: inputTop - 100
                        }, 300);
                    }
                }
            }, 300);
        });
        
        $('input, textarea').on('blur', function() {
            setTimeout(() => {
                $('body').removeClass('keyboard-visible');
            }, 300);
        });
    }
    
    // Prevent unintentional horizontal scrolling
    let touchStartX = 0;
    let touchStartY = 0;
    
    $(document).on('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    $(document).on('touchmove', function(e) {
        if (!$(e.target).closest('.carousel, .swiper, .scrollable-x').length) {
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const deltaX = Math.abs(touchEndX - touchStartX);
            const deltaY = Math.abs(touchEndY - touchStartY);
            
            // Prevent horizontal scroll if vertical scroll is dominant
            if (deltaY > deltaX) {
                e.preventDefault();
            }
        }
    });
    
    // Optimize touch events
    if (isMobile) {
        // Use touchstart for faster response
        $('.btn, button, a').on('touchstart', function() {
            $(this).addClass('touch-active');
        }).on('touchend touchcancel', function() {
            $(this).removeClass('touch-active');
        });
    }
    
    // Mobile-friendly image loading
    function loadMobileImages() {
        $('img[data-mobile-src]').each(function() {
            const $img = $(this);
            const mobileSrc = $img.data('mobile-src');
            const desktopSrc = $img.data('src');
            
            if (window.innerWidth <= 768 && mobileSrc) {
                $img.attr('src', mobileSrc);
            } else if (desktopSrc) {
                $img.attr('src', desktopSrc);
            }
        });
    }
    
    loadMobileImages();
    
    // Reload images on orientation change
    $(window).on('orientationchange', function() {
        setTimeout(loadMobileImages, 200);
    });
    
    // Detect and handle orientation changes
    $(window).on('orientationchange', function() {
        $('body').removeClass('portrait landscape');
        
        if (window.orientation === 0 || window.orientation === 180) {
            $('body').addClass('portrait');
        } else {
            $('body').addClass('landscape');
        }
    });
    
    // Mobile pull-to-refresh prevention (optional)
    if (isMobile) {
        let startY = 0;
        
        $(document).on('touchstart', function(e) {
            startY = e.touches[0].pageY;
        });
        
        $(document).on('touchmove', function(e) {
            const y = e.touches[0].pageY;
            
            // Prevent pull-to-refresh if at top of page
            if ($(window).scrollTop() === 0 && y > startY) {
                e.preventDefault();
            }
        });
    }
    
    // Mobile-optimized modals
    if (isMobile) {
        $('.modal').on('show.bs.modal', function() {
            $('body').css({
                'position': 'fixed',
                'width': '100%',
                'overflow': 'hidden'
            });
        });
        
        $('.modal').on('hide.bs.modal', function() {
            $('body').css({
                'position': '',
                'width': '',
                'overflow': ''
            });
        });
    }
    
    // Optimize scroll performance on mobile
    let ticking = false;
    let lastScrollY = 0;
    
    $(window).on('scroll', function() {
        lastScrollY = window.scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(function() {
                // Perform scroll-based updates here
                ticking = false;
            });
            
            ticking = true;
        }
    });
    
    // Mobile-friendly form validation
    if (isMobile) {
        $('form').on('submit', function(e) {
            const $form = $(this);
            const $invalidInputs = $form.find('input:invalid, textarea:invalid, select:invalid');
            
            if ($invalidInputs.length > 0) {
                e.preventDefault();
                
                // Scroll to first invalid input
                $('html, body').animate({
                    scrollTop: $invalidInputs.first().offset().top - 100
                }, 300);
                
                $invalidInputs.first().focus();
            }
        });
    }
    
    // Add mobile-specific classes
    if (window.innerWidth <= 768) {
        $('.btn:not(.btn-block)').addClass('btn-block-mobile');
    }
    
    // Handle resize
    $(window).on('resize', debounce(function() {
        if (window.innerWidth <= 768) {
            $('.btn:not(.btn-block)').addClass('btn-block-mobile');
        } else {
            $('.btn').removeClass('btn-block-mobile');
        }
    }, 250));
    
    // Mobile swipe gestures for carousels
    if (isMobile) {
        let touchstartX = 0;
        let touchendX = 0;
        
        $('.carousel, .swiper').on('touchstart', function(e) {
            touchstartX = e.changedTouches[0].screenX;
        });
        
        $('.carousel, .swiper').on('touchend', function(e) {
            touchendX = e.changedTouches[0].screenX;
            handleSwipe($(this));
        });
        
        function handleSwipe($element) {
            if (touchendX < touchstartX - 50) {
                // Swipe left
                $element.find('.carousel-control-next, .swiper-button-next').click();
            }
            
            if (touchendX > touchstartX + 50) {
                // Swipe right
                $element.find('.carousel-control-prev, .swiper-button-prev').click();
            }
        }
    }
    
    // Viewport height fix for mobile browsers
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    $(window).on('resize orientationchange', debounce(setVH, 250));
    
    console.log('Mobile optimizations initialized');
});


// ============================================
// MOBILE IMAGE OPTIMIZATION
// ============================================

$(document).ready(function() {
    // Responsive image loading based on viewport
    function loadResponsiveImages() {
        const viewportWidth = window.innerWidth;
        
        $('img[data-src-mobile], img[data-src-tablet], img[data-src-desktop]').each(function() {
            const $img = $(this);
            let src = '';
            
            if (viewportWidth <= 480 && $img.data('src-mobile')) {
                src = $img.data('src-mobile');
            } else if (viewportWidth <= 768 && $img.data('src-tablet')) {
                src = $img.data('src-tablet');
            } else if ($img.data('src-desktop')) {
                src = $img.data('src-desktop');
            } else if ($img.data('src')) {
                src = $img.data('src');
            }
            
            if (src && $img.attr('src') !== src) {
                $img.addClass('image-loading');
                
                const img = new Image();
                img.onload = function() {
                    $img.attr('src', src);
                    $img.removeClass('image-loading').addClass('image-loaded');
                };
                img.onerror = function() {
                    $img.removeClass('image-loading');
                    $img.attr('src', '/static/images/placeholder.png');
                };
                img.src = src;
            }
        });
    }
    
    loadResponsiveImages();
    
    // Reload on resize (debounced)
    $(window).on('resize', debounce(loadResponsiveImages, 500));
    
    // Prevent unintentional horizontal scrolling
    function preventHorizontalScroll() {
        const bodyWidth = $('body').width();
        
        $('*').each(function() {
            const $el = $(this);
            if ($el.width() > bodyWidth) {
                console.warn('Element wider than body:', $el);
                $el.css('max-width', '100%');
            }
        });
    }
    
    if (window.innerWidth <= 768) {
        preventHorizontalScroll();
    }
    
    // Handle keyboard appearance on mobile forms
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const originalHeight = window.innerHeight;
        
        $('input, textarea, select').on('focus', function() {
            const $input = $(this);
            
            setTimeout(() => {
                const currentHeight = window.innerHeight;
                
                if (currentHeight < originalHeight * 0.8) {
                    $('body').addClass('keyboard-visible');
                    
                    // Scroll input into view
                    const inputOffset = $input.offset().top;
                    const scrollTop = $(window).scrollTop();
                    const viewportHeight = window.innerHeight;
                    
                    if (inputOffset > scrollTop + viewportHeight - 150) {
                        $('html, body').animate({
                            scrollTop: inputOffset - 100
                        }, 300);
                    }
                }
            }, 300);
        });
        
        $('input, textarea, select').on('blur', function() {
            setTimeout(() => {
                $('body').removeClass('keyboard-visible');
            }, 100);
        });
    }
    
    // Fix viewport height for mobile browsers
    function updateVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    updateVH();
    
    $(window).on('resize orientationchange', debounce(updateVH, 100));
    
    // Lazy load images with Intersection Observer
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                
                if (src) {
                    img.classList.add('image-loading');
                    
                    const tempImg = new Image();
                    tempImg.onload = function() {
                        img.src = src;
                        img.classList.remove('image-loading');
                        img.classList.add('image-loaded');
                    };
                    tempImg.onerror = function() {
                        img.classList.remove('image-loading');
                        img.src = '/static/images/placeholder.png';
                    };
                    tempImg.src = src;
                    
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
    
    // Observe all lazy load images
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
    
    // Detect and prevent horizontal scroll
    function checkHorizontalOverflow() {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        
        if (scrollWidth > clientWidth) {
            console.warn('Horizontal overflow detected:', scrollWidth - clientWidth, 'px');
            
            // Find offending elements
            $('*').each(function() {
                const rect = this.getBoundingClientRect();
                if (rect.right > clientWidth || rect.left < 0) {
                    console.warn('Overflowing element:', this);
                }
            });
        }
    }
    
    if (window.innerWidth <= 768) {
        setTimeout(checkHorizontalOverflow, 1000);
    }
    
    // Handle orientation change
    $(window).on('orientationchange', function() {
        setTimeout(() => {
            loadResponsiveImages();
            updateVH();
            checkHorizontalOverflow();
        }, 200);
    });
    
    // Optimize image loading for slow connections
    if ('connection' in navigator) {
        const connection = navigator.connection;
        
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // Load lower quality images
            $('img[data-src-low]').each(function() {
                const $img = $(this);
                $img.attr('src', $img.data('src-low'));
            });
        }
    }
    
    // Progressive image loading
    $('.progressive-image').each(function() {
        const $container = $(this);
        const $placeholder = $container.find('.progressive-image-placeholder');
        const $mainImg = $container.find('.progressive-image-main');
        const mainSrc = $mainImg.data('src');
        
        if (mainSrc) {
            const img = new Image();
            img.onload = function() {
                $mainImg.attr('src', mainSrc).addClass('loaded');
            };
            img.src = mainSrc;
        }
    });
    
    // Handle image errors
    $('img').on('error', function() {
        const $img = $(this);
        if (!$img.hasClass('error-handled')) {
            $img.addClass('error-handled');
            $img.attr('src', '/static/images/placeholder.png');
            $img.attr('alt', 'Image not available');
        }
    });
    
    // Preload critical images
    function preloadCriticalImages() {
        const criticalImages = [];
        
        // Get images above the fold
        $('img').each(function() {
            const rect = this.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                const src = $(this).data('src') || $(this).attr('src');
                if (src && !src.includes('placeholder')) {
                    criticalImages.push(src);
                }
            }
        });
        
        // Preload them
        criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    preloadCriticalImages();
    
    // Monitor scroll performance
    let scrollTimeout;
    $(window).on('scroll', function() {
        clearTimeout(scrollTimeout);
        $('body').addClass('is-scrolling');
        
        scrollTimeout = setTimeout(() => {
            $('body').removeClass('is-scrolling');
        }, 150);
    });
    
    // Disable animations while scrolling for better performance
    if (window.innerWidth <= 768) {
        const style = document.createElement('style');
        style.textContent = `
            body.is-scrolling * {
                animation-play-state: paused !important;
                transition: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('Mobile image optimization initialized');
});


// ============================================
// ENHANCED FORM COMPONENTS
// ============================================

$(document).ready(function() {
    // Real-time form validation
    function validateField($field) {
        const value = $field.val().trim();
        const type = $field.attr('type');
        const required = $field.prop('required');
        let isValid = true;
        let message = '';
        
        // Required validation
        if (required && !value) {
            isValid = false;
            message = 'This field is required';
        }
        
        // Email validation
        else if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
        }
        
        // URL validation
        else if (type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                isValid = false;
                message = 'Please enter a valid URL';
            }
        }
        
        // Number validation
        else if (type === 'number' && value) {
            const min = $field.attr('min');
            const max = $field.attr('max');
            const num = parseFloat(value);
            
            if (isNaN(num)) {
                isValid = false;
                message = 'Please enter a valid number';
            } else if (min && num < parseFloat(min)) {
                isValid = false;
                message = `Value must be at least ${min}`;
            } else if (max && num > parseFloat(max)) {
                isValid = false;
                message = `Value must be at most ${max}`;
            }
        }
        
        // Pattern validation
        const pattern = $field.attr('pattern');
        if (pattern && value) {
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                isValid = false;
                message = $field.data('pattern-message') || 'Invalid format';
            }
        }
        
        // Min/max length validation
        const minLength = $field.attr('minlength');
        const maxLength = $field.attr('maxlength');
        
        if (minLength && value.length < parseInt(minLength)) {
            isValid = false;
            message = `Minimum ${minLength} characters required`;
        } else if (maxLength && value.length > parseInt(maxLength)) {
            isValid = false;
            message = `Maximum ${maxLength} characters allowed`;
        }
        
        // Update field state
        if (isValid) {
            $field.removeClass('invalid').addClass('valid');
            $field.siblings('.invalid-feedback').text('');
            $field.siblings('.valid-feedback').text('Looks good!');
        } else {
            $field.removeClass('valid').addClass('invalid');
            $field.siblings('.invalid-feedback').text(message);
            $field.siblings('.valid-feedback').text('');
        }
        
        return isValid;
    }
    
    // Validate on blur
    $('.form-control, .form-input').on('blur', function() {
        if ($(this).val()) {
            validateField($(this));
        }
    });
    
    // Clear validation on input
    $('.form-control, .form-input').on('input', function() {
        $(this).removeClass('valid invalid');
    });
    
    // Form submission validation
    $('form[data-validate]').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        let isValid = true;
        
        $form.find('.form-control, .form-input').each(function() {
            if (!validateField($(this))) {
                isValid = false;
            }
        });
        
        if (isValid) {
            const $submitBtn = $form.find('[type="submit"]');
            $submitBtn.addClass('loading');
            
            // Simulate form submission
            setTimeout(() => {
                $submitBtn.removeClass('loading').addClass('success');
                $submitBtn.text('Success!');
                
                showToastNotification('Form submitted successfully!', 'success');
                
                setTimeout(() => {
                    $submitBtn.removeClass('success');
                    $submitBtn.text('Submit');
                    $form[0].reset();
                    $form.find('.form-control, .form-input').removeClass('valid invalid');
                }, 2000);
            }, 1500);
        } else {
            // Scroll to first invalid field
            const $firstInvalid = $form.find('.invalid').first();
            if ($firstInvalid.length) {
                $('html, body').animate({
                    scrollTop: $firstInvalid.offset().top - 100
                }, 300);
                $firstInvalid.focus();
            }
            
            showToastNotification('Please fix the errors in the form', 'error');
        }
    });
    
    // Password strength indicator
    $('input[type="password"][data-strength]').on('input', function() {
        const password = $(this).val();
        const $strengthBar = $(this).siblings('.password-strength').find('.password-strength-bar');
        
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        
        $strengthBar.removeClass('weak medium strong');
        
        if (strength <= 1) {
            $strengthBar.addClass('weak');
        } else if (strength <= 3) {
            $strengthBar.addClass('medium');
        } else {
            $strengthBar.addClass('strong');
        }
    });
    
    // Character counter
    $('textarea[maxlength], input[maxlength]').each(function() {
        const $field = $(this);
        const maxLength = $field.attr('maxlength');
        
        if (!$field.siblings('.char-counter').length) {
            $field.after(`<span class="char-counter"><span class="current">0</span> / ${maxLength}</span>`);
        }
        
        $field.on('input', function() {
            const currentLength = $(this).val().length;
            const $counter = $(this).siblings('.char-counter');
            
            $counter.find('.current').text(currentLength);
            
            if (currentLength >= maxLength) {
                $counter.addClass('limit-reached');
            } else {
                $counter.removeClass('limit-reached');
            }
        });
    });
    
    // Floating labels
    $('.form-floating .form-control').on('focus blur', function() {
        $(this).parent().toggleClass('focused');
    });
    
    // Auto-resize textarea
    $('textarea[data-auto-resize]').on('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Password visibility toggle
    $('[data-password-toggle]').on('click', function() {
        const $input = $($(this).data('password-toggle'));
        const type = $input.attr('type') === 'password' ? 'text' : 'password';
        
        $input.attr('type', type);
        $(this).find('i').toggleClass('fa-eye fa-eye-slash');
    });
    
    // File input preview
    $('input[type="file"][data-preview]').on('change', function(e) {
        const file = e.target.files[0];
        const $preview = $($(this).data('preview'));
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                $preview.attr('src', e.target.result).show();
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // Form field dependencies
    $('[data-depends-on]').each(function() {
        const $field = $(this);
        const dependsOn = $field.data('depends-on');
        const dependsValue = $field.data('depends-value');
        
        $(dependsOn).on('change', function() {
            if ($(this).val() === dependsValue) {
                $field.closest('.form-group').show();
                $field.prop('required', true);
            } else {
                $field.closest('.form-group').hide();
                $field.prop('required', false);
            }
        }).trigger('change');
    });
    
    // Confirm password validation
    $('input[data-confirm]').on('input', function() {
        const $password = $($(this).data('confirm'));
        const $confirm = $(this);
        
        if ($confirm.val() && $password.val() !== $confirm.val()) {
            $confirm.addClass('invalid').removeClass('valid');
            $confirm.siblings('.invalid-feedback').text('Passwords do not match');
        } else if ($confirm.val()) {
            $confirm.addClass('valid').removeClass('invalid');
            $confirm.siblings('.invalid-feedback').text('');
        }
    });
    
    // Initialize custom checkboxes
    $('input[type="checkbox"]:not(.custom-checkbox input)').each(function() {
        if (!$(this).parent().hasClass('custom-checkbox')) {
            $(this).wrap('<label class="custom-checkbox"></label>');
            $(this).after('<span class="checkmark"></span>');
        }
    });
    
    // Prevent form resubmission
    $('form').on('submit', function() {
        const $form = $(this);
        const $submitBtn = $form.find('[type="submit"]');
        
        $submitBtn.prop('disabled', true);
        
        setTimeout(() => {
            $submitBtn.prop('disabled', false);
        }, 3000);
    });
    
    console.log('Enhanced form components initialized');
});


// ============================================
// FORM VALIDATION FEEDBACK
// ============================================

$(document).ready(function() {
    // Real-time validation with visual feedback
    function validateFieldRealtime($field) {
        const $formGroup = $field.closest('.form-group');
        const value = $field.val().trim();
        const type = $field.attr('type');
        const required = $field.prop('required');
        
        // Show validating state
        $formGroup.removeClass('valid invalid').addClass('validating');
        
        setTimeout(() => {
            let isValid = true;
            let message = '';
            
            // Required check
            if (required && !value) {
                isValid = false;
                message = 'This field is required';
            }
            // Email validation
            else if (type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    message = 'Please enter a valid email address';
                }
            }
            // Password strength
            else if (type === 'password' && value && $field.data('min-strength')) {
                const strength = calculatePasswordStrength(value);
                if (strength < $field.data('min-strength')) {
                    isValid = false;
                    message = 'Password is too weak';
                }
            }
            
            // Update UI
            $formGroup.removeClass('validating');
            
            if (isValid) {
                $field.removeClass('error').addClass('success');
                $formGroup.addClass('valid');
                $field.siblings('.feedback-message').removeClass('error').addClass('success').text('Looks good!');
            } else {
                $field.removeClass('success').addClass('error');
                $formGroup.addClass('invalid');
                $field.siblings('.feedback-message').removeClass('success').addClass('error').text(message);
            }
            
            // Update validation list if exists
            updateValidationList($field);
            
        }, 300); // Debounce
    }
    
    // Calculate password strength
    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        return strength;
    }
    
    // Update validation list
    function updateValidationList($field) {
        const $list = $field.siblings('.validation-list');
        if (!$list.length) return;
        
        const value = $field.val();
        
        $list.find('li').each(function() {
            const $item = $(this);
            const rule = $item.data('rule');
            let isValid = false;
            
            switch(rule) {
                case 'min-length':
                    isValid = value.length >= parseInt($item.data('value'));
                    break;
                case 'uppercase':
                    isValid = /[A-Z]/.test(value);
                    break;
                case 'lowercase':
                    isValid = /[a-z]/.test(value);
                    break;
                case 'number':
                    isValid = /\d/.test(value);
                    break;
                case 'special':
                    isValid = /[^a-zA-Z\d]/.test(value);
                    break;
            }
            
            $item.removeClass('valid invalid').addClass(isValid ? 'valid' : 'invalid');
        });
    }
    
    // Attach real-time validation
    $('.form-control[data-realtime], .form-input[data-realtime]').on('input', debounce(function() {
        if ($(this).val()) {
            validateFieldRealtime($(this));
        }
    }, 500));
    
    // Validate on blur
    $('.form-control, .form-input').on('blur', function() {
        if ($(this).val()) {
            validateFieldRealtime($(this));
        }
    });
    
    // Clear validation on focus
    $('.form-control, .form-input').on('focus', function() {
        $(this).removeClass('error success');
        $(this).closest('.form-group').removeClass('valid invalid');
        $(this).siblings('.feedback-message').removeClass('error success').text('');
    });
    
    // Form submission with summary
    $('form[data-validate-summary]').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const errors = [];
        let isValid = true;
        
        $form.find('.form-control, .form-input').each(function() {
            const $field = $(this);
            const label = $field.siblings('.form-label').text() || $field.attr('name');
            
            validateFieldRealtime($field);
            
            if ($field.hasClass('error')) {
                isValid = false;
                const message = $field.siblings('.feedback-message').text();
                errors.push(`${label}: ${message}`);
            }
        });
        
        const $summary = $form.find('.form-validation-summary');
        
        if (!isValid) {
            // Show error summary
            const $list = $summary.find('.form-validation-summary-list');
            $list.empty();
            
            errors.forEach(error => {
                $list.append(`<li>${error}</li>`);
            });
            
            $summary.addClass('show');
            
            // Scroll to summary
            $('html, body').animate({
                scrollTop: $summary.offset().top - 100
            }, 300);
        } else {
            $summary.removeClass('show');
            // Proceed with form submission
            showToastNotification('Form submitted successfully!', 'success');
        }
    });
    
    // Password confirmation validation
    $('input[data-confirm-password]').on('input', function() {
        const $confirm = $(this);
        const $password = $($confirm.data('confirm-password'));
        
        if ($confirm.val() && $password.val()) {
            if ($confirm.val() === $password.val()) {
                $confirm.removeClass('error').addClass('success');
                $confirm.siblings('.feedback-message').removeClass('error').addClass('success').text('Passwords match');
            } else {
                $confirm.removeClass('success').addClass('error');
                $confirm.siblings('.feedback-message').removeClass('success').addClass('error').text('Passwords do not match');
            }
        }
    });
    
    // Add helpful placeholders dynamically
    $('.form-control[type="email"]:not([placeholder])').attr('placeholder', 'e.g., john@example.com');
    $('.form-control[type="tel"]:not([placeholder])').attr('placeholder', 'e.g., (555) 123-4567');
    $('.form-control[type="url"]:not([placeholder])').attr('placeholder', 'e.g., https://example.com');
    
    // Multi-step form progress
    $('.form-step-next').on('click', function() {
        const $currentStep = $('.form-step.active');
        const $nextStep = $currentStep.next('.form-step');
        
        // Validate current step
        let isValid = true;
        $currentStep.find('.form-control, .form-input').each(function() {
            validateFieldRealtime($(this));
            if ($(this).hasClass('error')) {
                isValid = false;
            }
        });
        
        if (isValid && $nextStep.length) {
            $currentStep.removeClass('active');
            $nextStep.addClass('active');
            
            // Update progress
            const stepIndex = $nextStep.index();
            $('.form-progress-step').eq(stepIndex - 1).addClass('completed');
            $('.form-progress-step').eq(stepIndex).addClass('active');
        }
    });
    
    $('.form-step-prev').on('click', function() {
        const $currentStep = $('.form-step.active');
        const $prevStep = $currentStep.prev('.form-step');
        
        if ($prevStep.length) {
            $currentStep.removeClass('active');
            $prevStep.addClass('active');
            
            // Update progress
            const stepIndex = $prevStep.index();
            $('.form-progress-step').eq(stepIndex).removeClass('completed').addClass('active');
            $('.form-progress-step').eq(stepIndex + 1).removeClass('active');
        }
    });
    
    // Initialize validation tooltips
    $('.form-control[data-tooltip-validation], .form-input[data-tooltip-validation]').each(function() {
        const $field = $(this);
        if (!$field.siblings('.validation-tooltip').length) {
            $field.after('<div class="validation-tooltip"></div>');
        }
    });
    
    // Update tooltip on validation
    $('.form-control, .form-input').on('input blur', function() {
        const $field = $(this);
        const $tooltip = $field.siblings('.validation-tooltip');
        
        if ($tooltip.length && $field.hasClass('error')) {
            const message = $field.siblings('.feedback-message').text();
            $tooltip.text(message);
        }
    });
    
    console.log('Form validation feedback initialized');
});


// ============================================
// IMAGE OPTIMIZATION SYSTEM
// ============================================

$(document).ready(function() {
    // Lazy loading with Intersection Observer
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
    
    // Load image function
    function loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        if (!src) return;
        
        // Add loading class
        const $container = $(img).closest('.image-loading-state, .image-container');
        $container.addClass('loading');
        
        // Create temp image to preload
        const tempImg = new Image();
        
        tempImg.onload = function() {
            img.src = src;
            if (srcset) {
                img.srcset = srcset;
            }
            img.classList.add('loaded');
            $container.removeClass('loading').addClass('loaded');
            
            // Trigger fade-in animation
            $(img).addClass('fade-in-image loaded');
        };
        
        tempImg.onerror = function() {
            $container.removeClass('loading').addClass('error');
            $(img).closest('.image-container').addClass('image-fallback');
        };
        
        tempImg.src = src;
    }
    
    // Observe all lazy load images
    document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(img => {
        lazyImageObserver.observe(img);
    });
    
    // Progressive image loading (blur-up)
    $('.blur-up').each(function() {
        const $container = $(this);
        const $main = $container.find('.blur-up-main');
        const src = $main.data('src');
        
        if (src) {
            const img = new Image();
            img.onload = function() {
                $main.attr('src', src).addClass('loaded');
            };
            img.src = src;
        }
    });
    
    // Set proper aspect ratios
    $('img[data-aspect-ratio]').each(function() {
        const $img = $(this);
        const ratio = $img.data('aspect-ratio');
        
        if (!$img.parent().hasClass('aspect-ratio-container')) {
            $img.wrap(`<div class="aspect-ratio-container aspect-ratio-${ratio}"></div>`);
        }
    });
    
    // Handle image errors with fallback
    $('img').on('error', function() {
        const $img = $(this);
        
        if (!$img.hasClass('fallback-applied')) {
            $img.addClass('fallback-applied');
            
            // Try fallback image
            const fallback = $img.data('fallback') || '/static/images/placeholder.png';
            
            if ($img.attr('src') !== fallback) {
                $img.attr('src', fallback);
            } else {
                // Show fallback UI
                $img.closest('.image-container').addClass('image-fallback');
                $img.hide();
            }
        }
    });
    
    // WebP support detection
    function supportsWebP() {
        const elem = document.createElement('canvas');
        if (elem.getContext && elem.getContext('2d')) {
            return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
        return false;
    }
    
    if (supportsWebP()) {
        $('html').addClass('webp');
        
        // Load WebP images
        $('img[data-src-webp]').each(function() {
            $(this).data('src', $(this).data('src-webp'));
        });
    }
    
    // Responsive image loading based on viewport
    function loadResponsiveImage($img) {
        const viewportWidth = window.innerWidth;
        let src = '';
        
        if (viewportWidth <= 480 && $img.data('src-mobile')) {
            src = $img.data('src-mobile');
        } else if (viewportWidth <= 768 && $img.data('src-tablet')) {
            src = $img.data('src-tablet');
        } else if (viewportWidth <= 1200 && $img.data('src-desktop')) {
            src = $img.data('src-desktop');
        } else if ($img.data('src-large')) {
            src = $img.data('src-large');
        }
        
        if (src && $img.attr('src') !== src) {
            $img.data('src', src);
        }
    }
    
    $('img[data-src-mobile], img[data-src-tablet], img[data-src-desktop]').each(function() {
        loadResponsiveImage($(this));
    });
    
    // Reload on resize
    $(window).on('resize', debounce(function() {
        $('img[data-src-mobile], img[data-src-tablet], img[data-src-desktop]').each(function() {
            loadResponsiveImage($(this));
        });
    }, 500));
    
    // Preload critical images
    function preloadCriticalImages() {
        const criticalImages = [];
        
        // Get images in viewport
        $('img').each(function() {
            const rect = this.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const src = $(this).data('src') || $(this).attr('src');
                if (src && !src.includes('placeholder')) {
                    criticalImages.push(src);
                }
            }
        });
        
        // Preload them
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }
    
    preloadCriticalImages();
    
    // Image gallery lightbox
    $('.image-gallery-item').on('click', function() {
        const src = $(this).find('img').attr('src');
        // Implement lightbox functionality here
        console.log('Open lightbox for:', src);
    });
    
    // Thumbnail navigation
    $('.thumbnail').on('click', function() {
        const $thumb = $(this);
        const mainSrc = $thumb.data('main-src') || $thumb.attr('src');
        const $mainImage = $('.main-image');
        
        $('.thumbnail').removeClass('active');
        $thumb.addClass('active');
        
        // Fade out, change, fade in
        $mainImage.css('opacity', 0);
        
        setTimeout(() => {
            $mainImage.attr('src', mainSrc);
            $mainImage.css('opacity', 1);
        }, 300);
    });
    
    // Retina image loading
    if (window.devicePixelRatio > 1) {
        $('img[data-src-2x]').each(function() {
            const $img = $(this);
            $img.data('src', $img.data('src-2x'));
        });
    }
    
    // Monitor image loading performance
    const imageLoadTimes = [];
    
    $('img').on('load', function() {
        const loadTime = performance.now();
        imageLoadTimes.push(loadTime);
        
        // Log slow images
        if (loadTime > 3000) {
            console.warn('Slow image load:', this.src, loadTime + 'ms');
        }
    });
    
    // Compress images on upload (client-side)
    window.compressImage = function(file, maxWidth = 1920, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };
    
    // Auto-optimize uploaded images
    $('input[type="file"][accept*="image"]').on('change', async function(e) {
        const file = e.target.files[0];
        
        if (file && file.size > 1024 * 1024) { // > 1MB
            try {
                const compressed = await compressImage(file);
                console.log('Image compressed:', file.size, '->', compressed.size);
                
                // Replace file input with compressed version
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(new File([compressed], file.name, { type: 'image/jpeg' }));
                this.files = dataTransfer.files;
            } catch (error) {
                console.error('Image compression failed:', error);
            }
        }
    });
    
    console.log('Image optimization system initialized');
});


// ============================================
// IMAGE PERFORMANCE OPTIMIZATION
// ============================================

$(document).ready(function() {
    // Detect WebP support
    function detectWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = function() {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }
    
    detectWebPSupport().then(supported => {
        if (supported) {
            $('html').addClass('webp');
            console.log('WebP supported');
        } else {
            $('html').addClass('no-webp');
            console.log('WebP not supported, using fallback');
        }
    });
    
    // Implement srcset for responsive images
    function generateSrcset($img) {
        const baseSrc = $img.data('src-base');
        if (!baseSrc) return;
        
        const sizes = [320, 640, 768, 1024, 1280, 1920];
        const srcset = sizes.map(size => {
            const src = baseSrc.replace(/\.(jpg|png)$/, `-${size}w.$1`);
            return `${src} ${size}w`;
        }).join(', ');
        
        $img.attr('srcset', srcset);
        $img.attr('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw');
    }
    
    $('img[data-src-base]').each(function() {
        generateSrcset($(this));
    });
    
    // Monitor image loading performance
    const imagePerformance = {
        totalImages: 0,
        loadedImages: 0,
        failedImages: 0,
        totalLoadTime: 0,
        slowImages: []
    };
    
    function trackImageLoad(img, startTime) {
        const loadTime = performance.now() - startTime;
        
        imagePerformance.totalImages++;
        imagePerformance.loadedImages++;
        imagePerformance.totalLoadTime += loadTime;
        
        if (loadTime > 2000) {
            imagePerformance.slowImages.push({
                src: img.src,
                loadTime: loadTime
            });
            console.warn(`Slow image load: ${img.src} (${loadTime.toFixed(0)}ms)`);
        }
        
        // Show load time in dev mode
        if (window.location.search.includes('debug=images')) {
            $(img).attr('data-load-time', `${loadTime.toFixed(0)}ms`);
            $(img).addClass('show-metrics');
        }
    }
    
    // Track all images
    $('img').each(function() {
        const startTime = performance.now();
        
        if (this.complete) {
            trackImageLoad(this, startTime);
        } else {
            $(this).on('load', function() {
                trackImageLoad(this, startTime);
            });
            
            $(this).on('error', function() {
                imagePerformance.failedImages++;
                console.error('Image failed to load:', this.src);
            });
        }
    });
    
    // Report performance metrics
    $(window).on('load', function() {
        const avgLoadTime = imagePerformance.totalLoadTime / imagePerformance.loadedImages;
        
        console.log('Image Performance Report:', {
            total: imagePerformance.totalImages,
            loaded: imagePerformance.loadedImages,
            failed: imagePerformance.failedImages,
            avgLoadTime: avgLoadTime.toFixed(0) + 'ms',
            slowImages: imagePerformance.slowImages.length
        });
        
        if (imagePerformance.slowImages.length > 0) {
            console.table(imagePerformance.slowImages);
        }
    });
    
    // Compress images before upload
    async function compressImageAdvanced(file, options = {}) {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 0.85,
            format = 'image/jpeg'
        } = options;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    
                    // Calculate new dimensions
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    
                    // Enable image smoothing for better quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        const originalSize = file.size;
                        const compressedSize = blob.size;
                        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                        
                        console.log(`Image compressed: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (${savings}% savings)`);
                        
                        resolve(new File([blob], file.name, {
                            type: format,
                            lastModified: Date.now()
                        }));
                    }, format, quality);
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Auto-compress on file input
    $('input[type="file"][accept*="image"][data-compress]').on('change', async function(e) {
        const files = Array.from(e.target.files);
        const compressed = [];
        
        for (const file of files) {
            if (file.size > 500 * 1024) { // > 500KB
                try {
                    const compressedFile = await compressImageAdvanced(file);
                    compressed.push(compressedFile);
                } catch (error) {
                    console.error('Compression failed:', error);
                    compressed.push(file);
                }
            } else {
                compressed.push(file);
            }
        }
        
        // Update file input
        const dataTransfer = new DataTransfer();
        compressed.forEach(file => dataTransfer.items.add(file));
        this.files = dataTransfer.files;
    });
    
    // Detect connection speed and adjust image quality
    if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            const effectiveType = connection.effectiveType;
            
            console.log('Connection type:', effectiveType);
            
            if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                // Load low-quality images
                $('img[data-src-low]').each(function() {
                    $(this).data('src', $(this).data('src-low'));
                });
                
                $('body').addClass('slow-connection');
            } else if (effectiveType === '4g') {
                // Load high-quality images
                $('img[data-src-high]').each(function() {
                    $(this).data('src', $(this).data('src-high'));
                });
                
                $('body').addClass('fast-connection');
            }
        }
    }
    
    // Preload critical images with priority
    function preloadCriticalImagesWithPriority() {
        const criticalImages = document.querySelectorAll('img[data-priority="high"]');
        
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.dataset.src || img.src;
            link.fetchPriority = 'high';
            document.head.appendChild(link);
        });
    }
    
    preloadCriticalImagesWithPriority();
    
    // Implement native lazy loading fallback
    if ('loading' in HTMLImageElement.prototype) {
        $('img[data-lazy]').attr('loading', 'lazy');
    }
    
    // Test image format support
    async function testImageFormats() {
        const formats = {
            webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
            avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=',
            jp2: 'data:image/jp2;base64,/0//UQAyAAAAAAABAAAAAgAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAEBwEBBwEBBwEBBwEB/1IADAAAAAEAAAQEAAH/XAAEQED/ZAAlAAFDcmVhdGVkIGJ5IE9wZW5KUEVHIHZlcnNpb24gMi4wLjD/kAAKAAAAAABYAAH/UwAJAQAABAQAAf9dAAUBQED/UwAJAgAABAQAAf9dAAUCQED/UwAJAwAABAQAAf9dAAUDQED/k8+kEAGvz6QQAa/PpBABr994EAk//9k='
        };
        
        const supported = {};
        
        for (const [format, dataUrl] of Object.entries(formats)) {
            const img = new Image();
            const promise = new Promise(resolve => {
                img.onload = img.onerror = () => resolve(img.height === 2);
            });
            img.src = dataUrl;
            supported[format] = await promise;
        }
        
        console.log('Supported image formats:', supported);
        return supported;
    }
    
    testImageFormats();
    
    console.log('Image performance optimization initialized');
});


// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

$(document).ready(function() {
    // Accessibility features removed as per user request
    
    // Add ARIA labels to images without alt text
    $('img:not([alt])').each(function() {
        const src = $(this).attr('src');
        const filename = src ? src.split('/').pop().split('.')[0] : 'image';
        $(this).attr('alt', filename.replace(/-|_/g, ' '));
        console.warn('Image missing alt text:', src);
    });
    
    // Ensure form labels are associated with inputs
    $('input, textarea, select').each(function() {
        const $input = $(this);
        const id = $input.attr('id');
        
        if (!id) {
            const newId = 'input-' + Math.random().toString(36).substr(2, 9);
            $input.attr('id', newId);
        }
        
        const $label = $('label[for="' + $input.attr('id') + '"]');
        
        if (!$label.length && !$input.attr('aria-label')) {
            const placeholder = $input.attr('placeholder');
            if (placeholder) {
                $input.attr('aria-label', placeholder);
            } else {
                console.warn('Input missing label:', $input);
            }
        }
    });
    
    // Add required indicators
    $('input[required], textarea[required], select[required]').each(function() {
        const $input = $(this);
        const $label = $('label[for="' + $input.attr('id') + '"]');
        
        if ($label.length && !$label.find('.required-indicator').length) {
            $label.append('<span class="required-indicator" aria-label="required"></span>');
        }
        
        $input.attr('aria-required', 'true');
    });
    
    // Keyboard navigation detection
    let isKeyboardNav = false;
    
    $(document).on('keydown', function(e) {
        if (e.key === 'Tab') {
            isKeyboardNav = true;
            $('body').addClass('keyboard-nav');
        }
    });
    
    $(document).on('mousedown', function() {
        isKeyboardNav = false;
        $('body').removeClass('keyboard-nav');
    });
    
    // Focus trap for modals
    function trapFocus($modal) {
        const focusableElements = $modal.find('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableElements.first();
        const lastFocusable = focusableElements.last();
        
        $modal.on('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable[0]) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable[0]) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
            
            if (e.key === 'Escape') {
                closeModal($modal);
            }
        });
        
        firstFocusable.focus();
    }
    
    // Apply focus trap to modals
    $('.modal').on('show.bs.modal shown', function() {
        $(this).attr('aria-hidden', 'false');
        trapFocus($(this));
    });
    
    $('.modal').on('hide.bs.modal hidden', function() {
        $(this).attr('aria-hidden', 'true');
    });
    
    // Announce dynamic content changes
    function announceToScreenReader(message, priority = 'polite') {
        const $announcer = $('#aria-announcer');
        
        if (!$announcer.length) {
            $('body').append(`<div id="aria-announcer" role="status" aria-live="${priority}" aria-atomic="true" class="sr-only"></div>`);
        }
        
        $('#aria-announcer').text(message);
        
        setTimeout(() => {
            $('#aria-announcer').text('');
        }, 1000);
    }
    
    // Announce form errors
    $('form').on('submit', function(e) {
        const $form = $(this);
        const $errors = $form.find('.invalid, .error');
        
        if ($errors.length > 0) {
            announceToScreenReader(`Form has ${$errors.length} error${$errors.length > 1 ? 's' : ''}. Please review and correct.`, 'assertive');
        }
    });
    
    // Announce successful actions
    window.announceSuccess = function(message) {
        announceToScreenReader(message, 'polite');
    };
    
    window.announceError = function(message) {
        announceToScreenReader(message, 'assertive');
    };
    
    // Add ARIA attributes to interactive elements
    $('.btn, button').each(function() {
        if (!$(this).attr('type')) {
            $(this).attr('type', 'button');
        }
    });
    
    // Dropdown accessibility
    $('.dropdown-toggle').attr('aria-haspopup', 'true').attr('aria-expanded', 'false');
    
    $('.dropdown-toggle').on('click', function() {
        const isExpanded = $(this).attr('aria-expanded') === 'true';
        $(this).attr('aria-expanded', !isExpanded);
    });
    
    // Tab navigation accessibility
    $('[role="tab"]').on('click', function() {
        const $tab = $(this);
        const $tablist = $tab.closest('[role="tablist"]');
        const $tabpanel = $($tab.attr('aria-controls'));
        
        // Update tabs
        $tablist.find('[role="tab"]').attr('aria-selected', 'false').attr('tabindex', '-1');
        $tab.attr('aria-selected', 'true').attr('tabindex', '0');
        
        // Update panels
        $('[role="tabpanel"]').attr('aria-hidden', 'true');
        $tabpanel.attr('aria-hidden', 'false');
        
        announceToScreenReader(`${$tab.text()} tab selected`);
    });
    
    // Arrow key navigation for tabs
    $('[role="tab"]').on('keydown', function(e) {
        const $tab = $(this);
        const $tabs = $tab.closest('[role="tablist"]').find('[role="tab"]');
        const index = $tabs.index($tab);
        
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (index + 1) % $tabs.length;
            $tabs.eq(nextIndex).click().focus();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = (index - 1 + $tabs.length) % $tabs.length;
            $tabs.eq(prevIndex).click().focus();
        } else if (e.key === 'Home') {
            e.preventDefault();
            $tabs.first().click().focus();
        } else if (e.key === 'End') {
            e.preventDefault();
            $tabs.last().click().focus();
        }
    });
    
    // Accordion accessibility
    $('.accordion-header').attr('role', 'button').attr('aria-expanded', 'false');
    
    $('.accordion-header').on('click', function() {
        const $header = $(this);
        const isExpanded = $header.attr('aria-expanded') === 'true';
        
        $header.attr('aria-expanded', !isExpanded);
        
        const $content = $header.next('.accordion-content');
        $content.attr('aria-hidden', isExpanded);
    });
    
    // Progress bar accessibility
    $('.progress').attr('role', 'progressbar').attr('aria-valuemin', '0').attr('aria-valuemax', '100');
    
    $('.progress').each(function() {
        const $progress = $(this);
        const $bar = $progress.find('.progress-bar');
        const width = $bar.width();
        const total = $progress.width();
        const percent = Math.round((width / total) * 100);
        
        $progress.attr('aria-valuenow', percent);
        $progress.attr('aria-valuetext', `${percent}% complete`);
    });
    
    // Color contrast checker (dev mode)
    if (window.location.search.includes('debug=a11y')) {
        function checkContrast($element) {
            const bg = $element.css('background-color');
            const color = $element.css('color');
            
            // Simple contrast check (would need proper implementation)
            console.log('Checking contrast:', {
                element: $element[0],
                background: bg,
                color: color
            });
        }
        
        $('*').each(function() {
            checkContrast($(this));
        });
    }
    
    // Ensure all interactive elements are keyboard accessible
    $('div[onclick], span[onclick]').each(function() {
        const $el = $(this);
        
        if (!$el.attr('role')) {
            $el.attr('role', 'button');
        }
        
        if (!$el.attr('tabindex')) {
            $el.attr('tabindex', '0');
        }
        
        $el.on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                $(this).click();
            }
        });
    });
    
    // Add loading state announcements
    $(document).ajaxStart(function() {
        announceToScreenReader('Loading content', 'polite');
    });
    
    $(document).ajaxComplete(function() {
        announceToScreenReader('Content loaded', 'polite');
    });
    
    console.log('Accessibility enhancements initialized');
});


// ============================================
// ADDITIONAL ACCESSIBILITY FEATURES
// ============================================

$(document).ready(function() {
    // Detect and respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        $('body').addClass('reduced-motion');
        console.log('Reduced motion preference detected');
    }
    
    // Implement focus-visible polyfill
    function handleFirstTab(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('js-focus-visible');
            window.removeEventListener('keydown', handleFirstTab);
        }
    }
    
    window.addEventListener('keydown', handleFirstTab);
    
    // Focus trap implementation
    function createFocusTrap($container) {
        const focusableElements = $container.find('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements.first()[0];
        const lastElement = focusableElements.last()[0];
        
        $container.on('keydown.focustrap', function(e) {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
        
        firstElement.focus();
    }
    
    function removeFocusTrap($container) {
        $container.off('keydown.focustrap');
    }
    
    // Apply focus trap to modals
    $('.modal').on('shown.bs.modal', function() {
        createFocusTrap($(this));
        $('body').addClass('focus-trap-active');
    });
    
    $('.modal').on('hidden.bs.modal', function() {
        removeFocusTrap($(this));
        $('body').removeClass('focus-trap-active');
    });
    
    // Keyboard-only navigation test
    window.testKeyboardNavigation = function() {
        const focusableElements = $('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        
        console.log(`Found ${focusableElements.length} focusable elements`);
        
        focusableElements.each(function(index) {
            const $el = $(this);
            const hasVisibleFocus = $el.css('outline') !== 'none' || $el.css('box-shadow') !== 'none';
            
            if (!hasVisibleFocus) {
                console.warn('Element may not have visible focus:', this);
            }
        });
    };
    
    // Text size adjustment
    let currentTextSize = 1;
    
    window.adjustTextSize = function(direction) {
        if (direction === 'increase' && currentTextSize < 1.5) {
            currentTextSize += 0.1;
        } else if (direction === 'decrease' && currentTextSize > 0.8) {
            currentTextSize -= 0.1;
        } else if (direction === 'reset') {
            currentTextSize = 1;
        }
        
        $('html').css('font-size', (16 * currentTextSize) + 'px');
        announceToScreenReader(`Text size ${direction === 'increase' ? 'increased' : direction === 'decrease' ? 'decreased' : 'reset'}`);
    };
    
    // High contrast mode toggle
    window.toggleHighContrast = function() {
        $('body').toggleClass('high-contrast-mode');
        const isEnabled = $('body').hasClass('high-contrast-mode');
        
        localStorage.setItem('highContrastMode', isEnabled);
        announceToScreenReader(`High contrast mode ${isEnabled ? 'enabled' : 'disabled'}`);
    };
    
    // Load saved high contrast preference
    if (localStorage.getItem('highContrastMode') === 'true') {
        $('body').addClass('high-contrast-mode');
    }
    
    // Dyslexia-friendly font toggle
    window.toggleDyslexiaFont = function() {
        $('body').toggleClass('dyslexia-friendly');
        const isEnabled = $('body').hasClass('dyslexia-friendly');
        
        localStorage.setItem('dyslexiaFont', isEnabled);
        announceToScreenReader(`Dyslexia-friendly font ${isEnabled ? 'enabled' : 'disabled'}`);
    };
    
    // Load saved dyslexia font preference
    if (localStorage.getItem('dyslexiaFont') === 'true') {
        $('body').addClass('dyslexia-friendly');
    }
    
    // Add non-color indicators to status elements
    $('.status-success, .status-error, .status-warning').each(function() {
        if (!$(this).hasClass('status-indicator')) {
            $(this).addClass('status-indicator');
        }
    });
    
    // Ensure all images have proper alt text
    $('img').each(function() {
        const $img = $(this);
        
        if (!$img.attr('alt')) {
            const src = $img.attr('src') || '';
            const filename = src.split('/').pop().split('.')[0];
            const altText = filename.replace(/-|_/g, ' ');
            
            $img.attr('alt', altText);
            console.warn('Added missing alt text:', altText, 'to', src);
        }
        
        // Check for decorative images
        if ($img.attr('alt') === '' && !$img.attr('role')) {
            $img.attr('role', 'presentation');
        }
    });
    
    // Add ARIA live regions for dynamic content
    if (!$('#aria-live-polite').length) {
        $('body').append('<div id="aria-live-polite" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>');
    }
    
    if (!$('#aria-live-assertive').length) {
        $('body').append('<div id="aria-live-assertive" role="alert" aria-live="assertive" aria-atomic="true" class="sr-only"></div>');
    }
    
    // Enhanced screen reader announcements
    window.announcePolite = function(message) {
        $('#aria-live-polite').text(message);
        setTimeout(() => $('#aria-live-polite').text(''), 1000);
    };
    
    window.announceAssertive = function(message) {
        $('#aria-live-assertive').text(message);
        setTimeout(() => $('#aria-live-assertive').text(''), 1000);
    };
    
    // Monitor for accessibility violations (dev mode)
    if (window.location.search.includes('debug=a11y')) {
        // Check for missing labels
        $('input:not([type="hidden"]), textarea, select').each(function() {
            const $input = $(this);
            const hasLabel = $('label[for="' + $input.attr('id') + '"]').length > 0;
            const hasAriaLabel = $input.attr('aria-label') || $input.attr('aria-labelledby');
            
            if (!hasLabel && !hasAriaLabel) {
                console.error('Input missing label:', this);
            }
        });
        
        // Check for missing alt text
        $('img:not([alt])').each(function() {
            console.error('Image missing alt text:', this);
        });
        
        // Check for low contrast
        console.log('Accessibility audit complete. Check console for issues.');
    }
    
    // Escape key handler for closing modals/overlays
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close modal
            if ($('.modal.show').length) {
                $('.modal.show').modal('hide');
            }
            
            // Close dropdown
            if ($('.dropdown-menu.show').length) {
                $('.dropdown-menu.show').removeClass('show');
            }
            
            // Close mobile menu
            if ($('.mobile-menu.open').length) {
                $('.mobile-menu').removeClass('open');
            }
        }
    });
    
    // Add keyboard shortcuts
    $(document).on('keydown', function(e) {
        // Alt + H: Go to homepage
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = '/';
        }
        
        // Alt + S: Focus search
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            $('input[type="search"], .search-input').first().focus();
        }
        
        // Alt + M: Open menu
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            $('.navbar-toggler, .mobile-menu-toggle').first().click();
        }
    });
    
    // Add keyboard shortcut hints
    if (window.location.search.includes('shortcuts=show')) {
        const shortcuts = [
            'Alt + H: Homepage',
            'Alt + S: Search',
            'Alt + M: Menu',
            'Esc: Close modals/menus'
        ];
        
        console.log('Keyboard Shortcuts:', shortcuts.join('\n'));
    }
    
    console.log('Additional accessibility features initialized');
});


// ============================================
// CSS PERFORMANCE OPTIMIZATION
// ============================================

$(document).ready(function() {
    // Remove will-change after animations complete
    $('.animated-element').on('animationend transitionend', function() {
        $(this).addClass('animation-complete');
    });
    
    // Batch DOM reads and writes
    function batchDOMOperations() {
        const reads = [];
        const writes = [];
        
        // Collect all reads first
        $('.batch-read').each(function() {
            reads.push({
                element: this,
                height: this.offsetHeight,
                width: this.offsetWidth
            });
        });
        
        // Then perform all writes
        reads.forEach(read => {
            // Perform writes based on reads
        });
    }
    
    // Use requestAnimationFrame for smooth animations
    function smoothScroll(target, duration = 600) {
        const start = window.pageYOffset;
        const distance = target - start;
        const startTime = performance.now();
        
        function animation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeInOutCubic = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            window.scrollTo(0, start + distance * easeInOutCubic);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
    
    // Optimize scroll listeners
    let scrollTimeout;
    let lastScrollY = window.pageYOffset;
    
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        
        scrollTimeout = window.requestAnimationFrame(() => {
            const currentScrollY = window.pageYOffset;
            
            // Only update if scroll changed significantly
            if (Math.abs(currentScrollY - lastScrollY) > 5) {
                lastScrollY = currentScrollY;
                // Perform scroll-based updates
            }
        });
    }, { passive: true });
    
    // Lazy load CSS for below-fold content
    function loadDeferredCSS() {
        const deferredCSS = document.querySelectorAll('link[data-defer]');
        
        deferredCSS.forEach(link => {
            link.rel = 'stylesheet';
            link.removeAttribute('data-defer');
        });
    }
    
    // Load deferred CSS after page load
    if (document.readyState === 'complete') {
        loadDeferredCSS();
    } else {
        window.addEventListener('load', loadDeferredCSS);
    }
    
    // Monitor CSS performance
    if (window.location.search.includes('debug=css')) {
        const cssFiles = document.querySelectorAll('link[rel="stylesheet"]');
        
        cssFiles.forEach(link => {
            const startTime = performance.now();
            
            link.addEventListener('load', () => {
                const loadTime = performance.now() - startTime;
                console.log(`CSS loaded: ${link.href} (${loadTime.toFixed(0)}ms)`);
            });
        });
    }
    
    // Optimize CSS animations
    const animatedElements = document.querySelectorAll('.animated-element');
    
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.willChange = 'transform, opacity';
            } else {
                entry.target.style.willChange = 'auto';
            }
        });
    });
    
    animatedElements.forEach(el => animationObserver.observe(el));
    
    // Reduce paint areas
    function optimizePaintAreas() {
        $('.optimized-shadow').each(function() {
            $(this).css('isolation', 'isolate');
        });
    }
    
    optimizePaintAreas();
    
    console.log('CSS performance optimization initialized');
});


// ============================================
// JAVASCRIPT PERFORMANCE OPTIMIZATION
// ============================================

$(document).ready(function() {
    // Defer non-critical JavaScript
    function loadDeferredScripts() {
        const deferredScripts = document.querySelectorAll('script[data-defer]');
        
        deferredScripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.src = script.dataset.src;
            newScript.async = true;
            document.body.appendChild(newScript);
        });
    }
    
    // Load after page is interactive
    if (document.readyState === 'complete') {
        loadDeferredScripts();
    } else {
        window.addEventListener('load', loadDeferredScripts);
    }
    
    // Lazy load heavy components
    const heavyComponentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const component = entry.target;
                const componentType = component.dataset.component;
                
                // Load component dynamically
                loadComponent(componentType, component);
                
                heavyComponentObserver.unobserve(component);
            }
        });
    }, {
        rootMargin: '100px'
    });
    
    document.querySelectorAll('[data-component]').forEach(el => {
        heavyComponentObserver.observe(el);
    });
    
    function loadComponent(type, container) {
        // Dynamically load component code
        console.log(`Loading component: ${type}`);
    }
    
    // Use Intersection Observer for scroll effects
    const scrollEffectObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.scroll-effect').forEach(el => {
        scrollEffectObserver.observe(el);
    });
    
    // Debounce scroll and resize events
    function debounceAdvanced(func, wait, options = {}) {
        let timeout;
        let lastArgs;
        let lastThis;
        let result;
        
        const { leading = false, trailing = true, maxWait } = options;
        
        function invokeFunc(time) {
            const args = lastArgs;
            const thisArg = lastThis;
            
            lastArgs = lastThis = undefined;
            result = func.apply(thisArg, args);
            return result;
        }
        
        function leadingEdge(time) {
            if (leading) {
                result = invokeFunc(time);
            }
            timeout = setTimeout(timerExpired, wait);
            return result;
        }
        
        function timerExpired() {
            const time = Date.now();
            
            if (trailing && lastArgs) {
                return invokeFunc(time);
            }
            
            timeout = undefined;
        }
        
        function debounced(...args) {
            const time = Date.now();
            lastArgs = args;
            lastThis = this;
            
            if (!timeout) {
                return leadingEdge(time);
            }
            
            clearTimeout(timeout);
            timeout = setTimeout(timerExpired, wait);
        }
        
        debounced.cancel = function() {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = lastArgs = lastThis = undefined;
        };
        
        return debounced;
    }
    
    // Throttle with requestAnimationFrame
    function throttleRAF(func) {
        let ticking = false;
        
        return function(...args) {
            if (!ticking) {
                requestAnimationFrame(() => {
                    func.apply(this, args);
                    ticking = false;
                });
                
                ticking = true;
            }
        };
    }
    
    // Optimize event listeners
    const optimizedScroll = throttleRAF(function() {
        // Scroll handling
    });
    
    const optimizedResize = debounceAdvanced(function() {
        // Resize handling
    }, 250);
    
    window.addEventListener('scroll', optimizedScroll, { passive: true });
    window.addEventListener('resize', optimizedResize);
    
    // Virtual scrolling for long lists
    function virtualScroll(container, items, itemHeight) {
        const containerHeight = container.clientHeight;
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const buffer = 5;
        
        let scrollTop = 0;
        
        function render() {
            const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
            const endIndex = Math.min(items.length, startIndex + visibleCount + buffer * 2);
            
            // Render only visible items
            const fragment = document.createDocumentFragment();
            
            for (let i = startIndex; i < endIndex; i++) {
                const item = document.createElement('div');
                item.style.height = itemHeight + 'px';
                item.textContent = items[i];
                fragment.appendChild(item);
            }
            
            container.innerHTML = '';
            container.appendChild(fragment);
        }
        
        container.addEventListener('scroll', throttleRAF(() => {
            scrollTop = container.scrollTop;
            render();
        }));
        
        render();
    }
    
    // Memoization for expensive calculations
    function memoize(func) {
        const cache = new Map();
        
        return function(...args) {
            const key = JSON.stringify(args);
            
            if (cache.has(key)) {
                return cache.get(key);
            }
            
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }
    
    // Example: Memoized calculation
    const expensiveCalculation = memoize(function(n) {
        // Expensive operation
        return n * n;
    });
    
    // Web Workers for heavy computations
    function useWebWorker(task, data) {
        return new Promise((resolve, reject) => {
            const worker = new Worker('/static/js/worker.js');
            
            worker.postMessage({ task, data });
            
            worker.onmessage = function(e) {
                resolve(e.data);
                worker.terminate();
            };
            
            worker.onerror = function(error) {
                reject(error);
                worker.terminate();
            };
        });
    }
    
    // Optimize DOM manipulation
    function batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    }
    
    // Example usage
    window.optimizedUpdate = function() {
        batchDOMUpdates([
            () => document.getElementById('el1').textContent = 'Updated',
            () => document.getElementById('el2').style.color = 'red',
            () => document.getElementById('el3').classList.add('active')
        ]);
    };
    
    // Reduce memory leaks
    const eventListeners = new WeakMap();
    
    function addManagedListener(element, event, handler) {
        element.addEventListener(event, handler);
        
        if (!eventListeners.has(element)) {
            eventListeners.set(element, []);
        }
        
        eventListeners.get(element).push({ event, handler });
    }
    
    function removeManagedListeners(element) {
        const listeners = eventListeners.get(element);
        
        if (listeners) {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
            
            eventListeners.delete(element);
        }
    }
    
    // Monitor JavaScript performance
    if (window.location.search.includes('debug=js')) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.duration > 50) {
                    console.warn('Long task detected:', entry.name, entry.duration + 'ms');
                }
            });
        });
        
        observer.observe({ entryTypes: ['measure', 'longtask'] });
    }
    
    // Code splitting helper
    window.loadModule = async function(moduleName) {
        try {
            const module = await import(`/static/js/modules/${moduleName}.js`);
            return module;
        } catch (error) {
            console.error(`Failed to load module: ${moduleName}`, error);
        }
    };
    
    // Optimize animations
    function optimizeAnimation(element, properties, duration) {
        return element.animate(properties, {
            duration,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }
    
    // Resource hints
    function addResourceHints() {
        // Preconnect to external domains
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://fonts.googleapis.com';
        document.head.appendChild(preconnect);
        
        // DNS prefetch
        const dnsPrefetch = document.createElement('link');
        dnsPrefetch.rel = 'dns-prefetch';
        dnsPrefetch.href = 'https://cdn.example.com';
        document.head.appendChild(dnsPrefetch);
    }
    
    addResourceHints();
    
    console.log('JavaScript performance optimization initialized');
});


// ============================================
// FONT AND ASSET LOADING OPTIMIZATION
// ============================================

$(document).ready(function() {
    // Font loading with Font Face Observer
    function loadFonts() {
        if ('fonts' in document) {
            // Use CSS Font Loading API
            Promise.all([
                document.fonts.load('400 1em Poppins'),
                document.fonts.load('600 1em Poppins'),
                document.fonts.load('700 1em Poppins')
            ]).then(() => {
                document.documentElement.classList.add('fonts-loaded');
                document.documentElement.classList.remove('font-loading');
                console.log('Fonts loaded successfully');
            }).catch(error => {
                console.error('Font loading failed:', error);
                document.documentElement.classList.add('fonts-loaded');
            });
        } else {
            // Fallback for older browsers
            setTimeout(() => {
                document.documentElement.classList.add('fonts-loaded');
            }, 3000);
        }
    }
    
    document.documentElement.classList.add('font-loading');
    loadFonts();
    
    // Async load third-party scripts
    function loadThirdPartyScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        if (callback) {
            script.onload = callback;
        }
        
        document.body.appendChild(script);
    }
    
    // Load analytics after page is interactive
    window.addEventListener('load', () => {
        setTimeout(() => {
            // loadThirdPartyScript('https://analytics.example.com/script.js');
        }, 2000);
    });
    
    // Lazy load background images
    const bgImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const bgImage = element.dataset.bgImage;
                
                if (bgImage) {
                    const img = new Image();
                    img.onload = () => {
                        element.style.setProperty('--bg-image', `url(${bgImage})`);
                        element.classList.add('loaded');
                    };
                    img.src = bgImage;
                }
                
                bgImageObserver.unobserve(element);
            }
        });
    });
    
    document.querySelectorAll('.lazy-bg').forEach(el => {
        bgImageObserver.observe(el);
    });
    
    // Prefetch next page resources
    function prefetchNextPage(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }
    
    // Prefetch on hover
    $('a[data-prefetch]').on('mouseenter', function() {
        const url = $(this).attr('href');
        if (url && !$(this).data('prefetched')) {
            prefetchNextPage(url);
            $(this).data('prefetched', true);
        }
    });
    
    // Preload critical assets
    function preloadAsset(href, as, type) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        
        if (type) {
            link.type = type;
        }
        
        if (as === 'font') {
            link.crossOrigin = 'anonymous';
        }
        
        document.head.appendChild(link);
    }
    
    // Preload critical fonts
    preloadAsset('/static/fonts/poppins.woff2', 'font', 'font/woff2');
    
    // Optimize video loading
    $('video[data-src]').each(function() {
        const video = this;
        const src = video.dataset.src;
        
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.src = src;
                    video.load();
                    videoObserver.unobserve(video);
                }
            });
        });
        
        videoObserver.observe(video);
    });
    
    // Service Worker registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
    
    // Monitor asset loading performance
    if (window.location.search.includes('debug=assets')) {
        window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource');
            
            const assetStats = {
                fonts: [],
                images: [],
                scripts: [],
                styles: []
            };
            
            resources.forEach(resource => {
                const type = resource.initiatorType;
                const stats = {
                    name: resource.name,
                    duration: resource.duration.toFixed(0),
                    size: resource.transferSize
                };
                
                if (type === 'link' && resource.name.includes('font')) {
                    assetStats.fonts.push(stats);
                } else if (type === 'img') {
                    assetStats.images.push(stats);
                } else if (type === 'script') {
                    assetStats.scripts.push(stats);
                } else if (type === 'link' && resource.name.includes('.css')) {
                    assetStats.styles.push(stats);
                }
            });
            
            console.log('Asset Loading Performance:', assetStats);
        });
    }
    
    // Optimize First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
                console.log('First Contentful Paint:', entry.startTime.toFixed(0) + 'ms');
            }
        });
    });
    
    try {
        fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
        // Browser doesn't support paint timing
    }
    
    // Resource timing
    function logResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(r => r.duration > 1000);
        
        if (slowResources.length > 0) {
            console.warn('Slow loading resources:', slowResources);
        }
    }
    
    window.addEventListener('load', logResourceTiming);
    
    // Defer non-critical content
    function loadDeferredContent() {
        $('.deferred-content').each(function() {
            const $content = $(this);
            const src = $content.data('src');
            
            if (src) {
                $.get(src, (data) => {
                    $content.html(data).addClass('loaded');
                });
            } else {
                $content.addClass('loaded');
            }
        });
    }
    
    // Load deferred content after page load
    window.addEventListener('load', () => {
        setTimeout(loadDeferredContent, 1000);
    });
    
    // Connection-aware loading
    if ('connection' in navigator) {
        const connection = navigator.connection;
        
        if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // Reduce quality for slow connections
            $('img[data-src-low]').each(function() {
                $(this).attr('src', $(this).data('src-low'));
            });
            
            // Don't autoplay videos
            $('video[autoplay]').removeAttr('autoplay');
            
            console.log('Optimizing for slow connection');
        }
    }
    
    console.log('Font and asset loading optimization initialized');
});


// ============================================
// FIX BROWSER BACK BUTTON BLANK PAGE ISSUE
// ============================================

// Handle browser back/forward button cache issues
window.addEventListener('pageshow', function(event) {
    // Check if page is loaded from cache (back/forward button)
    if (event.persisted) {
        // Force reload the page to prevent blank screen
        window.location.reload();
    }
});

// Alternative approach: Detect back button and reload
window.addEventListener('popstate', function(event) {
    // Reload page when back button is pressed
    window.location.reload();
});

// Prevent page from being cached
window.addEventListener('beforeunload', function() {
    // This helps prevent the page from being stored in bfcache
});

// Force page reload on back button for specific browsers
(function() {
    window.onpageshow = function(event) {
        if (event.persisted) {
            window.location.reload();
        }
    };
})();
