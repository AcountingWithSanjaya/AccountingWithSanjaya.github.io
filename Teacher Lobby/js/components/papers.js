/**
 * Papers component
 * Handles document uploads and management
 */
export function initPapers(papersData) {
  // DOM elements
  const papersGrid = document.getElementById('papers-grid');
  const papersList = document.getElementById('papers-list');
  const viewButtons = document.querySelectorAll('.view-btn');
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const uploadList = document.getElementById('upload-list');
  const uploadSubmitBtn = document.getElementById('upload-submit-btn');
  
  const docTypeFilter = document.getElementById('doc-type-filter');
  const docCourseFilter = document.getElementById('doc-course-filter');
  const docDateFilter = document.getElementById('doc-date-filter');
  const filterButton = document.querySelector('.papers-sidebar .cta-button');
  
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  
  // Track files to upload
  let filesToUpload = [];
  
  // Initialize the component
  const init = () => {
    renderPapers(papersData);
    setupEventListeners();
  };
  
  // Render papers in both grid and list views
  const renderPapers = (papers) => {
    // Clear containers
    papersGrid.innerHTML = '';
    papersList.innerHTML = '';
    
    if (papers.length === 0) {
      const noDocsMessage = `
        <div class="no-documents">
          <p>No documents found matching your criteria.</p>
        </div>
      `;
      papersGrid.innerHTML = noDocsMessage;
      papersList.innerHTML = noDocsMessage;
      return;
    }
    
    // Render grid view
    papers.forEach(paper => {
      const paperCard = document.createElement('div');
      paperCard.className = 'paper-card';
      
      // Determine icon based on format
      let formatIcon = 'fa-file-alt';
      if (paper.format === 'pdf') {
        formatIcon = 'fa-file-pdf';
      } else if (paper.format === 'docx' || paper.format === 'doc') {
        formatIcon = 'fa-file-word';
      } else if (paper.format === 'xlsx' || paper.format === 'xls') {
        formatIcon = 'fa-file-excel';
      } else if (paper.format === 'pptx' || paper.format === 'ppt') {
        formatIcon = 'fa-file-powerpoint';
      }
      
      // Format date
      const uploadDate = new Date(paper.uploadDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      paperCard.innerHTML = `
        <div class="paper-icon">
          <i class="fas ${formatIcon}"></i>
        </div>
        <h3 class="paper-title">${paper.title}</h3>
        <div class="paper-meta">
          <span>${paper.size}</span>
          <span>&bull;</span>
          <span>${paper.format.toUpperCase()}</span>
        </div>
        <div class="paper-actions">
          <div class="paper-action" title="Download">
            <i class="fas fa-download"></i>
          </div>
          <div class="paper-action" title="Share">
            <i class="fas fa-share-alt"></i>
          </div>
          <div class="paper-action" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </div>
        </div>
      `;
      
      papersGrid.appendChild(paperCard);
      
      // Create list view item
      const paperListItem = document.createElement('div');
      paperListItem.className = 'paper-list-item';
      paperListItem.innerHTML = `
        <div class="paper-list-icon">
          <i class="fas ${formatIcon}"></i>
        </div>
        <div class="paper-list-details">
          <h3 class="paper-list-title">${paper.title}</h3>
          <div class="paper-list-meta">
            <span>${paper.course}</span>
            <span>${paper.type}</span>
            <span>${uploadDate}</span>
            <span>${paper.size}</span>
          </div>
        </div>
        <div class="paper-list-actions">
          <div class="paper-action" title="Download">
            <i class="fas fa-download"></i>
          </div>
          <div class="paper-action" title="Share">
            <i class="fas fa-share-alt"></i>
          </div>
          <div class="paper-action" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </div>
        </div>
      `;
      
      papersList.appendChild(paperListItem);
    });
  };
  
  // Set up event listeners
  const setupEventListeners = () => {
    // View toggle buttons
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const viewType = button.getAttribute('data-view');
        
        if (viewType === 'grid') {
          papersGrid.classList.add('active');
          papersList.classList.remove('active');
        } else {
          papersList.classList.add('active');
          papersGrid.classList.remove('active');
        }
      });
    });
    
    // Upload area click
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('active');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('active');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('active');
      
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });
    
    // Upload submit button
    uploadSubmitBtn.addEventListener('click', handleUpload);
    
    // Filter button
    filterButton.addEventListener('click', applyFilters);
    
    // Search
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  // Process selected files
  const handleFiles = (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if file is already in the list
      if (!filesToUpload.some(f => f.name === file.name && f.size === file.size)) {
        filesToUpload.push(file);
        addFileToUploadList(file);
      }
    }
    
    // Enable or disable submit button
    uploadSubmitBtn.disabled = filesToUpload.length === 0;
  };
  
  // Add file to the upload list UI
  const addFileToUploadList = (file) => {
    const item = document.createElement('div');
    item.className = 'upload-item';
    
    // Format file size
    const fileSize = formatFileSize(file.size);
    
    // Determine icon based on file type
    let fileIcon = 'fa-file-alt';
    const fileType = file.type.split('/')[1];
    
    if (fileType === 'pdf') {
      fileIcon = 'fa-file-pdf';
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      fileIcon = 'fa-file-word';
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      fileIcon = 'fa-file-excel';
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      fileIcon = 'fa-file-powerpoint';
    }
    
    item.innerHTML = `
      <div class="upload-item-info">
        <div class="upload-item-icon">
          <i class="fas ${fileIcon}"></i>
        </div>
        <div class="upload-item-details">
          <div class="upload-item-name">${file.name}</div>
          <div class="upload-item-size">${fileSize}</div>
        </div>
      </div>
      <div class="upload-item-remove" data-name="${file.name}">
        <i class="fas fa-times"></i>
      </div>
    `;
    
    uploadList.appendChild(item);
    
    // Add event listener to remove button
    item.querySelector('.upload-item-remove').addEventListener('click', () => {
      removeFile(file.name);
      item.remove();
    });
  };
  
  // Remove file from upload list
  const removeFile = (fileName) => {
    filesToUpload = filesToUpload.filter(file => file.name !== fileName);
    
    // Enable or disable submit button
    uploadSubmitBtn.disabled = filesToUpload.length === 0;
  };
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle file upload
  const handleUpload = () => {
    // In a real application, this would send files to a server
    // For this demo, we'll simulate adding the files to our papers list
    
    filesToUpload.forEach(file => {
      // Generate a random ID
      const id = 'doc' + Date.now() + Math.floor(Math.random() * 1000);
      
      // Extract file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      // Create new paper object
      const newPaper = {
        id,
        title: file.name.replace('.' + fileExtension, ''),
        type: 'other', // Default type
        course: 'Mathematics 101', // Default course
        uploadDate: new Date().toISOString().split('T')[0],
        size: formatFileSize(file.size),
        format: fileExtension
      };
      
      // Add to papers data
      papersData.unshift(newPaper);
    });
    
    // Clear upload list
    uploadList.innerHTML = '';
    filesToUpload = [];
    uploadSubmitBtn.disabled = true;
    
    // Re-render papers
    renderPapers(papersData);
    
    // Show confirmation
    alert('Files uploaded successfully!');
  };
  
  // Apply filters to papers
  const applyFilters = () => {
    const selectedType = docTypeFilter.value;
    const selectedCourse = docCourseFilter.value;
    const selectedDate = docDateFilter.value;
    
    let filteredPapers = [...papersData];
    
    // Apply type filter
    if (selectedType !== 'all') {
      filteredPapers = filteredPapers.filter(paper => paper.type === selectedType);
    }
    
    // Apply course filter
    if (selectedCourse !== 'all') {
      filteredPapers = filteredPapers.filter(paper => paper.course.includes(selectedCourse));
    }
    
    // Apply date filter
    if (selectedDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      
      filteredPapers = filteredPapers.filter(paper => {
        const paperDate = new Date(paper.uploadDate);
        paperDate.setHours(0, 0, 0, 0);
        
        if (selectedDate === 'today') {
          return paperDate.getTime() === today.getTime();
        } else if (selectedDate === 'week') {
          return paperDate >= weekAgo && paperDate <= today;
        } else if (selectedDate === 'month') {
          return paperDate >= monthAgo && paperDate <= today;
        }
        return true;
      });
    }
    
    renderPapers(filteredPapers);
  };
  
  // Perform search
  const performSearch = () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
      renderPapers(papersData);
      return;
    }
    
    const filteredPapers = papersData.filter(paper => {
      return paper.title.toLowerCase().includes(searchTerm) ||
             paper.course.toLowerCase().includes(searchTerm) ||
             paper.type.toLowerCase().includes(searchTerm);
    });
    
    renderPapers(filteredPapers);
  };
  
  // Initialize the component
  init();
}