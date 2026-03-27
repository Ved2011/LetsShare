// item_Return.js

const themeToggleReturn = document.getElementById('themeToggle');
const htmlReturn = document.documentElement;
const returnForm = document.getElementById('returnForm');
const orderIdInput = document.getElementById('orderId');
const returnReasonSelect = document.getElementById('returnReason');
const returnConditionSelect = document.getElementById('returnCondition');

function toggleThemeReturn() {
  const currentTheme = htmlReturn.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlReturn.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  updateThemeToggleIconReturn(nextTheme);
}

function clearMessagesReturn() {
  if (confirmationMessageReturn) confirmationMessageReturn.style.display = 'none';
  if (errorMessageReturn) errorMessageReturn.style.display = 'none';
}

function showErrorReturn(message) {
  if (!errorMessageReturn || !confirmationMessageReturn) return;
  errorMessageReturn.textContent = message;
  errorMessageReturn.style.display = 'block';
  confirmationMessageReturn.style.display = 'none';
}

function showSuccessReturn(message) {
  if (!errorMessageReturn || !confirmationMessageReturn) return;
  confirmationMessageReturn.textContent = message;
  confirmationMessageReturn.style.display = 'block';
  errorMessageReturn.style.display = 'none';
}

function validateReturnForm() {
  clearMessagesReturn();

  if (!orderIdInput.value.trim()) {
    showErrorReturn('Order / Item ID is required.');
    return false;
  }

  if (!returnReasonSelect.value) {
    showErrorReturn('Please select a return reason.');
    return false;
  }

  if (!returnConditionSelect.value) {
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
