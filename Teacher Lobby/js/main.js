import { initNavigation } from './components/navigation.js';
import { initRecordings } from './components/recordings.js';
import { initScheduler } from './components/scheduler.js';
import { initPapers } from './components/papers.js';
import { initDashboard } from './components/dashboard.js';
import { checkTeacherAuth, loadTeacherData } from './api/config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  
  try {
    // Check if user is authenticated teacher
    await checkTeacherAuth();
    
    // Load teacher data
    const teacherData = await loadTeacherData();
    
    // Set user name in header - ideally, backend `loadTeacherData` would return teacher's name
    const userEmail = localStorage.getItem('userEmail');
    document.querySelector('.user-name').textContent = userEmail ? userEmail.split('@')[0] : 'Teacher'; // Display part of email or "Teacher"
    document.querySelector('.avatar').textContent = userEmail ? userEmail.charAt(0).toUpperCase() : 'T';
    
    // Initialize components with data from API
    initNavigation();
    initDashboard(teacherData); // Expects teacherData.stats, .recordings, .classes.upcoming
    initRecordings(teacherData.recordings, teacherData.courses); // Pass courses for the dropdown in modal
    initScheduler(teacherData.classes, teacherData.courses); // Pass courses for the dropdown
    initPapers(teacherData.papers, teacherData.courses); // Pass courses for the dropdown

  } catch (error) {
    console.error('Error initializing application:', error);
    // Display a user-friendly error message on the page
    loadingOverlay.innerHTML = `<div class="loading-content">
                                  <p class="loading-text" style="color: red;">Error Initializing Application</p>
                                  <p class="loading-subtext">${error.message}</p>
                                  <p class="loading-subtext">Please try logging out and logging back in, or contact support.</p>
                               </div>`;
    loadingOverlay.classList.remove('hidden'); // Ensure it's visible
    return; // Stop further execution if init fails
  } finally {
    // Hide loading overlay
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.remove(), 500);
    }, 300);
  }
});
