/**
 * Module for fetching and displaying class recordings
 */

// API endpoint for loading recordings
const RECORDINGS_API_URL = 'http://deka.pylex.software:11219/loadrecordings';

// Store for recordings data
let allRecordings = [];
let filteredRecordings = [];

// DOM elements
const recordingsContainer = document.getElementById('recordings-container');
const loadingSpinner = document.getElementById('loading-spinner');
const noResultsElement = document.getElementById('no-recordings');
const errorMessageElement = document.getElementById('error-message');
const subjectFilter = document.getElementById('subject-filter');
const dateFilter = document.getElementById('date-filter');
const applyFiltersButton = document.getElementById('apply-filters');

/**
 * Fetch recordings from the API
 * @returns {Promise<Array>} Recordings data
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

/**
 * Initialize the recordings list and filters
 */
export async function initRecordingsList() {
  // Fetch recordings and populate the UI
  allRecordings = await fetchRecordings();
  filteredRecordings = [...allRecordings];
  
  if (allRecordings.length > 0) {
    populateFilters(allRecordings);
    renderRecordings(allRecordings);
  }
  
  // Set up event listeners
  applyFiltersButton.addEventListener('click', handleFilterApply);
}

/**
 * Populate filter dropdowns with available options
 * @param {Array} recordings Recordings data
 */
function populateFilters(recordings) {
  // Extract unique subjects and dates
  const subjects = [...new Set(recordings.map(recording => recording.subject))].sort();
  const dates = [...new Set(recordings.map(recording => recording.date))].sort((a, b) => new Date(b) - new Date(a));
  
  // Populate subject filter
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    subjectFilter.appendChild(option);
  });
  
  // Populate date filter
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = new Date(date).toLocaleDateString();
    dateFilter.appendChild(option);
  });
}

/**
 * Apply filters to the recordings list
 */
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
 * Render recordings to the UI
 * @param {Array} recordings Recordings to render
 */
function renderRecordings(recordings) {
  // Clear the container first
  recordingsContainer.innerHTML = '';
  
  if (recordings.length === 0) {
    noResultsElement.classList.remove('hidden');
    return;
  }
  
  noResultsElement.classList.add('hidden');
  
  // Create a card for each recording
  recordings.forEach(recording => {
    const recordingCard = createRecordingCard(recording);
    recordingsContainer.appendChild(recordingCard);
  });
}

/**
 * Create a recording card element
 * @param {Object} recording Recording data
 * @returns {HTMLElement} Recording card element
 */
function createRecordingCard(recording) {
  const card = document.createElement('div');
  card.className = 'recording-card';
  
  const title = document.createElement('h3');
  title.textContent = recording.title || 'Untitled Recording';
  
  const infoDiv = document.createElement('div');
  infoDiv.className = 'recording-info';
  
  // Create subject detail
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
  
  // Create date detail
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
  
  // Add duration detail if available
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
  
  // Create download button
  const downloadButton = document.createElement('button');
  downloadButton.className = 'download-button';
  downloadButton.textContent = 'Download Recording';
  downloadButton.addEventListener('click', () => {
    // Import downloadManager dynamically to avoid circular dependencies
    import('./downloadManager.js').then(module => {
      module.downloadRecording(recording);
    });
  });
  
  // Add info to the card
  infoDiv.appendChild(subjectDetail);
  infoDiv.appendChild(dateDetail);
  
  // Assemble the card
  card.appendChild(title);
  card.appendChild(infoDiv);
  card.appendChild(downloadButton);
  
  return card;
}

/**
 * Show or hide loading spinner
 * @param {boolean} show Whether to show loading spinner
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
 * Show or hide error message
 * @param {boolean} show Whether to show error message
 */
function showError(show) {
  errorMessageElement.classList.toggle('hidden', !show);
}

/**
 * Get all recordings data
 * @returns {Array} All recordings
 */
export function getAllRecordings() {
  return allRecordings;
}

/**
 * Get filtered recordings data
 * @returns {Array} Filtered recordings
 */
export function getFilteredRecordings() {
  return filteredRecordings;
}