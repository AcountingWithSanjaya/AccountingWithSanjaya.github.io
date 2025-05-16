export const API_BASE_URL = 'http://127.0.0.1:10209'; // Base URL for the backend

// Mock data is no longer used.
// const mockTeacherData = { ... };

export const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('authToken');
  const email = localStorage.getItem('userEmail');
  
  if (!token || !email) {
    // Handle missing auth details, perhaps redirect to login or show an error
    console.error("Auth token or email is missing from localStorage.");
    // throw new Error("Authentication details not found."); // Or handle more gracefully
  }

  const headers = {};
  if (!isFormData) { // For JSON, set Content-Type
    headers['Content-Type'] = 'application/json';
  }
  // For FormData, the browser sets Content-Type automatically with boundary.
  
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Email might be sent in body or as a query param depending on GET/POST
  // Or included if endpoint specifically needs it in header (X-User-Email was an example)
  // For POST requests, it's better to include email in the JSON body.
  // For FormData, include it as a form field.
  return headers;
  };
};

export const checkTeacherAuth = async () => {
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    console.error('Auth details missing for checkTeacherAuth');
    // Potentially redirect to login or throw error
    window.location.href = '../Login and Register/Login.html'; // Example redirect
    return false; // Or throw new Error("Missing auth details");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/confirmteacherloggedin`, { // Corrected endpoint
      method: 'POST',
      headers: getAuthHeaders(), // Use the helper for headers
      body: JSON.stringify({ email, token }) // Send email and token in body
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Teacher auth check failed:', errorData.message);
        // If auth fails, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        window.location.href = '../Login and Register/Login.html';
        return false;
    }
    // console.log('Teacher authentication successful.');
    return true;
  } catch (error) {
    console.error('Error during teacher auth check:', error);
    // Potentially redirect or show a generic error message to the user
    window.location.href = '../Login and Register/Login.html'; // Example redirect
    return false;
  }
};

export const loadTeacherData = async () => {
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    console.error('Auth details missing for loadTeacherData');
    throw new Error("Auth details not found for loading teacher data.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/loadteacher`, { // Corrected endpoint
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, token })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to load teacher data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading teacher data:', error);
    // Handle error, e.g., show message to user, or redirect
    throw error; // Re-throw to be caught by calling function in main.js
  }
};


export const scheduleNewClass = async (classDetails) => {
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    throw new Error("Authentication details not found for scheduling class.");
  }
  
  // Add auth details to the payload for the backend to verify
  const payload = {
    ...classDetails,
    auth_email: email,
    auth_token: token
  };

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/schedule-class`, {
      method: 'POST',
      headers: getAuthHeaders(), // Content-Type: application/json
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to schedule new class');
    }
    return await response.json(); // Should return { message: "...", class: { ... } }
  } catch (error) {
    console.error('Error scheduling new class:', error);
    throw error;
  }
};

export const uploadRecording = async (recordingId, file, metadata) => {
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    throw new Error("Authentication details not found for uploading recording.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('recordingId', recordingId); // ID of the recording being updated/uploaded
  formData.append('email', email); // Auth email
  formData.append('token', token); // Auth token
  
  // Append other metadata from the form
  if (metadata.title) formData.append('title', metadata.title);
  // if (metadata.course_id) formData.append('course_id', metadata.course_id); // if using course ID
  if (metadata.courseName) formData.append('course', metadata.courseName); // if using course name
  if (metadata.date) formData.append('date', metadata.date);
  // Add any other metadata fields like description if needed by backend

  try {
    const response = await fetch(`${API_BASE_URL}/upload/recording`, { // Corrected endpoint
      method: 'POST',
      headers: getAuthHeaders(true), // Pass true for FormData to omit Content-Type
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload recording');
    }
    return await response.json(); // Expects { message, driveLink, recording }
  } catch (error) {
    console.error('Error uploading recording:', error);
    throw error;
  }
};

export const uploadPaper = async (paperData, file) => {
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('authToken');

  if (!email || !token) {
    throw new Error("Authentication details not found for uploading paper.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('data', JSON.stringify(paperData)); // title, type, course
  formData.append('email', email); // Auth email
  formData.append('token', token); // Auth token

  try {
    const response = await fetch(`${API_BASE_URL}/upload/paper`, { // Corrected endpoint
      method: 'POST',
      headers: getAuthHeaders(true), // Pass true for FormData
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload paper');
    }
    return await response.json(); // Expects { message, paper }
  } catch (error) {
    console.error('Error uploading paper:', error);
    throw error;
  }
};
