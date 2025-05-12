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
    
    // Initialize components with data from API
    initNavigation();
    initDashboard(teacherData);
    initRecordings(teacherData.recordings);
    initScheduler(teacherData.classes);
    initPapers(teacherData.papers);

  } catch (error) {
    console.error('Authentication failed:', error);
    window.location.href = '/login.html';
    return;
  } finally {
    // Hide loading overlay
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.remove(), 500);
    }, 300);
  }
});