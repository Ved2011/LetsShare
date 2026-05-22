import os

injection = """

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
"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js') and 'public_mobile' in root:
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            if 'Close sidebar on Escape key press' not in content:
                target_string = "overlay.addEventListener('click', closeSidebar);"
                if target_string in content:
                    content = content.replace(target_string, target_string + injection)
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Injected into {filepath}")

