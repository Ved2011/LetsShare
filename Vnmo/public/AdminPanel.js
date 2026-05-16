document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/admin/complaints', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 403) {
            document.querySelector('.container').innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <h2>Access Denied</h2>
                    <p class="muted">You must be a Site Administrator to view this page.</p>
                </div>
            `;
            return;
        }

        if (response.ok) {
            const complaints = await response.json();
            displayAdminComplaints(complaints);
        } else {
            console.error('Failed to load complaints');
        }
    } catch (err) {
        console.error('Error:', err);
    }
});

function displayAdminComplaints(complaints) {
    const list = document.getElementById('adminComplaintsList');
    if (!list) return;

    if (complaints.length === 0) {
        list.innerHTML = '<p class="empty-state">No complaints found on the platform.</p>';
        return;
    }

    list.innerHTML = complaints.map(c => `
        <div class="item-card" style="background: #fff; border: 1px solid rgba(79, 70, 229, 0.2);">
            <div class="card-info">
                <h4 style="color: #4f46e5; margin: 0 0 0.5rem 0;">Issue: ${c.issue_type || 'General'} - Item: ${c.actual_item_name || 'N/A'}</h4>
                <p style="font-size: 0.85rem; margin-bottom: 0.25rem;">
                    <strong>Complainant:</strong> ${c.complainant_name}
                    <br>
                    <strong>Accused:</strong> ${c.accused_name}
                </p>
                <p style="font-style: italic; color: var(--muted); margin: 0.5rem 0;">"${c.description}"</p>
                ${c.before_image ? `<span style="font-size: 0.8rem; color: #10b981;">📸 Includes Before Image</span>` : ''}
                ${c.after_image ? `<span style="font-size: 0.8rem; color: #10b981; margin-left: 0.5rem;">📸 Includes After Image</span>` : ''}
            </div>
            <div class="item-meta" style="flex-direction: column; gap: 0.5rem;">
                <span class="status ${c.status === 'open' ? 'error' : 'success'}" style="${c.status === 'open' ? 'background: rgba(220,53,69,0.1); color: #dc3545;' : 'background: rgba(16,185,129,0.1); color: #10b981;'}">
                    ${c.status.toUpperCase()}
                </span>
                ${c.status === 'open' ? `
                    <button class="btn small primary" onclick="resolveComplaint(${c.id})">Mark Resolved</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function resolveComplaint(id) {
    if (!confirm('Are you sure you want to mark this complaint as resolved?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/admin/complaints/${id}/status`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'resolved' })
        });
        
        if (response.ok) {
            alert('Complaint resolved successfully.');
            window.location.reload();
        } else {
            alert('Failed to resolve complaint.');
        }
    } catch (err) {
        console.error('Error resolving:', err);
    }
}
