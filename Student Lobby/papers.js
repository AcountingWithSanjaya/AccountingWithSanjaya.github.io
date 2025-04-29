import './papers.css';
import { initPapersList } from './js/papersList.js';
import './js/downloadManager.js';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initApplication();
});

/**
 * Initialize the application
 */
async function initApplication() {
  // Initialize papers list
  await initPapersList();
  
  // Add smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('.nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // If we had multiple sections, we would scroll to them
      // For now, just prevent the default behavior
      
      // Update active link
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      link.classList.add('active');
    });
  });
  
  // Add some subtle animations for the paper cards
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe paper cards as they are added to the DOM
  const observePaperCards = () => {
    document.querySelectorAll('.paper-card').forEach(card => {
      if (!card.classList.contains('visible')) {
        observer.observe(card);
      }
    });
  };
  
  // Set up a mutation observer to watch for new paper cards
  const paperContainerObserver = new MutationObserver(observePaperCards);
  
  paperContainerObserver.observe(document.getElementById('papers-container'), {
    childList: true,
    subtree: true
  });
  
  // Add a class to the body when the page is fully loaded
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });
}