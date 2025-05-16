import { uploadRecording as apiUploadRecording } from '../api/config.js';

/**
 * Recordings component
 * Handles the display and interaction with class recordings
 */
export function initRecordings(recordings, coursesData) { // Added coursesData
  console.log('[Recordings] Initializing with recordings:', recordings, 'and coursesData:', coursesData);
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
    console.log('[Recordings] Rendering recordings. Count:', recordingsData.length);
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
      console.log('[Recordings] Creating card for recording:', recording.title);
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
    console.log('[Recordings] Applying filters. Course:', selectedCourse, 'Date:', selectedDate, 'Status:', selectedStatus);
    
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
    console.log('[Recordings] Opening upload modal for recording ID:', recordingId);
    // Find the recording by ID
    const recording = recordings.find(rec => rec.id === recordingId);
    
    if (recording) {
      console.log('[Recordings] Found recording for modal:', recording);
      // Reset the form
      uploadForm.reset();
      selectedFileDisplay.classList.add('hidden'); // Use selectedFileDisplay
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
    } else {
      console.warn('[Recordings] Recording not found for ID:', recordingId);
    }
  };
  
  // Close the upload modal
  const closeUploadModal = () => {
    console.log('[Recordings] Closing upload modal.');
    uploadModal.classList.remove('show');
  };
  
  // Actual upload function
  const handleRecordingUpload = async (recordingId, fileToUpload, metadata) => {
    console.log('[Recordings] Handling recording upload. ID:', recordingId, 'File:', fileToUpload.name, 'Metadata:', metadata);
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%'; // Reset progress bar
    progressText.textContent = '0%';
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');

    // For real progress, you'd use XHR events or fetch with ReadableStream
    // Here, we'll just show an indeterminate progress then success/failure
    progressBar.style.width = '50%'; // Simulate some progress
    progressText.textContent = 'Uploading...';

    try {
      const result = await apiUploadRecording(recordingId, fileToUpload, metadata); // Call API
      console.log('[Recordings] Upload API call successful. Result:', result);
      
      progressBar.style.width = '100%';
      progressText.textContent = '100%';
      successMessage.textContent = result.message || 'Recording uploaded successfully!';
      successMessage.classList.remove('hidden');

      // Update the local recordings data
      // It's crucial that 'recordings' here is the same array instance used by other functions.
      const recordingIndex = recordings.findIndex(rec => rec.id === recordingId);
      if (recordingIndex !== -1 && result.recording) {
        console.log('[Recordings] Updating local recording data for ID:', recordingId);
        recordings[recordingIndex] = result.recording; // Update with data from backend
      } else if (result.recording) { // If not found, maybe it's a new one (though current logic implies update)
        console.log('[Recordings] Adding new recording to local data:', result.recording);
        recordings.push(result.recording);
      }
      
      applyFilters(); // Re-render the recordings list which uses the 'recordings' array
      
      // Also update recordings on the dashboard if this function is shared/reused
      // This might require passing the dashboard rendering function or a callback
      console.log('[Recordings] Upload complete, closing modal soon.');
      setTimeout(() => {
        closeUploadModal();
      }, 2000);

    } catch (error) {
      console.error('[Recordings] Upload failed:', error);
      progressBar.style.width = '0%'; // Or show error state
      progressText.textContent = 'Error';
      errorMessage.textContent = error.message || 'Failed to upload recording.';
      errorMessage.classList.remove('hidden');
    }
  };

  // Event listeners
  console.log('[Recordings] Setting up event listeners.');
  if (filterButton) filterButton.addEventListener('click', applyFilters);
  
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeUploadModal);
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFileDisplay.textContent = `Selected file: ${e.target.files[0].name}`; // Ensure this is selectedFileDisplay
        selectedFileDisplay.classList.remove('hidden');
      } else {
        selectedFileDisplay.classList.add('hidden');
      }
    });
  }
  
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const recordingId = uploadForm.dataset.recordingId;
      const fileToUpload = fileInput.files[0];

      if (!recordingId) {
        alert('Recording ID is missing. Cannot upload.');
        return;
      }
      if (!fileToUpload) {
        alert('Please select a recording file to upload.');
        return;
      }

      const selectedCourseOption = recordingCourseSelect.options[recordingCourseSelect.selectedIndex];
      
      const metadata = {
        title: recordingTitleInput.value,
        courseName: selectedCourseOption ? selectedCourseOption.text : '', // Course name
        // courseId: selectedCourseOption ? selectedCourseOption.value : '', // Course ID if using IDs
        date: recordingDateInput.value
      };
      
      handleRecordingUpload(recordingId, fileToUpload, metadata);
    });
  }
  
  // Initial render for the main recordings page grid
  if (recordingsGrid) { // Ensure this specific grid exists before rendering to it
      console.log('[Recordings] Performing initial render for main recordings page.');
      renderRecordings(recordings);
  }

  // Populate course filter dropdown on the main recordings page
  if (courseFilter && coursesData) {
    console.log('[Recordings] Populating course filter dropdown.');
    courseFilter.innerHTML = '<option value="all">All Courses</option>';
    coursesData.forEach(course => {
        const option = document.createElement('option');
        option.value = course.name; // Filter by course name
        option.textContent = course.name;
        courseFilter.appendChild(option);
    });
  }
  console.log('[Recordings] Initialization complete.');
}
