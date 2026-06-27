import os

injection_theme = """
    // Initialize Theme Globally First
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
"""

icon_fix_target = """            .sidebar-nav .lucide {"""
icon_fix_replacement = """            .sidebar-nav .lucide, .sidebar-footer .lucide {
                min-width: 24px !important;
                min-height: 24px !important;
                flex-shrink: 0 !important;"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js') or file == 'update_sidebars.py':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # 1. Inject global theme
            if 'Initialize Theme Globally First' not in content:
                target_string = "function injectSidebar() {"
                if target_string in content:
                    content = content.replace(target_string, target_string + injection_theme)
            
            # 2. Fix icon size
            if 'min-width: 24px !important;' not in content:
                content = content.replace(icon_fix_target, icon_fix_replacement)
                
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Updated {filepath}")

