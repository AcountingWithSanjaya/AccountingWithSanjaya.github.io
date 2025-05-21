// Top-level log to confirm file execution (check native browser console)
console.log('[Main] main.js file parsing started.');

import { initNavigation } from './components/navigation.js';
import { initRecordings } from './components/recordings.js';
import { initScheduler } from './components/scheduler.js';
import { initPapers } from './components/papers.js';
import { initDashboard } from './components/dashboard.js';
import { checkTeacherAuth, loadTeacherData, API_BASE_URL } from './components/api/config.js'; // Import API_BASE_URL

// Log after all imports are processed (check native browser console)
console.log('[Main] All modules imported successfully.');

(async () => {
  // Log inside IIFE before setTimeout (check native browser console)
  console.log('[Main] IIFE entered, scheduling main logic.');

  // Wrap in setTimeout to delay execution slightly, allowing Eruda to initialize
  setTimeout(async () => {
    // Very first log inside setTimeout callback - increased delay for testing
    console.log('[Main] setTimeout callback (100ms delay) executing. Attempting initialization.');
    const loadingOverlay = document.getElementById('loading-overlay');
    let initializationErrorOccurred = false; // Flag to track if an error occurred
    
    try {
      // This log should now be the one to look for in Eruda after the "[Main] setTimeout callback..."
      console.log('[Main] Inside setTimeout try block, checking teacher authentication...');
    // Check if user is authenticated teacher
    await checkTeacherAuth();
    console.log('[Main] Teacher authentication successful.');
    
    console.log('[Main] Loading teacher data...');
    // Load teacher data
    const teacherData = await loadTeacherData();
    console.log('[Main] Teacher data loaded:', teacherData);
    
    // Set user name in header - ideally, backend `loadTeacherData` would return teacher's name
    const userEmail = localStorage.getItem('userEmail');
    document.querySelector('.user-name').textContent = userEmail ? userEmail.split('@')[0] : 'Teacher'; // Display part of email or "Teacher"
    document.querySelector('.avatar').textContent = userEmail ? userEmail.charAt(0).toUpperCase() : 'T';
    
    // Initialize components with data from API
    console.log('[Main] Initializing navigation...');
    initNavigation(); // This initializes navigation links, including potential logout listeners if added there
    console.log('[Main] Initializing dashboard...');
    initDashboard(teacherData); // Expects teacherData.stats, .recordings, .classes.upcoming
    console.log('[Main] Initializing recordings component...');
    initRecordings(teacherData.recordings, teacherData.courses); // Pass courses for the dropdown in modal
    console.log('[Main] Initializing scheduler component...');
    initScheduler(teacherData.classes, teacherData.courses, teacherData.lessonTypes); // Pass courses and lesson types
    console.log('[Main] Initializing papers component...');
    initPapers(teacherData.papers, teacherData.courses); // Pass courses for the dropdown

    // Setup Logout Button for Teacher Panel
    const teacherLogoutBtn = document.getElementById('teacher-logout-btn');
    if (teacherLogoutBtn) {
      console.log('[Main] Logout button found, adding event listener.');
      teacherLogoutBtn.addEventListener('click', async () => {
        console.log('[Main] Teacher logout button clicked.');
        const userEmailForLogout = localStorage.getItem('userEmail');
        const authTokenForLogout = localStorage.getItem('authToken');

        if (!userEmailForLogout || !authTokenForLogout) {
          // Show some form of notification if possible, or just proceed
          console.warn('[Main] Auth details missing for logout, clearing local session.');
          clearTeacherLocalStorageAndRedirect();
          return;
        }

        try {
          console.log('[Main] Sending logout request to server...');
          const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Standard headers for JSON
            body: JSON.stringify({
              email: userEmailForLogout,
              token: authTokenForLogout
            })
          });
          // const result = await response.json(); // Optional: check result.message

          if (response.ok) {
            console.log('[Main] Teacher logout successful on server.');
          } else {
            console.warn('[Main] Teacher logout failed on server, clearing local session anyway.');
          }
        } catch (error) {
          console.error('[Main] Error during teacher logout:', error);
        } finally {
          console.log('[Main] Clearing local storage and redirecting after logout attempt.');
          clearTeacherLocalStorageAndRedirect();
        }
      });
    }
    console.log('[Main] All components initialized successfully.');

  } catch (error) {
    initializationErrorOccurred = true; // Set the flag
    console.error('[Main] Error initializing application:', error);

    // Check if the error is an authentication error that requires redirection
    if (error.message.includes("Authentication failed") || 
        error.message.includes("Authentication details not found") ||
        error.message.includes("Invalid or expired token") ||
        error.message.includes("User is not authorized as a teacher")) {
      console.warn('[Main] Authentication error detected, redirecting to login:', error.message);
      clearTeacherLocalStorageAndRedirect(); // This function handles redirection
      // No need to show error on overlay if redirecting immediately
      return; // Exit early as we are redirecting
    }
    
    // For other errors, update existing loading overlay text with error message
    const errorLoadingText = loadingOverlay.querySelector('.loading-text');
    const errorLoadingSubtext = loadingOverlay.querySelector('.loading-subtext');

    if (errorLoadingText) {
      errorLoadingText.textContent = "Error Initializing Application";
      errorLoadingText.style.color = "var(--color-error)"; // Use CSS variable for error color
    }
    if (errorLoadingSubtext) {
      errorLoadingSubtext.textContent = `${error.message} Please try again or contact support.`;
    }
    // Ensure the overlay (with the error message) is visible
    if (loadingOverlay) loadingOverlay.classList.remove('hidden'); 
    // Do not return; let finally handle the overlay based on the flag
  } finally {
    // Hide loading overlay only if no error occurred AND we are not redirecting
    // If an auth error occurred and we returned early, this part might not be strictly necessary
    // for the overlay, but it's good for cleanup if other non-redirecting errors happen.
    if (!initializationErrorOccurred) {
      setTimeout(() => {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        // Remove the overlay after it's hidden, to clean up the DOM
        setTimeout(() => {
            if (loadingOverlay && loadingOverlay.parentNode) { // Check if it's still in DOM
                loadingOverlay.remove();
            }
        }, 500);
      }, 300); // Small delay to ensure content is loaded before hiding
      }
    }
  }, 100); // Increased to 100ms timeout pushes execution to after current call stack (for testing)
})();

function clearTeacherLocalStorageAndRedirect() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('username'); // If teacher panel uses it
  // Add any other relevant keys used by the teacher panel
  window.location.href = '../Login and Register/Login.html'; // Redirect to main login
}
