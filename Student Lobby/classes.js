const API_URL = 'http://helya.pylex.xyz:10209';

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
    const response = await fetch(`${API_URL}/confirmloggedin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail, token }),
    });

    if (!response.ok) {
      handleInvalidSession();
      return;
    }

    await Promise.all([fetchUserCredits(), fetchClasses()]);
  } catch (error) {
    console.error('Authentication error:', error);
    handleInvalidSession();
    return;
  } finally {
    // Hide the loading overlay after short delay for smoother UX
    setTimeout(() => {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }, 300);
  }
});

function redirectToLogin() {
  window.location.href = '../Login and Register/Login.html';
}

function handleInvalidSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('rememberedEmail');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('returncustomer');
  redirectToLogin();
}


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

function updateCreditsDisplay(credits) {
    const creditsCount = document.querySelector('.credits-count');
    creditsCount.textContent = credits;
}

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

function updateClassCardWithZoomLink(card, zoomLink) {
    card.classList.add('enrolled');
    const zoomLinkElement = document.createElement('div');
    zoomLinkElement.className = 'zoom-link';
    zoomLinkElement.innerHTML = `
        <a href="${zoomLink}" target="_blank" class="zoom-button">Join Zoom</a>
    `;
    card.appendChild(zoomLinkElement);
}

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

function selectClass(classItem) {
    document.querySelectorAll('.class-card').forEach(card => {
        card.classList.remove('selected');
    });

    event.currentTarget.classList.add('selected');
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
        
        updateCreditsDisplay(data.remaining_credits);
    
        const classCard = document.querySelector(`.class-card[data-class-id="${classId}"]`);
        updateClassCardWithZoomLink(classCard, data.zoom_link);
        
        alert('Successfully joined the class! You can now access the Zoom link.');
    } catch (error) {
        console.error('Error joining class:', error);
        alert(error.message);
    }
}