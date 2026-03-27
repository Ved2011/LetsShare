// User_Register.js

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
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', function () {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
  });
}

// Initialize theme on load
initializeTheme();

// ============= FORM HANDLING =============
// Select form fields
const form = document.querySelector('form');
const usernameInput = document.querySelector('input[name="username"]');
const emailInput = document.querySelector('input[name="email"]');
const passwordInput = document.querySelector('input[name="password"]');
const confirmPasswordInput = document.querySelector('input[name="confirm_password"]');
const phoneInput = document.querySelector('input[name="phone"]');
const dobInput = document.querySelector('input[name="dob"]');
const addressInput = document.querySelector('input[name="address"]');

let confirmationMessage = null;
let errorMessage = null;

// Create message containers if they don't exist
function initializeMessageContainers() {
  if (!confirmationMessage) {
    confirmationMessage = document.createElement('div');
    confirmationMessage.id = 'confirmationMessage';
    confirmationMessage.style.cssText = 'display:none; padding:10px; margin-bottom:20px; background:#d4edda; color:#155724; border:1px solid #c3e6cb; border-radius:4px;';
    form.parentNode.insertBefore(confirmationMessage, form);
  }
  
  if (!errorMessage) {
    errorMessage = document.createElement('div');
    errorMessage.id = 'errorMessage';
    errorMessage.style.cssText = 'display:none; padding:10px; margin-bottom:20px; background:#f8d7da; color:#721c24; border:1px solid #f5c6cb; border-radius:4px;';
    form.parentNode.insertBefore(errorMessage, form);
  }
}

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

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function validateForm() {
  clearMessages();
  
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const phone = phoneInput.value.trim();
  const dob = dobInput.value;
  const address = addressInput.value.trim();

  // Validate username
  if (!username) {
    showError('Username is required');
    return false;
  }
  
  if (username.length < 3) {
    showError('Username must be at least 3 characters');
    return false;
  }

  // Validate email
  if (!email) {
    showError('Email is required');
    return false;
  }
  
  if (!validateEmail(email)) {
    showError('Please enter a valid email address');
    return false;
  }

  // Validate password
  if (!password) {
    showError('Password is required');
    return false;
  }
  
  if (!validatePassword(password)) {
    showError('Password must be at least 6 characters');
    return false;
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return false;
  }

  // Validate phone (if provided)
  if (phone && phone.length < 10) {
    showError('Phone number must be at least 10 digits');
    return false;
  }

  // Validate date of birth (if provided)
  if (dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      showError('You must be at least 13 years old');
      return false;
    }
  }

  // Validate address
  if (!address) {
    showError('Address is required');
    return false;
  }

  return true;
}

function resetForm() {
  form.reset();
  clearMessages();
}

// Form submission
form.addEventListener('submit', function (e) {
  e.preventDefault();
  
  if (validateForm()) {
    showSuccess('Registration successful! Welcome to LetsShare!');
    setTimeout(() => {
      resetForm();
    }, 1500);
  }
});

// Add clear button functionality if it exists
const clearButton = document.querySelector('button[type="reset"]');
if (clearButton) {
  clearButton.addEventListener('click', resetForm);
}

// Real-time password matching validation
if (confirmPasswordInput) {
  confirmPasswordInput.addEventListener('blur', function () {
    if (this.value && passwordInput.value && this.value !== passwordInput.value) {
      this.style.borderColor = '#dc3545';
    } else {
      this.style.borderColor = '';
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeMessageContainers);
