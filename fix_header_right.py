import os
import re

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # The goal is to replace the preservedRight logic with a uniform generation logic
            # Find the header right logic block
            start_marker = "const headerRight = header.querySelector('.header-right');"
            end_marker = "</script>" # Not this
            
            # Let's replace using regex or string replacement
            # The current logic looks something like:
            # const preservedRight = headerRight && headerRight.innerHTML.trim() !== '?' ? headerRight.innerHTML : `
            #     ${isLoggedIn ? `<a href="Notifications.html" class="notification-link" style="position:relative; text-decoration:none; margin-right:0.5rem;" title="Notifications"><i data-lucide="bell"></i></a><a href="user_Profile.html" class="header-avatar">${user?.name?.charAt(0).toUpperCase()}</a>` : `<a href="login.html" class="btn small outline">Login</a>`}
            # `;
            
            new_logic = """
            const headerRight = header.querySelector('.header-right');
            const isNotifPage = window.location.pathname.toLowerCase().includes('notifications');
            const uniformRight = `
                ${isLoggedIn ? `
                    ${!isNotifPage ? `<a href="Notifications.html" class="notification-link" style="position:relative; text-decoration:none; margin-right:0.5rem;" title="Notifications"><i data-lucide="bell"></i></a>` : ''}
                    <a href="user_Profile.html" class="header-avatar" style="text-decoration:none;">${user?.name?.charAt(0).toUpperCase() || 'U'}</a>
                ` : `<a href="login.html" class="btn small primary" style="text-decoration: none;">Login</a>`}
            `;
"""

            # We can find the block by searching from 'const preservedRight' up to the end of the template literal
            # Actually, the entire header.innerHTML is set right after.
            # Let's do a regex replacement for the entire innerHTML setting block
            
            pattern = re.compile(r"const headerRight = header\.querySelector\('.header-right'\);[\s\S]*?header\.innerHTML = `[\s\S]*?<div class=\"header-right\">[\s\S]*?</div>[\s\S]*?`;")
            
            new_block = """const headerRight = header.querySelector('.header-right');
            const isNotifPage = window.location.pathname.toLowerCase().includes('notifications');
            const uniformRight = isLoggedIn 
                ? `${!isNotifPage ? '<a href="Notifications.html" class="notification-link" style="position:relative; text-decoration:none; margin-right:0.5rem;" title="Notifications"><i data-lucide="bell"></i></a>' : ''}<a href="user_Profile.html" class="header-avatar" style="text-decoration:none;">${user?.name?.charAt(0).toUpperCase() || 'U'}</a>`
                : `<a href="login.html" class="btn small primary" style="text-decoration: none;">Login</a>`;

            header.innerHTML = `
                <div class="header-left">
                    <a href="user_Dashboard.html" class="brand">
                        <img src="${logoSrc}" alt="Logo" class="header-logo" onerror="this.src='/assets/Logo1.jpeg'">
                    </a>
                </div>
                <div class="header-center">
                    <h1 class="page-title">${pageTitle === 'LetsShare' ? '' : pageTitle}</h1>
                </div>
                <div class="header-right">
                    ${uniformRight}
                </div>
            `;"""
            
            content, count = pattern.subn(new_block, content)
            if count > 0:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Updated {filepath}")

