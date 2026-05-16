// item_View.js
const html = document.documentElement;

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    html.setAttribute('data-theme', savedTheme);
}

async function loadItemDetails() {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        document.getElementById('itemView').innerHTML = '<h3>Item ID not provided.</h3>';
        return;
    }

    try {
        const response = await fetch(`/api/items/${itemId}`);
        if (!response.ok) throw new Error('Item not found');
        
        const item = await response.json();
        renderItem(item);
    } catch (error) {
        console.error('Error loading item:', error);
        document.getElementById('itemView').innerHTML = '<h3>Error loading item details.</h3>';
    }
}

function renderItem(item) {
    const container = document.getElementById('itemView');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const isOwner = user && Number(user.id) === Number(item.owner_id);
    const canBorrow = token && !isOwner && item.status === 'available';

    let actionButton = '';
    if (canBorrow) {
        actionButton = `<button class="btn primary" onclick="borrowItem(${item.id})">Request to Borrow</button>`;
    } else if (isOwner) {
        actionButton = `<span class="status available">You own this item</span>`;
    } else if (!token) {
        actionButton = `<a href="login.html" class="btn primary">Login to Borrow</a>`;
    } else {
        actionButton = `<span class="status ${item.status}">${item.status.toUpperCase()}</span>`;
    }

    container.innerHTML = `
        <div class="item-visuals">
            <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}" class="item-image-large" id="mainItemImage" style="cursor: zoom-in;">
        </div>
        <div class="item-info-detailed">
            <div class="item-owner-tag">
                <div class="owner-avatar">${(item.owner_name || '?').charAt(0).toUpperCase()}</div>
                <span>Owned by <strong>${item.owner_name || 'Anonymous'}</strong></span>
            </div>
            <h1>${item.name}</h1>
            <div style="display: flex; align-items: center; gap: 1rem; margin: 1rem 0;">
                <span class="status ${item.status}">${item.status}</span>
            </div>
            

            
            <div class="item-description-box">
                <p>${item.description || 'No description provided for this item.'}</p>
            </div>

            <div class="item-details-grid">
                <div class="detail-item">
                    <strong>Category</strong>
                    <span>${item.category || 'General'}</span>
                </div>
                <div class="detail-item">
                    <strong>Condition</strong>
                    <span>${item.condition || 'Not specified'}</span>
                </div>
                <div class="detail-item">
                    <strong>Brand</strong>
                    <span>${item.brand || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <strong>Recommended Age</strong>
                    <span>${item.age ? item.age : 'Not specified'}</span>
                </div>
            </div>

            <div class="action-bar">
               <div class="item-actions-box" style="width: 100%;">
                ${canBorrow ? `
                    <div style="background: rgba(0,0,0,0.02); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border);">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 700; font-size: 0.9rem;">When will you return it?</label>
                        <input type="date" id="returnDate" class="btn outline" style="width: 100%; margin-bottom: 1rem; background: white; color: var(--text); padding: 0.75rem;">
                        <button class="btn primary" style="width: 100%;" onclick="borrowItem(${item.id})">Request to Borrow</button>
                    </div>
                ` : actionButton}
               </div>
            </div>
        </div>
    `;

    // Set minimum date for return to today + 1
    const returnDateInput = document.getElementById('returnDate');
    if (returnDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        returnDateInput.min = tomorrow.toISOString().split('T')[0];
    }

    // Lightbox Logic
    const mainImg = document.getElementById('mainItemImage');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.querySelector('.lightbox-close');

    if (mainImg && lightbox && lightboxImg) {
        mainImg.addEventListener('click', () => {
            lightboxImg.src = mainImg.src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scroll
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        closeBtn?.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
        });
    }
}

async function borrowItem(itemId) {
    const token = localStorage.getItem('token');
    const returnDateInput = document.getElementById('returnDate');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (!returnDateInput || !returnDateInput.value) {
        window.showAlert('Please select a return date.', 'error');
        return;
    }

    window.showConfirm(`Are you sure you want to borrow this item until ${new Date(returnDateInput.value).toLocaleDateString()}?`, async () => {
        try {
            const response = await fetch('/api/borrows', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    itemId,
                    dueDate: returnDateInput.value 
                })
            });

            if (response.ok) {
                window.showAlert('Borrow request sent successfully!');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                const error = await response.json();
                window.showAlert('Failed: ' + error.error, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            window.showAlert('Failed to send request', 'error');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadItemDetails();
});
