const token = localStorage.getItem('token');

// ── AUTH GUARD ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (!token) { window.location.href = 'login.html'; return; }

    // Verify admin access
    const check = await fetch('/api/admin/complaints', { headers: { 'Authorization': `Bearer ${token}` } });
    if (check.status === 403) {
        document.querySelector('.container').innerHTML = `
            <div class="card" style="text-align:center;padding:3rem;">
                <h2>Access Denied</h2>
                <p class="muted">You must be a Site Administrator to view this page.</p>
            </div>`;
        return;
    }

    // Load everything
    loadUsers();
    loadItems();
    loadCommunities();
    loadComplaints();
});

// ── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(name, btn) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    btn.classList.add('active');
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function filterTable(tableId, query) {
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    const q = query.toLowerCase();
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

async function adminDelete(endpoint, label, reloadFn) {
    if (!confirm(`Are you sure you want to delete this ${label}? This cannot be undone.`)) return;
    try {
        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) { reloadFn(); }
        else { alert(data.error || `Failed to delete ${label}.`); }
    } catch (err) {
        alert('Network error. Please try again.');
    }
}

// ── USERS ─────────────────────────────────────────────────────────────────────
async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
        const users = await res.json();
        document.getElementById('statUsers').textContent = users.length;

        const tbody = document.getElementById('usersBody');
        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-admin">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr data-id="${u.id}">
                <td>
                    <a href="user_View.html?id=${u.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${u.name} 🔗</a>
                    ${u.is_site_admin ? '<span class="badge badge-admin" style="margin-left:0.4rem;">Admin</span>' : ''}
                    <br><small class="muted">@${u.username || '—'}</small>
                </td>
                <td>${u.email}</td>
                <td><span class="badge ${u.plan_type === 'Pro' ? 'badge-pro' : 'badge-free'}">${u.plan_type || 'Free'}</span></td>
                <td><span class="badge badge-ok">${u.item_count}</span></td>
                <td><span class="badge badge-ok">${u.community_count}</span></td>
                <td>${u.is_verified ? '✅' : '❌'}</td>
                <td>${fmt(u.created_at)}</td>
                <td>
                    <button class="btn-view" onclick="viewUser(${u.id}, '${u.name.replace(/'/g, "\\'")}')">View</button>
                    ${!u.is_site_admin ? `<button class="btn-del" onclick="adminDelete('/api/admin/users/${u.id}', 'user', loadUsers)">Delete</button>` : '<span class="muted" style="font-size:0.75rem;">Protected</span>'}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        document.getElementById('usersBody').innerHTML = '<tr><td colspan="8" class="empty-admin">Failed to load users.</td></tr>';
    }
}

async function viewUser(id, name) {
    document.getElementById('modalUserName').textContent = '👤 ' + name;
    document.getElementById('modalContent').innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <p class="muted">Loading user details...</p>
        </div>`;
    document.getElementById('userModal').classList.add('active');

    try {
        console.log(`[Admin] Fetching details for user ID: ${id}`);
        const res = await fetch(`/api/admin/users/${id}/details`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) {
            throw new Error(`Failed to load details (status: ${res.status})`);
        }
        const data = await res.json();
        const u = data.user;
        if (!u) {
            throw new Error('User not found in details response');
        }

        document.getElementById('modalContent').innerHTML = `
            <div class="detail-section">
                <h4>Profile</h4>
                <table class="admin-table">
                    <tr><td><strong>Email</strong></td><td>${u.email}</td><td><strong>Plan</strong></td><td>${u.plan_type || 'Free'}</td></tr>
                    <tr><td><strong>Location</strong></td><td>${[u.locality, u.city, u.state, u.country].filter(Boolean).join(', ') || '—'}</td><td><strong>Joined</strong></td><td>${fmt(u.created_at)}</td></tr>
                    <tr><td><strong>Last Login</strong></td><td>${fmt(u.last_login)}</td><td><strong>Verified</strong></td><td>${u.is_verified ? '✅ Yes' : '❌ No'}</td></tr>
                </table>
            </div>
            <div class="detail-section">
                <h4>Items (${data.items.length})</h4>
                ${data.items.length ? `
                <table class="admin-table">
                    <thead><tr><th>Name</th><th>Status</th><th>Condition</th><th>Listed</th><th></th></tr></thead>
                    <tbody>${data.items.map(i => `
                        <tr>
                            <td>${i.name}</td>
                            <td><span class="badge ${i.status === 'available' ? 'badge-ok' : 'badge-warn'}">${i.status}</span></td>
                            <td>${i.condition || '—'}</td>
                            <td>${fmt(i.created_at)}</td>
                            <td><button class="btn-del" onclick="adminDelete('/api/admin/items/${i.id}', 'item', () => viewUser(${u.id}, '${u.name.replace(/'/g, "\\'")}'))">Delete</button></td>
                        </tr>
                    `).join('')}</tbody>
                </table>` : '<p class="empty-admin">No items listed.</p>'}
            </div>
            <div class="detail-section">
                <h4>Communities (${data.communities.length})</h4>
                ${data.communities.length ? `
                <table class="admin-table">
                    <thead><tr><th>Name</th><th>Privacy</th><th>Joined</th><th></th></tr></thead>
                    <tbody>${data.communities.map(c => `
                        <tr>
                            <td>${c.name}</td>
                            <td><span class="badge ${c.is_private ? 'badge-private' : 'badge-public'}">${c.is_private ? 'Private' : 'Public'}</span></td>
                            <td>${fmt(c.joined_at)}</td>
                            <td><button class="btn-del" onclick="adminDelete('/api/admin/communities/${c.id}/members/${u.id}', 'member', () => viewUser(${u.id}, '${u.name.replace(/'/g, "\\'")}'))">Remove</button></td>
                        </tr>
                    `).join('')}</tbody>
                </table>` : '<p class="empty-admin">Not in any communities.</p>'}
            </div>
            <div class="detail-section">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; margin-bottom: 0.6rem;">
                    <h4 style="margin: 0;">Warning History (${data.warnings ? data.warnings.length : 0})</h4>
                    <button class="btn-view" onclick="toggleWarningForm(${u.id})" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; margin: 0; background: rgba(220,53,69,0.1); color: #dc3545; border-color: rgba(220,53,69,0.2);">⚠️ Issue Warning</button>
                </div>
                
                <div id="warningFormContainer-${u.id}" style="display: none; background: rgba(220, 53, 69, 0.03); border: 1px dashed rgba(220, 53, 69, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h5 style="margin: 0 0 0.5rem 0; color: #dc3545; font-size: 0.85rem;">Issue Warning to ${u.name}</h5>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div>
                            <label style="font-size: 0.7rem; font-weight: 600; color: var(--muted); display: block; margin-bottom: 0.2rem;">Reason / Category</label>
                            <select id="warnCategory-${u.id}" style="width: 100%; padding: 0.4rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem; background: var(--card-bg); color: var(--text);">
                                <option value="Terms of Service">Terms of Service</option>
                                <option value="Inappropriate Content">Inappropriate Content</option>
                                <option value="Spam">Spam</option>
                                <option value="Harassment">Harassment</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.7rem; font-weight: 600; color: var(--muted); display: block; margin-bottom: 0.2rem;">Warning Message</label>
                            <textarea id="warnMessage-${u.id}" rows="3" placeholder="Describe the warning message..." style="width: 100%; padding: 0.4rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem; font-family: inherit; background: var(--card-bg); color: var(--text); resize: vertical;"></textarea>
                        </div>
                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.25rem;">
                            <button class="btn-view" onclick="toggleWarningForm(${u.id})" style="background: none; border: 1px solid var(--border); color: var(--text);">Cancel</button>
                            <button class="btn-del" onclick="submitWarning(${u.id}, '${u.name.replace(/'/g, "\\'")}')" style="background: #dc3545; color: white; border: none;">Submit Warning</button>
                        </div>
                    </div>
                </div>

                ${data.warnings && data.warnings.length ? `
                <table class="admin-table">
                    <thead><tr><th>Category</th><th>Message</th><th>Issued By</th><th>Date</th></tr></thead>
                    <tbody>${data.warnings.map(w => `
                        <tr>
                            <td><span class="badge badge-warn">${w.category}</span></td>
                            <td style="max-width:250px;word-break:break-word;font-style:italic;color:var(--muted)">"${w.message}"</td>
                            <td>${w.admin_name || 'System'}</td>
                            <td>${fmt(w.created_at)}</td>
                        </tr>
                    `).join('')}</tbody>
                </table>` : '<p class="empty-admin">No warning history for this user.</p>'}
            </div>
        `;
    } catch (err) {
        console.error('[Admin] Error loading user details:', err);
        document.getElementById('modalContent').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #dc3545;">
                <p>⚠️ Error: ${err.message || 'Failed to load user details.'}</p>
                <button class="btn-view" onclick="viewUser(${id}, '${name.replace(/'/g, "\\'")}')" style="margin-top: 1rem;">Retry</button>
            </div>`;
    }
}

function closeModal() {
    document.getElementById('userModal').classList.remove('active');
}
document.getElementById('userModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('userModal')) closeModal();
});

// ── ITEMS ─────────────────────────────────────────────────────────────────────
async function loadItems() {
    try {
        const res = await fetch('/api/admin/items', { headers: { 'Authorization': `Bearer ${token}` } });
        const items = await res.json();
        document.getElementById('statItems').textContent = items.length;

        const tbody = document.getElementById('itemsBody');
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-admin">No items found.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(i => `
            <tr>
                <td><a href="item_View.html?id=${i.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${i.name} 🔗</a>${i.brand ? `<br><small class="muted">${i.brand}</small>` : ''}</td>
                <td>${i.owner_name}<br><small class="muted">${i.owner_email}</small></td>
                <td><span class="badge ${i.status === 'available' ? 'badge-ok' : 'badge-warn'}">${i.status || '—'}</span></td>
                <td>${i.brand || '—'}</td>
                <td>${i.condition || '—'}</td>
                <td>${fmt(i.created_at)}</td>
                <td><button class="btn-del" onclick="adminDelete('/api/admin/items/${i.id}', 'item', loadItems)">Delete</button></td>
            </tr>
        `).join('');
    } catch (err) {
        document.getElementById('itemsBody').innerHTML = '<tr><td colspan="7" class="empty-admin">Failed to load items.</td></tr>';
    }
}

// ── COMMUNITIES ───────────────────────────────────────────────────────────────
async function loadCommunities() {
    try {
        const res = await fetch('/api/admin/communities', { headers: { 'Authorization': `Bearer ${token}` } });
        const communities = await res.json();
        document.getElementById('statCommunities').textContent = communities.length;

        const tbody = document.getElementById('communitiesBody');
        if (!communities.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-admin">No communities found.</td></tr>';
            return;
        }

        tbody.innerHTML = communities.map(c => `
            <tr>
                <td>
                    <a href="community_Home.html?id=${c.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${c.name} 🔗</a>
                    ${c.chat_enabled ? '<span class="badge badge-ok" style="margin-left:0.4rem;">Chat</span>' : ''}
                    <br><small class="muted">${c.description ? c.description.slice(0,50) + (c.description.length > 50 ? '…' : '') : 'No description'}</small>
                </td>
                <td>${c.admin_name || '—'}<br><small class="muted">${c.admin_email || ''}</small></td>
                <td><span class="badge badge-ok">${c.member_count} / ${c.max_limit}</span></td>
                <td><span class="badge ${c.is_private ? 'badge-private' : 'badge-public'}">${c.is_private ? '🔒 Private' : '🌐 Public'}</span></td>
                <td>${[c.city, c.state, c.country].filter(Boolean).join(', ') || '—'}</td>
                <td>${fmt(c.created_at)}</td>
                <td><button class="btn-del" onclick="adminDelete('/api/admin/communities/${c.id}', 'community', loadCommunities)">Delete</button></td>
            </tr>
        `).join('');
    } catch (err) {
        document.getElementById('communitiesBody').innerHTML = '<tr><td colspan="7" class="empty-admin">Failed to load communities.</td></tr>';
    }
}

// ── COMPLAINTS ────────────────────────────────────────────────────────────────
let allComplaints = [];

async function loadComplaints() {
    try {
        const res = await fetch('/api/admin/complaints', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch complaints');
        allComplaints = await res.json();
        
        const open = allComplaints.filter(c => c.status === 'open').length;
        document.getElementById('statComplaints').textContent = open;

        // Populate dynamic category selector
        const categoryFilter = document.getElementById('complaintFilterCategory');
        if (categoryFilter) {
            const currentSelected = categoryFilter.value;
            const categories = [...new Set(allComplaints.map(c => c.issue_type || 'General'))];
            categoryFilter.innerHTML = '<option value="">All Categories</option>' + 
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            categoryFilter.value = currentSelected;
        }

        filterComplaints();
    } catch (err) {
        console.error('[Admin] Error loading complaints:', err);
        document.getElementById('complaintsBody').innerHTML = '<tr><td colspan="8" class="empty-admin">Failed to load complaints.</td></tr>';
    }
}

function filterComplaints() {
    const severity = document.getElementById('complaintFilterSeverity').value.toLowerCase();
    const category = document.getElementById('complaintFilterCategory').value;
    
    let filtered = allComplaints;
    if (severity) {
        filtered = filtered.filter(c => (c.severity || '').toLowerCase() === severity);
    }
    if (category) {
        filtered = filtered.filter(c => (c.issue_type || 'General') === category);
    }
    
    renderComplaintsTable(filtered);
}

function renderComplaintsTable(complaintsList) {
    const tbody = document.getElementById('complaintsBody');
    if (!complaintsList.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-admin">No complaints found matching filters.</td></tr>';
        return;
    }

    tbody.innerHTML = complaintsList.map(c => `
        <tr>
            <td><strong>${c.issue_type || 'General'}</strong></td>
            <td><span class="badge ${getSeverityBadgeClass(c.severity)}">${(c.severity || 'low').toUpperCase()}</span></td>
            <td>${c.actual_item_name || '—'}</td>
            <td>${c.complainant_name}</td>
            <td>${c.accused_name}</td>
            <td style="max-width:200px;word-break:break-word;font-style:italic;color:var(--muted)">"${c.description || '—'}"</td>
            <td><span class="badge ${c.status === 'open' ? 'badge-warn' : 'badge-ok'}">${c.status.toUpperCase()}</span></td>
            <td>
                ${c.status === 'open' ? `<button class="btn-view" onclick="resolveComplaint(${c.id})">Resolve</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function getSeverityBadgeClass(severity) {
    const sev = (severity || '').toLowerCase();
    if (sev === 'critical' || sev === 'high') return 'badge-warn';
    if (sev === 'medium') return 'badge-pro';
    return 'badge-free';
}

async function resolveComplaint(id) {
    if (!confirm('Mark this complaint as resolved?')) return;
    try {
        const res = await fetch(`/api/admin/complaints/${id}/status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'resolved' })
        });
        if (res.ok) { loadComplaints(); }
        else { alert('Failed to resolve complaint.'); }
    } catch (err) {
        alert('Network error.');
    }
}

function toggleWarningForm(userId) {
    const el = document.getElementById(`warningFormContainer-${userId}`);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
}

async function submitWarning(userId, userName) {
    const category = document.getElementById(`warnCategory-${userId}`).value;
    const message = document.getElementById(`warnMessage-${userId}`).value.trim();

    if (!message) {
        alert('Please enter a warning message.');
        return;
    }

    if (!confirm(`Are you sure you want to issue this warning to ${userName}?`)) {
        return;
    }

    try {
        const res = await fetch(`/api/admin/users/${userId}/warn`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category, message })
        });

        if (res.ok) {
            alert('Warning issued successfully.');
            viewUser(userId, userName);
        } else {
            const data = await res.json();
            alert(`Failed to issue warning: ${data.error || 'Unknown error'}`);
        }
    } catch (err) {
        console.error('[Admin] Error submitting warning:', err);
        alert('Network error.');
    }
}
