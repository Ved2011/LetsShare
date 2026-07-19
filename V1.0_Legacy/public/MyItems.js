// MyItems.js - Dedicated page for desktop uploaded items

let allItems = [];
let myItemsListContainer;

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  myItemsListContainer = document.getElementById('myItemsList');
  loadMyItems();
});

async function loadMyItems() {
  if (!token) return;

  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      const items = await response.json();
      allItems = items;
      const myItems = items.filter(item => item.owner_id === user.id);
      displayMyItems(myItems);
    } else {
      console.error('Failed to fetch items');
    }
  } catch (error) {
    console.error('Error fetching items:', error);
  }
}

function displayMyItems(items) {
  if (!myItemsListContainer) return;
  myItemsListContainer.innerHTML = '';
  
  if (!items.length) {
    myItemsListContainer.innerHTML = '<p class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--muted);">You haven\'t uploaded any items yet.</p>';
    return;
  }

  // Sort by newest
  const sortedItems = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  myItemsListContainer.innerHTML = sortedItems.map(item => `
    <div class="community-card" onclick="window.location.href='item_View.html?id=${item.id}'" style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem;">
      <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}" style="width: 100%; height: 160px; border-radius: 12px; object-fit: cover; background: #f1f5f9;">
      <div style="flex: 1;">
        <h4 style="margin: 0; font-size: 1rem; line-height: 1.4;">${item.name}</h4>
        <p style="color: var(--accent); font-weight: 700; margin-top: 0.25rem;">Rs. ${Number(item.price_per_day || 0).toFixed(2)} / day</p>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
        <button class="btn small outline" style="flex: 1; padding: 0.4rem;" onclick="event.stopPropagation(); editItem(${item.id})">Edit</button>
        <button class="btn small danger" style="padding: 0.4rem;" onclick="event.stopPropagation(); deleteItem(${item.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
    </div>
  `).join('');
}

function editItem(itemId) {
  window.location.href = `ItemForm.html?id=${itemId}`;
}

async function deleteItem(itemId) {
  if (typeof window.showConfirm === 'function') {
    window.showConfirm('Are you sure you want to delete this item?', async () => {
      await proceedDelete(itemId);
    });
  } else {
    if (confirm('Are you sure you want to delete this item?')) {
      await proceedDelete(itemId);
    }
  }
}

async function proceedDelete(itemId) {
  try {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      if (typeof window.showAlert === 'function') {
        window.showAlert('Item deleted successfully');
      } else {
        alert('Item deleted successfully');
      }
      loadMyItems();
    } else {
      const error = await response.json();
      if (typeof window.showAlert === 'function') {
        window.showAlert('Failed to delete item: ' + error.error, 'error');
      } else {
        alert('Failed to delete item: ' + error.error);
      }
    }
  } catch (error) {
    console.error('Error deleting item:', error);
  }
}
