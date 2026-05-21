import os
import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    
    # 1. Remove "Dashboard" button from HTML headers
    if filepath.endswith('.html'):
        # Match `<a href="user_Dashboard.html" class="btn outline small">Dashboard</a>`
        # and also `<a href="user_Dashboard.html" class="btn small outline">Dashboard</a>`
        content = re.sub(r'<a href="user_Dashboard\.html" class="btn [^"]*">Dashboard</a>\s*', '', content)
        
    # 2. Fix sidebar.js issues
    if filepath.endswith('sidebar.js'):
        # Add sidebar-footer class
        content = content.replace(
            '<div style="margin-top: auto; border-top: 1px solid var(--border); padding: 0.75rem;">',
            '<div class="sidebar-footer">'
        )
        content = content.replace(
            '<div style="margin-top: auto; border-top: 1px solid var(--border); padding-top: 1rem;">',
            '<div class="sidebar-footer">'
        )
        
        # Add nav-text class to profile info block
        content = content.replace(
            '<div style="flex: 1; min-width: 0;">',
            '<div class="nav-text" style="flex: 1; min-width: 0;">'
        )
        
        # Add missing CSS to the injected style block
        if '.sidebar-footer' not in content and 'style.innerHTML = `' in content:
            css_addition = """
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
            """
            content = content.replace('style.innerHTML = `', 'style.innerHTML = `' + css_addition)
            
        # Update header right content bell icon
        content = re.sub(
            r'<a href="Notifications\.html" class="notification-link" style="position:relative; text-decoration:none; font-size:1\.2rem; margin-right:0\.5rem; filter:grayscale\(100%\); transition:filter 0\.2s;" onmouseover="this\.style\.filter=\'none\'" onmouseout="this\.style\.filter=\'grayscale\(100%\)\'" title="Notifications">🔔',
            r'<a href="Notifications.html" class="notification-link" style="position:relative; text-decoration:none; margin-right:0.5rem;" title="Notifications"><i data-lucide="bell"></i>',
            content
        )
        
        # Re-initialize icons for the header inject
        if 'header.innerHTML =' in content:
            content = content.replace(
                'header.innerHTML = `',
                'header.innerHTML = `'
            )
            # Find the end of if(header) block to re-call lucide.createIcons()
            # We'll just replace `if (header) { ... }` closing brace with `if (window.lucide) window.lucide.createIcons(); }`
            if 'if (window.lucide) window.lucide.createIcons();' not in content:
                content = content.replace(
                    '            `;\n        }',
                    '            `;\n            if (window.lucide) setTimeout(() => window.lucide.createIcons(), 0);\n        }'
                )

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('sidebar.js'):
            update_file(os.path.join(root, file))

