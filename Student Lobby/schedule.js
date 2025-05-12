const API_URL = 'http://helya.pylex.xyz:10209';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  const classList = document.getElementById('classList');

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, token }),
    });

    if (!response.ok) {
      handleInvalidSession();
      return;
    }

    await fetchClasses();
    setInterval(fetchClasses, 60000);
  } catch (error) {
    console.error('Error checking login status:', error);
    handleInvalidSession();
    return;
  } finally {
    setTimeout(() => {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }, 300);
  }

  // === Class Fetch Logic ===

  async function fetchClasses() {
    if (!classList) return;
    try {
      const response = await fetch(`${API_URL}/schedule`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      const classes = await response.json();
      displayClasses(classes);
    } catch (error) {
      console.error('Failed to load classes:', error);
      classList.innerHTML = `
        <div class="error-message">
          Failed to load classes. Please try again later.
        </div>
      `;
    }
  }

  function displayClasses(classes) {
    classList.innerHTML = classes.map(classItem => {
      const startTime = new Date(classItem.startTime);
      const endTime = new Date(classItem.endTime);
      return `
        <div class="class-card">
          <div class="class-details">
            <h3>${classItem.title}</h3>
            <div class="class-info">
              <div class="class-time">
                ${startTime.toLocaleDateString()} | 
                ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div class="class-instructor">
                Instructor: ${classItem.instructor}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function handleInvalidSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('returncustomer');
    redirectToLogin();
  }

  function redirectToLogin() {
    window.location.href = '../Login and Register/Login.html';
  }
});
