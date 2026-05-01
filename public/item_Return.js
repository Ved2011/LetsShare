// item_Return.js

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const returnForm = document.getElementById('issueItemForm');
const itemIdInput = document.getElementById('itemId');
const itemNameInput = document.getElementById('itemName');
const ownerEmailInput = document.getElementById('ownerEmail');
const borrowerEmailInput = document.getElementById('borrowerEmail');
const returnConditionSelect = document.getElementById('returnCondition');
const returnDateInput = document.getElementById('returnDate');
const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage = document.getElementById('errorMessage');

function updateThemeToggleIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  updateThemeToggleIcon(nextTheme);
}

function clearMessages() {
  if (confirmationMessage) confirmationMessage.style.display = 'none';
  if (errorMessage) errorMessage.style.display = 'none';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  confirmationMessage.style.display = 'none';
}

function showSuccess(message) {
  confirmationMessage.textContent = message;
  confirmationMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

function validateReturnForm() {
  clearMessages();

  if (!itemIdInput.value.trim()) {
    showError('Item ID is required.');
    return false;
  }

  if (!itemNameInput.value.trim()) {
    showError('Item name is required.');
    return false;
  }

  if (!ownerEmailInput.value.trim()) {
    showError('Owner email is required.');
    return false;
  }

  if (!borrowerEmailInput.value.trim()) {
    showError('Borrower email is required.');
    return false;
  }

  if (!returnConditionSelect.value) {
    showError('Return condition is required.');
    return false;
  }

  if (!returnDateInput.value) {
    showError('Return date is required.');
    return false;
  }

  return true;
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (returnForm) {
  returnForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!validateReturnForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showError('You must be logged in to log a return.');
      return;
    }

    const data = {
      itemId: itemIdInput.value.trim(),
      borrowerEmail: borrowerEmailInput.value.trim(),
      condition: returnConditionSelect.value,
      notes: '', // optional
    };

    try {
      const response = await fetch('http://localhost:3000/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Return logged successfully!');
        returnForm.reset();
      } else {
        showError(result.error || 'Failed to log return');
      }
    } catch (error) {
      showError('Network error. Please try again.');
    }
  });
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

document.addEventListener('DOMContentLoaded', function () {
  initializeTheme();
  clearMessages();
});

  if (!itemName.value.trim()) {
    showErrorReturn('Item name is required.');
    return false;
  }
  if (!name.value.trim()) {
    showErrorReturn('Your name is required.');
    return false;
  }

  if (!ownerEmail.value.trim() || !/\S+@\S+\.\S+/.test(ownerEmail.value)) {
    showErrorReturn('A valid owner email is required.');
    return false;
  }

  if (!borrowerEmail.value.trim() || !/\S+@\S+\.\S+/.test(borrowerEmail.value)) {
    showErrorReturn('A valid borrower email is required.');
    return false;
  }

  if (!returnDate.value) {
    showErrorReturn('Return date is required.');
    return false;
  } 
  
  if (!returnCondition.value) {
    showErrorReturn('Please select the item condition.');
    return false;
  }

  return true;
}

if (themeToggleReturn) {
  themeToggleReturn.addEventListener('click', toggleThemeReturn);
}

if (returnForm) {
  returnForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (validateReturnForm()) {
      showSuccessReturn('Return request submitted successfully.');
      returnForm.reset();
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initializeThemeReturn();
  clearMessagesReturn();
});
