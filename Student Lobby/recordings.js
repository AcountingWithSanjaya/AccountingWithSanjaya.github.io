import { initRecordingsList } from './js/recordingsList.js';
import './js/downloadManager.js';
const API_URL = 'http://127.0.0.1:10209';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
        window.location.href = '../Login and Register/Login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/confirmloggedin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                token: token
            })
        });

        if (!response.ok) {
            throw new Error('Not authenticated');
        }

        // Removed fetchUserCredits() and fetchClasses() as they are not needed for this page.
        // The initApplication call below will handle fetching recordings.
    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = '../Login and Register/Login.html';
        return; // Stop execution if authentication fails and redirect is initiated
    }
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
