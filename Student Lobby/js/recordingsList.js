const RECORDINGS_API_URL = 'http://helya.pylex.xyz:10209/loadrecordings'; // Backend endpoint

let allRecordings = [];
let filteredRecordings = [];
const recordingsContainer = document.getElementById('recordings-container');
const loadingSpinner = document.getElementById('loading-spinner');
const noResultsElement = document.getElementById('no-recordings');
const errorMessageElement = document.getElementById('error-message');
const subjectFilter = document.getElementById('subject-filter');
const dateFilter = document.getElementById('date-filter');
const applyFiltersButton = document.getElementById('apply-filters');

/**
 * @returns {Promise<Array>} 
 */
export async function fetchRecordings() {
  try {
    showLoading(true);
    const response = await fetch(RECORDINGS_API_URL);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recordings:', error);
    showError(true);
    return [];
  } finally {
    showLoading(false);
  }
}

export async function initRecordingsList() {
  allRecordings = await fetchRecordings();
  filteredRecordings = [...allRecordings];
  
  if (allRecordings.length > 0) {
    populateFilters(allRecordings);
    renderRecordings(allRecordings);
  }
  
  applyFiltersButton.addEventListener('click', handleFilterApply);
}

/**
 * @param {Array} recordings
 */
function populateFilters(recordings) {
  const subjects = [...new Set(recordings.map(recording => recording.subject))].sort();
  const dates = [...new Set(recordings.map(recording => recording.date))].sort((a, b) => new Date(b) - new Date(a));
  
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    subjectFilter.appendChild(option);
  });
  
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = new Date(date).toLocaleDateString();
    dateFilter.appendChild(option);
  });
}

function handleFilterApply() {
  const selectedSubject = subjectFilter.value;
  const selectedDate = dateFilter.value;
  
  filteredRecordings = allRecordings.filter(recording => {
    const subjectMatch = selectedSubject === 'all' || recording.subject === selectedSubject;
    const dateMatch = selectedDate === 'all' || recording.date === selectedDate;
    return subjectMatch && dateMatch;
  });
  
  renderRecordings(filteredRecordings);
}

/**
 * @param {Array} recordings
 */
function renderRecordings(recordings) {
  recordingsContainer.innerHTML = '';
  
  if (recordings.length === 0) {
    noResultsElement.classList.remove('hidden');
    return;
  }
  
  noResultsElement.classList.add('hidden');
  
  recordings.forEach(recording => {
    const recordingCard = createRecordingCard(recording);
    recordingsContainer.appendChild(recordingCard);
  });
}

/**
 * @param {Object} recording
 * @returns {HTMLElement} 
 */
function createRecordingCard(recording) {
  const card = document.createElement('div');
  card.className = 'recording-card';
  
  const title = document.createElement('h3');
  title.textContent = recording.title || 'Untitled Recording';
  
  const infoDiv = document.createElement('div');
  infoDiv.className = 'recording-info';

  const subjectDetail = document.createElement('div');
  subjectDetail.className = 'recording-detail';
  
  const subjectLabel = document.createElement('span');
  subjectLabel.className = 'detail-label';
  subjectLabel.textContent = 'Subject:';
  
  const subjectValue = document.createElement('span');
  subjectValue.className = 'detail-value';
  subjectValue.textContent = recording.subject || 'N/A';
  
  subjectDetail.appendChild(subjectLabel);
  subjectDetail.appendChild(subjectValue);
  
  const dateDetail = document.createElement('div');
  dateDetail.className = 'recording-detail';
  
  const dateLabel = document.createElement('span');
  dateLabel.className = 'detail-label';
  dateLabel.textContent = 'Date:';
  
  const dateValue = document.createElement('span');
  dateValue.className = 'detail-value';
  dateValue.textContent = recording.date ? new Date(recording.date).toLocaleDateString() : 'N/A';
  
  dateDetail.appendChild(dateLabel);
  dateDetail.appendChild(dateValue);
  
  if (recording.duration) {
    const durationDetail = document.createElement('div');
    durationDetail.className = 'recording-detail';
    
    const durationLabel = document.createElement('span');
    durationLabel.className = 'detail-label';
    durationLabel.textContent = 'Duration:';
    
    const durationValue = document.createElement('span');
    durationValue.className = 'detail-value';
    durationValue.textContent = recording.duration;
    
    durationDetail.appendChild(durationLabel);
    durationDetail.appendChild(durationValue);
    infoDiv.appendChild(durationDetail);
  }
  
  const downloadButton = document.createElement('button');
  downloadButton.className = 'download-button';
  downloadButton.textContent = 'Download Recording';
  downloadButton.addEventListener('click', () => {
    // For Google Drive links, a direct link is usually enough.
    if (recording.link) {
        window.open(recording.link, '_blank');
    } else {
        // Fallback to downloadManager if it's intended for specific file types or backend-served files
        import('./downloadManager.js').then(module => {
            module.downloadRecording(recording); // downloadManager needs to handle this
        }).catch(err => console.error("Failed to load download manager", err));
    }
  });
  
  infoDiv.appendChild(subjectDetail);
  infoDiv.appendChild(dateDetail);
  
  card.appendChild(title);
  card.appendChild(infoDiv);
  card.appendChild(downloadButton);
  
  return card;
}

/**
 * @param {boolean} show 
 */
function showLoading(show) {
  if (show) {
    loadingSpinner.classList.remove('hidden');
    noResultsElement.classList.add('hidden');
    errorMessageElement.classList.add('hidden');
  } else {
    loadingSpinner.classList.add('hidden');
  }
}

/**
 * @param {boolean} show 
 */
function showError(show) {
  errorMessageElement.classList.toggle('hidden', !show);
}

/**
 * @returns {Array} 
 */
export function getAllRecordings() {
  return allRecordings;
}

/**
 * @returns {Array} 
 */
export function getFilteredRecordings() {
  return filteredRecordings;
}
