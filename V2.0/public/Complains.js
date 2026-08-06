// Complains.js

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const issueForm = document.getElementById('issueForm');

const borrowIdInput = document.getElementById('borrowId');
const itemNameInput = document.getElementById('itemName');
const borrowerNameInput = document.getElementById('borrowerName');
const issueTypeSelect = document.getElementById('issueType');
const severitySelect = document.getElementById('severity');
const issueDescriptionInput = document.getElementById('issueDescription');
const beforeImageInput = document.getElementById('beforeImage');
const afterImageInput = document.getElementById('afterImage');

const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage = document.getElementById('errorMessage');

function updateThemeToggleIcon(theme) {
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
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
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
  if (confirmationMessage) {
    confirmationMessage.style.display = 'none';
  }
}

function showSuccess(message) {
  if (confirmationMessage) {
    confirmationMessage.textContent = message;
    confirmationMessage.style.display = 'block';
  }
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
}

function validateComplaintForm() {
  clearMessages();

  if (!borrowIdInput?.value.trim()) {
    showError('Borrow ID is required.');
    return false;
  }

  if (!itemNameInput?.value.trim()) {
    showError('Item name is required.');
    return false;
  }

  if (!borrowerNameInput?.value.trim()) {
    showError('Borrower name is required.');
    return false;
  }

  if (!issueTypeSelect?.value) {
    showError('Issue type is required.');
    return false;
  }

  if (!severitySelect?.value) {
    showError('Severity is required.');
    return false;
  }

  if (!issueDescriptionInput?.value.trim()) {
    showError('Description is required.');
    return false;
  }

  if (!afterImageInput?.files || afterImageInput.files.length === 0) {
    showError('After image is required.');
    return false;
  }

  return true;
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (issueForm) {
  issueForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!validateComplaintForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showError('You must be logged in to submit a complaint.');
      return;
    }

    const formData = new FormData();
    formData.append('borrowId', borrowIdInput.value.trim());
    formData.append('itemName', itemNameInput.value.trim());
    formData.append('borrowerName', borrowerNameInput.value.trim());
    formData.append('issueType', issueTypeSelect.value);
    formData.append('severity', severitySelect.value);
    formData.append('issueDescription', issueDescriptionInput.value.trim());
    if (beforeImageInput.files[0]) {
      formData.append('beforeImage', beforeImageInput.files[0]);
    }
    formData.append('afterImage', afterImageInput.files[0]);

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Complaint submitted successfully!');
        issueForm.reset();
      } else {
        showError(result.error || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Complaint submission error:', error);
      showError('Network error. Please try again.');
    }
  });
}

const transactionSelect = document.getElementById('transactionSelect');
const transactionSelectGroup = document.getElementById('transactionSelectGroup');
const manualDetailsContainer = document.getElementById('manualDetailsContainer');

let userBorrows = [];

async function loadUserBorrows() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/borrows/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      userBorrows = await res.json();
      populateBorrowsDropdown();
    }
  } catch (err) {
    console.error('Error fetching user borrows:', err);
  }
}

function populateBorrowsDropdown() {
  if (!transactionSelect) return;
  
  transactionSelect.innerHTML = `
    <option value="">-- Choose a recent transaction or select Manual --</option>
    <option value="manual">Enter details manually</option>
  `;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  userBorrows.forEach(b => {
    const isOwner = Number(b.owner_id) === Number(user.id);
    const roleText = isOwner ? 'Lent to' : 'Borrowed from';
    const partnerName = isOwner ? b.borrower_name : b.owner_name;
    
    const option = document.createElement('option');
    option.value = b.id;
    option.textContent = `"${b.item_name}" (${roleText} ${partnerName}) - Status: ${b.status}`;
    option.dataset.borrowId = b.borrow_id;
    option.dataset.itemName = b.item_name;
    option.dataset.partnerName = partnerName;
    transactionSelect.appendChild(option);
  });
}

if (transactionSelect) {
  transactionSelect.addEventListener('change', function() {
    const val = this.value;
    if (val === 'manual') {
      manualDetailsContainer.style.display = 'block';
      borrowIdInput.value = '';
      itemNameInput.value = '';
      borrowerNameInput.value = '';
      borrowIdInput.removeAttribute('readonly');
      itemNameInput.removeAttribute('readonly');
      borrowerNameInput.removeAttribute('readonly');
    } else if (val === '') {
      manualDetailsContainer.style.display = 'none';
    } else {
      const selectedOption = this.options[this.selectedIndex];
      manualDetailsContainer.style.display = 'block';
      borrowIdInput.value = selectedOption.dataset.borrowId || '';
      itemNameInput.value = selectedOption.dataset.itemName || '';
      borrowerNameInput.value = selectedOption.dataset.partnerName || '';
      
      borrowIdInput.setAttribute('readonly', true);
      itemNameInput.setAttribute('readonly', true);
      borrowerNameInput.setAttribute('readonly', true);
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

  // Pre-fill from URL parameters
  const params = new URLSearchParams(window.location.search);
  const borrowId = params.get('borrowId');
  const itemName = params.get('itemName');
  const borrowerName = params.get('borrowerName');

  if (borrowId || itemName || borrowerName) {
    if (transactionSelectGroup) transactionSelectGroup.style.display = 'none';
    if (manualDetailsContainer) manualDetailsContainer.style.display = 'block';

    if (borrowId && borrowIdInput) {
      borrowIdInput.value = borrowId;
      borrowIdInput.setAttribute('readonly', true);
    }
    if (itemName && itemNameInput) {
      itemNameInput.value = itemName;
      itemNameInput.setAttribute('readonly', true);
    }
    if (borrowerName && borrowerNameInput) {
      borrowerNameInput.value = borrowerName;
      borrowerNameInput.setAttribute('readonly', true);
    }
  } else {
    loadUserBorrows();
  }
});
