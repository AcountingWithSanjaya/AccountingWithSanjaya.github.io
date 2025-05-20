export function initDashboard(data) {
  console.log('[Dashboard] Initializing with data:', data);
  // DOM elements
  const dashboardRecordingsGrid = document.querySelector('.dashboard-grid');
  const upcomingClassesContainer = document.querySelector('.upcoming-classes-container');
  
  // Initialize dashboard
  const init = () => {
    updateDashboardStats(data.stats);
    renderDashboardRecordings(data.recordings);
    renderUpcomingClasses(data.classes.upcoming);
  };
  
  // Update dashboard statistics
  const updateDashboardStats = (stats) => {
    console.log('[Dashboard] Updating dashboard stats with data:', stats);
    if (!stats) {
      console.warn('[Dashboard] Stats data is undefined or null. Cannot update stats.');
      document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = 'N/A';
      document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = 'N/A';
      document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = 'N/A';
      document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = 'N/A';
      return;
    }
    document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = stats.pendingRecordings !== undefined ? stats.pendingRecordings : 'N/A';
    document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = stats.upcomingClasses !== undefined ? stats.upcomingClasses : 'N/A';
    document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = stats.papersToGrade !== undefined ? stats.papersToGrade : 'N/A';
    document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = stats.totalStudents !== undefined ? stats.totalStudents : 'N/A';
    console.log('[Dashboard] Dashboard stats UI updated.');
  };
  
  // Render recordings section
  const renderDashboardRecordings = (recordings) => {
    console.log('[Dashboard] Attempting to render dashboard recordings. Total recordings received:', recordings ? recordings.length : 'N/A');
    if (!dashboardRecordingsGrid) {
        console.error('[Dashboard] dashboardRecordingsGrid element not found.');
        return;
    }
    dashboardRecordingsGrid.innerHTML = '';

    if (!recordings || !Array.isArray(recordings)) {
        console.warn('[Dashboard] Recordings data is invalid or not an array. Displaying no recordings message.');
        dashboardRecordingsGrid.innerHTML = `<div class="no-recordings"><p>No recordings data available.</p></div>`;
        return;
    }
    
    const pendingRecordings = recordings
      .filter(recording => recording.status === 'pending')
      .slice(0, 3);
    
    if (pendingRecordings.length === 0) {
      console.log('[Dashboard] No pending recordings to display on dashboard.');
      dashboardRecordingsGrid.innerHTML = `
        <div class="no-recordings">
          <p>No pending recordings.</p>
        </div>
      `;
      return;
    }
    
    console.log(`[Dashboard] Rendering ${pendingRecordings.length} pending recording(s) on dashboard.`);
    pendingRecordings.forEach(recording => {
      const formattedDate = new Date(recording.date).toLocaleDateString();
      console.log(`[Dashboard] Creating card for recording: ${recording.title}, Date: ${formattedDate}`);
      const card = document.createElement('div');
      card.className = 'recording-card';
      card.innerHTML = `
        <h3>${recording.title}</h3>
        <div class="recording-info">
          <div class="recording-detail">
            <span class="detail-label">Course:</span>
            <span class="detail-value">${recording.course}</span>
          </div>
          <div class="recording-detail">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
        </div>
        <button class="upload-button" data-id="${recording.id}">
          <i class="fas fa-cloud-upload-alt"></i> Upload Recording
        </button>
      `;
      
      dashboardRecordingsGrid.appendChild(card);
    });
  };
  
  // Render upcoming classes
  const renderUpcomingClasses = (classes) => {
    console.log('[Dashboard] Attempting to render upcoming classes. Total classes received:', classes ? classes.length : 'N/A');
    if (!upcomingClassesContainer) {
        console.error('[Dashboard] upcomingClassesContainer element not found.');
        return;
    }
    upcomingClassesContainer.innerHTML = '';

    if (!classes || !Array.isArray(classes)) {
        console.warn('[Dashboard] Upcoming classes data is invalid or not an array. Displaying no classes message.');
        upcomingClassesContainer.innerHTML = `<div class="no-classes"><p>No upcoming classes data available.</p></div>`;
        return;
    }
    
    const upcomingClasses = classes.slice(0, 3); // Show top 3
    
    if (upcomingClasses.length === 0) {
      console.log('[Dashboard] No upcoming classes to display on dashboard.');
      upcomingClassesContainer.innerHTML = `
        <div class="no-classes">
          <p>No upcoming classes scheduled.</p>
        </div>
      `;
      return;
    }
    
    console.log(`[Dashboard] Rendering ${upcomingClasses.length} upcoming class(es) on dashboard.`);
    upcomingClasses.forEach(cls => {
      const classDate = new Date(cls.date);
      console.log(`[Dashboard] Creating card for class: ${cls.title}, Date: ${classDate.toLocaleDateString()}`);
      const card = document.createElement('div');
      card.className = 'upcoming-class-card';
      card.innerHTML = `
        <div class="upcoming-class-date">
          <div class="upcoming-class-month">${classDate.toLocaleString('default', { month: 'short' })}</div>
          <div class="upcoming-class-day">${classDate.getDate()}</div>
        </div>
        <div class="upcoming-class-content">
          <h3 class="upcoming-class-title">${cls.title}</h3>
          <div class="upcoming-class-details">
            <div class="upcoming-class-detail">
              <i class="fas fa-book"></i>
              <span>${cls.course}</span>
            </div>
          </div>
        </div>
      `;
      
      upcomingClassesContainer.appendChild(card);
    });
  };
  
  // Initialize
  init();
}
