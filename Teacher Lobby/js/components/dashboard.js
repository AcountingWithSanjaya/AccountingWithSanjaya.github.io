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
    console.log('[Dashboard] Updating stats:', stats);
    document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = stats.pendingRecordings;
    document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = stats.upcomingClasses;
    document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = stats.papersToGrade;
    document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = stats.totalStudents;
  };
  
  // Render recordings section
  const renderDashboardRecordings = (recordings) => {
    console.log('[Dashboard] Rendering dashboard recordings. Total recordings received:', recordings.length);
    dashboardRecordingsGrid.innerHTML = '';
    
    const pendingRecordings = recordings
      .filter(recording => recording.status === 'pending')
      .slice(0, 3);
    
    if (pendingRecordings.length === 0) {
      dashboardRecordingsGrid.innerHTML = `
        <div class="no-recordings">
          <p>No pending recordings.</p>
        </div>
      `;
      return;
    }
    
    pendingRecordings.forEach(recording => {
      const formattedDate = new Date(recording.date).toLocaleDateString();
      
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
    console.log('[Dashboard] Rendering upcoming classes. Total classes received:', classes.length);
    upcomingClassesContainer.innerHTML = '';
    
    const upcomingClasses = classes.slice(0, 3);
    
    if (upcomingClasses.length === 0) {
      upcomingClassesContainer.innerHTML = `
        <div class="no-classes">
          <p>No upcoming classes scheduled.</p>
        </div>
      `;
      return;
    }
    
    upcomingClasses.forEach(cls => {
      const classDate = new Date(cls.date);
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
