// user_Profile.js
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const avatar = document.getElementById('avatar');
const newItemsList = document.getElementById('newItemsList');
const myItemsList = document.getElementById('myItemsList');
const borrowedItemsList = document.getElementById('borrowedItemsList');
const createItemBtn = document.getElementById('createItemBtn');
const borrowItemBtn = document.getElementById('borrowItemBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const requestsList = document.getElementById('requestsList');

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
}

async function loadUserProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      
      if (userName) userName.textContent = user.name;
      if (userEmail) userEmail.textContent = user.email;
      if (avatar) {
        if (user.profilePictureBase64) {
          avatar.innerHTML = `<img src="data:image/jpeg;base64,${user.profilePictureBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
          avatar.textContent = user.name.charAt(0).toUpperCase();
        }
      }

      const headerAvatar = document.getElementById('headerAvatar');
      if (headerAvatar) {
        if (user.profilePictureBase64) {
          headerAvatar.innerHTML = `<img src="data:image/jpeg;base64,${user.profilePictureBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
          headerAvatar.style.overflow = 'hidden';
          headerAvatar.style.padding = '0';
        } else {
          headerAvatar.textContent = user.name.charAt(0).toUpperCase();
        }
      }

      // Populate read-only details
      const displayFullName = document.getElementById('displayFullName');
      const displayEmail = document.getElementById('displayEmail');
      const displayPhone = document.getElementById('displayPhone');
      const displayDob = document.getElementById('displayDob');
      const displayAddress = document.getElementById('displayAddress');

      if (displayFullName) displayFullName.textContent = user.name;
      if (displayEmail) displayEmail.textContent = user.email;
      if (displayPhone) displayPhone.textContent = user.phone || 'Not provided';
      if (displayDob) {
        if (user.dob) {
          const d = new Date(user.dob);
          displayDob.textContent = d.toLocaleDateString();
        } else {
          displayDob.textContent = 'Not provided';
        }
      }
      if (displayAddress) displayAddress.textContent = user.address || 'Not provided';

      // Pre-fill edit form
      const editName = document.getElementById('editName');
      const editEmail = document.getElementById('editEmail');
      const editPhone = document.getElementById('editPhone');
      const editDob = document.getElementById('editDob');
      const editAddress = document.getElementById('editAddress');
      const twoFactorToggle = document.getElementById('twoFactorToggle');

      if (editName) editName.value = user.name || '';
      if (editEmail) editEmail.value = user.email || '';
      if (editPhone) editPhone.value = user.phone || '';
      if (editDob && user.dob) editDob.value = user.dob.split('T')[0];
      if (editAddress) editAddress.value = user.address || '';
      if (twoFactorToggle) twoFactorToggle.checked = user.two_factor_enabled;

      // Update header avatar
      const headerAvatar = document.getElementById('headerAvatar');
      if (headerAvatar && !user.profilePictureBase64) headerAvatar.textContent = user.name.charAt(0).toUpperCase();

    } else if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

const toggleProfileEditBtn = document.getElementById('toggleProfileEditBtn');
const profileEditSection = document.getElementById('profileEditSection');
const profileDetailsSection = document.getElementById('profileDetailsSection');

if (toggleProfileEditBtn && profileEditSection) {
  toggleProfileEditBtn.addEventListener('click', () => {
    const isHidden = profileEditSection.style.display === 'none';
    profileEditSection.style.display = isHidden ? 'block' : 'none';
    
    if (profileDetailsSection) {
      profileDetailsSection.style.display = isHidden ? 'none' : 'block';
    }
    
    toggleProfileEditBtn.innerHTML = isHidden ? '❌ Cancel Edit' : '✏️ Manage Profile';
    
    if (isHidden) {
      profileEditSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

async function loadNewItems() {
  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      const items = await response.json();
      const newItems = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      displayItems(newItemsList, newItems);
    }
  } catch (error) {
    console.error('Error loading new items:', error);
  }
}

async function loadMyItems() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/items', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const items = await response.json();
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const myItems = items.filter(i => Number(i.owner_id) === Number(currentUser.id));
      displayItems(myItemsList, myItems, true);
    }
  } catch (error) {
    console.error('Error loading my items:', error);
  }
}

async function loadBorrowedItems() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/borrows', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const borrows = await response.json();
      displayBorrowedItems(borrowedItemsList, borrows);
    }
  } catch (error) {
    console.error('Error loading borrowed items:', error);
  }
}

async function loadRequests() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/borrows/requests', {
      headers: { 'Authorization': `Bearer ${token}` }
// Removed list rendering logic

const profileUpdateForm = document.getElementById('profileUpdateForm');
if (profileUpdateForm) {
  profileUpdateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('name', document.getElementById('editName').value);
    formData.append('email', document.getElementById('editEmail').value);
    formData.append('phone', document.getElementById('editPhone').value || '');
    formData.append('dob', document.getElementById('editDob').value || '');
    formData.append('address', document.getElementById('editAddress').value || '');
    formData.append('password', document.getElementById('editPassword').value || '');
    formData.append('two_factor_enabled', document.getElementById('twoFactorToggle').checked);

    const fileInput = document.getElementById('editProfilePic');
    if (fileInput && fileInput.files[0]) {
      formData.append('profilePicture', fileInput.files[0]);
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        loadUserProfile();
      } else {
        const err = await response.json();
        alert('Update failed: ' + err.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    }
  });
}



// Logic for Options
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

const mainLogoutBtn = document.getElementById('mainLogoutBtn');
if (mainLogoutBtn) {
  mainLogoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }
  });
}

initializeTheme();
loadUserProfile();