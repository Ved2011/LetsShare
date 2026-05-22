import os

injection = """

    // Theme Logo updater
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const pfx = currentTheme === 'dark' ? 'Dark_' : 'Light_';
                document.querySelectorAll('img[src*="Logo"]').forEach(img => {
                    const src = img.getAttribute('src');
                    if (!src) return;
                    if (src.includes('Logo1.png')) img.src = `assets/${pfx}Logo1.png`;
                    if (src.includes('Logo2.png')) img.src = `assets/${pfx}Logo2.png`;
                    if (src.includes('Logo3.png')) img.src = `assets/${pfx}Logo3.png`;
                });
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });
"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js') or file == 'update_sidebars.py':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            if 'Theme Logo updater' not in content:
                target_string = "document.addEventListener('DOMContentLoaded', injectSidebar);"
                if target_string in content:
                    content = content.replace(target_string, injection + "\n" + target_string)
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Injected into {filepath}")

