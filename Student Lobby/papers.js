import './papers.css';
import { initPapersList } from './js/papersList.js';
import './js/downloadManager.js';

document.addEventListener('DOMContentLoaded', () => {
  initApplication();
});


async function initApplication() {
  await initPapersList();
  
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
  
  const observePaperCards = () => {
    document.querySelectorAll('.paper-card').forEach(card => {
      if (!card.classList.contains('visible')) {
        observer.observe(card);
      }
    });
  };
  
  const paperContainerObserver = new MutationObserver(observePaperCards);
  
  paperContainerObserver.observe(document.getElementById('papers-container'), {
    childList: true,
    subtree: true
  });
  
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });
}