// sidebar.js
function injectSidebar() {
    const isLandingPage = window.location.pathname.endsWith('welcome.html') || window.location.pathname === '/';
    const isLoggedIn = !!localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // Create Sidebar HTML
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar collapsed';
    sidebar.id = 'sidebar';

    // Create Mobile Header
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-header';
    const pageTitle = document.title.split(' - ')[0];

    // Helper to determine the correct logo source
    function getLogoSrc() {
        const isMobile = window.innerWidth <= 1024;
        return isMobile ? '/assets/Logo1.jpeg' : '/assets/Logo1.jpeg';
    }

    mobileHeader.innerHTML = `
        <div class="mobile-header-left">
            <button class="menu-toggle" id="mobileMenuToggle">☰</button>
            <a href="user_Dashboard.html" class="brand">
                <img src="/assets/Logo1.jpeg" alt="Logo" style="width: 32px; height: 32px; border-radius: 6px;">
            </a>
        </div>
        <div class="mobile-header-center">
            <h2>${pageTitle}</h2>
        </div>
        <div class="mobile-header-right">
            ${isLoggedIn ? `<a href="user_Profile.html" class="header-avatar" style="width: 32px; height: 32px;">${user?.name?.charAt(0).toUpperCase()}</a>` : `<a href="login.html" class="btn small outline">Login</a>`}
        </div>
    `;

    // Create Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';

    sidebar.innerHTML = `
        <div class="sidebar-header" style="justify-content: center; padding: 1rem 0;">
            <img src="/assets/Logo1.jpeg" alt="Logo" style="height: 45px; width: auto; border-radius: 6px;">
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
            <a href="Followers.html" class="nav-item ${window.location.pathname.includes('Followers') ? 'active' : ''}">
                <i>👤</i> <span class="nav-text">Followers</span>
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

    // Improved Wrapping: Wrap EVERYTHING in an app-container
    if (!document.getElementById('appContainer')) {
        const appContainer = document.createElement('div');
        appContainer.className = 'app-container';
        appContainer.id = 'appContainer';

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

        document.body.prepend(appContainer);
        appContainer.appendChild(sidebar);
        appContainer.appendChild(mainWrapper);
        document.body.appendChild(overlay);

        mainWrapper.prepend(mobileHeader);

        // Standardize Header across all pages
        const header = document.querySelector('.header');
        if (header) {
            const pageTitle = document.title.split(' - ')[0];
            const user = JSON.parse(localStorage.getItem('user'));
            const isMobile = window.innerWidth <= 1024;
            const logoSrc = '/assets/Logo1.jpeg';

            const headerRight = header.querySelector('.header-right');
            const preservedRight = headerRight && headerRight.innerHTML.trim() !== '?' ? headerRight.innerHTML : `
                ${isLoggedIn ? `<a href="user_Profile.html" class="header-avatar">${user?.name?.charAt(0).toUpperCase()}</a>` : `<a href="login.html" class="btn small outline">Login</a>`}
            `;

            header.innerHTML = `
                <div class="header-left">
                    <button class="menu-toggle" id="menuToggle">☰</button>
                    <a href="user_Dashboard.html" class="brand">
                        <img src="${logoSrc}" alt="Logo" class="header-logo">
                    </a>
                </div>
                <div class="header-center">
                    <h1 class="page-title">${pageTitle === 'LetsShare' ? '' : pageTitle}</h1>
                </div>
                <div class="header-right">
                    ${isLoggedIn ? preservedRight : `<a href="login.html" class="btn small primary" style="text-decoration: none;">Login</a>`}
                </div>
            `;
        }
    }

    // Toggle logic - Moved AFTER injection
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');

    const toggleSidebar = () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.add('active');
            overlay.classList.add('active');
        } else {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    };

    if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', toggleSidebar);

    const overlayEl = document.getElementById('sidebarOverlay');
    if (overlayEl) {
        overlayEl.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            sidebar.classList.add('collapsed');
            overlay.classList.remove('active');
        });
    }

    // Smart Sticky Header Logic
    let lastScroll = 0;
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll <= 0) {
            header.classList.remove('header-hidden');
            return;
        }
        if (currentScroll > lastScroll && !header.classList.contains('header-hidden')) {
            // Scroll Down
            header.classList.add('header-hidden');
        } else if (currentScroll < lastScroll && header.classList.contains('header-hidden')) {
            // Scroll Up
            header.classList.remove('header-hidden');
        }
        lastScroll = currentScroll;
    });

    // Update logo on resize
    window.addEventListener('resize', () => {
        const logo = document.querySelector('.header-logo');
        if (logo) {
            const isMobile = window.innerWidth <= 1024;
            logo.src = isMobile ? '/assets/Logo1.jpeg' : '/assets/Logo1.jpeg';
        }
    });

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

        // Ensure main wrapper doesn't have padding
        mainWrapper.style.paddingLeft = '0';
    }
}

document.addEventListener('DOMContentLoaded', injectSidebar);
