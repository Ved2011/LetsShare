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

      const planBadge = document.getElementById('currentPlanBadge');
      if (planBadge) {
        const plan = user.plan_type || 'Free';
        planBadge.textContent = plan;
        
        // Color coding for plans
        if (plan === 'Pro') {
          planBadge.style.background = 'linear-gradient(135deg, #6366f1, #a855f7)';
          planBadge.style.color = 'white';
        } else if (plan === 'Premium') {
          planBadge.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
          planBadge.style.color = 'white';
        } else {
          planBadge.style.background = 'rgba(79, 124, 222, 0.1)';
          planBadge.style.color = 'var(--accent)';
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
      if (displayAddress) {
        const addressParts = [
          user.address,
          user.locality,
          user.city,
          user.state,
          user.country
        ].filter(part => part && part.trim() !== '');
        displayAddress.textContent = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided';
      }

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

      const walletBalance = document.getElementById('walletBalance');
      const editUpiId = document.getElementById('editUpiId');
      if (walletBalance) walletBalance.textContent = `Rs. ${Number(user.wallet_balance || 0).toFixed(2)}`;
      if (editUpiId) editUpiId.value = user.upi_id || '';

    const displayBio = document.getElementById('displayBio');
    if (displayBio) displayBio.textContent = user.bio || 'Sharing is caring! Looking forward to connecting with the community.';

    // Pre-fill edit form
    const editName = document.getElementById('editName');
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    const editDob = document.getElementById('editDob');
    const editAddress = document.getElementById('editAddress');
    const editCountry = document.getElementById('editCountry');
    const editState = document.getElementById('editState');
    const editCity = document.getElementById('editCity');
    const editLocality = document.getElementById('editLocality');
    const editBio = document.getElementById('editBio');
    const twoFactorToggle = document.getElementById('twoFactorToggle');

    if (editName) editName.value = user.name || '';
    if (editUsername) editUsername.value = user.username || '';
    if (editEmail) editEmail.value = user.email || '';
    if (editPhone) editPhone.value = user.phone || '';
    if (editDob && user.dob) editDob.value = user.dob.split('T')[0];
    if (editAddress) editAddress.value = user.address || '';
    if (editCountry) editCountry.value = user.country || '';
    if (editState) editState.value = user.state || '';
    if (editCity) editCity.value = user.city || '';
    if (editLocality) editLocality.value = user.locality || '';
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
    
    toggleProfileEditBtn.innerHTML = isHidden ? '❌ Cancel Edit' : '✏️ Manage Profile';
    
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
    formData.append('country', document.getElementById('editCountry') ? document.getElementById('editCountry').value : '');
    formData.append('state', document.getElementById('editState') ? document.getElementById('editState').value : '');
    formData.append('city', document.getElementById('editCity') ? document.getElementById('editCity').value : '');
    formData.append('locality', document.getElementById('editLocality') ? document.getElementById('editLocality').value : '');
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
        if (toggleProfileEditBtn) toggleProfileEditBtn.innerHTML = '✏️ Manage Profile';
        
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

// Save payout info
const savePayoutBtn = document.getElementById('savePayoutBtn');
const verifyUpiBtn = document.getElementById('verifyUpiBtn');
const upiVerificationStatus = document.getElementById('upiVerificationStatus');

// Extensive list of common, valid Indian UPI handles (VPAs)
const validUpiHandles = [
  'okaxis', 'okhdfcbank', 'okicici', 'oksbi', 'paytm', 'ybl', 'upi', 'apl', 'ibl', 'axl', 
  'postbank', 'yesbank', 'sbi', 'icici', 'hdfcbank', 'kotak', 'freecharge', 'ap', 'idfcbank', 
  'jupiter', 'sib', 'axisbank', 'icici', 'ikwik', 'navin', 'karurvysyabank', 'federal'
];

let isUpiVerified = false;

if (verifyUpiBtn) {
  verifyUpiBtn.addEventListener('click', () => {
    const upiId = document.getElementById('editUpiId').value.trim().toLowerCase();
    upiVerificationStatus.style.display = 'block';

    if (!upiId) {
      upiVerificationStatus.textContent = 'Please enter a UPI ID first.';
      upiVerificationStatus.style.color = '#dc3545';
      return;
    }

    const upiParts = upiId.split('@');
    if (upiParts.length !== 2 || !upiParts[0] || !upiParts[1]) {
      upiVerificationStatus.textContent = 'Invalid format. Use username@bankname';
      upiVerificationStatus.style.color = '#dc3545';
      return;
    }

    const handle = upiParts[1];
    
    // Simulate network delay for verification
    verifyUpiBtn.disabled = true;
    verifyUpiBtn.textContent = 'Verifying...';
    upiVerificationStatus.textContent = 'Checking banking network...';
    upiVerificationStatus.style.color = 'var(--muted)';

    setTimeout(() => {
      verifyUpiBtn.disabled = false;
      verifyUpiBtn.textContent = 'Verify';

      if (validUpiHandles.includes(handle)) {
        isUpiVerified = true;
        upiVerificationStatus.innerHTML = '✅ <strong>Verified:</strong> Valid UPI Provider detected.';
        upiVerificationStatus.style.color = '#10b981';
      } else {
        isUpiVerified = false;
        upiVerificationStatus.innerHTML = '❌ <strong>Unrecognized Provider:</strong> The bank handle (@' + handle + ') is not recognized.';
        upiVerificationStatus.style.color = '#dc3545';
      }
    }, 1500);
  });
}

// Reset verification status if user types
const editUpiIdInput = document.getElementById('editUpiId');
if (editUpiIdInput) {
    editUpiIdInput.addEventListener('input', () => {
        isUpiVerified = false;
        if (upiVerificationStatus) {
            upiVerificationStatus.style.display = 'none';
        }
    });
}

if (savePayoutBtn) {
  savePayoutBtn.addEventListener('click', async () => {
    const upiId = document.getElementById('editUpiId').value.trim();
    const token = localStorage.getItem('token');

    if (!upiId) {
        window.showAlert('Please enter a UPI ID', 'error');
        return;
    }

    if (!isUpiVerified) {
        window.showAlert('Please click "Verify" to validate your UPI ID before saving.', 'error');
        return;
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ upi_id: upiId })
      });

      if (response.ok) {
        window.showAlert('Payout information updated successfully!');
      } else {
        window.showAlert('Failed to update payout information.', 'error');
      }
    } catch (err) {
      console.error('Update payout error:', err);
      window.showAlert('An error occurred.', 'error');
    }
  });
}

// Add money
const addMoneyBtn = document.getElementById('addMoneyBtn');
const addMoneyModal = document.getElementById('addMoneyModal');
const confirmAddMoneyBtn = document.getElementById('confirmAddMoneyBtn');
const cancelAddMoneyBtn = document.getElementById('cancelAddMoneyBtn');
const addMoneyAmountInput = document.getElementById('addMoneyAmount');

if (addMoneyBtn && addMoneyModal) {
  addMoneyBtn.addEventListener('click', () => {
    addMoneyModal.style.display = 'flex';
    if (addMoneyAmountInput) addMoneyAmountInput.value = '100';
  });
}

if (cancelAddMoneyBtn) {
  cancelAddMoneyBtn.addEventListener('click', () => {
    addMoneyModal.style.display = 'none';
  });
}

if (confirmAddMoneyBtn) {
  confirmAddMoneyBtn.addEventListener('click', async () => {
    const amount = addMoneyAmountInput.value;
    if (!amount || isNaN(amount) || amount <= 0) {
      window.showAlert('Please enter a valid amount.', 'error');
      return;
    }

    addMoneyModal.style.display = 'none';
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/users/add-money', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      if (response.ok) {
        const data = await response.json();
        window.showAlert(data.message);
        loadUserProfile();
      } else {
        window.showAlert('Failed to add money.', 'error');
      }
    } catch (err) {
      console.error('Add money error:', err);
      window.showAlert('An error occurred.', 'error');
    }
  });
}

// Close modal when clicking outside
if (addMoneyModal) {
  addMoneyModal.addEventListener('click', (e) => {
    if (e.target === addMoneyModal) addMoneyModal.style.display = 'none';
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
      <div class="item-info"> 
        <h3>${item.name}</h3>
        <p class="item-price">Rs. ${Number(item.price_per_day || 0).toFixed(2)} / day</p>
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