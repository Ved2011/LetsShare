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
            
            # --- DESKTOP ---
            if 'public/sidebar.js' in filepath:
                # Remove the hamburger button
                content = re.sub(r'<button class="menu-toggle" id="menuToggle">☰</button>\s*', '', content)
                
                # Make the sidebar header logo clickable
                if "const sidebarLogo = document.querySelector('.sidebar-header img');" not in content:
                    hook = "if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);"
                    injection = hook + "\n    const sidebarLogo = document.querySelector('.sidebar-header img');\n    if (sidebarLogo) sidebarLogo.addEventListener('click', toggleSidebar);"
                    content = content.replace(hook, injection)
                
                # Add CSS for cursor
                if "cursor: w-resize;" not in content:
                    css_hook = ".sidebar-header {"
                    css_inject = """            .sidebar-header img {
                cursor: w-resize;
                transition: transform 0.2s ease;
            }
            .sidebar.collapsed .sidebar-header img {
                cursor: e-resize;
            }
            .sidebar-header img:active {
                transform: scale(0.95);
            }
            .sidebar-header {"""
                    content = content.replace(css_hook, css_inject)

            # --- MOBILE ---
            elif 'public_mobile/sidebar.js' in filepath:
                # Remove hamburger button
                content = re.sub(r'<button class="menu-toggle" id="menuToggle"[^>]*>☰</button>\s*', '', content)
                
                # Make header logo div the menuToggle
                old_div = '<div style="display: flex; align-items: center; gap: 0.4rem;">'
                new_div = '<div id="menuToggle" style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">'
                content = content.replace(old_div, new_div)
                
                # Make the sidebar header logo clickable too (inside the sidebar)
                if "const sidebarLogo = document.querySelector('.sidebar-header img');" not in content:
                    hook = "if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);"
                    injection = hook + "\n    const sidebarLogo = document.querySelector('.sidebar-header img');\n    if (sidebarLogo) sidebarLogo.addEventListener('click', toggleSidebar);"
                    content = content.replace(hook, injection)

            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Updated {filepath}")

