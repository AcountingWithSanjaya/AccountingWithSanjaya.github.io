export const API_URL = 'http://helya.pylex.xyz:10209';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const checkTeacherAuth = async () => {
  const token = localStorage.getItem('authToken');
  const userEmail = localStorage.getItem('userEmail');

  if (!token || !userEmail) {
    window.location.href = '../Login and Register/Login.html';
  }

  const response = await fetch(`${API_URL}/confirmteacherloggedin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: userEmail, token })
  });

  if (!response.ok) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('returncustomer');
    throw new Error('Auth failed');
  }

  return true;
};

export const loadTeacherData = async () => {
  const token = localStorage.getItem('authToken');
  const userEmail = localStorage.getItem('userEmail');

  const response = await fetch(`${API_URL}/loadteacher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: userEmail, token })
  });

  if (!response.ok) {
    throw new Error('Failed to load teacher data');
  }

  return response.json();
};