import './recordings.css';
import { initRecordingsList } from './js/recordingsList.js';
import './js/downloadManager.js';

document.addEventListener('DOMContentLoaded', () => {
  initApplication();
});


async function initApplication() {
  await initRecordingsList();
  
  const navLinks = document.querySelectorAll('.nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      link.classList.add('active');
    });
  });
  
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
  
  const observeRecordingCards = () => {
    document.querySelectorAll('.recording-card').forEach(card => {
      if (!card.classList.contains('visible')) {
        observer.observe(card);
      }
    });
  };
  
  const recordingContainerObserver = new MutationObserver(observeRecordingCards);
  
  recordingContainerObserver.observe(document.getElementById('recordings-container'), {
    childList: true,
    subtree: true
  });
  
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });
}