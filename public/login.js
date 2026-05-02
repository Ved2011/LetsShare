// login.js
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const loginForm = document.getElementById('loginForm');
const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage = document.getElementById('errorMessage');

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
  if (!themeToggle) return;
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  updateThemeToggleIcon(nextTheme);
}

function showMessage(element, message) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  element.textContent = message;
  element.style.display = 'block';
}

function clearMessages() {
  confirmationMessage.style.display = 'none';
  errorMessage.style.display = 'none';
}

function getCachedAuth() {
  return {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null')
  };
}

async function checkExistingSession() {
  const { token, user } = getCachedAuth();
  if (!token) return;

  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const userData = await response.json();
      if (!user) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      window.location.href = 'user_Profile.html';
      return;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (err) {
    console.warn('Session verification failed:', err);
  }
}


function validateLoginForm() {
  clearMessages();

  const identifier = document.getElementById('identifier').value.trim();
  const password = document.getElementById('password').value;

  if (!identifier) {
    showMessage(errorMessage, 'Please enter your email or username.');
    return false;
  }

  if (!password) {
    showMessage(errorMessage, 'Please enter your password.');
    return false;
  }

  return true;
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

checkExistingSession();

if (loginForm) {
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!validateLoginForm()) return;

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('loginTime', new Date().toISOString());
        showMessage(confirmationMessage, 'Login successful. Redirecting...');
        setTimeout(() => {
          window.location.href = 'user_Profile.html';
        }, 1200);
      } else {
        showMessage(errorMessage, data.error || 'Login failed');
      }
    } catch (error) {
      showMessage(errorMessage, 'Network error. Please try again.');
    }
  });
}

initializeTheme();
clearMessages();
