/**
 * Module for fetching and displaying past papers
 */

// API endpoint for loading papers
const PAPERS_API_URL = 'http://deka.pylex.software:11219/loadpapers';

// Store for papers data
let allPapers = [];
let filteredPapers = [];

// DOM elements
const papersContainer = document.getElementById('papers-container');
const loadingSpinner = document.getElementById('loading-spinner');
const noResultsElement = document.getElementById('no-papers');
const errorMessageElement = document.getElementById('error-message');
const yearFilter = document.getElementById('year-filter');
const gradeFilter = document.getElementById('grade-filter');
const applyFiltersButton = document.getElementById('apply-filters');

/**
 * Fetch papers from the API
 * @returns {Promise<Array>} Papers data
 */
export async function fetchPapers() {
  try {
    showLoading(true);
    const response = await fetch(PAPERS_API_URL);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching papers:', error);
    showError(true);
    return [];
  } finally {
    showLoading(false);
  }
}

/**
 * Initialize the papers list and filters
 */
export async function initPapersList() {
  // Fetch papers and populate the UI
  allPapers = await fetchPapers();
  filteredPapers = [...allPapers];
  
  if (allPapers.length > 0) {
    populateFilters(allPapers);
    renderPapers(allPapers);
  }
  
  // Set up event listeners
  applyFiltersButton.addEventListener('click', handleFilterApply);
}

/**
 * Populate filter dropdowns with available options
 * @param {Array} papers Papers data
 */
function populateFilters(papers) {
  // Extract unique years and grades
  const years = [...new Set(papers.map(paper => paper.year))].sort((a, b) => b - a);
  const grades = [...new Set(papers.map(paper => paper.grade))].sort();
  
  // Populate year filter
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });
  
  // Populate grade filter
  grades.forEach(grade => {
    const option = document.createElement('option');
    option.value = grade;
    option.textContent = grade;
    gradeFilter.appendChild(option);
  });
}

/**
 * Apply filters to the papers list
 */
function handleFilterApply() {
  const selectedYear = yearFilter.value;
  const selectedGrade = gradeFilter.value;
  
  filteredPapers = allPapers.filter(paper => {
    const yearMatch = selectedYear === 'all' || paper.year.toString() === selectedYear;
    const gradeMatch = selectedGrade === 'all' || paper.grade === selectedGrade;
    return yearMatch && gradeMatch;
  });
  
  renderPapers(filteredPapers);
}

/**
 * Render papers to the UI
 * @param {Array} papers Papers to render
 */
function renderPapers(papers) {
  // Clear the container first
  papersContainer.innerHTML = '';
  
  if (papers.length === 0) {
    noResultsElement.classList.remove('hidden');
    return;
  }
  
  noResultsElement.classList.add('hidden');
  
  // Create a card for each paper
  papers.forEach(paper => {
    const paperCard = createPaperCard(paper);
    papersContainer.appendChild(paperCard);
  });
}

/**
 * Create a paper card element
 * @param {Object} paper Paper data
 * @returns {HTMLElement} Paper card element
 */
function createPaperCard(paper) {
  const card = document.createElement('div');
  card.className = 'paper-card';
  
  const title = document.createElement('h3');
  title.textContent = paper.name || 'Untitled Paper';
  
  const infoDiv = document.createElement('div');
  infoDiv.className = 'paper-info';
  
  // Create year detail
  const yearDetail = document.createElement('div');
  yearDetail.className = 'paper-detail';
  
  const yearLabel = document.createElement('span');
  yearLabel.className = 'detail-label';
  yearLabel.textContent = 'Year:';
  
  const yearValue = document.createElement('span');
  yearValue.className = 'detail-value';
  yearValue.textContent = paper.year || 'N/A';
  
  yearDetail.appendChild(yearLabel);
  yearDetail.appendChild(yearValue);
  
  // Create grade detail
  const gradeDetail = document.createElement('div');
  gradeDetail.className = 'paper-detail';
  
  const gradeLabel = document.createElement('span');
  gradeLabel.className = 'detail-label';
  gradeLabel.textContent = 'Grade:';
  
  const gradeValue = document.createElement('span');
  gradeValue.className = 'detail-value';
  gradeValue.textContent = paper.grade || 'N/A';
  
  gradeDetail.appendChild(gradeLabel);
  gradeDetail.appendChild(gradeValue);
  
  // Add info to the card
  infoDiv.appendChild(yearDetail);
  infoDiv.appendChild(gradeDetail);
  
  // Create download button
  const downloadButton = document.createElement('button');
  downloadButton.className = 'download-button';
  downloadButton.textContent = 'Download';
  downloadButton.addEventListener('click', () => {
    // Import downloadManager dynamically to avoid circular dependencies
    import('./downloadManager.js').then(module => {
      module.downloadPaper(paper);
    });
  });
  
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
 * Get all papers data
 * @returns {Array} All papers
 */
export function getAllPapers() {
  return allPapers;
}

/**
 * Get filtered papers data
 * @returns {Array} Filtered papers
 */
export function getFilteredPapers() {
  return filteredPapers;
}