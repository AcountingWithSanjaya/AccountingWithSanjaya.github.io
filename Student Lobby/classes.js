// API URL
const API_URL = 'http://deka.pylex.software:11219/';

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
        window.location.href = '../Login and Register/Login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/confirmloggedin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                token: token
            })
        });

        if (!response.ok) {
            throw new Error('Not authenticated');
        }

        // Fetch user credits and classes
        await Promise.all([fetchUserCredits(), fetchClasses()]);
    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = '../Login and Register/Login.html';
    }
});

// Fetch user credits
async function fetchUserCredits() {
    try {
        const email = localStorage.getItem('userEmail');
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_URL}/api/user/credits?email=${email}`, {
            headers: {
                'Authorization': token
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch credits');
        }
        
        const data = await response.json();
        updateCreditsDisplay(data.credits);
    } catch (error) {
        console.error('Error fetching credits:', error);
    }
}

// Update credits display
function updateCreditsDisplay(credits) {
    const creditsCount = document.querySelector('.credits-count');
    creditsCount.textContent = credits;
}

// Fetch classes from the backend
async function fetchClasses() {
    try {
        const response = await fetch(`${API_URL}/api/classes`);
        if (!response.ok) {
            throw new Error('Failed to fetch classes');
        }
        const classes = await response.json();
        renderClasses(classes);
        checkEnrolledClasses();
    } catch (error) {
        console.error('Error fetching classes:', error);
        const classList = document.getElementById('classList');
        classList.innerHTML = `
            <div class="error-message">
                Failed to load classes. Please try again later.
            </div>
        `;
    }
}

// Check enrolled classes and update UI
async function checkEnrolledClasses() {
    try {
        const email = localStorage.getItem('userEmail');
        const token = localStorage.getItem('authToken');
        
        document.querySelectorAll('.class-card').forEach(async (card) => {
            const classId = card.dataset.classId;
            const response = await fetch(
                `${API_URL}/api/class/zoom-link?email=${email}&classId=${classId}`,
                {
                    headers: {
                        'Authorization': token
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                updateClassCardWithZoomLink(card, data.zoom_link);
            }
        });
    } catch (error) {
        console.error('Error checking enrolled classes:', error);
    }
}

// Update class card with zoom link
function updateClassCardWithZoomLink(card, zoomLink) {
    card.classList.add('enrolled');
    const zoomLinkElement = document.createElement('div');
    zoomLinkElement.className = 'zoom-link';
    zoomLinkElement.innerHTML = `
        <a href="${zoomLink}" target="_blank" class="zoom-button">Join Zoom</a>
    `;
    card.appendChild(zoomLinkElement);
}

// Render all available classes
function renderClasses(classes) {
    const classList = document.getElementById('classList');
    classList.innerHTML = '';

    classes.forEach(classItem => {
        const classCard = document.createElement('div');
        classCard.className = 'class-card';
        classCard.dataset.classId = classItem.id;
        classCard.innerHTML = `
            <h3>${classItem.title}</h3>
            <p>${classItem.instructor}</p>
            <div class="class-info">
                <span>${classItem.date}</span>
                <span>${classItem.time}</span>
            </div>
            <div class="class-info">
                <span>${classItem.duration}</span>
                <span>${classItem.spots} spots left</span>
            </div>
        `;

        classCard.addEventListener('click', () => selectClass(classItem));
        classList.appendChild(classCard);
    });
}

// Handle class selection
function selectClass(classItem) {
    // Remove selection from all cards
    document.querySelectorAll('.class-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    event.currentTarget.classList.add('selected');

    // Update selected class display
    const selectedClassDiv = document.getElementById('selectedClass');
    selectedClassDiv.innerHTML = `
        <h2>Selected Class</h2>
        <div class="selected-class-content">
            <h3>${classItem.title}</h3>
            <div class="selected-class-details">
                <div class="detail-row">
                    <span>Instructor:</span>
                    <span>${classItem.instructor}</span>
                </div>
                <div class="detail-row">
                    <span>Date:</span>
                    <span>${classItem.date}</span>
                </div>
                <div class="detail-row">
                    <span>Time:</span>
                    <span>${classItem.time}</span>
                </div>
                <div class="detail-row">
                    <span>Duration:</span>
                    <span>${classItem.duration}</span>
                </div>
                <div class="detail-row">
                    <span>Available Spots:</span>
                    <span>${classItem.spots}</span>
                </div>
            </div>
            <button class="cta-button" onclick="joinClass(${classItem.id})">Join Class</button>
        </div>
    `;
}

// Handle joining a class
async function joinClass(classId) {
    try {
        const email = localStorage.getItem('userEmail');
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_URL}/api/class/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                email: email,
                classId: classId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to join class');
        }
        
        // Update credits display
        updateCreditsDisplay(data.remaining_credits);
        
        // Update class card with zoom link
        const classCard = document.querySelector(`.class-card[data-class-id="${classId}"]`);
        updateClassCardWithZoomLink(classCard, data.zoom_link);
        
        alert('Successfully joined the class! You can now access the Zoom link.');
    } catch (error) {
        console.error('Error joining class:', error);
        alert(error.message);
    }
}