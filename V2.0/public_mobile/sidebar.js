// sidebar.js
function injectSidebar() {
    // Initialize Theme Globally First
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);

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
        script.src = "assets/lucide.min.js";
        
        const style = document.createElement('style');
        style.innerHTML = `
            
            .sidebar-header:hover .main-logo { opacity: 0 !important; }
            .sidebar-header:hover .hover-icon { opacity: 1 !important; }
            .sidebar-footer {
                margin-top: auto;
                border-top: 1px solid var(--border);
                padding: 0.75rem;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            .sidebar.collapsed 
            .sidebar-header:hover .main-logo { opacity: 0 !important; }
            .sidebar-header:hover .hover-icon { opacity: 1 !important; }
            .sidebar-footer {
                padding: 1.25rem 0.5rem;
                gap: 0.75rem;
            }
            .sidebar.collapsed .sidebar-footer .nav-item {
                width: 44px !important;
                height: 44px !important;
                padding: 0 !important;
                margin: 0.25rem auto !important;
                justify-content: center !important;
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
            
            .sidebar-nav .lucide, .sidebar-footer .lucide {
                min-width: 24px !important;
                min-height: 24px !important;
                flex-shrink: 0 !important;
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
        <div class="sidebar-header" style="justify-content: center; padding: 1rem 0; cursor: pointer;">
            <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 45px; width: 45px;">
                <img src="/assets/Logo1.jpeg" alt="Logo" class="main-logo" style="height: 100%; width: 100%; border-radius: 6px; transition: opacity 0.2s;">
                <i data-lucide="panel-left" class="hover-icon" style="position: absolute; opacity: 0; transition: opacity 0.2s; color: var(--text-main); width: 28px; height: 28px;"></i>
            </div>
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
                <div id="menuToggle" style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
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

    // Close sidebar on outside click
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            const clickedInsideSidebar = sidebar.contains(e.target);
            const clickedMenuToggle = menuToggle && menuToggle.contains(e.target);
            
            if (!clickedInsideSidebar && !clickedMenuToggle) {
                closeSidebar();
            }
        }
    });

    // Close sidebar on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                closeSidebar();
            }
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

    
    // Notification Dropdown Logic
    const notificationLinks = document.querySelectorAll('.notification-link');
    notificationLinks.forEach(bellLink => {
        if (!bellLink.closest('.header-right') && !bellLink.closest('.header')) return;

        bellLink.style.position = 'relative';
        
        let badge = bellLink.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.style.cssText = 'display:none; position:absolute; top:-2px; right:2px; background:var(--danger, #ef4444); color:white; font-size:0.6rem; font-weight:bold; padding:2px 5px; border-radius:10px; pointer-events:none;';
            bellLink.appendChild(badge);
        }

        const parent = bellLink.parentElement;
        parent.style.position = 'relative';

        let dropdown = parent.querySelector('.notification-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'notification-dropdown';
            dropdown.style.cssText = 'display:none; position:absolute; top:45px; right:0; width:280px; max-height:400px; background:var(--card, #1e1e2f); border:1px solid var(--border, #2d2d3f); border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:1000; flex-direction:column; overflow:hidden;';
            
            dropdown.innerHTML = `
                <div style="padding:10px 12px; border-bottom:1px solid var(--border, #2d2d3f); font-weight:bold; color:var(--text-main, #fff); font-size:0.9rem;">Unread Notifications</div>
                <div class="notification-dropdown-list" style="display:flex; flex-direction:column; max-height:300px; overflow-y:auto;">
                    <div style="padding:15px 10px; text-align:center; color:var(--muted, #9ca3af); font-size:0.85rem;">Loading...</div>
                </div>
                <div style="padding:10px; border-top:1px solid var(--border, #2d2d3f); text-align:center; background:rgba(0,0,0,0.1);">
                    <a href="Notifications.html" style="color:var(--accent, #6366f1); text-decoration:none; font-size:0.85rem; font-weight:600; display:block;">View All</a>
                </div>
            `;
            parent.appendChild(dropdown);
        }

        const list = dropdown.querySelector('.notification-dropdown-list');

        bellLink.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'flex';
            if (isVisible) {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.display = 'flex';
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const res = await fetch('/api/notifications', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const notifs = await res.json();
                        const unread = notifs.filter(n => !n.is_read);
                        if (unread.length > 0) {
                            badge.style.display = 'block';
                            badge.textContent = unread.length;
                            list.innerHTML = unread.map(n => `
                                <a href="Notifications.html" style="padding:12px; border-bottom:1px solid var(--border, #2d2d3f); text-decoration:none; color:var(--text-main, #fff); font-size:0.85rem; display:block; transition:background 0.2s;">
                                    <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500;">${n.message}</div>
                                </a>
                            `).join('');
                        } else {
                            badge.style.display = 'none';
                            list.innerHTML = '<div style="padding:15px 10px; text-align:center; color:var(--muted, #9ca3af); font-size:0.85rem;">No unread messages</div>';
                        }
                    }
                } catch (err) {
                    list.innerHTML = '<div style="padding:15px 10px; text-align:center; color:var(--danger, #ef4444); font-size:0.85rem;">Failed to load</div>';
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (!bellLink.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` }})
                .then(r => r.json())
                .then(notifs => {
                    if(Array.isArray(notifs)) {
                        const unread = notifs.filter(n => !n.is_read);
                        if (unread.length > 0) {
                            badge.style.display = 'block';
                            badge.textContent = unread.length;
                        }
                    }
                }).catch(e => console.error(e));
        }
    });

    // Hide sidebar on landing if not logged in (visual only)
    if (isLandingPage && !isLoggedIn) {
        sidebar.classList.add('collapsed');
        sidebar.style.display = 'none'; // Completely hide on landing for non-logged-in users
        overlay.style.display = 'none';
        if (menuToggle) menuToggle.style.display = 'none';
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
