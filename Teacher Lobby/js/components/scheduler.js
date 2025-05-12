/**
 * Scheduler component
 * Handles the class scheduling functionality
 */
export function initScheduler(classesData) {
  // DOM elements
  const calendarGrid = document.getElementById('calendar-grid');
  const currentMonthEl = document.getElementById('current-month');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const scheduleForm = document.getElementById('schedule-form');
  const classDateInput = document.getElementById('class-date');
  
  const upcomingClassesContainer = document.getElementById('upcoming-classes');
  const pastClassesContainer = document.getElementById('past-classes');
  
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  // Current date and selected date
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDate = new Date();
  
  // Initialize the calendar
  const initCalendar = () => {
    updateCalendarHeader();
    renderCalendar();
    renderClasses();
  };
  
  // Update the calendar header (month and year)
  const updateCalendarHeader = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthEl.textContent = `${months[currentMonth]} ${currentYear}`;
  };
  
  // Render the calendar grid
  const renderCalendar = () => {
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
    
    // Format date for input field (YYYY-MM-DD)
    const formattedDate = date.toISOString().split('T')[0];
    classDateInput.value = formattedDate;
    
    // Re-render calendar to update selected date
    renderCalendar();
  };
  
  // Previous month button handler
  prevMonthBtn.addEventListener('click', () => {
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
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked tab
      button.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Show selected tab content
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Schedule form submission
  scheduleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('class-title').value;
    const course = document.getElementById('class-course').value;
    const date = document.getElementById('class-date').value;
    const time = document.getElementById('class-time').value;
    const duration = document.getElementById('class-duration').value;
    const description = document.getElementById('class-description').value;
    
    // Calculate end time
    const startDate = new Date(`2023-01-01T${time}`);
    startDate.setMinutes(startDate.getMinutes() + parseInt(duration));
    const endTime = startDate.toTimeString().slice(0, 5);
    
    // Create new class object
    const newClass = {
      id: `class${Date.now()}`,
      title,
      course: document.getElementById('class-course').options[document.getElementById('class-course').selectedIndex].text,
      date,
      startTime: time,
      endTime,
      duration: parseInt(duration),
      room: 'Room 101', // Default room
      studentsEnrolled: 0, // No students enrolled yet
      description
    };
    
    // Add to upcoming classes
    classesData.upcoming.push(newClass);
    
    // Re-render calendar and classes
    renderCalendar();
    renderClasses();
    
    // Reset form
    scheduleForm.reset();
    
    // Show confirmation
    alert('Class scheduled successfully!');
  });
  
  // Initialize the component
  initCalendar();
}