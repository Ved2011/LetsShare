// userLogin.js

// ============= DARK MODE THEME TOGGLE =============
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load theme from localStorage or system preference
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', function () {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleIcon(newTheme);
});

// Initialize theme on load
initializeTheme();

// ============= FORM HANDLING =============
// Select form elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage = document.getElementById('errorMessage');

// Mock user database (in a real app, this would be server-side)
const mockUsers = [
  { username: 'admin', password: 'password123' },
  { username: 'user1', password: 'pass123' },
  { username: 'testuser', password: 'testpass' }
];

function clearMessages() {
  confirmationMessage.style.display = 'none';
  errorMessage.style.display = 'none';
}

function showError(message) {
  errorMessage.style.display = 'block';
  errorMessage.textContent = message;
  confirmationMessage.style.display = 'none';
}

function showSuccess(message) {
  confirmationMessage.style.display = 'block';
  confirmationMessage.textContent = message;
  errorMessage.style.display = 'none';
}

function validateLogin(username, password) {
  // Check if fields are filled
  if (!username.trim()) {
    showError('Please enter your username.');
    return false;
  }

  if (!password) {
    showError('Please enter your password.');
    return false;
  }

  // Check credentials against mock database
  const user = mockUsers.find(u => u.username === username && u.password === password);
  if (!user) {
    showError('Invalid username or password.');
    return false;
  }

  return true;
}

function handleLogin(event) {
  event.preventDefault();
  clearMessages();

  const username = usernameInput.value;
  const password = passwordInput.value;

  if (validateLogin(username, password)) {
    showSuccess('Login successful! Redirecting...');
    // Simulate redirect after successful login
    setTimeout(() => {
      // In a real app, this would redirect to dashboard
      alert('Welcome to LetsShare! (This would redirect to dashboard in a real app)');
      // Reset form
      loginForm.reset();
      clearMessages();
    }, 1500);
  }
}

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleLogin(event);
  }
}

// Event listeners
loginForm.addEventListener('submit', handleLogin);

// Allow Enter key to submit from password field
passwordInput.addEventListener('keydown', handleEnterKey);

// Initialize state
clearMessages();