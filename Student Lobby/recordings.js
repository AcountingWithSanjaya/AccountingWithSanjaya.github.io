import './recordings.css';
import { initRecordingsList } from './js/recordingsList.js';
import './js/downloadManager.js';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initApplication();
});

/**
 * Initialize the application
 */
async function initApplication() {
  // Initialize recordings list
  await initRecordingsList();
  
  // Add smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('.nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active link
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      link.classList.add('active');
    });
  });
  
  // Add some subtle animations for the recording cards
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
  
  // Observe recording cards as they are added to the DOM
  const observeRecordingCards = () => {
    document.querySelectorAll('.recording-card').forEach(card => {
      if (!card.classList.contains('visible')) {
        observer.observe(card);
      }
    });
  };
  
  // Set up a mutation observer to watch for new recording cards
  const recordingContainerObserver = new MutationObserver(observeRecordingCards);
  
  recordingContainerObserver.observe(document.getElementById('recordings-container'), {
    childList: true,
    subtree: true
  });
  
  // Add a class to the body when the page is fully loaded
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });
}