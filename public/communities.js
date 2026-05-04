let communities = [];
let currentCommunity = null;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const avatar = document.getElementById('headerAvatar');
        if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
    }

    fetchCommunities();
    fetchInvites();

    document.getElementById('createCommunityBtn').addEventListener('click', () => {
        document.getElementById('createCommunityModal').classList.add('active');
    });

    document.getElementById('createCommunityForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('commName').value,
            address: document.getElementById('commAddress').value,
            max_limit: document.getElementById('commLimit').value,
            is_private: document.getElementById('commPrivate').checked
        };

        try {
            const res = await fetch('/api/communities', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                window.showAlert('Community created successfully!');
                document.getElementById('createCommunityModal').classList.remove('active');
                fetchCommunities();
            } else {
                window.showAlert(data.error, 'error');
            }
        } catch (err) {
            window.showAlert('Server error', 'error');
        }
    });

    document.getElementById('inviteCommBtn').addEventListener('click', () => {
        const form = document.getElementById('inviteForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('sendInviteBtn').addEventListener('click', async () => {
        const email = document.getElementById('inviteEmail').value;
        if (!email) return;
        try {
            const res = await fetch(`/api/communities/${currentCommunity.id}/invite`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                window.showAlert('Invite sent!');
                document.getElementById('inviteEmail').value = '';
            } else {
                window.showAlert(data.error, 'error');
            }
        } catch (err) {
            window.showAlert('Error sending invite', 'error');
        }
    });

    document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
    
    document.getElementById('chatSettingsBtn').addEventListener('click', async () => {
        const newStatus = !currentCommunity.chat_enabled;
        try {
            const res = await fetch(`/api/communities/${currentCommunity.id}/chat`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_enabled: newStatus })
            });
            const data = await res.json();
            if (res.ok) {
                window.showAlert(data.message);
                currentCommunity.chat_enabled = newStatus;
                openCommunity(currentCommunity); // refresh UI
            } else {
                window.showAlert(data.error, 'error');
            }
        } catch (err) {
            window.showAlert('Error toggling chat', 'error');
        }
    });

    document.getElementById('adminAddBtn').addEventListener('click', async () => {
        const email = document.getElementById('adminAddEmail').value;
        if(!email) return;
        try {
            const res = await fetch(`/api/communities/${currentCommunity.id}/members`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                window.showAlert('Member added directly');
                document.getElementById('adminAddEmail').value = '';
            } else {
                window.showAlert(data.error, 'error');
            }
        } catch(err) {
            window.showAlert('Server error', 'error');
        }
    });

    document.getElementById('adminRemoveBtn').addEventListener('click', async () => {
        const targetId = document.getElementById('adminRemoveId').value;
        if(!targetId) return;
        try {
            const res = await fetch(`/api/communities/${currentCommunity.id}/members/${targetId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                window.showAlert('Member removed');
                document.getElementById('adminRemoveId').value = '';
            } else {
                window.showAlert(data.error, 'error');
            }
        } catch(err) {
            window.showAlert('Server error', 'error');
        }
    });
    
    document.getElementById('manageCommBtn').addEventListener('click', () => {
        const section = document.getElementById('adminManagementSection');
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    });
});

async function fetchCommunities() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/communities', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
        communities = await res.json();
        renderCommunities();
    }
}

async function fetchInvites() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/communities/invites', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
        const invites = await res.json();
        const list = document.getElementById('invitesList');
        if (invites.length === 0) {
            list.innerHTML = '<p class="empty-state">No pending invites.</p>';
            return;
        }
        list.innerHTML = invites.map(i => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 0.5rem;">
                <span>You have been invited to <strong>${i.community_name}</strong></span>
                <button onclick="acceptInvite(${i.id})" class="btn small primary">Accept</button>
            </div>
        `).join('');
    }
}

async function acceptInvite(inviteId) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/communities/invites/${inviteId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            window.showAlert('Invite accepted!');
            fetchInvites();
            fetchCommunities();
        } else {
            window.showAlert(data.error, 'error');
        }
    } catch (err) {
        window.showAlert('Server error', 'error');
    }
}

function renderCommunities() {
    const grid = document.getElementById('communitiesList');
    if (communities.length === 0) {
        grid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">No communities around you yet.</p>';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const myId = user.id;

    grid.innerHTML = communities.map(c => `
        <div class="community-card" onclick='openCommunity(${JSON.stringify(c).replace(/'/g, "&apos;")})'>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3 style="margin: 0;">${c.name}</h3>
                <span class="community-badge ${c.is_private ? 'badge-private' : 'badge-public'}">${c.is_private ? 'Private' : 'Public'}</span>
            </div>
            <p style="color: var(--muted); font-size: 0.85rem;">📍 ${c.address}</p>
            <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted);">
                <span>👥 ${c.member_count} / ${c.max_limit}</span>
                ${c.is_member ? '<span style="color: var(--accent); font-weight: bold;">Joined</span>' : ''}
                ${c.admin_id === myId ? '<span style="color: #10b981; font-weight: bold;">Admin</span>' : ''}
            </div>
        </div>
    `).join('');
}

async function openCommunity(c) {
    currentCommunity = c;
    const user = JSON.parse(localStorage.getItem('user'));
    const myId = user.id;
    const token = localStorage.getItem('token');

    document.getElementById('viewCommName').textContent = c.name;

    const joinBtn = document.getElementById('joinCommBtn');
    const inviteBtn = document.getElementById('inviteCommBtn');
    const chatSection = document.getElementById('chatSection');
    const manageCommBtn = document.getElementById('manageCommBtn');
    const adminManagementSection = document.getElementById('adminManagementSection');
    
    joinBtn.style.display = 'none';
    inviteBtn.style.display = 'none';
    chatSection.style.display = 'none';
    manageCommBtn.style.display = 'none';
    adminManagementSection.style.display = 'none';
    document.getElementById('inviteForm').style.display = 'none';

    if (!c.is_member && !c.is_private) {
        joinBtn.style.display = 'inline-flex';
        joinBtn.onclick = async () => {
            const res = await fetch(`/api/communities/${c.id}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                window.showAlert('Joined community!');
                document.getElementById('viewCommunityModal').classList.remove('active');
                fetchCommunities();
            } else {
                const data = await res.json();
                window.showAlert(data.error, 'error');
            }
        };
    }

    if (c.is_member || c.admin_id === myId) {
        inviteBtn.style.display = 'inline-flex';
        if (c.chat_enabled) {
            chatSection.style.display = 'block';
            loadChatMessages();
        }
    }

    if (c.admin_id === myId) {
        manageCommBtn.style.display = 'inline-flex';
    }

    document.getElementById('viewCommunityModal').classList.add('active');
}

async function loadChatMessages() {
    const token = localStorage.getItem('token');
    const box = document.getElementById('chatBox');
    try {
        const res = await fetch(`/api/communities/${currentCommunity.id}/chat`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const msgs = await res.json();
            box.innerHTML = msgs.map(m => `
                <div class="chat-message">
                    <strong>${m.user_name}:</strong> ${m.message}
                </div>
            `).join('');
            box.scrollTop = box.scrollHeight;
        } else {
            box.innerHTML = '<p class="muted">Could not load chat.</p>';
        }
    } catch(err) {
        box.innerHTML = '<p class="muted">Error loading chat.</p>';
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if(!message) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/communities/${currentCommunity.id}/chat`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (res.ok) {
            input.value = '';
            loadChatMessages();
        } else {
            const data = await res.json();
            window.showAlert(data.error, 'error');
        }
    } catch(err) {
        window.showAlert('Error sending message', 'error');
    }
}
