import os
import re

def fix_style(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Change flex-start to space-between for .header in mobile
    content = content.replace('justify-content: flex-start !important;', 'justify-content: space-between !important;')
    
    # Ensure .header-center handles truncation on small screens
    # We will just add a global rule for .header-center inside the 768px media query.
    # Look for .header { flex-direction: row ... } block
    if '.header {\n        flex-direction: row !important;' in content:
        replacement = """    .header-center {
        position: absolute !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        max-width: 35vw;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
    }
    .page-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .header {"""
        content = content.replace('    .header {\n        flex-direction: row !important;', replacement + '\n        flex-direction: row !important;')
    
    with open(filepath, 'w') as f:
        f.write(content)

def fix_dashboard_js(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    content = content.replace('dashboardItems.textContent = stats.total_items || 0;', 'if (dashboardItems) dashboardItems.textContent = stats.total_items || 0;')
    
    with open(filepath, 'w') as f:
        f.write(content)


for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('style.css'):
            fix_style(os.path.join(root, file))
        if file.endswith('user_Dashboard.js'):
            fix_dashboard_js(os.path.join(root, file))

print("Bugs fixed.")
