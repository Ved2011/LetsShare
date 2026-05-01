// issue_Item.js for borrow

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const issueItemForm = document.getElementById('issueItemForm');

const itemIdInput = document.getElementById('itemId');
const borrowerNameInput = document.getElementById('borrowerName');
const borrowerEmailInput = document.getElementById('borrowerEmail');
const issueDateInput = document.getElementById('issueDate');
const dueDateInput = document.getElementById('dueDate');
const durationInput = document.getElementById('duration');

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

function validateBorrowForm() {
  clearMessages();

  if (!itemIdInput.value.trim()) {
    showError('Item ID is required.');
    return false;
  }

  if (!borrowerNameInput.value.trim()) {
    showError('Borrower name is required.');
    return false;
  }

  if (!borrowerEmailInput.value.trim()) {
    showError('Borrower email is required.');
    return false;
  }

  if (!issueDateInput.value) {
    showError('Issue date is required.');
    return false;
  }

  if (!dueDateInput.value) {
    showError('Due date is required.');
    return false;
  }

  if (!durationInput.value) {
    showError('Duration is required.');
    return false;
  }

  return true;
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (issueItemForm) {
  issueItemForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!validateBorrowForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showError('You must be logged in to issue an item.');
      return;
    }

    const data = {
      itemId: itemIdInput.value.trim(),
      borrowerEmail: borrowerEmailInput.value.trim(),
      dueDate: dueDateInput.value,
    };

    try {
      const response = await fetch('http://localhost:3000/api/borrows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Item issued successfully!');
        issueItemForm.reset();
      } else {
        showError(result.error || 'Failed to issue item');
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

function updateThemeToggleIconIssue(theme) {
  themeToggleIssue.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleThemeIssue() {
  const currentTheme = htmlIssue.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlIssue.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  updateThemeToggleIconIssue(nextTheme);
}

function clearMessagesIssue() {
  if (confirmationMessageIssue) confirmationMessageIssue.style.display = 'none';
  if (errorMessageIssue) errorMessageIssue.style.display = 'none';
}

function showErrorIssue(message) {
  if (!errorMessageIssue || !confirmationMessageIssue) return;
  errorMessageIssue.textContent = message;
  errorMessageIssue.style.display = 'block';
  confirmationMessageIssue.style.display = 'none';
}

function showSuccessIssue(message) {
  if (!errorMessageIssue || !confirmationMessageIssue) return;
  confirmationMessageIssue.textContent = message;
  confirmationMessageIssue.style.display = 'block';
  errorMessageIssue.style.display = 'none';
}

// ==========================
// UNIVERSAL CLEAR BUTTON SYSTEM
// ==========================
function setupClearButtons() {
  document.querySelectorAll('.clear-btn').forEach(btn => {

    btn.addEventListener('click', () => {
      const form = btn.closest('form');
      if (!form) return;

      // 🔴 CONFIRMATION
      if (!confirm('Clear all fields?')) return;

      // 🟢 ANIMATION START
      form.classList.add('clearing');

      setTimeout(() => {
        form.reset();

        // 🧼 EXTRA CLEANUP
        clearExtraUI(form);

        form.classList.remove('clearing');

        // 🔵 TOAST FEEDBACK
        showToast('Form cleared');

      }, 200);
    });

  });
}


// ==========================
// EXTRA CLEANUP
// ==========================
function clearExtraUI(form) {

  // clear messages
  form.querySelectorAll('.error, .success').forEach(el => {
    el.textContent = '';
  });

  // clear image previews
  form.querySelectorAll('img').forEach(img => {
    img.src = '';
  });

  // reset selects
  form.querySelectorAll('select').forEach(s => {
    s.selectedIndex = 0;
  });

  // reset checkboxes + radios
  form.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(i => {
    i.checked = false;
  });
}


// ==========================
// TOAST SYSTEM
// ==========================
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}


// ==========================
// INIT
// ==========================
document.addEventListener('DOMContentLoaded', setupClearButtons);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateIssueForm() {
  clearMessagesIssue();

  if (!itemIdInput.value.trim()) {
    showErrorIssue('Item ID is required.');
    return false;
  }

  if (!issueTitleInput.value.trim()) {
    showErrorIssue('Issue title is required.');
    return false;
  }

  if (!issueTypeSelect.value) {
    showErrorIssue('Please select an issue type.');
    return false;
  }

  if (!issueDescriptionInput.value.trim()) {
    showErrorIssue('Issue description is required.');
    return false;
  }

  if (contactEmailInput.value && !isValidEmail(contactEmailInput.value)) {
    showErrorIssue('Please enter a valid email address.');
    return false;
  } else if (!contactEmailInput.value.trim()) {
    showErrorIssue('Contact email is required.');
    return false;
  } 

  return true;
}

if (themeToggleIssue) {
  themeToggleIssue.addEventListener('click', toggleThemeIssue);
}

if (issueForm) {
  issueForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (validateIssueForm()) {
      showSuccessIssue('Issue report submitted successfully.');
      issueForm.reset();
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initializeThemeIssue();
  clearMessagesIssue();
});
