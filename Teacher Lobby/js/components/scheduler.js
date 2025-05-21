/**
 * Scheduler component
 * Handles the class scheduling functionality
 */
import { scheduleNewClass } from './api/config.js';

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
  const classDateInput = document.getElementById('class-date');
  const classCourseSelect = document.getElementById('class-course');
  const classLessonTypeSelect = document.getElementById('class-lesson-type'); // Added lesson type select
  
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

  // Populate lesson type dropdown
  const populateLessonTypesDropdown = () => {
    if (!classLessonTypeSelect || !lessonTypesData) {
        console.warn('[Scheduler] Lesson type select or data not available for populating.');
        if (classLessonTypeSelect) classLessonTypeSelect.innerHTML = '<option value="">No lesson types loaded</option>';
        return;
    }
    classLessonTypeSelect.innerHTML = '<option value="">Select a lesson type</option>'; // Reset
    lessonTypesData.forEach(type => {
      const option = document.createElement('option');
      option.value = type.id; // Use lesson type ID as value (e.g., "lecture")
      option.textContent = type.name; // Display lesson type name (e.g., "Lecture")
      classLessonTypeSelect.appendChild(option);
    });
  };

  // Initialize the calendar
  const initCalendar = () => {
    console.log('[Scheduler] initCalendar called.');
    populateCoursesDropdown(); 
    populateLessonTypesDropdown(); // Populate lesson types
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
          <i class="fas fa-chalkboard-teacher"></i> <!-- Example icon for lesson type -->
          <span>${cls.lessonType || 'N/A'}</span>
        </div>
        <div class="class-detail">
          <i class="fas fa-map-marker-alt"></i>
          <span>${cls.room}</span>
        </div>
        <div class="class-detail">
          <i class="fas fa-clock"></i>
          <span>${cls.duration} minutes</span>
        </div>
        <div class="class-detail">
          <i class="fas fa-users"></i>
          <span>${studentsText}</span>
        </div>
      </div>
      ${cls.description ? `<p class="class-description">${cls.description}</p>` : ''}
      <div class="class-actions">
        ${type === 'upcoming' ? `
          <button class="class-btn edit-btn">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="class-btn cancel-btn">
            <i class="fas fa-times"></i> Cancel
          </button>
        ` : `
          <button class="class-btn edit-btn">
            <i class="fas fa-file-alt"></i> Details
          </button>
        `}
      </div>
    `;
    
    return card;
  };
  
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
  scheduleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('[Scheduler] Schedule form submitted.');
    
    // Get form values
    const title = document.getElementById('class-title').value.trim();
    const courseSelect = document.getElementById('class-course');
    const courseName = courseSelect.options[courseSelect.selectedIndex].text; // Get the text of the selected option
    const courseId = courseSelect.value; // Get the ID of the selected option (if you store courses by ID)
    const lessonType = document.getElementById('class-lesson-type').value;
    const date = document.getElementById('class-date').value;
    const time = document.getElementById('class-time').value; // HH:MM (24-hour)
    const duration = parseInt(document.getElementById('class-duration').value, 10);
    const description = document.getElementById('class-description').value.trim();
    const room = 'Online'; // Default or make it a form field

    if (!title || !courseId || !lessonType || !date || !time || !duration) {
        alert('Please fill in all required fields for the class, including lesson type.');
        return;
    }

    const classDetails = {
        title,
        course: courseName, // Send course name
        // courseId: courseId, // Optionally send course ID if backend uses it
        lessonType,
        date,
        startTime: time, // Backend expects startTime
        duration, // Send integer minutes
        description,
        room
        // Backend will calculate endTime, generate ID, set instructor, etc.
    };
    console.log('[Scheduler] Scheduling new class with details:', classDetails);

    scheduleNewClass(classDetails)
        .then(result => {
            console.log('[Scheduler] Class scheduled successfully via API. Result:', result);
            // Add the newly scheduled class (returned from backend) to the local upcoming classes list
            if (classesData && classesData.upcoming && result.class) {
                 // Ensure the backend returns a class object that matches frontend structure or adapt here
                const newClassFromBackend = {
                    ...result.class, // Spread the properties from backend
                    // Frontend might expect duration as number, studentsEnrolled, etc.
                    // Ensure structure consistency or adapt here. For now, assume backend returns a compatible structure.
                    // For example, backend returns "duration": "90 mins", scheduler.js might prefer number 90
                    // For now, let's assume result.class matches the structure needed by createClassCard
                     duration: parseInt(result.class.duration), // If backend sends "90 mins" string
                     studentsEnrolled: result.class.studentsEnrolled || 0
                };
                console.log('[Scheduler] Adding new class to local data:', newClassFromBackend);
                classesData.upcoming.push(newClassFromBackend);
            }
            
            // Re-render calendar (to show event dot) and classes list
            renderCalendar(); // Might need to re-fetch or update classesData if not done above
            renderClasses(); // This uses the modified classesData.upcoming
            
            scheduleForm.reset();
            alert('Class scheduled successfully!');
        })
        .catch(error => {
            console.error('[Scheduler] Failed to schedule class:', error);
            alert(`Error scheduling class: ${error.message}`);
        });
  });
  
  // Initialize the component
  console.log('[Scheduler] Component setup complete. Initializing calendar...');
  initCalendar();
}
