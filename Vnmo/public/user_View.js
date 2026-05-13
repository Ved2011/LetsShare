document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        window.location.href = 'user_Dashboard.html';
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('User not found');
        const user = await response.json();

        // Update UI
        document.title = `${user.name} - LetsShare`;
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userUsername').textContent = `@${user.username || user.email.split('@')[0]}`;
        
        const avatar = document.getElementById('userAvatar');
        if (user.profilePictureBase64) {
            avatar.innerHTML = `<img src="data:image/jpeg;base64,${user.profilePictureBase64}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            avatar.textContent = user.name.charAt(0).toUpperCase();
        }

        // Follow Button Logic
        const followBtn = document.getElementById('followBtn');
        let isFollowed = user.is_followed;

        const updateFollowBtn = () => {
            if (isFollowed) {
                followBtn.textContent = 'Unfollow';
                followBtn.classList.remove('primary');
                followBtn.classList.add('outline');
            } else {
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('outline');
                followBtn.classList.add('primary');
            }
        };

        updateFollowBtn();

        followBtn.onclick = async () => {
            const method = isFollowed ? 'DELETE' : 'POST';
            try {
                const res = await fetch(`/api/users/${userId}/follow`, {
                    method: method,
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    isFollowed = !isFollowed;
                    updateFollowBtn();
                }
            } catch (err) {
                console.error('Follow error:', err);
            }
        };

        // Load User Items
        loadUserItems(userId);

    } catch (err) {
        console.error('Error loading user profile:', err);
        document.querySelector('.page-wrapper').innerHTML = '<section class="card"><h1>User not found</h1><a href="user_Dashboard.html">Go back</a></section>';
    }
});

async function loadUserItems(userId) {
    const grid = document.getElementById('userItemsGrid');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/items/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = await response.json();

        if (items.length === 0) {
            grid.innerHTML = '<p>No items uploaded by this user.</p>';
            return;
        }

        grid.innerHTML = items.map(item => `
            <div class="community-card">
                ${item.imageBase64 ? `<img src="${item.imageBase64}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">` : ''}
                ${item.imageBase64 ? `<img src="${item.imageBase64}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">` : `<img src="/assets/untitled.png" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">`}
                <h3>${item.name}</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 1rem;">${item.description || 'No description'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="status ${item.status.toLowerCase()}">${item.status}</span>
                    <a href="item_Details.html?id=${item.id}" class="btn small outline">Details</a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading user items:', err);
        grid.innerHTML = '<p>Error loading items.</p>';
    }
}
