import { uploadPaper as apiUploadPaper } from '../api/config.js';

/**
 * Papers component
 * Handles document uploads and management
 */
export function initPapers(papersData, coursesData) { // Added coursesData
  console.log('[Papers] Initializing with papersData:', papersData, 'and coursesData:', coursesData);
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
  let filesToUpload = []; // This will store { file: FileObject, title: '', type: '', course: '' }
  
  // Initialize the component
  const init = () => {
    populateFilterDropdowns(papersData, coursesData);
    renderPapers(papersData);
    setupEventListeners();
  };

  const populateFilterDropdowns = (allPapers, allCourses) => {
    if (docTypeFilter) {
        docTypeFilter.innerHTML = '<option value="all">All Types</option>';
        const types = [...new Set(allPapers.map(p => p.type))].filter(Boolean).sort();
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            docTypeFilter.appendChild(option);
        });
    }
    if (docCourseFilter && allCourses) {
        docCourseFilter.innerHTML = '<option value="all">All Courses</option>';
        allCourses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.name; // Filter by name
            option.textContent = course.name;
            docCourseFilter.appendChild(option);
        });
    }
    // Date filter is static or can be populated if needed
  };
  
  // Render papers in both grid and list views
  const renderPapers = (papers) => {
    console.log('[Papers] Rendering papers. Count:', papers.length);
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
  const handleFiles = (selectedFiles) => {
    console.log('[Papers] Handling selected files:', selectedFiles);
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check if file is already in the list (by name and size)
      if (!filesToUpload.some(f => f.file.name === file.name && f.file.size === file.size)) {
        // For each file, create an object to store file and its metadata
        const fileEntry = {
          file: file,
          title: file.name.replace(/\.[^/.]+$/, ""), // Default title from filename
          type: 'assignment', // Default type, user should be able to change this
          course: coursesData && coursesData.length > 0 ? coursesData[0].name : 'General' // Default course
        };
        console.log('[Papers] Adding file to upload list:', fileEntry);
        filesToUpload.push(fileEntry);
        addFileToUploadListUI(fileEntry);
      }
    }
    uploadSubmitBtn.disabled = filesToUpload.length === 0;
  };
  
  // Add file to the upload list UI and allow metadata editing
  const addFileToUploadListUI = (fileEntry) => {
    console.log('[Papers] Adding file to UI:', fileEntry.file.name);
    const item = document.createElement('div');
    item.className = 'upload-item-detailed'; // New class for more details
    
    const file = fileEntry.file;
    const fileSize = formatFileSize(file.size);
    let fileIcon = getFileIcon(file.name);

    item.innerHTML = `
      <div class="upload-item-main-info">
        <i class="fas ${fileIcon} upload-file-icon"></i>
        <span class="upload-file-name">${file.name} (${fileSize})</span>
        <button type="button" class="upload-item-remove-btn">&times;</button>
      </div>
      <div class="upload-item-meta-form">
        <div class="form-group-inline">
          <label>Title:</label>
          <input type="text" class="upload-meta-title" value="${fileEntry.title}" placeholder="Document Title">
        </div>
        <div class="form-group-inline">
          <label>Type:</label>
          <select class="upload-meta-type">
            <option value="assignment" ${fileEntry.type === 'assignment' ? 'selected' : ''}>Assignment</option>
            <option value="notes" ${fileEntry.type === 'notes' ? 'selected' : ''}>Notes</option>
            <option value="past_paper" ${fileEntry.type === 'past_paper' ? 'selected' : ''}>Past Paper</option>
            <option value="syllabus" ${fileEntry.type === 'syllabus' ? 'selected' : ''}>Syllabus</option>
            <option value="other" ${fileEntry.type === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div class="form-group-inline">
          <label>Course:</label>
          <select class="upload-meta-course">
            ${coursesData.map(course => `<option value="${course.name}" ${fileEntry.course === course.name ? 'selected' : ''}>${course.name}</option>`).join('')}
            <option value="General" ${fileEntry.course === 'General' ? 'selected' : ''}>General</option>
          </select>
        </div>
      </div>
    `;
    
    uploadList.appendChild(item);

    // Event listeners for metadata changes
    item.querySelector('.upload-meta-title').addEventListener('change', (e) => fileEntry.title = e.target.value);
    item.querySelector('.upload-meta-type').addEventListener('change', (e) => fileEntry.type = e.target.value);
    item.querySelector('.upload-meta-course').addEventListener('change', (e) => fileEntry.course = e.target.value);
    
    item.querySelector('.upload-item-remove-btn').addEventListener('click', () => {
      removeFileFromUploadList(fileEntry.file.name, fileEntry.file.size);
      item.remove();
    });
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf';
    if (['doc', 'docx'].includes(ext)) return 'fa-file-word';
    if (['xls', 'xlsx'].includes(ext)) return 'fa-file-excel';
    if (['ppt', 'pptx'].includes(ext)) return 'fa-file-powerpoint';
    return 'fa-file-alt';
  };
  
  // Remove file from upload list
  const removeFileFromUploadList = (fileName, fileSize) => {
    filesToUpload = filesToUpload.filter(entry => !(entry.file.name === fileName && entry.file.size === fileSize));
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
  const handleUpload = async () => {
    console.log('[Papers] Starting upload process for files:', filesToUpload);
    if (filesToUpload.length === 0) {
      alert("No files selected for upload.");
      return;
    }

    uploadSubmitBtn.disabled = true;
    uploadSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    let allSucceeded = true;
    let successfulUploads = 0;

    for (const fileEntry of filesToUpload) {
      console.log(`[Papers] Uploading file: ${fileEntry.file.name} with metadata:`, fileEntry);
      const paperData = {
        title: fileEntry.title,
        type: fileEntry.type,
        course: fileEntry.course
        // Backend will generate ID, uploadDate, size, format from file
      };
      try {
        const result = await apiUploadPaper(paperData, fileEntry.file);
        if (result.paper) {
          console.log(`[Papers] Successfully uploaded ${fileEntry.file.name}. Backend response:`, result);
          papersData.unshift(result.paper); // Add successfully uploaded paper to the main list
          successfulUploads++;
        } else {
          allSucceeded = false;
          console.error(`[Papers] Failed to upload ${fileEntry.file.name}:`, result.message);
        }
      } catch (error) {
        allSucceeded = false;
        console.error(`[Papers] Error uploading ${fileEntry.file.name}:`, error);
        alert(`Error uploading ${fileEntry.file.name}: ${error.message}`);
      }
    }
    
    console.log('[Papers] Upload process finished.');
    // Clear upload list UI and data
    uploadList.innerHTML = '';
    filesToUpload = [];
    uploadSubmitBtn.disabled = true; // Keep disabled until new files are added
    uploadSubmitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Upload Files';
    
    renderPapers(papersData); // Re-render papers list with new additions
    
    if (allSucceeded) {
      alert(`${successfulUploads} file(s) uploaded successfully!`);
    } else if (successfulUploads > 0) {
      alert(`Partially successful: ${successfulUploads} file(s) uploaded. Some uploads failed. Check console for details.`);
    } else {
      alert('All file uploads failed. Please try again or check console for errors.');
    }
  };
  
  // Apply filters to papers
  const applyFilters = () => {
    const selectedType = docTypeFilter ? docTypeFilter.value : 'all';
    const selectedCourse = docCourseFilter ? docCourseFilter.value : 'all';
    const selectedDate = docDateFilter.value;
    console.log('[Papers] Applying filters. Type:', selectedType, 'Course:', selectedCourse, 'Date:', selectedDate);
    
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
    console.log('[Papers] Performing search for:', searchTerm);
    
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
  console.log('[Papers] Component setup complete. Initializing...');
  init();
}
