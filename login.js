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
  element.textContent = message;
  element.style.display = 'block';
}

function clearMessages() {
  confirmationMessage.style.display = 'none';
  errorMessage.style.display = 'none';
}

function validateLoginForm() {
  clearMessages();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email) {
    showMessage(errorMessage, 'Please enter your email.');
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

if (loginForm) {
  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!validateLoginForm()) return;

    showMessage(confirmationMessage, 'You are now signed in. Redirecting...');
    errorMessage.style.display = 'none';

    setTimeout(() => {
      // Replace this with real navigation after login if needed.
      window.location.href = 'User_Register.html';
    }, 1200);
  });
}

initializeTheme();
clearMessages();
