// Iconify Icon Picker for Django Admin with API Integration
// Provides access to 150,000+ icons via Iconify API

// Popular icon collections
const ICON_COLLECTIONS = [
    { id: 'mdi', name: 'Material Design', prefix: 'mdi' },
    { id: 'fa', name: 'Font Awesome', prefix: 'fa' },
    { id: 'fa6-solid', name: 'FA6 Solid', prefix: 'fa6-solid' },
    { id: 'bi', name: 'Bootstrap', prefix: 'bi' },
    { id: 'heroicons', name: 'Heroicons', prefix: 'heroicons' },
    { id: 'lucide', name: 'Lucide', prefix: 'lucide' },
    { id: 'tabler', name: 'Tabler', prefix: 'tabler' },
    { id: 'carbon', name: 'Carbon', prefix: 'carbon' }
];

// Popular gift-related icons
const POPULAR_ICONS = [
    // Gifts & Celebrations
    'mdi:gift', 'mdi:gift-outline', 'mdi:gift-open', 'fa:gift', 'bi:gift',
    'mdi:party-popper', 'mdi:balloon', 'mdi:confetti', 'mdi:firework',
    
    // Love & Romance
    'mdi:heart', 'mdi:cards-heart', 'fa:heart', 'bi:heart', 'heroicons:heart',
    'mdi:heart-outline', 'mdi:heart-multiple', 'mdi:diamond-stone', 'mdi:ring',
    
    // Birthday & Cake
    'mdi:cake-variant', 'mdi:cake', 'fa:birthday-cake', 'bi:cake', 'bi:cake2',
    'mdi:cupcake', 'mdi:candle',
    
    // Flowers & Nature
    'mdi:flower', 'mdi:flower-tulip', 'mdi:flower-outline', 'bi:flower1', 'bi:flower2',
    'mdi:spa', 'mdi:leaf', 'mdi:tree',
    
    // Food & Drinks
    'mdi:food', 'mdi:coffee', 'mdi:wine', 'mdi:beer', 'fa:wine-glass',
    'fa:coffee', 'fa:pizza-slice', 'bi:cup', 'mdi:silverware-fork-knife',
    
    // Tech & Gadgets
    'mdi:laptop', 'mdi:cellphone', 'mdi:headphones', 'mdi:watch', 'mdi:camera',
    'fa:mobile-alt', 'fa:laptop', 'fa:headphones', 'bi:phone', 'bi:laptop',
    
    // Books & Education
    'mdi:book-open-page-variant', 'mdi:book', 'fa:book', 'bi:book',
    'heroicons:book-open', 'mdi:school', 'mdi:pencil',
    
    // Fashion & Accessories
    'mdi:tshirt-crew', 'mdi:shoe-heel', 'mdi:bag-personal', 'mdi:sunglasses',
    'fa:tshirt', 'mdi:watch', 'mdi:ring', 'mdi:necklace',
    
    // Sports & Fitness
    'mdi:dumbbell', 'mdi:soccer', 'mdi:basketball', 'mdi:yoga', 'mdi:run',
    'mdi:bike', 'mdi:swim', 'mdi:tennis',
    
    // Home & Living
    'mdi:home', 'mdi:sofa', 'mdi:lamp', 'mdi:bed', 'mdi:chair-rolling',
    'mdi:desk', 'mdi:table-furniture',
    
    // Art & Music
    'mdi:music', 'mdi:palette', 'mdi:brush', 'fa:music', 'fa:paint-brush',
    'mdi:guitar-acoustic', 'mdi:piano',
    
    // Special Occasions
    'fa:star', 'fa:crown', 'fa:gem', 'mdi:star', 'mdi:crown',
    'heroicons:sparkles', 'mdi:trophy', 'mdi:medal'
];

let currentInputId = null;
let currentCollection = 'all';

// Open icon picker modal
function openIconPicker(inputId) {
    currentInputId = inputId;
    
    // Create modal if it doesn't exist
    if (!document.getElementById('iconify-picker-modal')) {
        createIconPickerModal();
    }
    
    // Show modal
    const modal = document.getElementById('iconify-picker-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Load popular icons
    loadPopularIcons();
    
    // Focus search
    setTimeout(() => {
        document.getElementById('iconify-search-input').focus();
    }, 100);
}

// Close icon picker modal
function closeIconPicker() {
    const modal = document.getElementById('iconify-picker-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Create the modal HTML
function createIconPickerModal() {
    const modalHTML = `
        <div id="iconify-picker-modal" class="iconify-modal">
            <div class="iconify-modal-content">
                <div class="iconify-modal-header">
                    <h2>Choose an Icon</h2>
                    <button onclick="closeIconPicker()" class="iconify-close-btn">&times;</button>
                </div>
                
                <div class="iconify-modal-body">
                    <!-- Search Bar -->
                    <div class="iconify-search-bar">
                        <input type="text" 
                               id="iconify-search-input" 
                               placeholder="Search 150,000+ icons (e.g., gift, heart, cake)..."
                               onkeyup="searchIcons(this.value)">
                        <span class="iconify" data-icon="mdi:magnify"></span>
                    </div>
                    
                    <!-- Collection Tabs -->
                    <div class="iconify-collections">
                        <button class="collection-tab active" onclick="setCollection('all', event)">
                            All Popular
                        </button>
                        ${ICON_COLLECTIONS.map(col => `
                            <button class="collection-tab" onclick="setCollection('${col.prefix}', event)">
                                ${col.name}
                            </button>
                        `).join('')}
                    </div>
                    
                    <!-- Icons Grid -->
                    <div id="iconify-icons-grid" class="iconify-icons-grid">
                        <div class="iconify-loading">Loading icons...</div>
                    </div>
                    
                    <!-- Loading Indicator -->
                    <div id="iconify-loading-indicator" class="iconify-loading-indicator" style="display: none;">
                        <div class="spinner"></div>
                        <p>Searching icons...</p>
                    </div>
                </div>
                
                <div class="iconify-modal-footer">
                    <p class="iconify-help-text">
                        <strong>💡 Tip:</strong> Search for anything (e.g., "birthday", "tech", "food") or browse collections above
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close on outside click
    document.getElementById('iconify-picker-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeIconPicker();
        }
    });
    
    // Close on Esc key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('iconify-picker-modal').style.display === 'flex') {
            closeIconPicker();
        }
    });
}

// Set collection filter
function setCollection(collection, event) {
    currentCollection = collection;
    
    // Update active tab
    document.querySelectorAll('.collection-tab').forEach(tab => tab.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Get current search query
    const query = document.getElementById('iconify-search-input').value.trim();
    
    if (query.length >= 2) {
        searchIconsAPI(query, collection);
    } else if (collection === 'all') {
        loadPopularIcons();
    } else {
        // Filter popular icons by collection
        const filtered = POPULAR_ICONS.filter(icon => icon.startsWith(collection + ':'));
        displayIcons(filtered.length > 0 ? filtered : POPULAR_ICONS);
    }
}

// Load popular icons
function loadPopularIcons() {
    currentCollection = 'all';
    displayIcons(POPULAR_ICONS);
    
    // Set active tab
    document.querySelectorAll('.collection-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.collection-tab')[0].classList.add('active');
}

// Display icons in grid
function displayIcons(icons) {
    const grid = document.getElementById('iconify-icons-grid');
    grid.innerHTML = '';
    
    if (icons.length === 0) {
        grid.innerHTML = `
            <div class="iconify-no-results">
                <span class="iconify" data-icon="mdi:magnify-close" style="font-size: 48px; opacity: 0.3;"></span>
                <p>No icons found</p>
                <p class="small">Try a different search term or collection</p>
            </div>
        `;
        return;
    }
    
    icons.forEach(iconName => {
        const iconCard = createIconCard(iconName);
        grid.appendChild(iconCard);
    });
}

// Search icons via Iconify API
let searchTimeout;
function searchIcons(query) {
    clearTimeout(searchTimeout);
    
    if (!query || query.length < 2) {
        if (currentCollection === 'all') {
            loadPopularIcons();
        } else {
            const filtered = POPULAR_ICONS.filter(icon => icon.startsWith(currentCollection + ':'));
            displayIcons(filtered.length > 0 ? filtered : POPULAR_ICONS);
        }
        return;
    }
    
    searchTimeout = setTimeout(() => {
        searchIconsAPI(query, currentCollection);
    }, 500);
}

// Search icons using Iconify API
function searchIconsAPI(query, collection) {
    const grid = document.getElementById('iconify-icons-grid');
    const loadingIndicator = document.getElementById('iconify-loading-indicator');
    
    // Show loading
    grid.style.opacity = '0.5';
    loadingIndicator.style.display = 'flex';
    
    // Build API URL
    let apiUrl = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=100`;
    if (collection && collection !== 'all') {
        apiUrl += `&prefix=${collection}`;
    }
    
    // Fetch icons from API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Hide loading
            grid.style.opacity = '1';
            loadingIndicator.style.display = 'none';
            
            if (data.icons && data.icons.length > 0) {
                displayIcons(data.icons);
            } else {
                // Fallback to local search
                const localResults = POPULAR_ICONS.filter(icon => 
                    icon.toLowerCase().includes(query.toLowerCase())
                );
                
                if (localResults.length > 0) {
                    displayIcons(localResults);
                } else {
                    grid.innerHTML = `
                        <div class="iconify-no-results">
                            <span class="iconify" data-icon="mdi:magnify-close" style="font-size: 48px; opacity: 0.3;"></span>
                            <p>No icons found for "${query}"</p>
                            <p class="small">Try: "gift", "heart", "cake", "tech", "food"</p>
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Icon search error:', error);
            
            // Hide loading
            grid.style.opacity = '1';
            loadingIndicator.style.display = 'none';
            
            // Fallback to local search
            const localResults = POPULAR_ICONS.filter(icon => 
                icon.toLowerCase().includes(query.toLowerCase())
            );
            displayIcons(localResults);
        });
}

// Create icon card element
function createIconCard(iconName) {
    const card = document.createElement('div');
    card.className = 'iconify-icon-card';
    card.onclick = () => selectIcon(iconName);
    card.title = iconName;
    
    card.innerHTML = `
        <span class="iconify" data-icon="${iconName}" style="font-size: 32px;"></span>
        <span class="icon-name">${iconName.split(':')[1] || iconName}</span>
    `;
    
    return card;
}

// Select an icon
function selectIcon(iconName) {
    if (!currentInputId) return;
    
    // Update input value
    const input = document.getElementById(currentInputId);
    if (input) {
        input.value = iconName;
        
        // Update preview
        const wrapper = input.closest('.iconify-picker-wrapper');
        if (wrapper) {
            const preview = wrapper.querySelector('.preview-icon');
            if (preview) {
                preview.setAttribute('data-icon', iconName);
            }
        }
        
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Close modal
    closeIconPicker();
    
    // Show success message
    showSuccessMessage(`Icon "${iconName}" selected!`);
}

// Show success message
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'iconify-toast';
    toast.innerHTML = `<span class="iconify" data-icon="mdi:check-circle" style="margin-right: 8px;"></span>${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Update preview when input changes manually
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('iconify-icon-input')) {
            const wrapper = e.target.closest('.iconify-picker-wrapper');
            if (wrapper) {
                const preview = wrapper.querySelector('.preview-icon');
                if (preview && e.target.value) {
                    preview.setAttribute('data-icon', e.target.value);
                }
            }
        }
    });
});
