// login.js
const html = document.documentElement;
const loginForm = document.getElementById('loginForm');

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
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
      window.location.href = 'user_Dashboard.html';
      return;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (err) {
    console.warn('Session verification failed:', err);
  }
}

function validateLoginForm() {

  const identifier = document.getElementById('identifier').value.trim();
  const password = document.getElementById('password').value;

  if (!identifier) {
    window.showAlert('Please enter your email or username.', 'error');
    return false;
  }

  if (!password) {
    window.showAlert('Please enter your password.', 'error');
    return false;
  }

  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  checkExistingSession();
  initializeTheme();
});

let pendingUserId = null;

if (loginForm) {
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

if (validateLoginForm()) {
      const identifier = document.getElementById('identifier').value.trim();
      const password = document.getElementById('password').value;

      try {
        const recaptchaToken = grecaptcha.getResponse();
        if (!recaptchaToken) {
          window.showAlert('Please complete the reCAPTCHA verification.', 'error');
          return;
        }

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ identifier, password, recaptchaToken }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.twoFactorRequired) {
            // Show OTP form
            pendingUserId = data.userId;
            loginForm.style.display = 'none';
            document.getElementById('otpForm').style.display = 'block';
            window.showAlert('Please check your console/email for the OTP code.', 'success');
          } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('loginTime', new Date().toISOString());
            window.showAlert('Login successful. Redirecting...', 'success');
            setTimeout(() => {
              window.location.href = 'user_Dashboard.html';
            }, 1200);
          }
        } else {
          if (data.unverified) {
            window.showAlert(data.error, 'warning');
            setTimeout(() => {
              window.location.href = `verify.html?userId=${data.userId}`;
            }, 2000);
            return;
          }
          window.showAlert(data.error || 'Login failed', 'error');
        }
      } catch (error) {
        window.showAlert('Network error. Please try again.', 'error');
      }
    }
  });
}

const otpForm = document.getElementById('otpForm');
if (otpForm) {
  otpForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const otpCode = document.getElementById('otpCode').value.trim();

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: pendingUserId, otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('loginTime', new Date().toISOString());
        window.showAlert('2FA Verification successful. Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'user_Dashboard.html';
        }, 1200);
      } else {
        window.showAlert(data.error || 'Invalid OTP', 'error');
      }
    } catch (error) {
      window.showAlert('Network error. Please try again.', 'error');
    }
  });
}
