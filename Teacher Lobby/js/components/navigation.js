/**
 * Navigation component
 * Handles page navigation and active link states
 */
export function initNavigation() {
  console.log('[Navigation] Initializing navigation.');
  const navLinks = document.querySelectorAll('.nav a');
  const pages = document.querySelectorAll('.page');
  
  // Function to show a specific page and update active link
  const showPage = (pageId) => {
    console.log(`[Navigation] Showing page: ${pageId}`);
    // Hide all pages
    pages.forEach(page => {
      page.classList.remove('active');
    });
    
    // Remove active class from all links
    navLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Show the selected page
    const selectedPage = document.getElementById(`${pageId}-page`);
    if (selectedPage) {
      selectedPage.classList.add('active');
    }
    
    // Add active class to the clicked link
    const activeLink = document.querySelector(`.nav a[data-page="${pageId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
    
    // Update URL hash
    window.location.hash = pageId;
  };
  
  // Handle navigation click events
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.getAttribute('data-page');
      showPage(pageId);
    });
  });
  
  // Handle hash change to support direct links and browser back/forward
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      showPage(hash);
    } else {
      // Default to dashboard if no hash
      showPage('dashboard');
    }
  });
  
  // Check initial hash on page load
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    showPage(initialHash);
  } else {
    // Default to dashboard if no hash
    showPage('dashboard');
  }
  
  // Handle footer navigation links
  const footerLinks = document.querySelectorAll('.footer-section a[href^="#"]');
  footerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.getAttribute('href').replace('#', '');
      showPage(pageId);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}
