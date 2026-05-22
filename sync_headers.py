import os
import re

universal_header_logic = """
        // Standardize Header across all pages
        const header = document.querySelector('.header');
        if (header) {
            let pageTitle = "LetsShare";
            const existingSpan = header.querySelector('span[style*="font-weight: 600"]');
            const existingH2 = header.querySelector('h2');
            const existingH1 = header.querySelector('h1');
            if (existingSpan) pageTitle = existingSpan.textContent;
            else if (existingH2) pageTitle = existingH2.textContent;
            else if (existingH1) pageTitle = existingH1.textContent;
            else if (document.title.includes(' - ')) pageTitle = document.title.split(' - ')[0];

            const isNotifPage = window.location.pathname.toLowerCase().includes('notifications');
            const isWelcomePage = window.location.pathname.toLowerCase().includes('welcome');
            
            const user = JSON.parse(localStorage.getItem('user'));
            const isMobile = window.innerWidth <= 1024;
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            const prefix = theme === 'dark' ? 'Dark_' : 'Light_';
            
            // Try prefix first, fallback to no prefix if broken
            const logoSrc = `assets/${prefix}Logo1.png`;

            const uniformRight = isLoggedIn 
                ? `${!isNotifPage ? '<a href="Notifications.html" class="notification-link" style="position:relative; text-decoration:none; margin-right:1rem; display:flex; align-items:center; justify-content:center; color:var(--text);" title="Notifications"><i data-lucide="bell"></i></a>' : ''}
                   <a href="user_Profile.html" class="header-avatar" style="text-decoration:none; width:36px; height:36px; border-radius:50%; background:var(--accent); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; flex-shrink:0;">${user?.name?.charAt(0).toUpperCase() || 'U'}</a>`
                : `<a href="login.html" class="btn small primary" style="text-decoration: none; padding:0.5rem 1.2rem; border-radius:999px; background:var(--accent); color:white; font-weight:bold; font-size:0.9rem;">Login</a>`;

            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.width = '100%';

            header.innerHTML = `
                <div class="header-left" style="display:flex; align-items:center;">
                    <a href="${isLoggedIn ? 'user_Dashboard.html' : 'welcome.html'}" class="brand" style="display:flex; align-items:center; text-decoration:none;">
                        <img src="${logoSrc}" alt="Logo" class="header-logo" onerror="this.src='assets/Logo1.jpeg'" style="height:45px; width:auto; max-width:180px; border-radius:6px; object-fit:contain;">
                    </a>
                </div>
                <div class="header-center" style="flex:1; text-align:center; padding:0 1rem; pointer-events:none;">
                    <h1 class="page-title" style="margin:0; font-size:1.2rem; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; pointer-events:auto;">${(pageTitle === 'LetsShare' || isWelcomePage) ? '' : pageTitle}</h1>
                </div>
                <div class="header-right" style="display:flex; align-items:center; justify-content:flex-end; flex-shrink:0;">
                    ${uniformRight}
                </div>
            `;
            if (window.lucide) setTimeout(() => window.lucide.createIcons(), 0);
        }
"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # We need to replace the entire block that standardizes/injects the header
            # Desktop versions usually have: "// Standardize Header across all pages"
            # Mobile versions might have: "// Auto-unify Header"
            
            # Find start of block
            if "// Standardize Header across all pages" in content:
                start_str = "// Standardize Header across all pages"
            elif "// Auto-unify Header" in content:
                start_str = "// Auto-unify Header"
            else:
                print(f"Skipping {filepath} - no header logic found")
                continue

            # Find end of block. Usually it's right before "// Toggle logic"
            end_str = "// Toggle logic"
            if end_str not in content:
                print(f"Could not find end marker in {filepath}")
                continue

            start_idx = content.find(start_str)
            end_idx = content.find(end_str)

            if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                new_content = content[:start_idx] + universal_header_logic + "\n    " + content[end_idx:]
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Synchronized header in {filepath}")
            else:
                print(f"Index error in {filepath}")

