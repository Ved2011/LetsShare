import os

injection = """

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
"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js') or file == 'update_sidebars.py':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Avoid injecting multiple times
            if 'Close sidebar on Escape key press' not in content:
                # Find insertion point
                target_string = "if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', toggleSidebar);"
                if target_string in content:
                    content = content.replace(target_string, target_string + injection)
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Injected into {filepath}")

