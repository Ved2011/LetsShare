const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('id');

if (!communityId) {
    window.location.href = 'user_Dashboard.html';
}

const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const communityItemsGrid = document.getElementById('communityItemsGrid');
const communityHomeSearch = document.getElementById('communityHomeSearch');
const memberSearchResults = document.getElementById('memberSearchResults');
const membersGrid = document.getElementById('membersGrid');

let currentCommunity = null;
let allCommunityItems = [];
let allCommunityMembers = [];

async function loadCommunityDetails() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/communities/${communityId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            currentCommunity = await res.json();
            const elName = document.getElementById('communityName'); if (elName) elName.textContent = currentCommunity.name;
            const elHeroName = document.getElementById('heroCommName'); if (elHeroName) elHeroName.textContent = currentCommunity.name;
            const elAddress = document.getElementById('heroCommAddress'); if (elAddress) elAddress.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${currentCommunity.address}`;
            const elMemCount = document.getElementById('memberCount'); if (elMemCount) elMemCount.textContent = currentCommunity.member_count;
            
            const chatSectionHome = document.getElementById('chatSectionHome');
            const contentWrapper = document.querySelector('.community-content-wrapper');
            
            const adminPanelBtn = document.getElementById('adminPanelBtn');
            if (currentCommunity.is_current_user_admin) {
                if (adminPanelBtn) {
                    adminPanelBtn.style.display = 'inline-flex';
                    adminPanelBtn.onclick = () => {
                        document.getElementById('adminModal').style.display = 'flex';
                    };
                }
            } else {
                if (adminPanelBtn) adminPanelBtn.style.display = 'none';
            }

            if (currentCommunity.chat_enabled && currentCommunity.is_member) {
                if (chatSectionHome) chatSectionHome.style.display = 'block';
                if (contentWrapper) contentWrapper.style.gridTemplateColumns = '1.2fr 0.8fr';
                loadChatMessages();
                setInterval(loadChatMessages, 5000);
            } else {
                if (chatSectionHome) chatSectionHome.style.display = 'none';
                if (contentWrapper) contentWrapper.style.gridTemplateColumns = '1fr';
            }
            // Reveal page now that data is ready
            document.body.classList.add('page-ready');
        } else {
            document.body.classList.add('page-ready');
            window.location.href = 'user_Dashboard.html';
        }
    } catch (err) {
        console.error('Error loading community details:', err);
        document.body.classList.add('page-ready');
    }
}

async function loadCommunityItems() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/items?community_id=${communityId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            allCommunityItems = await res.json();
            const elItemCount = document.getElementById('itemCount'); if (elItemCount) elItemCount.textContent = allCommunityItems.length;
            displayItems(allCommunityItems);
        }
    } catch (err) {
        console.error('Error loading items:', err);
    }
}

async function loadMembers() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/communities/${communityId}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            allCommunityMembers = await res.json();
        }
    } catch (err) {
        console.error('Error loading members:', err);
    }
}

function displayItems(items) {
    if (items.length === 0) {
        communityItemsGrid.innerHTML = '<p class="empty-state">No items uploaded yet.</p>';
        return;
    }
    communityItemsGrid.innerHTML = items.map(item => `
        <div class="item-square" onclick="window.location.href='item_View.html?id=${item.id}'">
        <img src="${item.imageBase64 || 'assets/untitled.png'}" class="item-image" alt="${item.name}" loading="lazy">
            <div class="item-name">${item.name}</div>
            <div class="item-category">${item.category || 'Miscellaneous'}</div>
            <div style="color: var(--accent); font-weight: 700; margin-top: 0.5rem;">Rs. ${Number(item.price_per_day || 0).toFixed(2)}/day</div>
        </div>
    `).join('');
}

function displayMembers(members) {
    if (members.length === 0) {
        membersGrid.innerHTML = '<p class="empty-state">No members found.</p>';
        return;
    }
    membersGrid.innerHTML = members.map(m => `
        <div style="background: var(--card-bg); border: 1px solid var(--border); padding: 1rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ${m.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h4 style="margin: 0; font-size: 0.9rem;">${m.name}</h4>
                <p style="color: var(--muted); font-size: 0.75rem; margin: 0;">${m.is_admin ? 'Admin' : 'Member'}</p>
            </div>
        </div>
    `).join('');
}

async function loadChatMessages() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    try {
        const res = await fetch(`/api/communities/${communityId}/chat`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const messages = await res.json();
            const isAtBottom = chatBox.scrollHeight - chatBox.scrollTop <= chatBox.clientHeight + 10;
            
            chatBox.innerHTML = messages.map(msg => `
                <div class="chat-msg ${msg.user_id === user.id ? 'mine' : 'theirs'}">
                    <span class="msg-info">${msg.user_name} • ${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    ${msg.message}
                </div>
            `).join('');

            if (isAtBottom) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }
    } catch (err) {
        console.error('Error loading chat:', err);
    }
}

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/communities/${communityId}/chat`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        if (res.ok) {
            chatInput.value = '';
            loadChatMessages();
        }
    } catch (err) {
        console.error('Error sending message:', err);
    }
}

// Search Logic
communityHomeSearch.addEventListener('input', () => {
    const query = communityHomeSearch.value.trim().toLowerCase();
    
    if (!query) {
        memberSearchResults.classList.add('hidden');
        displayItems(allCommunityItems);
        return;
    }

    // Filter items
    const filteredItems = allCommunityItems.filter(i => 
        i.name.toLowerCase().includes(query) || 
        i.description?.toLowerCase().includes(query)
    );
    displayItems(filteredItems);

    // Filter members
    const filteredMembers = allCommunityMembers.filter(m => 
        m.name.toLowerCase().includes(query) || 
        m.email.toLowerCase().includes(query)
    );
    
    if (filteredMembers.length > 0) {
        memberSearchResults.classList.remove('hidden');
        displayMembers(filteredMembers);
    } else {
        memberSearchResults.classList.add('hidden');
    }
});

sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    loadCommunityDetails();
    loadCommunityItems();
    loadMembers();
});

// Admin Modal Controls
document.addEventListener('DOMContentLoaded', () => {
    const toggleChatBtn = document.getElementById('adminToggleChatBtn');
    const sendInviteBtn = document.getElementById('adminSendInviteBtn');
    const deleteCommBtn = document.getElementById('adminDeleteCommBtn');

    if (toggleChatBtn) {
        toggleChatBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/communities/${communityId}/chat`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    window.showAlert(`Chat toggled ${data.chat_enabled ? 'ON' : 'OFF'}!`);
                    location.reload();
                } else {
                    window.showAlert(data.error || 'Failed to toggle chat', 'error');
                }
            } catch (err) {
                window.showAlert('Server error', 'error');
            }
        });
    }

    if (sendInviteBtn) {
        sendInviteBtn.addEventListener('click', async () => {
            const identifier = document.getElementById('adminInviteEmail').value.trim();
            if (!identifier) return;
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/communities/${communityId}/invite`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ identifier })
                });
                const data = await res.json();
                if (res.ok) {
                    window.showAlert('Invite sent successfully!');
                    document.getElementById('adminInviteEmail').value = '';
                } else {
                    window.showAlert(data.error || 'Failed to send invite', 'error');
                }
            } catch (err) {
                window.showAlert('Server error', 'error');
            }
        });
    }

    if (deleteCommBtn) {
        deleteCommBtn.addEventListener('click', async () => {
            if (!confirm('Are you absolutely sure you want to delete this community? This action is irreversible.')) return;
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/communities/${communityId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    window.showAlert('Community deleted successfully!');
                    window.location.href = 'communities.html';
                } else {
                    const data = await res.json();
                    window.showAlert(data.error || 'Failed to delete community', 'error');
                }
            } catch (err) {
                window.showAlert('Server error', 'error');
            }
        });
    }
});
