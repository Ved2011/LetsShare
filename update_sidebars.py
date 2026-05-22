import os
import re

replacements = {
    r'<i>🏠</i>': '<i data-lucide="layout-dashboard"></i>',
    r'<i>🔔</i>': '<i data-lucide="bell"></i>',
    r'<i>🔍</i>': '<i data-lucide="search"></i>',
    r'<i>⭐</i>': '<i data-lucide="star"></i>',
    r'<i>👥</i>': '<i data-lucide="users"></i>',
    r'<i>👤</i>': '<i data-lucide="user-round"></i>',
    r'<i>➕</i>': '<i data-lucide="square-plus"></i>',
    r'<i>🤝</i>': '<i data-lucide="handshake"></i>',
    r'<i>⚠️</i>': '<i data-lucide="triangle-alert"></i>',
    r'<i>🛡️</i>': '<i data-lucide="shield-check"></i>',
    r'<i>💎</i>': '<i data-lucide="gem"></i>',
    r'<i>🚪</i>': '<i data-lucide="log-out"></i>',
}

injection_code = """
    // Inject Lucide script and styles
    if (!document.getElementById('lucide-setup')) {
        const script = document.createElement('script');
        script.id = 'lucide-setup';
        script.src = "assets/lucide.min.js";
        
        const style = document.createElement('style');
        style.innerHTML = `
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
"""

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    
    for old, new in replacements.items():
        content = re.sub(old, new, content)
        
    # Replace profile avatar in mobile sidebar with lucide icon
    content = re.sub(
        r'<div class="header-avatar"[^>]*>\$\{user\?\.name\?\.charAt\(0\)\.toUpperCase\(\) \|\| \'\?\'\}</div>\s*<span class="nav-text">My Profile</span>',
        r'<i data-lucide="circle-user-round"></i> <span class="nav-text">My Profile</span>',
        content
    )
    
    # Insert injection code right before the sidebar innerHTML is set if not already there
    if 'lucide-setup' not in content:
        # Find where sidebar.innerHTML is set
        if 'sidebar.innerHTML =' in content:
            content = content.replace('sidebar.innerHTML =', injection_code + '\n    sidebar.innerHTML =', 1)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"No changes needed for {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file == 'sidebar.js':
            update_file(os.path.join(root, file))

