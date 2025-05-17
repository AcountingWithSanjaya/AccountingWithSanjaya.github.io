import { initRecordingsList } from './js/recordingsList.js';
import './js/downloadManager.js';
const API_URL = 'http://127.0.0.1:10209';

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden'); // Show loading overlay

    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
        handleInvalidSession(); // Use helper to clear session and redirect
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
            console.error('Login confirmation failed, status:', response.status);
            const errorData = await response.json().catch(() => ({ message: 'Authentication check failed.' }));
            throw new Error(errorData.message || 'Not authenticated');
        }
        
        // User is authenticated, proceed to initialize the application
        initApplication();

    } catch (error) {
        console.error('Authentication error:', error.message);
        handleInvalidSession(); // Use helper to clear session and redirect
        // No return needed here as handleInvalidSession redirects
    } finally {
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.classList.add('hidden'); // Hide loading overlay
        }, 300);
    }
});

function redirectToLogin() {
    window.location.href = '../Login and Register/Login.html';
}

function handleInvalidSession(message = 'Your session is invalid or has expired. Please log in again.') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username'); 
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('returncustomer');
    // Do not redirect immediately. Show an overlay instead.

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        const loadingText = loadingOverlay.querySelector('.loading-text');
        const loadingSubtext = loadingOverlay.querySelector('.loading-subtext');
        const spinner = loadingOverlay.querySelector('.spinner');

        if (spinner) spinner.style.display = 'none'; 
        if (loadingText) loadingText.textContent = 'Authentication Required';
        
        let buttonHTML = `<button id="go-to-login-btn" class="cta-button" style="margin-top: 1rem; background-color: var(--error-red); color: var(--white);">Go to Login</button>`;
        if (loadingSubtext) {
            loadingSubtext.innerHTML = `${message}<br>${buttonHTML}`;
            const goToLoginBtn = loadingSubtext.querySelector('#go-to-login-btn');
            if (goToLoginBtn) {
                goToLoginBtn.onclick = redirectToLogin;
            }
        } else if (loadingText) { 
            loadingText.innerHTML += `<br>${message}<br>${buttonHTML}`;
            const goToLoginBtn = loadingText.querySelector('#go-to-login-btn');
            if (goToLoginBtn) {
                goToLoginBtn.onclick = redirectToLogin;
            }
        }
        loadingOverlay.classList.remove('hidden'); 
    } else {
        alert(message + " Please click OK to go to the login page.");
        redirectToLogin();
    }
}

async function initApplication() {
  // Ensure recordings list is initialized after successful auth
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
