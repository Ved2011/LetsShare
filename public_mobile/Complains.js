<<<<<<< HEAD
// Complains.js — redesigned

let allComplaints = [];
let currentUser = null;

// ─── Tab Switching ───────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
  // Find and activate corresponding button
  const buttons = document.querySelectorAll('.tab-btn');
  const idx = ['unresolved', 'new', 'against'].indexOf(name);
  if (idx >= 0 && buttons[idx]) buttons[idx].classList.add('active');
}

// ─── Borrow Lookup ───────────────────────────────────────────
async function lookupBorrow() {
  const id = document.getElementById('borrowId').value.trim();
  if (!id) { window.showAlert('Please enter a Borrow ID', 'error'); return; }
  const token = localStorage.getItem('token');
  const btn = document.querySelector('.lookup-btn');
  btn.textContent = '…';
  btn.disabled = true;
  try {
    const res = await fetch(`/api/borrows/lookup/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      window.showAlert(err.error || 'Borrow not found', 'error');
      clearAutoFill();
      return;
    }
    const data = await res.json();
    // Fill hidden fields
    document.getElementById('itemName').value = data.item_name || '';
    document.getElementById('borrowerName').value = data.borrower_name || '';
    // Show preview
    document.getElementById('previewItem').textContent = data.item_name || '—';
    document.getElementById('previewBorrower').textContent = data.borrower_name || '—';
    document.getElementById('autofillPreview').classList.add('visible');
  } catch (e) {
    window.showAlert('Network error. Please try again.', 'error');
  } finally {
    btn.textContent = 'Lookup';
    btn.disabled = false;
  }
}

function clearAutoFill() {
  document.getElementById('itemName').value = '';
  document.getElementById('borrowerName').value = '';
  document.getElementById('autofillPreview').classList.remove('visible');
}

// ─── Submit Complaint ────────────────────────────────────────
async function submitComplaint(event) {
  event.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) { window.showAlert('Please log in to submit a complaint.', 'error'); return; }

  const itemName = document.getElementById('itemName').value;
  const borrowerName = document.getElementById('borrowerName').value;
  if (!itemName || !borrowerName) {
    window.showAlert('Please use the Lookup button to confirm the Borrow ID first.', 'error');
    return;
  }

  const afterImage = document.getElementById('afterImage').files[0];
  if (!afterImage) { window.showAlert('Please upload the "After" image.', 'error'); return; }

  const formData = new FormData();
  formData.append('borrowId', document.getElementById('borrowId').value.trim());
  formData.append('itemName', itemName);
  formData.append('borrowerName', borrowerName);
  formData.append('issueType', document.getElementById('issueType').value);
  formData.append('severity', document.getElementById('severity').value);
  formData.append('issueDescription', document.getElementById('issueDescription').value.trim());
  const beforeImage = document.getElementById('beforeImage').files[0];
  if (beforeImage) formData.append('beforeImage', beforeImage);
  formData.append('afterImage', afterImage);

  const btn = document.querySelector('.submit-complaint-btn');
  btn.textContent = 'Submitting…';
  btn.disabled = true;
  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const result = await res.json();
    if (res.ok) {
      window.showAlert('Complaint submitted!');
      document.getElementById('complainForm').reset();
      clearAutoFill();
      loadComplaints(); // refresh lists
      setTimeout(() => switchTab('unresolved'), 1200);
    } else {
      window.showAlert(result.error || 'Failed to submit complaint', 'error');
    }
  } catch (e) {
    window.showAlert('Network error. Please try again.', 'error');
  } finally {
    btn.textContent = 'Submit Complaint';
    btn.disabled = false;
  }
}

// ─── Complaint Card Renderer ─────────────────────────────────
function severityClass(s) {
  return s === 'high' ? 'severity-high' : s === 'medium' ? 'severity-medium' : 'severity-low';
}

function renderComplaintCard(c, showAgainst = false) {
  const statusClass = c.status === 'resolved' ? 'status-resolved' : 'status-pending';
  const statusLabel = c.status || 'pending';
  return `
    <div class="complaint-card">
      <div class="complaint-card-header">
        <div>
          <div class="complaint-item-name">${c.item_name || 'Unknown Item'}</div>
          <div class="complaint-meta">Borrow #${c.borrow_ref || c.borrow_id || c.id} · ${c.issue_type || '—'}</div>
        </div>
        <span class="severity-badge ${severityClass(c.severity)}">${c.severity || 'low'}</span>
      </div>
      ${c.description ? `<p class="complaint-desc">${c.description}</p>` : ''}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
        <span class="complaint-status-badge ${statusClass}">${statusLabel}</span>
        ${showAgainst && c.complainant_name ? `<span class="complaint-against-tag">🚨 by ${c.complainant_name}</span>` : ''}
        ${!showAgainst && c.accused_name ? `<span class="complaint-against-tag">👤 against ${c.accused_name}</span>` : ''}
      </div>
    </div>
  `;
}

// ─── Load & Render Complaints ────────────────────────────────
async function loadComplaints() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/complaints', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    allComplaints = await res.json();
    renderLists();
  } catch (e) {
    console.error('Error loading complaints:', e);
  }
}

function renderLists() {
  const userId = currentUser?.id;

  // Unresolved: filed by me, not resolved
  const unresolved = allComplaints.filter(c =>
    Number(c.complainant_id) === Number(userId) && c.status !== 'resolved'
  );
  const unresolvedList = document.getElementById('unresolvedList');
  if (unresolvedList) {
    unresolvedList.innerHTML = unresolved.length
      ? unresolved.map(c => renderComplaintCard(c, false)).join('')
      : '<div class="empty-complaints"><span class="ei">✅</span><p>No open complaints.</p></div>';
  }

  // Against me
  const against = allComplaints.filter(c => Number(c.accused_id) === Number(userId));
  const againstList = document.getElementById('againstList');
  if (againstList) {
    againstList.innerHTML = against.length
      ? against.map(c => renderComplaintCard(c, true)).join('')
      : '<div class="empty-complaints"><span class="ei">🎉</span><p>No complaints against you.</p></div>';
  }
}

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  // Set avatar
  const avatar = document.getElementById('headerAvatar');
  if (avatar && currentUser?.name) {
    avatar.textContent = currentUser.name.charAt(0).toUpperCase();
  }

  // Pre-fill borrow ID from URL params if coming from another page
  const params = new URLSearchParams(window.location.search);
  const borrowIdParam = params.get('borrowId');
  if (borrowIdParam) {
    const borrowIdInput = document.getElementById('borrowId');
    if (borrowIdInput) {
      borrowIdInput.value = borrowIdParam;
      switchTab('new');
      lookupBorrow(); // auto-lookup
    }
  }

  loadComplaints();
});

// Expose globals for HTML onclick handlers
window.switchTab = switchTab;
window.lookupBorrow = lookupBorrow;
window.clearAutoFill = clearAutoFill;
window.submitComplaint = submitComplaint;

=======
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

  if (borrowId && borrowIdInput) borrowIdInput.value = borrowId;
  if (itemName && itemNameInput) itemNameInput.value = itemName;
  if (borrowerName && borrowerNameInput) borrowerNameInput.value = borrowerName;
});
>>>>>>> 5d0a726 (wer)
