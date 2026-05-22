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

            # Fix event listener binding to the whole header
            content = content.replace("const sidebarLogo = document.querySelector('.sidebar-header img');", "const sidebarLogo = document.querySelector('.sidebar-header');")
            
            # --- DESKTOP ---
            if 'public/sidebar.js' in filepath:
                # Replace the HTML block
                old_html = """        <div class="sidebar-header">
            <img src="assets/${prefix}Logo1.png" alt="Logo" style="width: 32px; height: 32px; border-radius: 6px;">
            <span class="nav-text" style="font-weight: 700; font-size: 1.25rem; color: #fff; letter-spacing: -0.01em;">LetsShare</span>
        </div>"""
                new_html = """        <div class="sidebar-header" style="cursor: pointer;">
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
                <img src="assets/${prefix}Logo1.png" alt="Logo" class="main-logo" style="width: 100%; height: 100%; border-radius: 6px; transition: opacity 0.2s;">
                <i data-lucide="panel-left" class="hover-icon" style="position: absolute; opacity: 0; transition: opacity 0.2s; color: white; width: 24px; height: 24px;"></i>
            </div>
            <span class="nav-text" style="font-weight: 700; font-size: 1.25rem; color: #fff; letter-spacing: -0.01em;">LetsShare</span>
        </div>"""
                if old_html in content:
                    content = content.replace(old_html, new_html)
                
                # Remove the previously injected cursor styles and add new ones
                cursor_css_old = """            .sidebar-header img {
                cursor: w-resize;
                transition: transform 0.2s ease;
            }
            .sidebar.collapsed .sidebar-header img {
                cursor: e-resize;
            }
            .sidebar-header img:active {
                transform: scale(0.95);
            }"""
                cursor_css_new = """            .sidebar-header:hover .main-logo { opacity: 0 !important; }
            .sidebar-header:hover .hover-icon { opacity: 1 !important; }"""
                if cursor_css_old in content:
                    content = content.replace(cursor_css_old, cursor_css_new)
            
            # --- MOBILE ---
            elif 'public_mobile/sidebar.js' in filepath:
                # Replace the HTML block
                old_html = """        <div class="sidebar-header" style="justify-content: center; padding: 1rem 0;">
            <img src="/assets/Logo1.jpeg" alt="Logo" style="height: 45px; width: auto; border-radius: 6px;">
        </div>"""
                new_html = """        <div class="sidebar-header" style="justify-content: center; padding: 1rem 0; cursor: pointer;">
            <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 45px; width: 45px;">
                <img src="/assets/Logo1.jpeg" alt="Logo" class="main-logo" style="height: 100%; width: 100%; border-radius: 6px; transition: opacity 0.2s;">
                <i data-lucide="panel-left" class="hover-icon" style="position: absolute; opacity: 0; transition: opacity 0.2s; color: var(--text-main); width: 28px; height: 28px;"></i>
            </div>
        </div>"""
                if old_html in content:
                    content = content.replace(old_html, new_html)

                # Add CSS
                css_hook = ".sidebar-header {"
                css_new = """            .sidebar-header:hover .main-logo { opacity: 0 !important; }
            .sidebar-header:hover .hover-icon { opacity: 1 !important; }
            .sidebar-header {"""
                if "sidebar-header:hover" not in content and css_hook in content:
                    content = content.replace(css_hook, css_new)

            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Updated {filepath}")

