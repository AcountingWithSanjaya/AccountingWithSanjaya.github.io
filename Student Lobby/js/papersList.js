const PAPERS_API_URL = 'http://127.0.0.1:10209/loadpapers'; // Backend endpoint to fetch papers

let allPapers = [];
let filteredPapers = [];
const papersContainer = document.getElementById('papers-container');
const loadingSpinner = document.getElementById('loading-spinner');
const noResultsElement = document.getElementById('no-papers');
const errorMessageElement = document.getElementById('error-message');
const yearFilter = document.getElementById('year-filter');
const gradeFilter = document.getElementById('grade-filter');
const applyFiltersButton = document.getElementById('apply-filters');

/**
 * @returns {Promise<Array>}
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


export async function initPapersList() {
  allPapers = await fetchPapers();
  filteredPapers = [...allPapers];
  
  if (allPapers.length > 0) {
    populateFilters(allPapers);
    renderPapers(allPapers);
  }

  applyFiltersButton.addEventListener('click', handleFilterApply);
}

/**
 * @param {Array} papers 
 */
function populateFilters(papers) {
  const years = [...new Set(papers.map(paper => paper.year))].sort((a, b) => b - a);
  const grades = [...new Set(papers.map(paper => paper.grade))].sort();
  
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });

  grades.forEach(grade => {
    const option = document.createElement('option');
    option.value = grade;
    option.textContent = grade;
    gradeFilter.appendChild(option);
  });
}


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
 *
 * @param {Array} papers 
 */
function renderPapers(papers) {
  papersContainer.innerHTML = '';
  
  if (papers.length === 0) {
    noResultsElement.classList.remove('hidden');
    return;
  }
  
  noResultsElement.classList.add('hidden');
  
  papers.forEach(paper => {
    const paperCard = createPaperCard(paper);
    papersContainer.appendChild(paperCard);
  });
}

/**
 * @param {Object} paper 
 * @returns {HTMLElement} 
 */
function createPaperCard(paper) {
  const card = document.createElement('div');
  card.className = 'paper-card';
  
  const title = document.createElement('h3');
  title.textContent = paper.name || 'Untitled Paper';
  
  const infoDiv = document.createElement('div');
  infoDiv.className = 'paper-info';
  
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
  
  infoDiv.appendChild(yearDetail);
  infoDiv.appendChild(gradeDetail);
  
  const downloadButton = document.createElement('button');
  downloadButton.className = 'download-button';
  downloadButton.textContent = 'Download';
  downloadButton.addEventListener('click', () => {
    // For Google Drive links, a direct link is usually enough.
    // The downloadManager might be for more complex scenarios or if files are served from backend.
    if (paper.link) {
      window.open(paper.link, '_blank');
    } else {
      alert('Download link is not available for this paper.');
    }
  });
  
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
export function getAllPapers() {
  return allPapers;
}

/**
 * @returns {Array}
 */
export function getFilteredPapers() {
  return filteredPapers;
}
