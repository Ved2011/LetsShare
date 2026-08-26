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

      const displayUsernameMain = document.getElementById('displayUsernameMain');
      if (displayUsernameMain) displayUsernameMain.textContent = user.username || 'notset';

      if (avatar) {
        if (user.profilePictureBase64) {
          avatar.innerHTML = `<img src="data:image/jpeg;base64,${user.profilePictureBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
          avatar.textContent = (user.username || user.name || '?').charAt(0).toUpperCase();
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
      const displayUsername = document.getElementById('displayUsername');
      const displayEmail = document.getElementById('displayEmail');
      const displayPhone = document.getElementById('displayPhone');
      const displayDob = document.getElementById('displayDob');
      const displayAddress = document.getElementById('displayAddress');

      if (displayFullName) displayFullName.textContent = user.name;
      if (displayUsername) displayUsername.textContent = user.username ? `@${user.username}` : 'Not set';
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
      
      const displayLocality = document.getElementById('displayLocality');
      const displayCity = document.getElementById('displayCity');
      const displayState = document.getElementById('displayState');
      const displayCountry = document.getElementById('displayCountry');
      
      if (displayLocality) displayLocality.textContent = user.locality || 'Not provided';
      if (displayCity) displayCity.textContent = user.city || 'Not provided';
      if (displayState) displayState.textContent = user.state || 'Not provided';
      if (displayCountry) displayCountry.textContent = user.country || 'Not provided';

      const missingFields = [];
      if (!user.username) missingFields.push('Username');
      if (!user.phone) missingFields.push('Phone Number');
      if (!user.dob) missingFields.push('Date of Birth');
      if (!user.address) missingFields.push('Address');

      if (missingFields.length > 0) {
        const msg = `${missingFields.join(', ')} is not filled and you must fill it!`;
        setTimeout(() => {
          if (window.showAlert) window.showAlert(msg, 'warning');
          else alert(msg);
        }, 300);
      }

      const displayBio = document.getElementById('displayBio');
    if (displayBio) displayBio.textContent = user.bio || 'Sharing is caring! Looking forward to connecting with the community.';

    // Pre-fill edit form
    const editName = document.getElementById('editName');
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    const editDob = document.getElementById('editDob');
    const editAddress = document.getElementById('editAddress');
    const editLocality = document.getElementById('editLocality');
    const editCity = document.getElementById('editCity');
    const editState = document.getElementById('editState');
    const editCountry = document.getElementById('editCountry');
    const editBio = document.getElementById('editBio');
    const twoFactorToggle = document.getElementById('twoFactorToggle');

    if (editName) editName.value = user.name || '';
    if (editUsername) editUsername.value = user.username || '';
    if (editEmail) editEmail.value = user.email || '';
    if (editPhone) editPhone.value = user.phone || '';
    if (editDob && user.dob) editDob.value = user.dob.split('T')[0];
    if (editAddress) editAddress.value = user.address || '';
    if (editLocality) editLocality.value = user.locality || '';
    if (editCity) editCity.value = user.city || '';
    if (editState) editState.value = user.state || '';
    if (editCountry) editCountry.value = user.country || '';
    if (editBio) editBio.value = user.bio || '';
      if (twoFactorToggle) {
        twoFactorToggle.checked = user.two_factor_enabled;
        
        // Add listener for immediate save
        twoFactorToggle.onchange = async () => {
          const isEnabled = twoFactorToggle.checked;
          const formData = new FormData();
          // We need to send all required fields or update the backend to support partial updates
          // But since the backend expects everything in the PUT /me route, we'll use a simpler approach if possible
          // or just reuse the save logic.
          // For now, let's just trigger a click on the save button if it exists, or fetch the API directly.
          
          try {
            const updateRes = await fetch('/api/users/me', {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` },
              body: (function() {
                const fd = new FormData();
                fd.append('name', user.name);
                fd.append('email', user.email);
                fd.append('two_factor_enabled', isEnabled);
                return fd;
              })()
            });
            if (updateRes.ok) {
              window.showAlert(`Two-Factor Authentication ${isEnabled ? 'enabled' : 'disabled'}`);
            } else {
              twoFactorToggle.checked = !isEnabled; // revert
              window.showAlert('Failed to update security settings', 'error');
            }
          } catch (err) {
            twoFactorToggle.checked = !isEnabled; // revert
            window.showAlert('Server error', 'error');
          }
        };
      }

      // Update header avatar
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
    
    toggleProfileEditBtn.innerHTML = isHidden ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel Edit' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Manage Profile';
    
    if (isHidden) {
      profileEditSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

const togglePasswordFieldsBtn = document.getElementById('togglePasswordFieldsBtn');
const passwordFieldsContainer = document.getElementById('passwordFieldsContainer');
if (togglePasswordFieldsBtn && passwordFieldsContainer) {
  togglePasswordFieldsBtn.addEventListener('click', () => {
    const isHidden = passwordFieldsContainer.style.display === 'none';
    passwordFieldsContainer.style.display = isHidden ? 'flex' : 'none';
    togglePasswordFieldsBtn.textContent = isHidden ? 'Cancel Password Change' : 'Change Password';
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
    });
    if (response.ok) {
      const requests = await response.json();
      if (requestsList) {
        if (requests.length === 0) {
          requestsList.innerHTML = '<p style="text-align: center; color: var(--muted); margin: 2rem 0;">No pending requests.</p>';
        } else {
          // Simplified rendering for now to restore functionality
          requestsList.innerHTML = requests.map(req => `
            <div class="request-card" style="padding: 1rem; background: var(--card-bg); border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--border);">
              <p>Request for item ID: ${req.item_id}</p>
              <p>Status: ${req.status}</p>
            </div>
          `).join('');
        }
      }
    }
  } catch (error) {
    console.error('Error loading requests:', error);
  }
}

const profileUpdateForm = document.getElementById('profileUpdateForm');
if (profileUpdateForm) {
  profileUpdateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('name', document.getElementById('editName').value);
    formData.append('username', document.getElementById('editUsername').value || '');
    formData.append('email', document.getElementById('editEmail').value);
    formData.append('phone', document.getElementById('editPhone').value || '');
    formData.append('dob', document.getElementById('editDob').value || '');
    formData.append('address', document.getElementById('editAddress').value || '');
    formData.append('locality', document.getElementById('editLocality').value || '');
    formData.append('city', document.getElementById('editCity').value || '');
    formData.append('state', document.getElementById('editState').value || '');
    formData.append('country', document.getElementById('editCountry').value || '');
    formData.append('bio', document.getElementById('editBio').value || '');
    
    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass) {
      if (newPass !== confirmPass) {
        window.showAlert('New passwords do not match!', 'error');
        return;
      }
      formData.append('oldPassword', oldPass);
      formData.append('newPassword', newPass);
    }

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
        window.showAlert('Profile updated successfully!');
        
        // Hide edit section and show details
        if (profileEditSection) profileEditSection.style.display = 'none';
        if (profileDetailsSection) profileDetailsSection.style.display = 'block';
        if (toggleProfileEditBtn) toggleProfileEditBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Manage Profile';
        
        // Reset password fields
        const passwordFieldsContainer = document.getElementById('passwordFieldsContainer');
        const togglePasswordFieldsBtn = document.getElementById('togglePasswordFieldsBtn');
        if (passwordFieldsContainer) passwordFieldsContainer.style.display = 'none';
        if (togglePasswordFieldsBtn) togglePasswordFieldsBtn.textContent = 'Change Password';
        if (document.getElementById('oldPassword')) document.getElementById('oldPassword').value = '';
        if (document.getElementById('newPassword')) document.getElementById('newPassword').value = '';
        if (document.getElementById('confirmPassword')) document.getElementById('confirmPassword').value = '';

        loadUserProfile();
      } else {
        const err = await response.json();
        window.showAlert('Update failed: ' + err.error, 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      window.showAlert('Failed to update profile', 'error');
    }
  });
}

// Logic for Options
const fileInput = document.getElementById('editProfilePic');
const cropPreviewContainer = document.getElementById('cropPreviewContainer');
const cropPreviewImg = document.getElementById('cropPreviewImg');
const repositionCircle = document.getElementById('repositionCircle');
const yOffsetRange = document.getElementById('yOffsetRange');
const yOffsetVal = document.getElementById('yOffsetVal');
const resetRepositionBtn = document.getElementById('resetRepositionBtn');

const zoomRange = document.getElementById('zoomRange');
const zoomVal = document.getElementById('zoomVal');

const xOffsetRange = document.getElementById('xOffsetRange');
const xOffsetVal = document.getElementById('xOffsetVal');

let activeDrag = false;
let startX = 0;
let startY = 0;
let currentLeftPercent = 50;
let currentTopPercent = 50;
let currentZoom = 1.0;

if (fileInput) {
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        cropPreviewImg.src = event.target.result;
        cropPreviewContainer.style.display = 'block';
        currentTopPercent = 50;
        currentLeftPercent = 50;
        currentZoom = 1.0;
        if (zoomRange) zoomRange.value = 100;
        updateRepositionUI(currentLeftPercent, currentTopPercent, currentZoom);
      };
      reader.readAsDataURL(file);
    } else {
      cropPreviewContainer.style.display = 'none';
    }
  });
}

function updateRepositionUI(xPercent = currentLeftPercent, yPercent = currentTopPercent, zoom = currentZoom) {
  yOffsetRange.value = yPercent;
  yOffsetVal.textContent = yPercent;
  
  if (xOffsetRange) {
    xOffsetRange.value = xPercent;
  }
  if (xOffsetVal) {
    xOffsetVal.textContent = xPercent;
  }
  
  if (zoomRange) {
    zoomRange.value = Math.round(zoom * 100);
  }
  if (zoomVal) {
    zoomVal.textContent = zoom.toFixed(1);
  }
  
  const xShift = (xPercent - 50) * 0.8;
  const yShift = (yPercent - 50) * 0.8;
  cropPreviewImg.style.transform = `scale(${zoom}) translate(${xShift}px, ${yShift}px)`;
  cropPreviewContainer.dataset.xOffset = xPercent;
  cropPreviewContainer.dataset.yOffset = yPercent;
  cropPreviewContainer.dataset.zoom = zoom;
}

if (yOffsetRange) {
  yOffsetRange.addEventListener('input', function() {
    currentTopPercent = parseInt(this.value);
    updateRepositionUI(currentLeftPercent, currentTopPercent, currentZoom);
  });
}

if (xOffsetRange) {
  xOffsetRange.addEventListener('input', function() {
    currentLeftPercent = parseInt(this.value);
    updateRepositionUI(currentLeftPercent, currentTopPercent, currentZoom);
  });
}

if (zoomRange) {
  zoomRange.addEventListener('input', function() {
    currentZoom = parseInt(this.value) / 100;
    updateRepositionUI(currentLeftPercent, currentTopPercent, currentZoom);
  });
}

if (repositionCircle) {
  repositionCircle.addEventListener('mousedown', function(e) {
    activeDrag = true;
    startX = e.clientX;
    startY = e.clientY;
    repositionCircle.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', function(e) {
    if (!activeDrag) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    startX = e.clientX;
    startY = e.clientY;
    currentLeftPercent = Math.max(0, Math.min(100, currentLeftPercent + deltaX * 0.5));
    currentTopPercent = Math.max(0, Math.min(100, currentTopPercent + deltaY * 0.5));
    updateRepositionUI(currentLeftPercent, currentTopPercent, currentZoom);
  });

  document.addEventListener('mouseup', function() {
    if (activeDrag) {
      activeDrag = false;
      repositionCircle.style.cursor = 'grab';
    }
  });

  repositionCircle.addEventListener('touchstart', function(e) {
    activeDrag = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });

  repositionCircle.addEventListener('touchmove', function(e) {
    if (!activeDrag) return;
    const deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentLeftPercent = Math.max(0, Math.min(100, currentLeftPercent + deltaX * 0.5));
    currentTopPercent = Math.max(0, Math.min(100, currentTopPercent + deltaY * 0.5));
    updateRepositionUI(currentLeftPercent, currentTopPercent, currentZoom);
  });

  repositionCircle.addEventListener('touchend', function() {
    activeDrag = false;
  });
}

if (resetRepositionBtn) {
  resetRepositionBtn.addEventListener('click', function() {
    currentTopPercent = 50;
    currentLeftPercent = 50;
    currentZoom = 1.0;
    updateRepositionUI(currentLeftPercent, currentTopPercent, currentZoom);
  });
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

const mainLogoutBtn = document.getElementById('mainLogoutBtn');
if (mainLogoutBtn) {
  mainLogoutBtn.addEventListener('click', () => {
    window.showConfirm('Are you sure you want to logout?', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  });
}



function displayItems(container, items, isMyItems = false) {
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--muted); margin: 2rem 0;">No items found.</p>';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="item-card" onclick="window.location.href='item_View.html?id=${item.id}'">
      <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}">
      <div class="item-info">
        <h3>${item.name}</h3>
        <span class="status ${item.status}">${item.status}</span>
        ${isMyItems ? `<button onclick="event.stopPropagation(); window.location.href='ItemForm.html?id=${item.id}'" class="btn outline" style="width:100%; margin-top:0.5rem; padding: 0.5rem;">Edit Item</button>` : ''}
      </div>
    </div>
  `).join('');
}

function displayBorrowedItems(container, borrows) {
  if (!container) return;
  if (borrows.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--muted); margin: 2rem 0;">You haven\'t borrowed anything yet.</p>';
    return;
  }

  container.innerHTML = borrows.map(b => `
    <div class="item-card" onclick="window.location.href='item_View.html?id=${b.item_id}'">
      <img src="${b.imageBase64 || 'assets/untitled.png'}" alt="${b.name}">
      <div class="item-info">
        <h3>${b.name}</h3>
        <p style="font-size: 0.85rem; color: var(--muted);">Status: <span class="status ${b.status}">${b.status}</span></p>
        <p style="font-size: 0.85rem; color: var(--muted);">Due: ${new Date(b.due_date).toLocaleDateString()}</p>
      </div>
    </div>
  `).join('');
}

initializeTheme();
loadUserProfile();
loadNewItems();
loadMyItems();
loadBorrowedItems();
loadRequests();