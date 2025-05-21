/**
 * Scheduler component
 * Handles the class scheduling functionality
 */
import { scheduleNewClass, updateScheduledClass, deleteScheduledClass } from './api/config.js';

/**
 * Scheduler component
 * Handles the class scheduling functionality
 */
export function initScheduler(classesData, coursesData, lessonTypesData) { // Added coursesData and lessonTypesData
  console.log('[Scheduler] Initializing with classesData:', classesData, 'coursesData:', coursesData, 'lessonTypesData:', lessonTypesData);
  // DOM elements
  const calendarGrid = document.getElementById('calendar-grid');
  const currentMonthEl = document.getElementById('current-month');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const scheduleForm = document.getElementById('schedule-form');
  const classIdEditingInput = document.getElementById('class-id-editing');
  const classTitleInput = document.getElementById('class-title');
  const classCourseSelect = document.getElementById('class-course');
  const classDateInput = document.getElementById('class-date');
  const classTimeInput = document.getElementById('class-time');
  const classDurationInput = document.getElementById('class-duration');
  const classDescriptionInput = document.getElementById('class-description');
  const scheduleSubmitBtn = document.getElementById('schedule-submit-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  // const classLessonTypeSelect = document.getElementById('class-lesson-type'); // Removed
  
  const upcomingClassesContainer = document.getElementById('upcoming-classes');
  const pastClassesContainer = document.getElementById('past-classes');
  
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  // Current date and selected date
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDate = new Date();
  
  // Populate course dropdown
  const populateCoursesDropdown = () => {
    if (!classCourseSelect || !coursesData) return;
    classCourseSelect.innerHTML = '<option value="">Select a course</option>'; // Reset
    coursesData.forEach(course => {
      const option = document.createElement('option');
      option.value = course.id; // Use course ID as value
      option.textContent = course.name; // Display course name
      classCourseSelect.appendChild(option);
    });
  };

  // Initialize the calendar
  const initCalendar = () => {
    console.log('[Scheduler] initCalendar called.');
    populateCoursesDropdown(); 
    // populateLessonTypesDropdown(); // Removed
    updateCalendarHeader();
    renderCalendar();
    renderClasses(); // classesData is passed in initScheduler
  };
  
  // Update the calendar header (month and year)
  const updateCalendarHeader = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthEl.textContent = `${months[currentMonth]} ${currentYear}`;
    console.log(`[Scheduler] Calendar header updated to: ${months[currentMonth]} ${currentYear}`);
  };
  
  // Render the calendar grid
  const renderCalendar = () => {
    console.log('[Scheduler] renderCalendar called.');
    calendarGrid.innerHTML = '';
    
    // Add day headers (Sun, Mon, etc.)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of the month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    // Get number of days in the month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Get number of days in previous month
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Add days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dayEl = createDayElement(day, true);
      calendarGrid.appendChild(dayEl);
    }
    
    // Add days for current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const hasEvent = checkForEvents(date);
      const isToday = checkIfToday(date);
      const isSelected = checkIfSelected(date);
      
      const dayEl = createDayElement(day, false, hasEvent, isToday, isSelected);
      dayEl.addEventListener('click', () => selectDate(date));
      
      calendarGrid.appendChild(dayEl);
    }
    
    // Add days from next month to fill the grid
    const totalCells = 42; // 6 rows of 7 days
    const remainingCells = totalCells - (firstDayOfMonth + daysInMonth);
    
    for (let day = 1; day <= remainingCells; day++) {
      const dayEl = createDayElement(day, true);
      calendarGrid.appendChild(dayEl);
    }
  };
  
  // Create a day element for the calendar
  const createDayElement = (day, isOtherMonth, hasEvent = false, isToday = false, isSelected = false) => {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;
    
    if (isOtherMonth) {
      dayEl.classList.add('other-month');
    }
    
    if (hasEvent) {
      dayEl.classList.add('has-event');
    }
    
    if (isToday) {
      dayEl.classList.add('today');
    }
    
    if (isSelected) {
      dayEl.classList.add('selected');
    }
    
    return dayEl;
  };
  
  // Check if a date has events
  const checkForEvents = (date) => {
    const dateString = date.toISOString().split('T')[0];
    
    // Check upcoming classes
    const hasUpcoming = classesData.upcoming.some(cls => cls.date === dateString);
    
    // Check past classes
    const hasPast = classesData.past.some(cls => cls.date === dateString);
    
    return hasUpcoming || hasPast;
  };
  
  // Check if a date is today
  const checkIfToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // Check if a date is selected
  const checkIfSelected = (date) => {
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  // Select a date on the calendar
  const selectDate = (date) => {
    selectedDate = date;
    console.log('[Scheduler] Date selected:', selectedDate);
    
    // Format date for input field (YYYY-MM-DD)
    const formattedDate = date.toISOString().split('T')[0];
    classDateInput.value = formattedDate;
    
    // Re-render calendar to update selected date
    renderCalendar();
  };
  
  // Previous month button handler
  prevMonthBtn.addEventListener('click', () => {
    console.log('[Scheduler] Previous month button clicked.');
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateCalendarHeader();
    renderCalendar();
  });
  
  // Next month button handler
  nextMonthBtn.addEventListener('click', () => {
    console.log('[Scheduler] Next month button clicked.');
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateCalendarHeader();
    renderCalendar();
  });
  
  // Render the classes lists
  const renderClasses = () => {
    console.log('[Scheduler] renderClasses called.');
    // Clear containers
    upcomingClassesContainer.innerHTML = '';
    pastClassesContainer.innerHTML = '';
    
    // Sort upcoming classes by date
    const sortedUpcoming = [...classesData.upcoming].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    // Sort past classes by date (most recent first)
    const sortedPast = [...classesData.past].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // Render upcoming classes
    if (sortedUpcoming.length === 0) {
      upcomingClassesContainer.innerHTML = `
        <div class="no-classes">
          <p>No upcoming classes scheduled.</p>
        </div>
      `;
    } else {
      sortedUpcoming.forEach(cls => {
        const classCard = createClassCard(cls, 'upcoming');
        upcomingClassesContainer.appendChild(classCard);
      });
    }
    
    // Render past classes
    if (sortedPast.length === 0) {
      pastClassesContainer.innerHTML = `
        <div class="no-classes">
          <p>No past classes found.</p>
        </div>
      `;
    } else {
      sortedPast.forEach(cls => {
        const classCard = createClassCard(cls, 'past');
        pastClassesContainer.appendChild(classCard);
      });
    }
  };
  
  // Create a class card
  const createClassCard = (cls, type) => {
    const card = document.createElement('div');
    card.className = 'class-card';
    
    // Format date
    const classDate = new Date(cls.date);
    const formattedDate = classDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Format time
    const formatTime = (timeString) => {
      const options = { hour: 'numeric', minute: '2-digit', hour12: true };
      return new Date(`2023-01-01T${timeString}`).toLocaleTimeString('en-US', options);
    };
    
    const startTime = formatTime(cls.startTime);
    const endTime = formatTime(cls.endTime);
    
    let studentsText = '';
    if (type === 'upcoming') {
      studentsText = `${cls.studentsEnrolled} students enrolled`;
    } else {
      studentsText = `${cls.studentsAttended} students attended`;
    }
    
    card.innerHTML = `
      <div class="class-card-header">
        <h3 class="class-title">${cls.title}</h3>
        <div class="class-date">
          <span class="class-day">${formattedDate.split(',')[0]}</span>
          <span class="class-time">${startTime} - ${endTime}</span>
        </div>
      </div>
      <div class="class-details">
        <div class="class-detail">
          <i class="fas fa-book"></i>
          <span>${cls.course}</span>
        </div>
        <div class="class-detail">
          <i class="fas fa-map-marker-alt"></i>
          <span>${cls.room}</span>
        </div>
        <div class="class-detail">
          <i class="fas fa-clock"></i>
          <span>${cls.duration}</span> 
        </div>
        <div class="class-detail">
          <i class="fas fa-users"></i>
          <span>${studentsText}</span>
        </div>
      </div>
      ${cls.description ? `<p class="class-description">${cls.description}</p>` : ''}
      <div class="class-actions">
        ${type === 'upcoming' ? `
          <button class="class-btn edit-btn" data-class-id="${cls.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="class-btn cancel-btn" data-class-id="${cls.id}">
            <i class="fas fa-times"></i> Cancel Class
          </button>
        ` : `
          <button class="class-btn details-btn" data-class-id="${cls.id}">
            <i class="fas fa-file-alt"></i> Details
          </button>
        `}
      </div>
    `;

    // Add event listener for edit button
    const editButton = card.querySelector('.edit-btn');
    if (editButton) {
      editButton.addEventListener('click', () => {
        console.log(`[Scheduler] Edit button pressed for class ID: ${cls.id}. Calling handleEditClass...`);
        handleEditClass(cls.id);
      });
    }
    
    // Add event listener for cancel class button
    const cancelClassButton = card.querySelector('.cancel-btn');
    if (cancelClassButton) {
      cancelClassButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click or other parent events
        console.log(`[Scheduler] Cancel Class button pressed for class ID: ${cls.id}. Calling handleCancelClass...`);
        handleCancelClass(cls.id);
      });
    }

    return card;
  };

  const handleCancelClass = async (classId) => {
    console.log('[Scheduler] Cancel Class button clicked for class ID:', classId);
    
    const classToCancel = classesData.upcoming.find(c => c.id === classId) || classesData.past.find(c => c.id === classId);
    if (!classToCancel) {
      alert('Error: Class not found.');
      return;
    }

    if (confirm(`Are you sure you want to delete the class "${classToCancel.title}"? This action cannot be undone.`)) {
      try {
        const result = await deleteScheduledClass(classId); // API call
        console.log('[Scheduler] Class deletion API call successful. Result:', result);

        // Remove class from local data
        classesData.upcoming = classesData.upcoming.filter(c => c.id !== classId);
        classesData.past = classesData.past.filter(c => c.id !== classId);

        renderCalendar(); // Update calendar dots
        renderClasses();  // Re-render class lists
        
        alert(result.message || 'Class deleted successfully!');

      } catch (error) {
        console.error('[Scheduler] Failed to delete class:', error);
        alert(`Error deleting class: ${error.message}`);
      }
    }
  };

  const handleEditClass = (classId) => {
    console.log('[Scheduler] Edit button clicked for class ID:', classId);
    const classToEdit = classesData.upcoming.find(c => c.id === classId) || classesData.past.find(c => c.id === classId);

    if (classToEdit) {
      classIdEditingInput.value = classToEdit.id;
      classTitleInput.value = classToEdit.title;
      
      // Set course
      const courseOption = Array.from(classCourseSelect.options).find(opt => opt.text === classToEdit.course);
      if (courseOption) {
        classCourseSelect.value = courseOption.value;
      } else {
        classCourseSelect.value = ''; // Or handle if course not found
      }
      
      classDateInput.value = classToEdit.date;
      classTimeInput.value = classToEdit.startTime || classToEdit.time; // Use startTime if available
      classDurationInput.value = parseInt(classToEdit.duration) || 60; // Extract number from "60 mins"
      classDescriptionInput.value = classToEdit.description || '';

      scheduleSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Update Class';
      cancelEditBtn.classList.remove('hidden');
      
      // Scroll to form for better UX
      scheduleForm.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.error('[Scheduler] Class to edit not found with ID:', classId);
      alert('Error: Could not find class details to edit.');
    }
  };

  const resetScheduleForm = () => {
    scheduleForm.reset();
    classIdEditingInput.value = '';
    scheduleSubmitBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Schedule Class';
    cancelEditBtn.classList.add('hidden');
    // Reset selected date on calendar if needed, or clear specific fields
    classDateInput.value = selectedDate.toISOString().split('T')[0]; // Reset to currently selected calendar date
  };

  cancelEditBtn.addEventListener('click', () => {
    console.log('[Scheduler] Cancel edit button clicked.');
    resetScheduleForm();
  });
  
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      console.log(`[Scheduler] Tab button clicked: ${tabId}`);
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked tab
      button.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Show selected tab content
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Schedule form submission
  scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[Scheduler] Schedule form submitted.');
    
    const editingId = classIdEditingInput.value;
    // Get form values
    const title = classTitleInput.value.trim();
    const courseSelect = document.getElementById('class-course'); // Re-fetch to ensure it's current
    const courseName = courseSelect.options[courseSelect.selectedIndex].text;
    const courseId = courseSelect.value; 
    const date = classDateInput.value;
    const time = classTimeInput.value;
    const duration = parseInt(classDurationInput.value, 10);
    const description = classDescriptionInput.value.trim();
    const room = 'Online';

    if (!title || !courseId || !date || !time || !duration) {
        alert('Please fill in all required fields for the class.');
        return;
    }

    const classDetailsPayload = {
        title,
        course: courseName,
        date,
        startTime: time,
        duration, 
        description,
        room,
        // grade: 'Any Grade' // Add if grade is part of the form and needs to be sent
        // zoomLink: '...' // Add if zoomLink is part of the form
    };

    try {
      let result;
      if (editingId) {
        console.log('[Scheduler] Updating existing class with ID:', editingId, 'Details:', classDetailsPayload);
        // Import updateScheduledClass from api/config.js if not already done
        // For now, assuming it's available or will be added.
        // result = await updateScheduledClass(editingId, classDetailsPayload); // This function needs to be created in api/config.js
        
        // Placeholder for the actual API call - this will be replaced once updateScheduledClass is in api/config.js
        console.log('[Scheduler] Updating existing class with ID:', editingId, 'Details:', classDetailsPayload);
        result = await updateScheduledClass(editingId, classDetailsPayload); // Actual API call
        console.log('[Scheduler] Class update API call successful. Result:', result);
        
        // Update local data
        const classIndex = classesData.upcoming.findIndex(c => c.id === editingId);
        if (classIndex !== -1 && result.class) {
            classesData.upcoming[classIndex] = result.class; // Update with data from backend
        } else {
            // Also check past classes if the class being edited could be there
            const pastClassIndex = classesData.past.findIndex(c => c.id === editingId);
            if (pastClassIndex !== -1 && result.class) {
                classesData.past[pastClassIndex] = result.class;
            } else if (result.class) { // If not found, but backend returned a class, it's an issue or new logic needed
                console.warn("[Scheduler] Updated class not found in local upcoming/past lists, but backend returned data. Re-fetching or adding might be needed.");
                // Potentially add to upcoming if it became upcoming, or handle as error.
                // For now, we assume it was found or this is an edge case.
            }
        }
      } else {
        console.log('[Scheduler] Scheduling new class with details:', classDetailsPayload);
        result = await scheduleNewClass(classDetailsPayload);
        console.log('[Scheduler] Class scheduled successfully via API. Result:', result);
        if (classesData && classesData.upcoming && result.class) {
            classesData.upcoming.push(result.class); // Add new class to local data
        }
      }

      // Common success logic
      renderCalendar(); // Re-render calendar to update event dots
      renderClasses();  // Re-render class lists with updated data
      resetScheduleForm(); // Reset form fields and buttons
      alert(result.message || (editingId ? 'Class updated successfully!' : 'Class scheduled successfully!'));

    } catch (error) {
      console.error(`[Scheduler] Failed to ${editingId ? 'update' : 'schedule'} class:`, error);
      alert(`Error ${editingId ? 'updating' : 'scheduling'} class: ${error.message}`);
    }
  });
  
  // Initialize the component
  console.log('[Scheduler] Component setup complete. Initializing calendar...');
  initCalendar();
}
