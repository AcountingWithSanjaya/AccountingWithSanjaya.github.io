import { uploadRecording as apiUploadRecording } from '../api/config.js';

/**
 * Recordings component
 * Handles the display and interaction with class recordings
 */
export function initRecordings(recordings, coursesData) { // Added coursesData
  // Get DOM elements
  const recordingsGrid = document.querySelector('.recordings-grid'); // This is for the main recordings page, not dashboard
  const dashboardRecordingsGrid = document.querySelector('#dashboard-page .recordings-grid'); // Grid on dashboard

  const courseFilter = document.getElementById('course-filter'); // Main page filter
  const dateFilter = document.getElementById('date-filter');
  const statusFilter = document.getElementById('status-filter');
  const filterButton = document.querySelector('.filters-card .cta-button');
  const uploadModal = document.getElementById('upload-recording-modal');
  const closeModalBtn = document.getElementById('close-upload-modal');
  const uploadForm = document.getElementById('recording-upload-form');
  const recordingTitleInput = document.getElementById('recording-title');
  const recordingCourseSelect = document.getElementById('recording-course'); // Select for course in modal
  const recordingDateInput = document.getElementById('recording-date');
  const fileInput = document.getElementById('recording-file-input');
  const selectedFileDisplay = document.getElementById('selected-recording-file'); // Corrected variable name
  const progressContainer = document.getElementById('recording-progress-container');
  const progressBar = document.getElementById('recording-progress-bar');
  const progressText = document.getElementById('recording-progress-text');
  const successMessage = document.getElementById('recording-success-message');
  const errorMessage = document.getElementById('recording-error-message');
  
  // Render all recordings
  const renderRecordings = (recordingsData) => {
    // Clear existing recordings
    recordingsGrid.innerHTML = '';
    
    if (recordingsData.length === 0) {
      recordingsGrid.innerHTML = `
        <div class="no-recordings">
          <p>No recordings found matching your filters.</p>
        </div>
      `;
      return;
    }
    
    // Create a card for each recording
    recordingsData.forEach(recording => {
      // Format date
      const formattedDate = new Date(recording.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Format time from duration (e.g., "01:30:00" to "1 hr 30 min")
      const durationParts = recording.duration.split(':');
      const hours = parseInt(durationParts[0]);
      const minutes = parseInt(durationParts[1]);
      const formattedDuration = `${hours > 0 ? hours + ' hr' : ''} ${minutes > 0 ? minutes + ' min' : ''}`.trim();
      
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
          <div class="recording-detail">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${formattedDuration}</span>
          </div>
          <div class="recording-detail">
            <span class="detail-label">Students:</span>
            <span class="detail-value">${recording.studentsAttended}</span>
          </div>
          <div class="recording-detail">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${recording.status === 'pending' ? 'Pending Upload' : 'Uploaded'}</span>
          </div>
        </div>
        <button class="upload-button" data-id="${recording.id}">
          <i class="fas fa-cloud-upload-alt"></i> Upload Recording
        </button>
      `;
      
      recordingsGrid.appendChild(card);
    });
    
    // Add click event listeners to upload buttons
    document.querySelectorAll('.upload-button').forEach(button => {
      button.addEventListener('click', () => {
        openUploadModal(button.getAttribute('data-id'));
      });
    });
  };
  
  // Apply filters to recordings
  const applyFilters = () => {
    const selectedCourse = courseFilter.value;
    const selectedDate = dateFilter.value;
    const selectedStatus = statusFilter.value;
    
    let filteredRecordings = [...recordings];
    
    // Apply course filter
    if (selectedCourse !== 'all') {
      filteredRecordings = filteredRecordings.filter(recording => recording.course.includes(selectedCourse));
    }
    
    // Apply date filter
    if (selectedDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      
      filteredRecordings = filteredRecordings.filter(recording => {
        const recordingDate = new Date(recording.date);
        recordingDate.setHours(0, 0, 0, 0);
        
        if (selectedDate === 'today') {
          return recordingDate.getTime() === today.getTime();
        } else if (selectedDate === 'week') {
          return recordingDate >= weekAgo && recordingDate <= today;
        } else if (selectedDate === 'month') {
          return recordingDate >= monthAgo && recordingDate <= today;
        }
        return true;
      });
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filteredRecordings = filteredRecordings.filter(recording => recording.status === selectedStatus);
    }
    
    renderRecordings(filteredRecordings);
  };
  
  // Open the upload modal
  const openUploadModal = (recordingId) => {
    // Find the recording by ID
    const recording = recordings.find(rec => rec.id === recordingId);
    
    if (recording) {
      // Reset the form
      uploadForm.reset();
      selectedFile.classList.add('hidden');
      progressContainer.classList.add('hidden');
      successMessage.classList.add('hidden');
      errorMessage.classList.add('hidden');
      
      // Pre-fill form fields with recording data
      recordingTitleInput.value = recording.title;
      recordingDateInput.value = recording.date;
      
      // Populate and select course in modal
      if (recordingCourseSelect && coursesData) {
        recordingCourseSelect.innerHTML = '<option value="">Select a course</option>';
        let courseFound = false;
        coursesData.forEach(course => {
          const option = document.createElement('option');
          option.value = course.id; // Assuming course.id
          option.textContent = course.name;
          if (course.name === recording.course) { // Match by name if that's what recording.course stores
            option.selected = true;
            courseFound = true;
          }
          recordingCourseSelect.appendChild(option);
        });
        // If course wasn't in the list, maybe add it or handle as 'other'
        if (!courseFound && recording.course) {
            const option = document.createElement('option');
            option.value = recording.course; // Or some placeholder value
            option.textContent = recording.course;
            option.selected = true;
            recordingCourseSelect.appendChild(option);
        }
      }
      
      // Store recording ID in the form or modal for submission
      uploadForm.dataset.recordingId = recordingId;

      // Show the modal
      uploadModal.classList.add('show');
    }
  };
  
  // Close the upload modal
  const closeUploadModal = () => {
    uploadModal.classList.remove('show');
  };
  
  // Simulate upload progress
  const simulateUpload = () => {
    let progress = 0;
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 100) progress = 100;
      
      progressBar.style.width = `${progress}%`;
      progressText.textContent = `${Math.round(progress)}%`;
      
      if (progress === 100) {
        clearInterval(interval);
        // Show success message after a short delay
        setTimeout(() => {
          successMessage.classList.remove('hidden');
          // Close modal after showing success
          setTimeout(() => {
            closeUploadModal();
            
            // Update recording status to 'uploaded'
            recordings.forEach(rec => {
              if (rec.id === 'rec1') {
                rec.status = 'uploaded';
              }
            });
            
            // Re-render recordings
            applyFilters();
          }, 2000);
        }, 500);
      }
    }, 200);
  };
  
  // Event listeners
  filterButton.addEventListener('click', applyFilters);
  closeModalBtn.addEventListener('click', closeUploadModal);
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      selectedFile.textContent = `Selected file: ${e.target.files[0].name}`;
      selectedFile.classList.remove('hidden');
    } else {
      selectedFile.classList.add('hidden');
    }
  });
  
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Check if a file is selected
    if (fileInput.files.length === 0) {
      alert('Please select a recording file to upload.');
      return;
    }
    
    // Simulate upload
    simulateUpload();
  });
  
  // Initial render
  renderRecordings(recordings);
}
