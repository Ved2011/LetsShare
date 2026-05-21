import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    
    # 1. Remove Pricing from Vnmo sidebars
    if 'Vnmo' in filepath and filepath.endswith('sidebar.js'):
        pricing_regex = re.compile(r'<a href="Pricing\.html" class="nav-item[^>]+>\s*<i data-lucide="gem"></i> <span class="nav-text">Upgrade Plan</span>\s*</a>\s*', re.MULTILINE)
        content = pricing_regex.sub('', content)

    # 2. Fix 🔔 emoji where my previous regex missed it
    if filepath.endswith('sidebar.js'):
        # Just find the <a> tag containing 🔔 and replace the whole tag
        old_bell_tag = r'<a href="Notifications\.html" style="text-decoration: none; font-size: 1\.2rem; margin-right: 0\.5rem; filter: grayscale\(100%\); transition: filter 0\.2s;" onmouseover="this\.style\.filter=\'none\'" onmouseout="this\.style\.filter=\'grayscale\(100%\)\'" title="Notifications">🔔</a>'
        new_bell_tag = r'<a href="Notifications.html" class="notification-link" style="position:relative; text-decoration:none; margin-right:0.5rem;" title="Notifications"><i data-lucide="bell"></i></a>'
        content = re.sub(old_bell_tag, new_bell_tag, content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            fix_file(os.path.join(root, file))

