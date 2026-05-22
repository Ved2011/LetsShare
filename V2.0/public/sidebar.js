// sidebar.js
function injectSidebar() {
    const isLandingPage = window.location.pathname.endsWith('welcome.html') || window.location.pathname === '/';
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const prefix = theme === 'dark' ? 'Dark_' : 'Light_';
    const isLoggedIn = !!localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // Create Sidebar HTML
    const sidebar = document.createElement('aside');
    const isMobileDevice = window.innerWidth <= 1024;
    const isSidebarExpanded = !isMobileDevice && localStorage.getItem('sidebarExpanded') === 'true';
    if (isSidebarExpanded && (!isLandingPage || isLoggedIn)) {
        sidebar.className = 'sidebar active';
    } else {
        sidebar.className = 'sidebar collapsed';
    }
    sidebar.id = 'sidebar';

    // Create Mobile Header
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-header';
    const pageTitle = document.title.split(' - ')[0];

    mobileHeader.innerHTML = `
        <div class="mobile-header-left">
            <button class="menu-toggle" id="mobileMenuToggle">☰</button>
            <a href="user_Dashboard.html" class="brand">
                <img src="assets/${prefix}Logo1.png" alt="Logo" style="width: 32px; height: 32px; border-radius: 6px;">
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

    
    // Inject Lucide script and styles
    if (!document.getElementById('lucide-setup')) {
        const script = document.createElement('script');
        script.id = 'lucide-setup';
        script.src = "assets/lucide.min.js";
        
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
                padding: 1.25rem 0.5rem;
                gap: 0.75rem;
            }
            .sidebar-footer .nav-item {
                margin: 0.2rem 0.3rem !important;
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
        <div class="sidebar-header">
            <img src="assets/${prefix}Logo1.png" alt="Logo" style="width: 32px; height: 32px; border-radius: 6px;">
            <span class="nav-text" style="font-weight: 700; font-size: 1.25rem; color: #fff; letter-spacing: -0.01em;">LetsShare</span>
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
            <a href="Followers.html" class="nav-item ${window.location.pathname.includes('Followers') ? 'active' : ''}">
                <i data-lucide="user-round"></i> <span class="nav-text">Followers</span>
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
                <a href="${isLoggedIn ? 'user_Profile.html' : 'login.html'}" class="nav-item ${window.location.pathname.includes('Profile') ? 'active' : ''}" style="gap: 0.875rem;">
                    <div class="header-avatar" style="width: 28px; height: 28px; font-size: 0.65rem; flex-shrink: 0;">${user?.name?.charAt(0).toUpperCase() || '?'}</div>
                    <div class="nav-text" style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user?.name || 'Login'}</div>
                        <div style="font-size: 0.72rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${isLoggedIn ? 'View profile' : 'Sign in'}</div>
                    </div>
                </a>
                <a href="#" class="nav-item" id="sidebarLogout" style="color: var(--danger, #ef4444);">
                    <i data-lucide="log-out"></i> <span class="nav-text">Logout</span>
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
        document.body.prepend(overlay);

        mainWrapper.prepend(mobileHeader);

        // Standardize Header across all pages
        const header = document.querySelector('.header');
        if (header) {
            const pageTitle = document.title.split(' - ')[0];
            const user = JSON.parse(localStorage.getItem('user'));
            const isMobile = window.innerWidth <= 1024;
            const logoSrc = isMobile ? `assets/${prefix}Logo2.png` : `assets/${prefix}Logo3.png`;

            const headerRight = header.querySelector('.header-right');
            const preservedRight = headerRight && headerRight.innerHTML.trim() !== '?' ? headerRight.innerHTML : `
                ${isLoggedIn ? `<a href="Notifications.html" class="notification-link" style="position:relative; text-decoration:none; margin-right:0.5rem;" title="Notifications"><i data-lucide="bell"></i></a><a href="user_Profile.html" class="header-avatar">${user?.name?.charAt(0).toUpperCase()}</a>` : `<a href="login.html" class="btn small outline">Login</a>`}
            `;

            header.innerHTML = `
                <div class="header-left">
                    <button class="menu-toggle" id="menuToggle">☰</button>
                    <a href="user_Dashboard.html" class="brand">
                        <img src="${logoSrc}" alt="Logo" class="header-logo" onerror="this.src='/assets/Logo1.jpeg'">
                    </a>
                </div>
                <div class="header-center">
                    <h1 class="page-title">${pageTitle === 'LetsShare' ? '' : pageTitle}</h1>
                </div>
                <div class="header-right">
                    ${isLoggedIn ? preservedRight : `<a href="login.html" class="btn small primary" style="text-decoration: none;">Login</a>`}
                </div>
            `;
            if (window.lucide) setTimeout(() => window.lucide.createIcons(), 0);
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
            if (window.innerWidth > 1024) {
                localStorage.setItem('sidebarExpanded', 'true');
            }
        } else {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            if (window.innerWidth > 1024) {
                localStorage.setItem('sidebarExpanded', 'false');
            }
        }
    };

    if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', toggleSidebar);

    // Close sidebar on outside click
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && !sidebar.classList.contains('collapsed')) {
            const clickedInsideSidebar = sidebar.contains(e.target);
            const clickedMenuToggle = (menuToggle && menuToggle.contains(e.target)) || (mobileMenuToggle && mobileMenuToggle.contains(e.target));
            
            if (!clickedInsideSidebar && !clickedMenuToggle) {
                sidebar.classList.add('collapsed');
                sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                if (window.innerWidth > 1024) {
                    localStorage.setItem('sidebarExpanded', 'false');
                }
            }
        }
    });

    // Close sidebar on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
                sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                if (window.innerWidth > 1024) {
                    localStorage.setItem('sidebarExpanded', 'false');
                }
            }
        }
    });


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
    if (header) {
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
    }

    // Update logo on resize
    window.addEventListener('resize', () => {
        const logo = document.querySelector('.header-logo');
        if (logo) {
            const isMobile = window.innerWidth <= 1024;
            logo.src = isMobile ? 'assets/Logo2.png' : 'assets/Logo1.png';
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



    // Theme Logo updater
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const pfx = currentTheme === 'dark' ? 'Dark_' : 'Light_';
                document.querySelectorAll('img[src*="Logo"]').forEach(img => {
                    const src = img.getAttribute('src');
                    if (!src) return;
                    if (src.includes('Logo1.png')) img.src = `assets/${pfx}Logo1.png`;
                    if (src.includes('Logo2.png')) img.src = `assets/${pfx}Logo2.png`;
                    if (src.includes('Logo3.png')) img.src = `assets/${pfx}Logo3.png`;
                });
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });

document.addEventListener('DOMContentLoaded', injectSidebar);
