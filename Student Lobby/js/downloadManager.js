const FILE_API_URL = 'http://127.0.0.1:10209/File/';

const downloadModal = document.getElementById('download-modal');
const closeModalButton = document.querySelector('.close-modal');
const downloadFilename = document.getElementById('download-filename');
const downloadProgress = document.getElementById('download-progress');
const downloadStatus = document.getElementById('download-status');

function initDownloadManager() {
  closeModalButton.addEventListener('click', hideModal);
  
  window.addEventListener('click', (e) => {
    if (e.target === downloadModal) {
      hideModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && downloadModal.classList.contains('show')) {
      hideModal();
    }
  });
}

/**
 * @param {Object} recording 
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
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error downloading file: ${response.status}`);
    }
    
    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;
    
    const reader = response.body.getReader();
    
    const chunks = [];
    let receivedLength = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      chunks.push(value);
      receivedLength += value.length;
      
    
      if (total) {
        loaded += value.length;
        const percent = Math.round((loaded / total) * 100);
        updateProgress(percent);
      } else {
        updateProgress(-1);
      }
    }
    
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }
    
    const blob = new Blob([chunksAll], { type: 'video/mp4' });
    
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = recording.filename;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    updateProgress(100);
    showSuccess('Download complete! The recording should begin downloading automatically.');
    
    setTimeout(() => {
      hideModal();
    }, 3000);
    
  } catch (error) {
    console.error('Download error:', error);
    showError('Failed to download the recording. Please try again later.');
  }
}


function showModal() {
  downloadModal.classList.add('show');
}


function hideModal() {
  downloadModal.classList.remove('show');
}

function resetModalState() {
  downloadProgress.style.width = '0%';
  downloadStatus.className = 'status-message';
  downloadStatus.textContent = '';
  downloadStatus.classList.add('hidden');
}

/**
 * @param {number} percent 
 */
function updateProgress(percent) {
  if (percent < 0) {
    downloadProgress.style.width = '100%';
    downloadProgress.style.animation = 'indeterminate 1.5s infinite linear';
  } else {
    downloadProgress.style.animation = 'none';
    downloadProgress.style.width = `${percent}%`;
  }
}

/**
 * @param {string} message 
 */
function showSuccess(message) {
  downloadStatus.classList.remove('hidden', 'error');
  downloadStatus.classList.add('success');
  downloadStatus.textContent = message;
}

/**
 * @param {string} message 
 */
function showError(message) {
  downloadStatus.classList.remove('hidden', 'success');
  downloadStatus.classList.add('error');
  downloadStatus.textContent = message;
}


export async function downloadPaper(paper) {
  if (!paper || !paper.link) { // Assuming paper object has a 'link' and 'name'
    showError('Invalid paper data. Please try again.');
    return;
  }
  
  // For Google Drive links or direct links, just open them.
  // If files were served from backend and need special handling, logic would be similar to downloadRecording.
  if (paper.link.startsWith('http')) {
    window.open(paper.link, '_blank');
    // Optionally show a simpler modal message
    showModal();
    resetModalState();
    downloadFilename.textContent = paper.name || 'Document';
    updateProgress(100); // Simulate completion for direct links
    showSuccess('Your download should start in a new tab.');
    setTimeout(() => {
      hideModal();
    }, 3000);
  } else {
    showError('Download link is not valid.');
  }
}


document.addEventListener('DOMContentLoaded', initDownloadManager);

export default {
  downloadRecording,
  downloadPaper, // Export new function
  initDownloadManager
};
