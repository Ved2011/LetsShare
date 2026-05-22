import os
import re

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    
    for file in files:
        if file == 'user_Dashboard.html':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                
            # We want to remove the Community Members tile
            # It usually looks like:
            # <div class="hero-stat-card">
            #     <strong id="dashboardUsers">0</strong>
            #     <span>Community Members</span>
            # </div>
            
            pattern = re.compile(r'<div\s+class="hero-stat-card">\s*<strong\s+id="dashboardUsers">.*?</strong>\s*<span>Community Members</span>\s*</div>', re.DOTALL)
            new_content, count = pattern.subn('', content)
            
            if count > 0:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Removed Community Members tile from {filepath}")
                
        elif file == 'style.css':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                
            # Replace min-width: 180px; with min-width: 0; in .hero-stat-card
            # Wait, .hero-stat-card might not have exactly 'min-width: 180px;' due to formatting
            # Let's search and replace carefully.
            
            new_content = content.replace('min-width: 180px;', 'min-width: 0;')
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Fixed hero-stat-card min-width in {filepath}")

