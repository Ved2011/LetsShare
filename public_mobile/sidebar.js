// sidebar.js
function injectSidebar() {
    const isLandingPage = window.location.pathname.endsWith('welcome.html') || window.location.pathname === '/';
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const prefix = theme === 'dark' ? 'Dark_' : 'Light_';
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

    
    // Inject Lucide script and styles
    if (!document.getElementById('lucide-setup')) {
        const script = document.createElement('script');
        script.id = 'lucide-setup';
        script.src = "https://unpkg.com/lucide@latest";
        
        const style = document.createElement('style');
        style.innerHTML = `
            .sidebar-footer {
                margin-top: auto;
                border-top: 1px solid var(--border);
                padding: 0.75rem;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            .sidebar.collapsed .sidebar-footer {
                padding: 0.5rem;
            }
            .sidebar-footer .nav-item {
                margin: 0 !important;
            }
            .notification-link {
                color: var(--text-main);
                transition: color 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 50%;
            }
            .notification-link:hover {
                color: var(--accent);
                background: rgba(99, 102, 241, 0.1);
            }
            
            .sidebar-nav .lucide {
                width: 22px;
                height: 22px;
                stroke-width: 2px;
                transition: transform 0.2s ease, stroke 0.2s ease;
                color: inherit;
            }
            .sidebar-nav .nav-item:hover .lucide {
                transform: scale(1.1);
            }
            .sidebar-nav .nav-item.active .lucide {
                stroke: var(--accent, #6366f1);
            }
        `;
        document.head.appendChild(style);
        document.head.appendChild(script);
        
        script.onload = () => {
            if (window.lucide) lucide.createIcons();
        };
    } else {
        if (window.lucide) setTimeout(() => lucide.createIcons(), 0);
    }

    sidebar.innerHTML = `
        <div class="sidebar-header" style="justify-content: center; padding: 1rem 0;">
            <img src="/assets/Logo1.jpeg" alt="Logo" style="height: 45px; width: auto; border-radius: 6px;">
        </div>
        <nav class="sidebar-nav">
            <a href="user_Dashboard.html" class="nav-item ${window.location.pathname.includes('Dashboard') ? 'active' : ''}">
                <i data-lucide="layout-dashboard"></i> <span class="nav-text">Dashboard</span>
            </a>
            <a href="Notifications.html" class="nav-item ${window.location.pathname.includes('Notifications') ? 'active' : ''}">
                <i data-lucide="bell"></i> <span class="nav-text">Notifications</span>
            </a>
            <a href="SearchPage.html" class="nav-item ${window.location.pathname.includes('SearchPage') ? 'active' : ''}">
                <i data-lucide="search"></i> <span class="nav-text">Global Search</span>
            </a>
            <a href="Following.html" class="nav-item ${window.location.pathname.includes('Following') ? 'active' : ''}">
                <i data-lucide="star"></i> <span class="nav-text">Following</span>
            </a>
            <a href="communities.html" class="nav-item ${window.location.pathname.includes('communities') ? 'active' : ''}">
                <i data-lucide="users"></i> <span class="nav-text">Communities</span>
            </a>
            <a href="ItemForm.html" class="nav-item ${window.location.pathname.includes('ItemForm') ? 'active' : ''}">
                <i data-lucide="square-plus"></i> <span class="nav-text">List Item</span>
            </a>
            <a href="issue_Item.html" class="nav-item ${window.location.pathname.includes('issue_Item') ? 'active' : ''}">
                <i data-lucide="handshake"></i> <span class="nav-text">Borrow Item</span>
            </a>
            <a href="Complains.html" class="nav-item ${window.location.pathname.includes('Complains') ? 'active' : ''}">
                <i data-lucide="triangle-alert"></i> <span class="nav-text">Complaints</span>
            </a>
            <a href="Pricing.html" class="nav-item ${window.location.pathname.includes('Pricing') ? 'active' : ''}">
                <i data-lucide="gem"></i> <span class="nav-text">Upgrade Plan</span>
            </a>
            <div class="sidebar-footer">
                <a href="user_Profile.html" class="nav-item ${window.location.pathname.includes('Profile') ? 'active' : ''}">
                    <i data-lucide="circle-user-round"></i> <span class="nav-text">My Profile</span>
                </a>
                <a href="#" class="nav-item" id="sidebarLogout">
                    <i data-lucide="log-out"></i> <span class="nav-text">Logout</span>
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
    }

    // Auto-unify Header
    const header = document.querySelector('.header');
    if (header) {
        // Determine Page Title
        let pageTitle = "LetsShare";
        const existingSpan = header.querySelector('span[style*="font-weight: 600"]');
        const existingH2 = header.querySelector('h2');
        const existingH1 = header.querySelector('h1');
        if (existingSpan) pageTitle = existingSpan.textContent;
        else if (existingH2) pageTitle = existingH2.textContent;
        else if (existingH1) pageTitle = existingH1.textContent;
        else if (document.title.includes(' - ')) pageTitle = document.title.split(' - ')[0];

        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem; width: 100%;">
                <button class="menu-toggle" id="menuToggle" style="background: none; border: none; font-size: 1.5rem; color: var(--accent); padding: 0.5rem; margin-left: -0.5rem; cursor: pointer;">☰</button>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <img src="/assets/Logo2.jpeg" alt="LetsShare" style="height: 32px; border-radius: 4px;">
                    <span style="font-weight: 700; font-size: 1.1rem; color: var(--accent); margin-right: 0.5rem;">LetsShare</span>
                </div>
                <h2 style="font-size: 1.1rem; margin: 0; color: var(--text); flex-grow: 1; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pageTitle}</h2>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <a href="user_Profile.html" class="header-avatar" style="text-decoration: none; width: 32px; height: 32px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; background: var(--accent); color: white; border-radius: 50%;">${user?.name?.charAt(0).toUpperCase() || '?'}</a>
                </div>
            </div>
        `;
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
            window.location.href = 'welcome.html';
        });
    }

    // Hide sidebar on landing if not logged in (visual only)
    if (isLandingPage && !isLoggedIn) {
        sidebar.classList.add('collapsed');
        sidebar.style.display = 'none'; // Completely hide on landing for non-logged-in users
        overlay.style.display = 'none';
        if (menuToggle) menuToggle.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', injectSidebar);
