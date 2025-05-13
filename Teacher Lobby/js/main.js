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
    
    // Set user name in header
    document.querySelector('.user-name').textContent = 'Teacher';
    document.querySelector('.avatar').textContent = 'T';
    
    // Initialize components with data from API
    initNavigation();
    initDashboard(teacherData);
    initRecordings(teacherData.recordings);
    initScheduler(teacherData.classes);
    initPapers(teacherData.papers);

  } catch (error) {
    console.error('Error initializing application:', error);
  } finally {
    // Hide loading overlay
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.remove(), 500);
    }, 300);
  }
});