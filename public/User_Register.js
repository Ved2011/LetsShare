const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const registerForm = document.getElementById('registerForm');
const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage = document.getElementById('errorMessage');

function updateThemeToggleIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function showMessage(element, message) {
  element.textContent = message;
  element.style.display = 'block';
}

function clearMessages() {
  if (confirmationMessage) confirmationMessage.style.display = 'none';
  if (errorMessage) errorMessage.style.display = 'none';
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(registerForm);
    const data = {
      name: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      phone: formData.get('phone'),
      dob: formData.get('dob'),
      address: formData.get('address')
    };

    // Validate password confirmation
    if (data.password !== formData.get('confirm_password')) {
      showMessage(errorMessage, 'Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(confirmationMessage, 'Registration successful. Redirecting to login...');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
      } else {
        showMessage(errorMessage, result.error || 'Registration failed');
      }
    } catch (error) {
      showMessage(errorMessage, 'Network error. Please try again.');
    }
  });
}

initializeTheme();
clearMessages();
