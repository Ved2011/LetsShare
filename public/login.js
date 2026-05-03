// login.js
let captchaText;
const html = document.documentElement;
const loginForm = document.getElementById('loginForm');
const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage = document.getElementById('errorMessage');

function generateCaptcha() {
  const canvas = document.getElementById('captchaCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1 for clarity
  captchaText = '';
  for (let i = 0; i < 6; i++) {
    captchaText += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background Noise (Lines)
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.2)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Text with random rotation/offset
  ctx.font = 'bold 24px monospace';
  ctx.textBaseline = 'middle';
  
  for (let i = 0; i < captchaText.length; i++) {
    const x = 20 + i * 20;
    const y = canvas.height / 2 + (Math.random() * 10 - 5);
    const angle = (Math.random() * 30 - 15) * Math.PI / 180;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgb(${Math.random()*150},${Math.random()*150},${Math.random()*150})`;
    ctx.fillText(captchaText[i], 0, 0);
    ctx.restore();
  }

  // Background Noise (Dots)
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.1})`;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
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

document.addEventListener('DOMContentLoaded', () => {
  generateCaptcha();
  
  const refreshBtn = document.getElementById('refreshCaptcha');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', generateCaptcha);
  }

  checkExistingSession();
  initializeTheme();
  clearMessages();
});

let pendingUserId = null;

if (loginForm) {
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!validateLoginForm()) return;

    const captchaInput = document.getElementById('captchaInput').value.trim().toUpperCase();
    if (captchaInput !== captchaText) {
      showMessage(errorMessage, 'Incorrect captcha. Please try again.');
      generateCaptcha();
      document.getElementById('captchaInput').value = '';
      return;
    }

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
        if (data.twoFactorRequired) {
          // Show OTP form
          pendingUserId = data.userId;
          loginForm.style.display = 'none';
          document.getElementById('otpForm').style.display = 'block';
          showMessage(confirmationMessage, 'Please check your console/email for the OTP code.');
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('loginTime', new Date().toISOString());
          showMessage(confirmationMessage, 'Login successful. Redirecting...');
          setTimeout(() => {
            window.location.href = 'user_Dashboard.html';
          }, 1200);
        }
      } else {
        showMessage(errorMessage, data.error || 'Login failed');
        generateCaptcha();
      }
    } catch (error) {
      showMessage(errorMessage, 'Network error. Please try again.');
      generateCaptcha();
    }
  });
}

const otpForm = document.getElementById('otpForm');
if (otpForm) {
  otpForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearMessages();
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
        showMessage(confirmationMessage, '2FA Verification successful. Redirecting...');
        setTimeout(() => {
          window.location.href = 'user_Dashboard.html';
        }, 1200);
      } else {
        showMessage(errorMessage, data.error || 'Invalid OTP');
      }
    } catch (error) {
      showMessage(errorMessage, 'Network error. Please try again.');
    }
  });
}
