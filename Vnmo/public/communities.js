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

    const createBtn = document.getElementById('createCommunityBtn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            const modal = document.getElementById('createCommunityModal');
            if (modal) modal.classList.add('active');
        });
    }

    const createForm = document.getElementById('createCommunityForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('commName').value,
                locality: document.getElementById('commLocality').value,
                country: document.getElementById('commCountry').value,
                city: document.getElementById('commCity').value,
                state: document.getElementById('commState').value,
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
                    const errorData = await res.json();
                    console.error('Community Creation Error:', errorData);
                    window.showAlert(errorData.error || 'Failed to create community', 'error');
                }
            } catch (err) {
                window.showAlert('Server error', 'error');
            }
        });
    }

    document.getElementById('inviteCommBtn').addEventListener('click', () => {
        const form = document.getElementById('inviteForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('sendInviteBtn').addEventListener('click', async () => {
        const identifier = document.getElementById('inviteIdentifier').value.trim();
        if (!identifier) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/communities/${currentCommunity.id}/invite`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });
            const data = await res.json();
            if (res.ok) {
                window.showAlert('Invite sent!');
                document.getElementById('inviteIdentifier').value = '';
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

    document.getElementById('communitySearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderCommunities(query);
    });

});

async function fetchCommunities() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/communities', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }
    if (res.ok) {
        communities = await res.json();
        renderCommunities();
    } else {
        const errorData = await res.json();
        console.error('Communities Fetch Error:', errorData);
    }
}

async function fetchInvites() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/communities/invites', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }
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

function renderCommunities(filter = '') {
    const grid = document.getElementById('communitiesList');
    const myGrid = document.getElementById('myCommunitiesList');
    
    if (communities.length === 0) {
        grid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">No communities around you yet.</p>';
        myGrid.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">You haven\'t joined any communities yet.</p>';
        return;
    }

    const filteredComms = communities.filter(c => 
        c.name.toLowerCase().includes(filter) || 
        (c.address && c.address.toLowerCase().includes(filter))
    );

    const user = JSON.parse(localStorage.getItem('user'));
    const myId = user.id;

    const myComms = filteredComms.filter(c => c.is_member || c.admin_id === myId);
    const otherComms = filteredComms.filter(c => !c.is_member && c.admin_id !== myId);

    const cardHtml = c => `
        <div class="community-card" onclick="window.location.href='community_Home.html?id=${c.id}'">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3 style="margin: 0;">${c.name}</h3>
                <span class="community-badge ${c.is_private ? 'badge-private' : 'badge-public'}">${c.is_private ? 'Private' : 'Public'}</span>
            </div>
            <p style="color: var(--muted); font-size: 0.85rem;">📍 ${c.address}</p>
            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; color: var(--muted);">
                <div style="display: flex; justify-content: space-between;">
                    <span>👥 ${c.member_count} / ${c.max_limit} members</span>
                    <span>📦 ${c.item_count} items</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    ${c.is_member ? '<span style="color: var(--accent); font-weight: bold;">Joined</span>' : '<span></span>'}
                    ${c.admin_id === myId ? '<span style="color: #10b981; font-weight: bold;">Admin</span>' : ''}
                </div>
            </div>
        </div>
    `;

    myGrid.innerHTML = myComms.length ? myComms.map(cardHtml).join('') : '<p class="empty-state" style="grid-column: 1/-1;">No communities found.</p>';
    grid.innerHTML = otherComms.length ? otherComms.map(cardHtml).join('') : '<p class="empty-state" style="grid-column: 1/-1;">No other communities found.</p>';
}

async function openCommunity(c) {
    currentCommunity = c;
    const user = JSON.parse(localStorage.getItem('user'));
    const myId = user.id;
    const token = localStorage.getItem('token');

    document.getElementById('viewCommName').textContent = c.name;

    const joinBtn = document.getElementById('joinCommBtn');
    const leaveBtn = document.getElementById('leaveCommBtn');
    const inviteBtn = document.getElementById('inviteCommBtn');
    const chatSection = document.getElementById('chatSection');
    const manageCommBtn = document.getElementById('manageCommBtn');
    const deleteCommBtn = document.getElementById('deleteCommBtn');
    const adminManagementSection = document.getElementById('adminManagementSection');
    const membersList = document.getElementById('membersList');
    
    joinBtn.style.display = 'none';
    leaveBtn.style.display = 'none';
    inviteBtn.style.display = 'none';
    chatSection.style.display = 'none';
    manageCommBtn.style.display = 'none';
    adminManagementSection.style.display = 'none';
    document.getElementById('inviteForm').style.display = 'none';
    membersList.innerHTML = '<p class="muted">Loading members...</p>';

    // Load members
    try {
        const res = await fetch(`/api/communities/${c.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const members = await res.json();
            if (members.length === 0) {
                membersList.innerHTML = '<p class="muted">No members found.</p>';
            } else {
                membersList.innerHTML = members.map(m => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                        <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                            <span style="font-weight: 500;">${m.name} ${m.is_admin ? '<small style="color: var(--accent); margin-left: 0.5rem;">(Admin)</small>' : ''}</span>
                            <small class="muted" style="font-size: 0.8rem;">${m.email}</small>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            ${(c.is_current_user_admin && m.id !== myId) ? `
                                <button onclick="toggleAdmin(${c.id}, ${m.id}, ${!m.is_admin})" class="btn small outline" style="font-size: 0.8rem; border-radius: 6px; padding: 0.3rem 0.7rem;">${m.is_admin ? 'Demote' : 'Make Admin'}</button>
                                <button onclick="removeMember(${c.id}, ${m.id})" class="btn small outline" style="color: #ef4444; border-color: #ef4444; padding: 0.3rem 0.7rem; font-size: 0.8rem; border-radius: 6px;">Remove</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
                // Remove border from last item
                if (membersList.lastElementChild) membersList.lastElementChild.style.borderBottom = 'none';
            }
        } else {
            membersList.innerHTML = '<p class="muted">Failed to load members.</p>';
        }
    } catch (err) {
        membersList.innerHTML = '<p class="muted">Error loading members.</p>';
    }

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

    if (c.is_current_user_admin) {
        manageCommBtn.style.display = 'inline-flex';
        inviteBtn.style.display = 'inline-flex';
        leaveBtn.style.display = 'inline-flex';
        
        leaveBtn.onclick = () => leaveCommunity(c.id);
        deleteCommBtn.onclick = () => deleteCommunity(c.id);
    } else if (c.is_member) {
        inviteBtn.style.display = 'inline-flex';
        leaveBtn.style.display = 'inline-flex';
        leaveBtn.onclick = () => leaveCommunity(c.id);
    }

    if (c.is_member || c.is_current_user_admin) {
        if (c.chat_enabled) {
            chatSection.style.display = 'block';
            loadChatMessages();
        }
    }

    document.getElementById('viewCommunityModal').classList.add('active');
}

async function leaveCommunity(communityId) {
    // Custom confirm via a simple injected modal
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    
    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--card-bg);padding:2rem;border-radius:12px;max-width:400px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
    modal.innerHTML = `
        <h3 style="margin-top:0;">Leave Community?</h3>
        <p style="color:var(--muted);margin-bottom:1.5rem;">Are you sure you want to leave this community?</p>
        <div style="display:flex;gap:1rem;justify-content:center;">
            <button id="cancelLeaveBtn" class="btn outline">Cancel</button>
            <button id="confirmLeaveBtn" class="btn primary" style="background:#dc3545;border-color:#dc3545;">Leave</button>
        </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('cancelLeaveBtn').onclick = () => overlay.remove();
    document.getElementById('confirmLeaveBtn').onclick = async () => {
        overlay.remove();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/communities/${communityId}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                window.showAlert('You have left the community.');
                document.getElementById('viewCommunityModal').classList.remove('active');
                fetchCommunities();
            } else {
                window.showAlert(data.error, 'error');
            }
        } catch (err) {
            window.showAlert('Error leaving community.', 'error');
        }
    };
}

async function deleteCommunity(communityId) {
    if (!confirm('CRITICAL: This will permanently delete the community and all its data. Are you sure?')) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/communities/${communityId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            window.showAlert('Community deleted successfully.');
            document.getElementById('viewCommunityModal').classList.remove('active');
            fetchCommunities();
        } else {
            const data = await res.json();
            window.showAlert(data.error, 'error');
        }
    } catch (err) {
        window.showAlert('Error deleting community', 'error');
    }
}

async function toggleAdmin(communityId, userId, isAdmin) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/communities/${communityId}/members/${userId}/admin`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_admin: isAdmin })
        });
        if (res.ok) {
            window.showAlert(`User is now ${isAdmin ? 'an Admin' : 'a Member'}.`);
            // Refresh current community view
            const resComm = await fetch('/api/communities', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resComm.ok) {
                const comms = await resComm.json();
                const updatedComm = comms.find(c => c.id === communityId);
                if (updatedComm) openCommunity(updatedComm);
            }
        } else {
            const data = await res.json();
            window.showAlert(data.error, 'error');
        }
    } catch (err) {
        window.showAlert('Error updating member role', 'error');
    }
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

async function removeMember(communityId, userId) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/communities/${communityId}/members/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            window.showAlert('Member removed successfully');
            // Refresh current community view
            const resComm = await fetch('/api/communities', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resComm.ok) {
                const comms = await resComm.json();
                const updatedComm = comms.find(c => c.id === communityId);
                if (updatedComm) openCommunity(updatedComm);
                fetchCommunities(); // refresh main list
            }
        } else {
            window.showAlert(data.error, 'error');
        }
    } catch (err) {
        window.showAlert('Error removing member', 'error');
    }
}
