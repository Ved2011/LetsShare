const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const registerForm = document.getElementById('registerForm');

function updateThemeToggleIcon(theme) {
  if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
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

    const formData = new FormData(registerForm);
    const data = {
      name: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      phone: formData.get('phone'),
      dob: formData.get('dob'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      locality: formData.get('locality'),
      country: formData.get('country'),
      recaptchaToken: typeof grecaptcha !== "undefined" ? grecaptcha.getResponse() : null
    };

    // Validate password confirmation
    if (data.password !== formData.get('confirm_password')) {
      window.showAlert('Passwords do not match', 'error');
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(data.password)) {
      window.showAlert('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.', 'error');
      return;
    }

    if (data.recaptchaToken === null && typeof grecaptcha !== "undefined") {
      window.showAlert('Please complete the reCAPTCHA.', 'error');
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
        // Reset reCAPTCHA on successful registration
        if(typeof grecaptcha !== "undefined") grecaptcha.reset();
        window.showAlert('Registration successful. Please check your email for the verification code.', 'success');
        setTimeout(() => {
          window.location.href = `verify.html?userId=${result.userId}`;
        }, 1500);
      } else {
        window.showAlert(result.error || 'Registration failed', 'error');
      }
      if(typeof grecaptcha !== "undefined") grecaptcha.reset(); // Reset reCAPTCHA on failure
    } catch (error) {
      window.showAlert('Network error. Please try again.', 'error');
      if(typeof grecaptcha !== "undefined") grecaptcha.reset(); // Reset reCAPTCHA on network error
    }
  });
}

initializeTheme();

const regPassword = document.getElementById('regPassword');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');

if (regPassword && strengthBar && strengthText) {
  regPassword.addEventListener('input', function() {
    const val = this.value;
    let strength = 0;
    
    if (val.length >= 8) strength += 1;
    if (/[A-Z]/.test(val)) strength += 1;
    if (/[a-z]/.test(val)) strength += 1;
    if (/[0-9]/.test(val)) strength += 1;
    if (/[@$!%*?&]/.test(val)) strength += 1;
    
    strengthBar.className = 'strength-bar';
    
    if (val.length === 0) {
      strengthBar.style.width = '0';
      strengthText.textContent = 'Password strength';
    } else if (strength <= 2) {
      strengthBar.classList.add('strength-weak');
      strengthText.textContent = 'Weak';
    } else if (strength <= 4) {
      strengthBar.classList.add('strength-medium');
      strengthText.textContent = 'Medium';
    } else {
      strengthBar.classList.add('strength-strong');
      strengthText.textContent = 'Strong';
    }
  });
}
