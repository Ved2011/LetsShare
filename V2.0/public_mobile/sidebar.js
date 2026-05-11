// sidebar.js
function injectSidebar() {
    const isLandingPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    const isLoggedIn = !!localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Create Sidebar HTML
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';
    
    // Create Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <img src="assets/Logo2.jpeg" alt="Logo" style="width: 32px; height: 32px; border-radius: 6px;">
            <span class="nav-text" style="font-weight: 700; font-size: 1.3rem; color: var(--accent); margin-left: 0.75rem;">LetsShare</span>
        </div>
        <nav class="sidebar-nav">
            <a href="user_Dashboard.html" class="nav-item ${window.location.pathname.includes('Dashboard') ? 'active' : ''}">
                <i>🏠</i> <span class="nav-text">Dashboard</span>
            </a>
            <a href="SearchPage.html" class="nav-item ${window.location.pathname.includes('SearchPage') ? 'active' : ''}">
                <i>🔍</i> <span class="nav-text">Global Search</span>
            </a>
            <a href="Following.html" class="nav-item ${window.location.pathname.includes('Following') ? 'active' : ''}">
                <i>⭐</i> <span class="nav-text">Following</span>
            </a>
            <a href="communities.html" class="nav-item ${window.location.pathname.includes('communities') ? 'active' : ''}">
                <i>👥</i> <span class="nav-text">Communities</span>
            </a>
            <a href="ItemForm.html" class="nav-item ${window.location.pathname.includes('ItemForm') ? 'active' : ''}">
                <i>➕</i> <span class="nav-text">List Item</span>
            </a>
            <a href="issue_Item.html" class="nav-item ${window.location.pathname.includes('issue_Item') ? 'active' : ''}">
                <i>🤝</i> <span class="nav-text">Borrow Item</span>
            </a>
            <a href="Complains.html" class="nav-item ${window.location.pathname.includes('Complains') ? 'active' : ''}">
                <i>⚠️</i> <span class="nav-text">Complaints</span>
            </a>
            <a href="Pricing.html" class="nav-item ${window.location.pathname.includes('Pricing') ? 'active' : ''}">
                <i>💎</i> <span class="nav-text">Upgrade Plan</span>
            </a>
            <div style="margin-top: auto; border-top: 1px solid var(--border); padding-top: 1rem;">
                <a href="user_Profile.html" class="nav-item ${window.location.pathname.includes('Profile') ? 'active' : ''}">
                    <div class="header-avatar" style="width: 24px; height: 24px; font-size: 0.7rem; margin-right: 0.5rem;">${user?.name?.charAt(0).toUpperCase() || '?'}</div>
                    <span class="nav-text">My Profile</span>
                </a>
                <a href="#" class="nav-item" id="sidebarLogout">
                    <i>🚪</i> <span class="nav-text">Logout</span>
                </a>
            </div>
        </nav>
    `;

    // Improved Wrapping: Wrap EVERYTHING in the body except scripts and sidebar elements
    if (!document.getElementById('mainWrapper')) {
        const mainWrapper = document.createElement('div');
        mainWrapper.className = 'main-wrapper';
        mainWrapper.id = 'mainWrapper';
        
        // Move all current body children into mainWrapper (except scripts and the sidebar/overlay)
        const children = Array.from(document.body.children);
        children.forEach(child => {
            if (child.tagName !== 'SCRIPT' && child !== sidebar && child !== overlay) {
                mainWrapper.appendChild(child);
            }
        });
        
        document.body.prepend(mainWrapper);
        document.body.prepend(overlay);
        document.body.prepend(sidebar);

        // Auto-inject toggle button into header if missing
        const header = document.querySelector('.header');
        if (header && !document.getElementById('menuToggle')) {
            const btn = document.createElement('button');
            btn.id = 'menuToggle';
            btn.className = 'menu-toggle';
            btn.innerHTML = '☰';
            btn.style.marginRight = '1rem';
            btn.style.background = 'none';
            btn.style.border = '1px solid var(--border)';
            btn.style.padding = '0.5rem';
            btn.style.borderRadius = '8px';
            btn.style.cursor = 'pointer';
            header.prepend(btn);
        }
    }

    // Toggle logic
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    overlay.addEventListener('click', closeSidebar);

    // Logout logic
    const logoutBtn = document.getElementById('sidebarLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Hide sidebar on landing if not logged in (visual only)
    if (isLandingPage && !isLoggedIn) {
        sidebar.classList.add('collapsed');
        sidebar.style.display = 'none'; // Completely hide on landing for non-logged-in users
        overlay.style.display = 'none';
        if (menuToggle) menuToggle.style.display = 'none';
        
        // Ensure main wrapper doesn't have padding
        mainWrapper.style.paddingLeft = '0';
    }
}

document.addEventListener('DOMContentLoaded', injectSidebar);
