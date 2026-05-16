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
                    <strong>${u.name}</strong>
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
    document.getElementById('modalContent').innerHTML = '<p class="muted">Loading…</p>';
    document.getElementById('userModal').classList.add('active');

    try {
        const res = await fetch(`/api/admin/users/${id}/details`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        const u = data.user;
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
        `;
    } catch (err) {
        document.getElementById('modalContent').innerHTML = '<p class="empty-admin">Failed to load user details.</p>';
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
                <td><strong>${i.name}</strong>${i.brand ? `<br><small class="muted">${i.brand}</small>` : ''}</td>
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
                    <strong>${c.name}</strong>
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
async function loadComplaints() {
    try {
        const res = await fetch('/api/admin/complaints', { headers: { 'Authorization': `Bearer ${token}` } });
        const complaints = await res.json();
        const open = complaints.filter(c => c.status === 'open').length;
        document.getElementById('statComplaints').textContent = open;

        const tbody = document.getElementById('complaintsBody');
        if (!complaints.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-admin">No complaints on the platform.</td></tr>';
            return;
        }

        tbody.innerHTML = complaints.map(c => `
            <tr>
                <td><strong>${c.issue_type || 'General'}</strong></td>
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
    } catch (err) {
        document.getElementById('complaintsBody').innerHTML = '<tr><td colspan="7" class="empty-admin">Failed to load complaints.</td></tr>';
    }
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
