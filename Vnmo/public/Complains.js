// Complains.js

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Modal Elements
const reportModalOverlay = document.getElementById('reportModalOverlay');
const openReportModalBtn = document.getElementById('openReportModalBtn');
const closeReportModalBtn = document.getElementById('closeReportModalBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');

// Form Elements
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

// Dashboard Elements
const reportedList = document.getElementById('reportedList');
const againstList = document.getElementById('againstList');

function clearMessages() {
  if (confirmationMessage) {
    confirmationMessage.textContent = '';
    confirmationMessage.style.display = 'none';
  }
  if (errorMessage) {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }
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

function openModal() {
  clearMessages();
  reportModalOverlay.classList.add('active');
}

function closeModal() {
  reportModalOverlay.classList.remove('active');
  issueForm.reset();
  clearMessages();
}

// Modal open/close listeners
if (openReportModalBtn) openReportModalBtn.addEventListener('click', openModal);
if (closeReportModalBtn) closeReportModalBtn.addEventListener('click', closeModal);
if (cancelFormBtn) cancelFormBtn.addEventListener('click', closeModal);

// Close modal when clicking outside modal-container
if (reportModalOverlay) {
  reportModalOverlay.addEventListener('click', (e) => {
    if (e.target === reportModalOverlay) {
      closeModal();
    }
  });
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

// Fetch and Render Complaints
async function fetchComplaints() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  if (!token || !user) {
    reportedList.innerHTML = '<div class="empty-state">Please log in to view complaints.</div>';
    againstList.innerHTML = '<div class="empty-state">Please log in to view complaints.</div>';
    return;
  }

  const userId = Number(user.id);

  try {
    const response = await fetch('/api/complaints', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to load complaints');

    const complaints = await response.json();

    // Filter complaints
    const reportedUnresolved = complaints.filter(c => Number(c.complainant_id) === userId && c.status !== 'resolved');
    const complaintsAgainstMe = complaints.filter(c => Number(c.accused_id) === userId);

    renderComplaintList(reportedList, reportedUnresolved, 'No unresolved complaints reported by you.');
    renderComplaintList(againstList, complaintsAgainstMe, 'No complaints filed against you.');

  } catch (error) {
    console.error('Error fetching complaints:', error);
    reportedList.innerHTML = '<div class="empty-state">Error loading complaints.</div>';
    againstList.innerHTML = '<div class="empty-state">Error loading complaints.</div>';
  }
}

function renderComplaintList(container, list, emptyMessage) {
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="complaint-item">
      <div class="complaint-header">
        <span class="complaint-title">${c.item_name || 'Unnamed Item'}</span>
        <span class="badge ${c.severity || 'low'}">${c.severity || 'low'}</span>
      </div>
      <div class="complaint-meta">
        <span><strong>Ref:</strong> ${c.borrow_ref || 'N/A'}</span>
        <span><strong>Borrower:</strong> ${c.borrower_name || 'N/A'}</span>
        <span><strong>Status:</strong> <span class="badge ${c.status || 'open'}">${c.status || 'open'}</span></span>
      </div>
      <div class="complaint-desc">${c.description || 'No description provided.'}</div>
    </div>
  `).join('');
}

// Form Submission
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
        setTimeout(() => {
          closeModal();
          fetchComplaints();
        }, 1500);
      } else {
        showError(result.error || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Complaint submission error:', error);
      showError('Network error. Please try again.');
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  clearMessages();
  fetchComplaints();

  // Pre-fill from URL parameters (e.g. from Dashboard or Returns pages)
  const params = new URLSearchParams(window.location.search);
  const borrowId = params.get('borrowId');
  const itemName = params.get('itemName');
  const borrowerName = params.get('borrowerName');

  if (borrowId || itemName || borrowerName) {
    openModal();
    if (borrowId && borrowIdInput) borrowIdInput.value = borrowId;
    if (itemName && itemNameInput) itemNameInput.value = itemName;
    if (borrowerName && borrowerNameInput) borrowerNameInput.value = borrowerName;
  }
});
