/**
* Template Name: iLanding
* Template URL: https://bootstrapmade.com/ilanding-bootstrap-landing-page-template/
* Updated: Nov 12 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

})();

// Featured Templates Preview
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('featuredTemplates')) {
    loadFeaturedTemplates();
  }
});

function loadFeaturedTemplates() {
  const firebaseConfig = {
    apiKey: "AIzaSyC3CWCTA0vbhmbXU2sJIEuqiaBPABQ4t8c",
    authDomain: "emazra-websites.firebaseapp.com",
    projectId: "emazra-websites",
    storageBucket: "emazra-websites.appspot.com",
    messagingSenderId: "918337863968",
    appId: "1:918337863968:web:7d6a2662df6f0e78949745",
    measurementId: "G-07YVB5TFKF"
  };

  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const db = firebase.firestore();
  const featuredContainer = document.getElementById('featuredTemplates');

  db.collection("templates").limit(6).get()
    .then((querySnapshot) => {
      featuredContainer.innerHTML = '';
      
      if (querySnapshot.empty) {
        featuredContainer.innerHTML = `
          <div class="col-12 text-center py-5">
            <p>No templates found in the database.</p>
          </div>
        `;
        return;
      }
      
      querySnapshot.forEach((doc) => {
        const template = doc.data();
        template.id = doc.id;
        
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6';
        
        // Use the first image as the main image or placeholder
        const mainImage = template.imageUrls && template.imageUrls.length > 0 
          ? template.imageUrls[0] 
          : 'https://via.placeholder.com/400x300?text=Template+Image';
        
        // Create tags HTML if available (show max 2 tags in preview)
        let tagsHTML = '';
        if (template.tags && template.tags.length > 0) {
          tagsHTML = template.tags.slice(0, 2).map(tag => 
            `<span class="template-tag">${tag}</span>`
          ).join('');
        }
        
        // Price display
        let priceHTML = '';
        if (template.price) {
          priceHTML = `<div class="template-price">$${template.price.toFixed(2)}</div>`;
        }
        
        col.innerHTML = `
          <div class="template-card">
            <div class="template-image" style="background-image: url('${mainImage}')">
              <div class="template-tags">
                ${tagsHTML}
              </div>
            </div>
            <div class="template-content">
              <h3 class="template-title">${template.title || 'Untitled Template'}</h3>
              ${priceHTML}
              <a href="product.html#${template.id}" class="btn btn-sm btn-outline-primary mt-3">
                Explore Templates
              </a>
            </div>
          </div>
        `;
        
        featuredContainer.appendChild(col);
      });
    })
    .catch((error) => {
      console.error("Error loading templates: ", error);
      featuredContainer.innerHTML = `
        <div class="col-12 text-center py-5">
          <p>Error loading templates. Please try again later.</p>
        </div>
      `;
    });
}