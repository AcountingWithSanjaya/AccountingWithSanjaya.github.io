/**
 * Module for handling recording downloads
 */

// API endpoint for downloading files
const FILE_API_URL = 'http://deka.pylex.software:11219/File/';

// DOM elements
const downloadModal = document.getElementById('download-modal');
const closeModalButton = document.querySelector('.close-modal');
const downloadFilename = document.getElementById('download-filename');
const downloadProgress = document.getElementById('download-progress');
const downloadStatus = document.getElementById('download-status');

// Initialize event listeners
function initDownloadManager() {
  closeModalButton.addEventListener('click', hideModal);
  
  // Click outside to close
  window.addEventListener('click', (e) => {
    if (e.target === downloadModal) {
      hideModal();
    }
  });
  
  // Escape key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && downloadModal.classList.contains('show')) {
      hideModal();
    }
  });
}

/**
 * Download a recording
 * @param {Object} recording Recording to download
 */
export async function downloadRecording(recording) {
  if (!recording || !recording.filename) {
    showError('Invalid recording data. Please try again.');
    return;
  }
  
  showModal();
  resetModalState();
  downloadFilename.textContent = recording.title || recording.filename;
  
  try {
    const url = `${FILE_API_URL}${encodeURIComponent(recording.filename)}`;
    
    // Fetch file with progress tracking
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error downloading file: ${response.status}`);
    }
    
    // Get content length for progress calculation, if available
    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;
    
    // Create a reader from the response body
    const reader = response.body.getReader();
    
    // Read the data chunks
    const chunks = [];
    let receivedLength = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      chunks.push(value);
      receivedLength += value.length;
      
      // Update progress
      if (total) {
        loaded += value.length;
        const percent = Math.round((loaded / total) * 100);
        updateProgress(percent);
      } else {
        // If content length is unknown, show indefinite progress
        updateProgress(-1);
      }
    }
    
    // Combine chunks into a single Uint8Array
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }
    
    // Convert the Uint8Array to Blob
    const blob = new Blob([chunksAll], { type: 'video/mp4' });
    
    // Create download link
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = recording.filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    // Show success message
    updateProgress(100);
    showSuccess('Download complete! The recording should begin downloading automatically.');
    
    // Close modal after a short delay
    setTimeout(() => {
      hideModal();
    }, 3000);
    
  } catch (error) {
    console.error('Download error:', error);
    showError('Failed to download the recording. Please try again later.');
  }
}

/**
 * Show the download modal
 */
function showModal() {
  downloadModal.classList.add('show');
}

/**
 * Hide the download modal
 */
function hideModal() {
  downloadModal.classList.remove('show');
}

/**
 * Reset modal state
 */
function resetModalState() {
  downloadProgress.style.width = '0%';
  downloadStatus.className = 'status-message';
  downloadStatus.textContent = '';
  downloadStatus.classList.add('hidden');
}

/**
 * Update progress bar
 * @param {number} percent Progress percentage (-1 for indeterminate)
 */
function updateProgress(percent) {
  if (percent < 0) {
    // Indeterminate progress
    downloadProgress.style.width = '100%';
    downloadProgress.style.animation = 'indeterminate 1.5s infinite linear';
  } else {
    downloadProgress.style.animation = 'none';
    downloadProgress.style.width = `${percent}%`;
  }
}

/**
 * Show success message
 * @param {string} message Success message
 */
function showSuccess(message) {
  downloadStatus.classList.remove('hidden', 'error');
  downloadStatus.classList.add('success');
  downloadStatus.textContent = message;
}

/**
 * Show error message
 * @param {string} message Error message
 */
function showError(message) {
  downloadStatus.classList.remove('hidden', 'success');
  downloadStatus.classList.add('error');
  downloadStatus.textContent = message;
}

// Initialize download manager
document.addEventListener('DOMContentLoaded', initDownloadManager);

export default {
  downloadRecording,
  initDownloadManager
};