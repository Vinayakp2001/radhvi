/**
 * Valentine's Day Campaign JavaScript
 * Radhvi.in - Emotions, Crafted Perfectly
 * 
 * Handles interactive features for Valentine's promotional campaign
 */

// ============================================================================
// ANNOUNCEMENT BAR DISMISSAL
// ============================================================================

/**
 * Dismiss the Valentine's announcement bar
 * Stores dismissal state in sessionStorage to persist during session
 */
function dismissValentineBar() {
    const bar = document.getElementById('valentineAnnouncement');
    if (!bar) return;
    
    // Animate out
    bar.style.transition = 'all 0.3s ease';
    bar.style.opacity = '0';
    bar.style.transform = 'translateY(-100%)';
    
    // Remove from DOM after animation
    setTimeout(() => {
        bar.style.display = 'none';
    }, 300);
    
    // Store dismissal in session storage
    sessionStorage.setItem('valentine_bar_dismissed', 'true');
    
    console.log('Valentine announcement bar dismissed');
}

/**
 * Check if announcement bar was previously dismissed
 * Runs on page load
 */
function checkAnnouncementBarDismissal() {
    if (sessionStorage.getItem('valentine_bar_dismissed') === 'true') {
        const bar = document.getElementById('valentineAnnouncement');
        if (bar) {
            bar.style.display = 'none';
            console.log('Valentine announcement bar hidden (previously dismissed)');
        }
    }
}

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================

/**
 * Initialize and run the Valentine's campaign countdown timer
 * Updates every second until campaign end date
 */
function initValentineCountdown() {
    const countdownEl = document.getElementById('valentineCountdown');
    if (!countdownEl) return;
    
    // Get end date from data attribute or use default
    const endDateStr = countdownEl.dataset.endDate || '2026-02-15T23:59:59';
    const endDate = new Date(endDateStr).getTime();
    
    /**
     * Update countdown display
     */
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endDate - now;
        
        // Check if countdown has ended
        if (distance < 0) {
            countdownEl.innerHTML = '<span class="text-muted">Offer Ended</span>';
            return;
        }
        
        // Calculate time units
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update display
        countdownEl.innerHTML = `
            <span class="countdown-item">${days}d</span>
            <span class="countdown-item">${hours}h</span>
            <span class="countdown-item">${minutes}m</span>
            <span class="countdown-item">${seconds}s</span>
        `;
    }
    
    // Initial update
    updateCountdown();
    
    // Update every second
    const intervalId = setInterval(updateCountdown, 1000);
    
    // Store interval ID for cleanup if needed
    countdownEl.dataset.intervalId = intervalId;
    
    console.log('Valentine countdown timer initialized');
}

// ============================================================================
// SMOOTH SCROLL TO VALENTINE'S PRODUCTS
// ============================================================================

/**
 * Smooth scroll to Valentine's category when clicking CTA buttons
 */
function initValentineSmoothScroll() {
    const ctaButtons = document.querySelectorAll('[href*="category=valentines"]');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add a subtle animation effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// ============================================================================
// COPY DISCOUNT CODE
// ============================================================================

/**
 * Copy discount code to clipboard when clicked
 */
function initDiscountCodeCopy() {
    const discountCodes = document.querySelectorAll('.valentine-code, .offer-code');
    
    discountCodes.forEach(codeEl => {
        codeEl.style.cursor = 'pointer';
        codeEl.title = 'Click to copy code';
        
        codeEl.addEventListener('click', function() {
            const code = this.textContent.trim();
            
            // Copy to clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(() => {
                    showCopyNotification(this, 'Copied!');
                }).catch(err => {
                    console.error('Failed to copy code:', err);
                    fallbackCopyCode(code);
                });
            } else {
                fallbackCopyCode(code);
            }
        });
    });
}

/**
 * Fallback method for copying code (older browsers)
 */
function fallbackCopyCode(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        console.log('Code copied using fallback method');
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
}

/**
 * Show a temporary notification when code is copied
 */
function showCopyNotification(element, message) {
    const originalText = element.textContent;
    element.textContent = message;
    element.style.background = 'rgba(76, 175, 80, 0.3)';
    
    setTimeout(() => {
        element.textContent = originalText;
        element.style.background = '';
    }, 1500);
}

// ============================================================================
// ANIMATION EFFECTS
// ============================================================================

/**
 * Add entrance animations to Valentine's elements
 */
function initValentineAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe Valentine's sections
    const sections = document.querySelectorAll(
        '.valentine-hero-section, .valentine-promo-section, .valentine-category-card'
    );
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// ============================================================================
// ANALYTICS TRACKING (Optional)
// ============================================================================

/**
 * Track Valentine's campaign interactions
 * Can be integrated with Google Analytics or other analytics tools
 */
function trackValentineInteraction(action, label) {
    console.log(`Valentine Campaign: ${action} - ${label}`);
    
    // Example: Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': 'Valentine Campaign',
            'event_label': label
        });
    }
    
    // Example: Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', 'ValentineCampaign', {
            action: action,
            label: label
        });
    }
}

/**
 * Initialize analytics tracking for Valentine's elements
 */
function initValentineAnalytics() {
    // Track CTA button clicks
    document.querySelectorAll('.btn-valentine-primary, .btn-valentine-large').forEach(btn => {
        btn.addEventListener('click', () => {
            trackValentineInteraction('CTA Click', btn.textContent.trim());
        });
    });
    
    // Track announcement bar dismissal
    const closeBtn = document.querySelector('.valentine-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            trackValentineInteraction('Announcement Dismissed', 'User Action');
        });
    }
    
    // Track category card clicks
    document.querySelectorAll('.valentine-category-card').forEach(card => {
        card.addEventListener('click', () => {
            trackValentineInteraction('Category Click', 'Valentine Category');
        });
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all Valentine's campaign features
 * Runs when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Valentine\'s Day campaign features...');
    
    // Check if announcement bar was dismissed
    checkAnnouncementBarDismissal();
    
    // Initialize countdown timer
    initValentineCountdown();
    
    // Initialize smooth scroll
    initValentineSmoothScroll();
    
    // Initialize discount code copy
    initDiscountCodeCopy();
    
    // Initialize animations
    initValentineAnimations();
    
    // Initialize analytics tracking
    initValentineAnalytics();
    
    console.log('Valentine\'s Day campaign features initialized successfully');
});

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Cleanup function for when page is unloaded
 * Clears intervals and removes event listeners
 */
window.addEventListener('beforeunload', function() {
    const countdownEl = document.getElementById('valentineCountdown');
    if (countdownEl && countdownEl.dataset.intervalId) {
        clearInterval(parseInt(countdownEl.dataset.intervalId));
    }
});

// ============================================================================
// EXPORT FOR MODULE USAGE (if needed)
// ============================================================================

// If using ES6 modules, export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        dismissValentineBar,
        initValentineCountdown,
        trackValentineInteraction
    };
}
