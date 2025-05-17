const API_URL = 'http://127.0.0.1:10209';

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const classListContainer = document.getElementById('classList');

    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
        redirectToLogin();
        return;
    }

    try {
        const confirmResponse = await fetch(`${API_URL}/confirmloggedin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, token }),
        });

        if (!confirmResponse.ok) {
            handleInvalidSession();
            return;
        }

        await fetchWeeklySchedule();
        // Optionally, set an interval to refresh the schedule, e.g., every 5 minutes
        // setInterval(fetchWeeklySchedule, 5 * 60 * 1000); 

    } catch (error) {
        console.error('Error initializing schedule page:', error);
        if (classListContainer) {
            classListContainer.innerHTML = `<div class="error-message">Could not load schedule. Please try again.</div>`;
        }
        // Optionally, handleInvalidSession() if error implies auth issue
    } finally {
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }, 300);
    }
});

async function fetchWeeklySchedule() {
    const classListContainer = document.getElementById('classList');
    if (!classListContainer) return;

    try {
        const userEmail = localStorage.getItem('userEmail');
        const token = localStorage.getItem('authToken');
        // The backend /schedule endpoint should now handle filtering for the week
        const response = await fetch(`${API_URL}/schedule?email=${userEmail}`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch weekly schedule');
        }
        const scheduleItems = await response.json();
        displaySchedule(scheduleItems);
    } catch (error) {
        console.error('Failed to load schedule:', error);
        classListContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

function displaySchedule(scheduleItems) {
    const classListContainer = document.getElementById('classList');
    if (!classListContainer) return;

    if (!scheduleItems || scheduleItems.length === 0) {
        classListContainer.innerHTML = '<div class="no-selection"><p>No classes scheduled for the upcoming week.</p></div>';
        return;
    }

    // Group classes by date
    const groupedByDate = scheduleItems.reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {});

    let scheduleHTML = '';
    Object.keys(groupedByDate).sort().forEach(dateStr => {
        const dayDate = new Date(dateStr + 'T00:00:00'); // Ensure correct date parsing for formatting
        scheduleHTML += `<div class="schedule-day-group">`;
        scheduleHTML += `<h4>${dayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h4>`;
        
        groupedByDate[dateStr].forEach(classItem => {
            // Assuming classItem.time is in "HH:MM" format or "HH:MM AM/PM"
            let displayTime = classItem.time;
            try {
                const [hours, minutes] = classItem.time.split(':');
                const d = new Date();
                d.setHours(parseInt(hours), parseInt(minutes.substring(0,2))); // Handle "14:00" or "02:00 PM"
                if (classItem.time.toUpperCase().includes("AM") || classItem.time.toUpperCase().includes("PM")) {
                     displayTime = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                } else {
                     displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                }

            } catch (e) { /* keep original time if parsing fails */ }


            scheduleHTML += `
                <div class="class-card">
                    <h3>${classItem.title}</h3>
                    <div class="class-info">
                        <span class="class-time">Time: ${displayTime}</span>
                        <span class="class-instructor">Instructor: ${classItem.instructor || 'N/A'}</span>
                    </div>
                    ${classItem.grade ? `<div class="class-info"><span class="class-grade">Grade: ${classItem.grade}</span></div>` : ''}
                </div>
            `;
        });
        scheduleHTML += `</div>`;
    });

    classListContainer.innerHTML = scheduleHTML;
}

function handleInvalidSession(message = 'Your session is invalid or has expired. Please log in again.') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('returncustomer');
    // Do not redirect immediately. Show an overlay instead.

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        const loadingText = loadingOverlay.querySelector('.loading-text');
        const loadingSubtext = loadingOverlay.querySelector('.loading-subtext');
        const spinner = loadingOverlay.querySelector('.spinner');

        if (spinner) spinner.style.display = 'none'; 
        if (loadingText) loadingText.textContent = 'Authentication Required';
        
        let buttonHTML = `<button id="go-to-login-btn" class="cta-button" style="margin-top: 1rem; background-color: var(--error-red); color: var(--white);">Go to Login</button>`;
        // The schedule.css might not have .cta-button, so ensure the button is styled or use a generic one.
        // For consistency, if .cta-button is available in schedule.css (it seems to be from error-message usage), this is fine.
        // If not, a more generic button style or inline styles would be needed for the button.
        // The existing schedule.html's overlay is identical to others, so .loading-text etc exist.
        if (loadingSubtext) {
            loadingSubtext.innerHTML = `${message}<br>${buttonHTML}`;
            const goToLoginBtn = loadingSubtext.querySelector('#go-to-login-btn');
            if (goToLoginBtn) {
                goToLoginBtn.onclick = redirectToLogin;
            }
        } else if (loadingText) { 
            loadingText.innerHTML += `<br>${message}<br>${buttonHTML}`;
            const goToLoginBtn = loadingText.querySelector('#go-to-login-btn');
            if (goToLoginBtn) {
                goToLoginBtn.onclick = redirectToLogin;
            }
        }
        loadingOverlay.classList.remove('hidden'); 
    } else {
        alert(message + " Please click OK to go to the login page.");
        redirectToLogin();
    }
}

function redirectToLogin() {
    window.location.href = '../Login and Register/Login.html';
}
