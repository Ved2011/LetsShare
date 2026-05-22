import os

sidebar_replacement_script = """
        // Standardize Header across all pages
        const header = document.querySelector('.header');
        const isWelcomePage = window.location.pathname.toLowerCase().includes('welcome');
        
        if (header && !isWelcomePage) {
            let pageTitle = "LetsShare";
            const existingSpan = header.querySelector('span[style*="font-weight: 600"]');
            const existingH2 = header.querySelector('h2');
            const existingH1 = header.querySelector('h1');
            if (existingSpan) pageTitle = existingSpan.textContent;
            else if (existingH2) pageTitle = existingH2.textContent;
            else if (existingH1) pageTitle = existingH1.textContent;
            else if (document.title.includes(' - ')) pageTitle = document.title.split(' - ')[0];

            const isNotifPage = window.location.pathname.toLowerCase().includes('notifications');
            
            const user = JSON.parse(localStorage.getItem('user'));
            const isMobile = window.innerWidth <= 1024;
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            const prefix = theme === 'dark' ? 'Dark_' : 'Light_';
            
            const logoSrc = isMobile ? `assets/${prefix}Logo2.png` : `assets/${prefix}Logo3.png`;

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
                        <img src="${logoSrc}" alt="Logo" class="header-logo" onerror="this.src='assets/Logo3.jpeg'" style="height:45px; width:auto; max-width:180px; border-radius:6px; object-fit:contain;">
                    </a>
                </div>
                <div class="header-center" style="flex:1; text-align:center; padding:0 1rem; pointer-events:none;">
                    <h1 class="page-title" style="margin:0; font-size:1.2rem; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; pointer-events:auto;">${(pageTitle === 'LetsShare') ? '' : pageTitle}</h1>
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

            start_str = "// Standardize Header across all pages"
            end_str = "// Toggle logic"

            start_idx = content.find(start_str)
            end_idx = content.find(end_str)

            if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                new_content = content[:start_idx] + sidebar_replacement_script + "\n    " + content[end_idx:]
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Fixed sidebar logic in {filepath}")

        if file.endswith('index.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                
            # Replace the auth buttons hiding logic
            old_logic = """  if (token) {
    const guestButtons = document.querySelectorAll('.auth-buttons a.btn');
    guestButtons.forEach(btn => btn.style.display = 'none');
  }"""
            new_logic = """  if (token) {
    const authButtons = document.getElementById('authButtons');
    if (authButtons) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      authButtons.style.display = 'flex';
      authButtons.style.alignItems = 'center';
      authButtons.innerHTML = `
        <a href="user_Dashboard.html" class="btn primary" style="margin-right: 1rem;">Go to Dashboard</a>
        <a href="user_Profile.html" class="header-avatar" style="text-decoration:none; width:36px; height:36px; border-radius:50%; background:var(--accent); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; flex-shrink:0;">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</a>
      `;
    }
  }"""
            
            if old_logic in content:
                content = content.replace(old_logic, new_logic)
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Fixed index.js auth buttons in {filepath}")
                

