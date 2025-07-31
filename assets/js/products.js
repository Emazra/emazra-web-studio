        // Firebase configuration
        const firebaseConfig = {
            projectId: "emazra-websites",
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        
        // DOM Elements
        const listingPage = document.getElementById('listingPage');
        const productDetailPage = document.getElementById('productDetailPage');
        const productsGrid = document.getElementById('productsGrid');
        const filtersContainer = document.getElementById('filtersContainer');
        const backToList = document.getElementById('backToList');
        const productDetail = document.getElementById('productDetail');
        const detailImages = document.getElementById('detailImages');
        const mainImage = document.getElementById('mainImage');
        const mainImageWrapper = document.querySelector('.main-image-wrapper');
        const detailTitle = document.getElementById('detailTitle');
        const detailTags = document.getElementById('detailTags');
        const detailPrice = document.getElementById('detailPrice');
        const detailDescription = document.getElementById('detailDescription');
        const demoLinksContainer = document.getElementById('demoLinksContainer');
        const noDemoLinks = document.getElementById('noDemoLinks');
        const credentialsContainer = document.getElementById('credentialsContainer');
        const mobileCredentialsContainer = document.getElementById('mobileCredentialsContainer');
        
        // Zoom controls
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        
        // Lightbox elements
        const lightboxModal = document.getElementById('lightboxModal');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxImgWrapper = document.querySelector('.lightbox-img-wrapper');
        const lightboxClose = document.getElementById('lightboxClose');
        const lightboxZoomIn = document.getElementById('lightboxZoomIn');
        const lightboxZoomOut = document.getElementById('lightboxZoomOut');
        const lightboxReset = document.getElementById('lightboxReset');
        const prevImage = document.getElementById('prevImage');
        const nextImage = document.getElementById('nextImage');
        const imageCounter = document.getElementById('imageCounter');
        
        // Thumbnail scroll controls
        const scrollLeftBtn = document.getElementById('scrollLeftBtn');
        const scrollRightBtn = document.getElementById('scrollRightBtn');
        
        // Global variables
        let allTemplates = [];
        let uniqueTags = [];
        let currentScale = 1;
        let lightboxScale = 1;
        let currentTemplateImages = [];
        let currentImageIndex = 0;
        let isDragging = false;
        let startX, startY;
        let translateX = 0, translateY = 0;
        let lightboxTranslateX = 0, lightboxTranslateY = 0;
        let lightboxIsDragging = false;
        let lightboxStartX, lightboxStartY;
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            loadTemplates();
            
            // Back to list button
            backToList.addEventListener('click', (e) => {
                e.preventDefault();
                showListingPage();
            });
            
            // Setup zoom functionality
            setupZoom();
            
            // Setup lightbox
            setupLightbox();
            
            // Setup keyboard navigation
            setupKeyboardNavigation();
            
            // Setup thumbnail scrolling
            setupThumbnailScrolling();
        });
        
        // Load templates from Firestore
        function loadTemplates() {
            productsGrid.innerHTML = '<div class="loading">Loading templates...</div>';
            
            db.collection("templates").get()
                .then((querySnapshot) => {
                    allTemplates = [];
                    productsGrid.innerHTML = '';
                    
                    if (querySnapshot.empty) {
                        productsGrid.innerHTML = '<p>No templates found in the database.</p>';
                        return;
                    }
                    
                    querySnapshot.forEach((doc) => {
                        const template = doc.data();
                        template.id = doc.id;
                        allTemplates.push(template);
                        
                        // Create product card
                        const productCard = createProductCard(template);
                        productsGrid.appendChild(productCard);
                    });
                    
                    // Extract unique tags
                    extractUniqueTags();
                    createFilterButtons();
                })
                .catch((error) => {
                    console.error("Error loading templates: ", error);
                    productsGrid.innerHTML = '<p>Error loading templates. Please try again later.</p>';
                });
        }
        
        // Create product card for listing page
        function createProductCard(template) {
            const card = document.createElement('a');
            card.className = 'product-card';
            card.href = '#';
            card.dataset.id = template.id;
            
            // Use the first image as the main image or placeholder
            const mainImage = template.imageUrls && template.imageUrls.length > 0 
                ? template.imageUrls[0] 
                : 'https://via.placeholder.com/400x300?text=Template+Image';
            
            // Create tags HTML if available
            let tagsHTML = '';
            if (template.tags && template.tags.length > 0) {
                tagsHTML = template.tags.slice(0, 3).map(tag => 
                    `<span class="tag">${tag}</span>`
                ).join('');
            }
            
            // Price display
            let priceHTML = '';
            if (template.price) {
                priceHTML = `<div class="product-price">$${template.price.toFixed(2)}</div>`;
            }
            
            card.innerHTML = `
                <div class="product-image" style="background-image: url('${mainImage}')">
                    <div class="product-tags">
                        ${tagsHTML}
                    </div>
                </div>
                <div class="product-content">
                    <h3 class="product-title">${template.title || 'Untitled Template'}</h3>
                    ${priceHTML}
                </div>
            `;
            
            // Add click event to show detail page
            card.addEventListener('click', (e) => {
                e.preventDefault();
                showProductDetail(template.id);
            });
            
            return card;
        }
        
        // Show product detail page
        function showProductDetail(templateId) {
            const template = allTemplates.find(t => t.id === templateId);
            if (!template) {
                alert('Template not found');
                return;
            }
            
            // Store images for lightbox navigation
            currentTemplateImages = template.imageUrls || [];
            currentImageIndex = 0;
            
            // Populate detail page
            detailTitle.textContent = template.title || 'Untitled Template';
            
            // Description
            if (template.description) {
                detailDescription.innerHTML = `<p>${template.description}</p>`;
            } else {
                detailDescription.innerHTML = '<p class="no-data">No description available</p>';
            }
            
            // Price
            if (template.price) {
                detailPrice.innerHTML = `$${template.price.toFixed(2)}`;
            } else {
                detailPrice.innerHTML = '<p class="no-data">Price not specified</p>';
            }
            
            // Tags - now above description
            detailTags.innerHTML = '';
            if (template.tags && template.tags.length > 0) {
                template.tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'detail-tag';
                    tagElement.textContent = tag;
                    detailTags.appendChild(tagElement);
                });
            } else {
                detailTags.innerHTML = '<p class="no-data">No tags available</p>';
            }
            
            // Images
            detailImages.innerHTML = '';
            if (template.imageUrls && template.imageUrls.length > 0) {
                template.imageUrls.forEach((url, index) => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = template.title || 'Template image';
                    img.dataset.index = index;
                    img.addEventListener('click', () => {
                        // Update main image
                        mainImage.src = url;
                        currentImageIndex = index;
                        resetImagePosition();
                        
                        // Update active thumbnail
                        document.querySelectorAll('.detail-images img').forEach(img => {
                            img.classList.remove('active');
                        });
                        img.classList.add('active');
                        
                        // Scroll to active thumbnail
                        scrollToThumbnail(img);
                    });
                    
                    // Set first image as active
                    if (index === 0) {
                        img.classList.add('active');
                        mainImage.src = url;
                        resetImagePosition();
                    }
                    
                    detailImages.appendChild(img);
                });
            } else {
                // No images available
                mainImage.src = 'https://via.placeholder.com/800x600?text=No+Image+Available';
                detailImages.innerHTML = '<p class="no-data">No images available</p>';
            }
            
            // Demo buttons - Fixed styling
            demoLinksContainer.innerHTML = '';
            let hasDemoLinks = false;
            
            if (template.demoLinks && template.demoLinks.length > 0) {
                template.demoLinks.forEach(link => {
                    if (link.url) {
                        const btn = document.createElement('a');
                        btn.href = link.url;
                        btn.target = '_blank';
                        btn.className = 'btn btn-outline';
                        btn.innerHTML = `<i class="fas fa-external-link-alt"></i> ${link.label || 'Demo'}`;
                        demoLinksContainer.appendChild(btn);
                        hasDemoLinks = true;
                    }
                });
            }
            
            noDemoLinks.style.display = hasDemoLinks ? 'none' : 'block';
            
            // Credentials - Desktop
            credentialsContainer.innerHTML = '';
            mobileCredentialsContainer.innerHTML = '';
            if (template.credentials && template.credentials.length > 0) {
                template.credentials.forEach(cred => {
                    const card = document.createElement('div');
                    card.className = 'credential-card';
                    
                    card.innerHTML = `
                        <div class="credential-title">${cred.role || 'Credentials'}</div>
                        <div class="credential-field">
                            <div class="credential-label">Username:</div>
                            <div class="credential-value">
                                <span>${cred.username}</span>
                                <button class="copy-btn" data-value="${cred.username}">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        <div class="credential-field">
                            <div class="credential-label">Password:</div>
                            <div class="credential-value">
                                <span>${cred.password}</span>
                                <button class="copy-btn" data-value="${cred.password}">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    
                    credentialsContainer.appendChild(card.cloneNode(true));
                    mobileCredentialsContainer.appendChild(card.cloneNode(true));
                    
                    // Add copy event listeners
                    const copyButtons = card.querySelectorAll('.copy-btn');
                    copyButtons.forEach(btn => {
                        btn.addEventListener('click', function() {
                            const value = this.getAttribute('data-value');
                            copyToClipboard(value);
                            
                            // Show feedback
                            const originalIcon = this.innerHTML;
                            this.innerHTML = '<i class="fas fa-check"></i>';
                            
                            setTimeout(() => {
                                this.innerHTML = originalIcon;
                            }, 2000);
                        });
                    });
                });
            } else {
                credentialsContainer.innerHTML = '<div class="no-data">No credentials available</div>';
                mobileCredentialsContainer.innerHTML = '<div class="no-data">No credentials available</div>';
            }
            
            // Show mobile credentials section if mobile view
            if (window.innerWidth <= 992) {
                document.querySelector('.mobile-credentials-section').style.display = 'block';
            }
            
            // Show detail page
            listingPage.style.display = 'none';
            productDetailPage.style.display = 'block';
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
        
        // Reset image position and scale
        function resetImagePosition() {
            currentScale = 1;
            translateX = 0;
            translateY = 0;
            mainImage.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
            mainImage.classList.remove('zoomed');
        }
        
        // Show listing page
        function showListingPage() {
            listingPage.style.display = 'block';
            productDetailPage.style.display = 'none';
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
        
        // Extract unique tags from all templates
        function extractUniqueTags() {
            const allTags = [];
            
            allTemplates.forEach(template => {
                if (template.tags && template.tags.length > 0) {
                    allTags.push(...template.tags);
                }
            });
            
            // Get unique tags
            uniqueTags = [...new Set(allTags)];
        }
        
        // Create filter buttons
        function createFilterButtons() {
            // Clear existing buttons (except "All")
            const allBtn = filtersContainer.querySelector('[data-tag="all"]');
            filtersContainer.innerHTML = '';
            filtersContainer.appendChild(allBtn);
            
            // Add buttons for each unique tag
            uniqueTags.forEach(tag => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.textContent = tag;
                btn.dataset.tag = tag;
                filtersContainer.appendChild(btn);
                
                btn.addEventListener('click', () => {
                    filterTemplates(tag);
                    
                    // Update active state
                    filtersContainer.querySelectorAll('.filter-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    btn.classList.add('active');
                });
            });
            
            // Add "All" button event
            allBtn.addEventListener('click', () => {
                filterTemplates('all');
                
                filtersContainer.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                allBtn.classList.add('active');
            });
        }
        
        // Filter templates by tag
        function filterTemplates(tag) {
            productsGrid.innerHTML = '';
            
            const filteredTemplates = tag === 'all' 
                ? allTemplates 
                : allTemplates.filter(template => 
                    template.tags && template.tags.includes(tag)
                );
            
            if (filteredTemplates.length === 0) {
                productsGrid.innerHTML = '<p>No templates found for this category.</p>';
            } else {
                filteredTemplates.forEach(template => {
                    const productCard = createProductCard(template);
                    productsGrid.appendChild(productCard);
                });
            }
        }
        
        // Setup zoom functionality with panning
        function setupZoom() {
            // Zoom in button
            zoomInBtn.addEventListener('click', () => {
                currentScale += 0.5;
                updateImageTransform();
                mainImage.classList.add('zoomed');
            });
            
            // Zoom out button
            zoomOutBtn.addEventListener('click', () => {
                if (currentScale > 1) {
                    currentScale -= 0.5;
                    updateImageTransform();
                    
                    if (currentScale === 1) {
                        mainImage.classList.remove('zoomed');
                        resetImagePosition();
                    }
                }
            });
            
            // Reset zoom button
            resetZoomBtn.addEventListener('click', () => {
                resetImagePosition();
            });
            
            // Double click to toggle zoom
            mainImage.addEventListener('dblclick', (e) => {
                e.preventDefault();
                if (currentScale === 1) {
                    currentScale = 2;
                    mainImage.classList.add('zoomed');
                } else {
                    currentScale = 1;
                    mainImage.classList.remove('zoomed');
                }
                updateImageTransform();
            });
            
            // Click to open lightbox
            mainImage.addEventListener('click', (e) => {
                if (!isDragging) {
                    lightboxImage.src = mainImage.src;
                    lightboxModal.style.display = 'flex';
                    lightboxScale = 1;
                    lightboxTranslateX = 0;
                    lightboxTranslateY = 0;
                    updateLightboxImageTransform();
                    updateImageCounter();
                }
            });
            
            // Panning functionality for main image
            mainImageWrapper.addEventListener('mousedown', (e) => {
                if (currentScale > 1) {
                    e.preventDefault();
                    isDragging = true;
                    startX = e.clientX - translateX;
                    startY = e.clientY - translateY;
                    mainImage.style.cursor = 'grabbing';
                }
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                updateImageTransform();
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    mainImage.style.cursor = 'grab';
                }
            });
        }
        
        // Update main image transform
        function updateImageTransform() {
            mainImage.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
        }
        
        // Update lightbox image transform
        function updateLightboxImageTransform() {
            lightboxImage.style.transform = `scale(${lightboxScale}) translate(${lightboxTranslateX}px, ${lightboxTranslateY}px)`;
        }
        
        // Update image counter in lightbox
        function updateImageCounter() {
            if (currentTemplateImages.length > 0) {
                imageCounter.textContent = `${currentImageIndex + 1}/${currentTemplateImages.length}`;
            } else {
                imageCounter.textContent = '1/1';
            }
        }
        
        // Setup lightbox functionality with panning and navigation
        function setupLightbox() {
            // Close lightbox
            lightboxClose.addEventListener('click', () => {
                lightboxModal.style.display = 'none';
            });
            
            // Close when clicking outside image
            lightboxModal.addEventListener('click', (e) => {
                if (e.target === lightboxModal) {
                    lightboxModal.style.display = 'none';
                }
            });
            
            // Lightbox zoom in
            lightboxZoomIn.addEventListener('click', () => {
                lightboxScale += 0.5;
                updateLightboxImageTransform();
            });
            
            // Lightbox zoom out
            lightboxZoomOut.addEventListener('click', () => {
                if (lightboxScale > 1) {
                    lightboxScale -= 0.5;
                    updateLightboxImageTransform();
                }
            });
            
            // Lightbox reset zoom
            lightboxReset.addEventListener('click', () => {
                lightboxScale = 1;
                lightboxTranslateX = 0;
                lightboxTranslateY = 0;
                updateLightboxImageTransform();
            });
            
            // Double click to toggle zoom in lightbox
            lightboxImage.addEventListener('dblclick', (e) => {
                e.preventDefault();
                if (lightboxScale === 1) {
                    lightboxScale = 2;
                } else {
                    lightboxScale = 1;
                    lightboxTranslateX = 0;
                    lightboxTranslateY = 0;
                }
                updateLightboxImageTransform();
            });
            
            // Panning for lightbox
            lightboxImgWrapper.addEventListener('mousedown', (e) => {
                if (lightboxScale > 1) {
                    e.preventDefault();
                    lightboxIsDragging = true;
                    lightboxStartX = e.clientX - lightboxTranslateX;
                    lightboxStartY = e.clientY - lightboxTranslateY;
                    lightboxImage.style.cursor = 'grabbing';
                }
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!lightboxIsDragging) return;
                e.preventDefault();
                lightboxTranslateX = e.clientX - lightboxStartX;
                lightboxTranslateY = e.clientY - lightboxStartY;
                updateLightboxImageTransform();
            });
            
            document.addEventListener('mouseup', () => {
                if (lightboxIsDragging) {
                    lightboxIsDragging = false;
                    lightboxImage.style.cursor = 'grab';
                }
            });
            
            // Navigation arrows
            prevImage.addEventListener('click', () => {
                if (currentTemplateImages.length > 0) {
                    currentImageIndex = (currentImageIndex - 1 + currentTemplateImages.length) % currentTemplateImages.length;
                    lightboxImage.src = currentTemplateImages[currentImageIndex];
                    lightboxScale = 1;
                    lightboxTranslateX = 0;
                    lightboxTranslateY = 0;
                    updateLightboxImageTransform();
                    updateImageCounter();
                    
                    // Update active thumbnail
                    document.querySelectorAll('.detail-images img').forEach(img => {
                        img.classList.remove('active');
                        if (parseInt(img.dataset.index) === currentImageIndex) {
                            img.classList.add('active');
                            scrollToThumbnail(img);
                        }
                    });
                }
            });
            
            nextImage.addEventListener('click', () => {
                if (currentTemplateImages.length > 0) {
                    currentImageIndex = (currentImageIndex + 1) % currentTemplateImages.length;
                    lightboxImage.src = currentTemplateImages[currentImageIndex];
                    lightboxScale = 1;
                    lightboxTranslateX = 0;
                    lightboxTranslateY = 0;
                    updateLightboxImageTransform();
                    updateImageCounter();
                    
                    // Update active thumbnail
                    document.querySelectorAll('.detail-images img').forEach(img => {
                        img.classList.remove('active');
                        if (parseInt(img.dataset.index) === currentImageIndex) {
                            img.classList.add('active');
                            scrollToThumbnail(img);
                        }
                    });
                }
            });
        }
        
        // Setup thumbnail scrolling functionality
        function setupThumbnailScrolling() {
            // Scroll left button
            scrollLeftBtn.addEventListener('click', () => {
                detailImages.scrollBy({ left: -200, behavior: 'smooth' });
            });
            
            // Scroll right button
            scrollRightBtn.addEventListener('click', () => {
                detailImages.scrollBy({ left: 200, behavior: 'smooth' });
            });
            
            // Auto hide/show scroll indicators
            detailImages.addEventListener('scroll', () => {
                updateScrollIndicators();
            });
            
            // Initial update
            updateScrollIndicators();
        }
        
        // Update scroll indicators visibility
        function updateScrollIndicators() {
            scrollLeftBtn.style.display = detailImages.scrollLeft > 0 ? 'flex' : 'none';
            scrollRightBtn.style.display = 
                detailImages.scrollLeft < (detailImages.scrollWidth - detailImages.clientWidth) 
                ? 'flex' : 'none';
        }
        
        // Scroll to active thumbnail
        function scrollToThumbnail(thumbnail) {
            const container = detailImages;
            const thumbRect = thumbnail.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Check if thumbnail is not fully in view
            if (thumbRect.left < containerRect.left) {
                container.scrollTo({
                    left: container.scrollLeft + (thumbRect.left - containerRect.left) - 10,
                    behavior: 'smooth'
                });
            } else if (thumbRect.right > containerRect.right) {
                container.scrollTo({
                    left: container.scrollLeft + (thumbRect.right - containerRect.right) + 10,
                    behavior: 'smooth'
                });
            }
        }
        
        // Setup keyboard navigation
        function setupKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                // Only when lightbox is open
                if (lightboxModal.style.display === 'flex') {
                    switch (e.key) {
                        case 'ArrowLeft':
                            prevImage.click();
                            break;
                        case 'ArrowRight':
                            nextImage.click();
                            break;
                        case 'Escape':
                            lightboxClose.click();
                            break;
                        case '+':
                            lightboxZoomIn.click();
                            break;
                        case '-':
                            lightboxZoomOut.click();
                            break;
                        case '0':
                            lightboxReset.click();
                            break;
                    }
                }
            });
        }
        
        // Copy to clipboard function
        function copyToClipboard(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }


// Send height to parent when content changes
function sendHeightToParent() {
  const height = document.body.scrollHeight;
  window.parent.postMessage({
    type: 'resize',
    height: height
  }, '*');
}

// Send initial height
sendHeightToParent();

// Send height when content changes (e.g., after filtering or opening details)
const observer = new MutationObserver(sendHeightToParent);
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true
});

// Also send height on window resize
window.addEventListener('resize', sendHeightToParent);
