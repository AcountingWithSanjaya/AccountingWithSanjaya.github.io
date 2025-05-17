const API_URL = 'http://127.0.0.1:10209';

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.getElementById('loading-overlay');
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
            const errorData = await confirmResponse.json();
            console.error('Login confirmation failed:', errorData.message);
            handleInvalidSession();
            return;
        }
        // console.log('Login confirmed successfully.');

        await Promise.all([fetchUserCredits(), fetchClassesForUserGrade()]);
        // No need to call checkEnrolledClasses separately, renderClasses will handle it.

    } catch (error) {
        console.error('Initialization error:', error);
        handleInvalidSession(); // Fallback for any network or unexpected errors
    } finally {
        setTimeout(() => {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }, 300);
    }
});

function redirectToLogin() {
    window.location.href = '../Login and Register/Login.html';
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

        if (spinner) spinner.style.display = 'none'; // Hide spinner
        if (loadingText) loadingText.textContent = 'Authentication Required';
        
        let buttonHTML = `<button id="go-to-login-btn" class="cta-button" style="margin-top: 1rem; background-color: var(--error-red); color: var(--white);">Go to Login</button>`;
        if (loadingSubtext) {
            loadingSubtext.innerHTML = `${message}<br>${buttonHTML}`;
            const goToLoginBtn = loadingSubtext.querySelector('#go-to-login-btn');
            if (goToLoginBtn) {
                goToLoginBtn.onclick = redirectToLogin;
            }
        } else if (loadingText) { // Fallback if subtext element doesn't exist but text element does
            loadingText.innerHTML += `<br>${message}<br>${buttonHTML}`;
            const goToLoginBtn = loadingText.querySelector('#go-to-login-btn');
            if (goToLoginBtn) {
                goToLoginBtn.onclick = redirectToLogin;
            }
        }
        loadingOverlay.classList.remove('hidden'); // Ensure it's visible
    } else {
        // Fallback if overlay isn't found (should not happen in normal flow)
        alert(message + " Please click OK to go to the login page.");
        redirectToLogin();
    }
}

async function fetchUserCredits() {
    try {
        const email = localStorage.getItem('userEmail');
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_URL}/api/user/credits?email=${email}`, {
            headers: { 'Authorization': `Bearer ${token}` } // Added Bearer
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch credits');
        }
        
        const data = await response.json();
        updateCreditsDisplay(data.credits);
    } catch (error) {
        console.error('Error fetching credits:', error);
        updateCreditsDisplay('N/A'); // Show N/A on error
    }
}

function updateCreditsDisplay(credits) {
    const creditsCountElement = document.querySelector('.credits-count');
    if (creditsCountElement) {
        creditsCountElement.textContent = credits;
    }
}

async function fetchClassesForUserGrade() {
    const classList = document.getElementById('classList');
    try {
        const email = localStorage.getItem('userEmail');
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/api/classes?email=${email}`, { // Pass email for backend to get grade
             headers: { 'Authorization': `Bearer ${token}` } // Added Bearer
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch classes for your grade');
        }
        const classes = await response.json();
        renderClasses(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        if (classList) {
            classList.innerHTML = `<div class="error-message">${error.message}</div>`;
        }
    }
}


function renderClasses(classes) {
    const classList = document.getElementById('classList');
    if (!classList) return;
    classList.innerHTML = '';

    if (classes.length === 0) {
        classList.innerHTML = `<div class="no-selection"><p>No upcoming classes found for your grade.</p></div>`;
        return;
    }
    
    const userEmail = localStorage.getItem('userEmail');
    const token = localStorage.getItem('authToken');

    classes.forEach(classItem => {
        const classCard = document.createElement('div');
        classCard.className = 'class-card';
        classCard.dataset.classId = classItem.id;

        // Basic class info
        let cardHTML = `
            <h3>${classItem.title}</h3>
            <p>Instructor: ${classItem.instructor}</p>
            <div class="class-info">
                <span>Date: ${classItem.date}</span>
                <span>Time: ${classItem.time}</span>
            </div>
            <div class="class-info">
                <span>Duration: ${classItem.duration}</span>
                <span>Spots Left: ${classItem.spots}</span>
            </div>`;

        classCard.innerHTML = cardHTML;
        classCard.addEventListener('click', (event) => {
            // Prevent re-selecting if a button inside the card was clicked
            if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
                return;
            }
            selectClass(classItem);
        });
        classList.appendChild(classCard);

        // Check enrollment and Zoom link status
        checkAndDisplayZoomLink(classCard, classItem, userEmail, token);
    });
}

async function checkAndDisplayZoomLink(cardElement, classItem, userEmail, token) {
    try {
        const response = await fetch(
            `${API_URL}/api/class/zoom-link?email=${userEmail}&classId=${classItem.id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.ok) {
            const data = await response.json();
            if (data.zoom_link) {
                cardElement.classList.add('enrolled');
                // Attempt to parse class start time
                const classStartTime = parseClassDateTime(classItem.date, classItem.time);
                if (classStartTime) {
                    const now = new Date();
                    const thirtyMinBefore = new Date(classStartTime.getTime() - 30 * 60000);
                    const twoHoursAfter = new Date(classStartTime.getTime() + 2 * 60 * 60000); // Link active for 2 hours post start

                    if (now >= thirtyMinBefore && now <= twoHoursAfter) {
                        const zoomLinkElement = document.createElement('div');
                        zoomLinkElement.className = 'zoom-link';
                        zoomLinkElement.innerHTML = `<a href="${data.zoom_link}" target="_blank" class="zoom-button">Join Zoom</a>`;
                        cardElement.appendChild(zoomLinkElement);
                    } else if (now < thirtyMinBefore) {
                         const zoomLinkElement = document.createElement('div');
                        zoomLinkElement.className = 'zoom-link';
                        zoomLinkElement.innerHTML = `<button class="zoom-button disabled" disabled>Link active 30m before class</button>`;
                        cardElement.appendChild(zoomLinkElement);
                    } else {
                         // Link expired
                        const zoomLinkElement = document.createElement('div');
                        zoomLinkElement.className = 'zoom-link';
                        zoomLinkElement.innerHTML = `<button class="zoom-button disabled" disabled>Class link expired</button>`;
                        cardElement.appendChild(zoomLinkElement);
                    }
                }
            }
        } else if (response.status === 403) {
            // Not enrolled or link not active yet
            const errorData = await response.json();
            if (errorData.error.includes("Not enrolled")) {
                // No special UI for not enrolled, selection will show join button
            } else if (errorData.error.includes("not active yet")) {
                 const zoomLinkElement = document.createElement('div');
                 zoomLinkElement.className = 'zoom-link';
                 zoomLinkElement.innerHTML = `<button class="zoom-button disabled" disabled>Link active 30m before class</button>`;
                 cardElement.appendChild(zoomLinkElement);
            }
        }
    } catch (error) {
        console.error('Error checking zoom link for class', classItem.id, error);
    }
}

function parseClassDateTime(dateStr, timeStr) {
    // Assuming timeStr is like "14:00" or "2:00 PM"
    // This is a simplified parser. A robust library like date-fns or moment.js is better for complex cases.
    const [year, month, day] = dateStr.split('-').map(Number);
    let hours, minutes;
    const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeParts) {
        hours = parseInt(timeParts[1]);
        minutes = parseInt(timeParts[2]);
        if (timeParts[3]) { // AM/PM present
            const ampm = timeParts[3].toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0; // Midnight case
        }
    } else {
        return null; // Invalid time format
    }
    return new Date(year, month - 1, day, hours, minutes);
}


function selectClass(classItem) {
    document.querySelectorAll('.class-card.selected').forEach(card => {
        card.classList.remove('selected');
    });

    const newlySelectedCard = document.querySelector(`.class-card[data-class-id="${classItem.id}"]`);
    if (newlySelectedCard) {
        newlySelectedCard.classList.add('selected');
    }
    
    const selectedClassDiv = document.getElementById('selectedClass');
    if (!selectedClassDiv) return;

    let actionButtonHTML = '';
    if (newlySelectedCard && newlySelectedCard.classList.contains('enrolled')) {
        // If already enrolled, check if Zoom link is already displayed or should be
        const existingZoomButton = newlySelectedCard.querySelector('.zoom-button');
        if (existingZoomButton) {
            actionButtonHTML = existingZoomButton.outerHTML; // Use the existing button (might be disabled or active)
        } else {
             // Re-check logic for displaying zoom link or "link active soon"
            const classStartTime = parseClassDateTime(classItem.date, classItem.time);
            if (classStartTime) {
                const now = new Date();
                const thirtyMinBefore = new Date(classStartTime.getTime() - 30 * 60000);
                 if (now >= thirtyMinBefore) {
                    // This case should ideally be caught by checkAndDisplayZoomLink, but as a fallback:
                    actionButtonHTML = `<p>Enrolled. Check class card for Zoom link.</p>`;
                 } else {
                    actionButtonHTML = `<button class="cta-button" disabled>Enrolled (Link active 30m prior)</button>`;
                 }
            } else {
                 actionButtonHTML = `<p>Enrolled (Error parsing class time)</p>`;
            }
        }
    } else {
        actionButtonHTML = `<button class="cta-button" onclick="joinClass('${classItem.id}')">Join Class (1 Credit)</button>`;
    }

    selectedClassDiv.innerHTML = `
        <h2>Selected Class</h2>
        <div class="selected-class-content">
            <h3>${classItem.title}</h3>
            <div class="selected-class-details">
                <div class="detail-row"><span>Instructor:</span><span>${classItem.instructor}</span></div>
                <div class="detail-row"><span>Date:</span><span>${classItem.date}</span></div>
                <div class="detail-row"><span>Time:</span><span>${classItem.time}</span></div>
                <div class="detail-row"><span>Duration:</span><span>${classItem.duration}</span></div>
                <div class="detail-row"><span>Available Spots:</span><span>${classItem.spots}</span></div>
                <div class="detail-row"><span>Grade:</span><span>${classItem.grade}</span></div>
            </div>
            <div class="class-action-area">${actionButtonHTML}</div>
        </div>
    `;
}

async function joinClass(classId) {
    try {
        const email = localStorage.getItem('userEmail');
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_URL}/api/class/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Added Bearer
            },
            body: JSON.stringify({ email, classId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to join class');
        }
        
        updateCreditsDisplay(data.remaining_credits);
    
        const classCardElement = document.querySelector(`.class-card[data-class-id="${classId}"]`);
        if (classCardElement) {
            // Find the classItem object to pass to selectClass for re-rendering the details pane
            const classes = await (await fetch(`${API_URL}/api/classes?email=${email}`, { headers: { 'Authorization': `Bearer ${token}` }})).json();
            const classItem = classes.find(c => c.id === classId);
            if (classItem) {
                selectClass(classItem); // Re-render selected class details
            }
            checkAndDisplayZoomLink(classCardElement, classItem, email, token); // Update the card itself
        }
        
        alert('Successfully joined the class! The Zoom link will be available on the class card 30 minutes before it starts.');

    } catch (error) {
        console.error('Error joining class:', error);
        alert(error.message);
    }
}
// Make joinClass globally accessible for the inline onclick
window.joinClass = joinClass;
