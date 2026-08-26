// Complains.js

// ─── Modal Elements ────────────────────────────────────────────────────────────
const reportModalOverlay  = document.getElementById('reportModalOverlay');
const openReportModalBtn  = document.getElementById('openReportModalBtn');
const closeReportModalBtn = document.getElementById('closeReportModalBtn');
const cancelFormBtn       = document.getElementById('cancelFormBtn');
const issueForm           = document.getElementById('issueForm');

// ─── List Elements ─────────────────────────────────────────────────────────────
const reportedList = document.getElementById('reportedList');
const againstList  = document.getElementById('againstList');

// ─── Feedback Elements ─────────────────────────────────────────────────────────
const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage        = document.getElementById('errorMessage');

// ─── Hidden State ──────────────────────────────────────────────────────────────
let selectedBorrow = null;

// ─── Feedback helpers ──────────────────────────────────────────────────────────
function clearMessages() {
  if (confirmationMessage) { confirmationMessage.textContent = ''; confirmationMessage.style.display = 'none'; }
  if (errorMessage)        { errorMessage.textContent = '';        errorMessage.style.display = 'none'; }
}
function showError(msg) {
  if (errorMessage)        { errorMessage.textContent = msg;       errorMessage.style.display = 'block'; }
  if (confirmationMessage) { confirmationMessage.style.display = 'none'; }
}
function showSuccess(msg) {
  if (confirmationMessage) { confirmationMessage.textContent = msg; confirmationMessage.style.display = 'block'; }
  if (errorMessage)        { errorMessage.style.display = 'none'; }
}

// ─── Borrow picker ─────────────────────────────────────────────────────────────
async function loadBorrowsForPicker() {
  const token       = localStorage.getItem('token');
  const borrowGrid  = document.getElementById('borrowGrid');
  const formFields  = document.getElementById('formFields');
  if (!borrowGrid) return;

  selectedBorrow = null;
  if (formFields) formFields.style.display = 'none';
  borrowGrid.innerHTML = '<div class="picker-loading"><span class="spinner"></span> Loading your borrows\u2026</div>';

  try {
    const res     = await fetch('/api/borrows/for-complaint', { headers: { 'Authorization': `Bearer ${token}` } });
    const borrows = await res.json();

    if (!res.ok || !Array.isArray(borrows) || borrows.length === 0) {
      borrowGrid.innerHTML = `
        <div class="picker-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <p>No recent borrows to report against.<br><small>Only active or returned borrows can be disputed.</small></p>
        </div>`;
      return;
    }

    window._complainBorrows = borrows;
    borrowGrid.innerHTML = borrows.map(b => `
      <div class="borrow-pick-card" data-id="${b.id}" onclick="selectBorrow(${b.id})">
        <div class="bpc-top">
          <span class="bpc-name">${b.item_name}</span>
          <span class="bpc-badge status-${b.status}">${b.status}</span>
        </div>
        <div class="bpc-meta">
          <span>\u{1F464} ${b.my_role === 'borrower' ? 'Lent by' : 'Borrowed by'}: <strong>${b.other_party_name}</strong></span>
          <span>\u{1F4C5} ${b.issue_date ? new Date(b.issue_date).toLocaleDateString('en-IN') : (b.due_date ? 'Due ' + new Date(b.due_date).toLocaleDateString('en-IN') : 'Pending')}</span>
        </div>
        <div class="bpc-ref">${b.borrow_id || '#' + b.id}</div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loading borrows:', err);
    borrowGrid.innerHTML = '<div class="picker-empty">Could not load borrows. Please try again.</div>';
  }
}

window.selectBorrow = function(borrowId) {
  const borrow = (window._complainBorrows || []).find(b => b.id === borrowId);
  if (!borrow) return;
  selectedBorrow = borrow;

  document.querySelectorAll('.borrow-pick-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.borrow-pick-card[data-id="${borrowId}"]`)?.classList.add('selected');

  const summary = document.getElementById('selectedBorrowSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="sel-summary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>
          <strong>${borrow.item_name}</strong>
          &mdash; ${borrow.my_role === 'borrower' ? 'Lent by ' + borrow.other_party_name : 'Borrowed by ' + borrow.other_party_name}
          <span class="sel-ref">${borrow.borrow_id || '#' + borrow.id}</span>
        </span>
      </div>`;
    summary.style.display = 'block';
  }

  const formFields = document.getElementById('formFields');
  if (formFields) {
    formFields.style.display = 'block';
    formFields.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  clearMessages();
};

// ─── Modal open / close ────────────────────────────────────────────────────────
function openModal(preselectedBorrowId) {
  clearMessages();
  if (issueForm) issueForm.reset();
  selectedBorrow = null;
  const summary = document.getElementById('selectedBorrowSummary');
  if (summary) { summary.innerHTML = ''; summary.style.display = 'none'; }
  const formFields = document.getElementById('formFields');
  if (formFields) formFields.style.display = 'none';
  reportModalOverlay.classList.add('active');
  loadBorrowsForPicker().then(() => {
    if (preselectedBorrowId) window.selectBorrow(preselectedBorrowId);
  });
}

function closeModal() {
  reportModalOverlay.classList.remove('active');
  if (issueForm) issueForm.reset();
  selectedBorrow = null;
  clearMessages();
}

if (openReportModalBtn)  openReportModalBtn.addEventListener('click', () => openModal());
if (closeReportModalBtn) closeReportModalBtn.addEventListener('click', closeModal);
if (cancelFormBtn)       cancelFormBtn.addEventListener('click', closeModal);
if (reportModalOverlay) {
  reportModalOverlay.addEventListener('click', e => { if (e.target === reportModalOverlay) closeModal(); });
}

// ─── Validation ────────────────────────────────────────────────────────────────
function validateComplaintForm() {
  clearMessages();
  if (!selectedBorrow)                                              { showError('Please select a borrow transaction first.');  return false; }
  if (!document.getElementById('issueType')?.value)                { showError('Please select an issue type.');                return false; }
  if (!document.getElementById('severity')?.value)                 { showError('Please select a severity level.');             return false; }
  if (!document.getElementById('issueDescription')?.value.trim())  { showError('Please describe the issue.');                  return false; }
  return true;
}

// ─── Submission ────────────────────────────────────────────────────────────────
if (issueForm) {
  issueForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!validateComplaintForm()) return;

    const token = localStorage.getItem('token');
    if (!token) { showError('You must be logged in to submit a complaint.'); return; }

    const submitBtn = issueForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting\u2026';

    const formData = new FormData();
    formData.append('borrowId',         selectedBorrow.borrow_id || String(selectedBorrow.id));
    formData.append('itemName',         selectedBorrow.item_name);
    formData.append('borrowerName',     selectedBorrow.borrower_name);
    formData.append('issueType',        document.getElementById('issueType').value);
    formData.append('severity',         document.getElementById('severity').value);
    formData.append('issueDescription', document.getElementById('issueDescription').value.trim());

    const beforeImg = document.getElementById('beforeImage')?.files[0];
    const afterImg  = document.getElementById('afterImage')?.files[0];
    if (beforeImg) formData.append('beforeImage', beforeImg);
    if (afterImg)  formData.append('afterImage',  afterImg);

    try {
      const res    = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        showSuccess('Complaint submitted successfully!');
        issueForm.reset();
        setTimeout(() => { closeModal(); fetchComplaints(); }, 1500);
      } else {
        showError(result.error || 'Failed to submit complaint.');
      }
    } catch (err) {
      console.error('Complaint submission error:', err);
      showError('Network error. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Report';
    }
  });
}

// ─── Complaint list rendering ──────────────────────────────────────────────────
async function fetchComplaints() {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user'));
  if (!token || !user) {
    if (reportedList) reportedList.innerHTML = '<div class="empty-state">Please log in to view complaints.</div>';
    if (againstList)  againstList.innerHTML  = '<div class="empty-state">Please log in to view complaints.</div>';
    return;
  }
  const userId = Number(user.id);
  try {
    const res        = await fetch('/api/complaints', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to load complaints');
    const complaints = await res.json();
    renderComplaintList(reportedList, complaints.filter(c => Number(c.complainant_id) === userId && c.status !== 'resolved'), 'No unresolved complaints reported by you.');
    renderComplaintList(againstList,  complaints.filter(c => Number(c.accused_id)     === userId), 'No complaints filed against you.');
  } catch (err) {
    console.error('Error fetching complaints:', err);
    if (reportedList) reportedList.innerHTML = '<div class="empty-state">Error loading complaints.</div>';
    if (againstList)  againstList.innerHTML  = '<div class="empty-state">Error loading complaints.</div>';
  }
}

function renderComplaintList(container, list, emptyMessage) {
  if (!container) return;
  if (list.length === 0) { container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`; return; }
  container.innerHTML = list.map(c => `
    <div class="complaint-item">
      <div class="complaint-header">
        <span class="complaint-title">${c.item_name || 'Unnamed Item'}</span>
        <span class="badge ${c.severity || 'low'}">${c.severity || 'low'}</span>
      </div>
      <div class="complaint-meta">
        <span><strong>Ref:</strong> ${c.borrow_id || 'N/A'}</span>
        <span><strong>Type:</strong> ${c.issue_type || 'N/A'}</span>
        <span><strong>Status:</strong> <span class="badge ${c.status || 'open'}">${c.status || 'open'}</span></span>
      </div>
      <div class="complaint-desc">${c.description || 'No description provided.'}</div>
    </div>
  `).join('');
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  clearMessages();
  fetchComplaints();
  const params   = new URLSearchParams(window.location.search);
  const borrowId = params.get('borrowId');
  if (borrowId) openModal(borrowId);
});
