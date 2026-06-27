import os
import re

def fix_style(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # ensure page-title inside media query has max-width
    if 'max-width: 100%;' not in content and '.page-title {' in content:
        content = content.replace('text-overflow: ellipsis;', 'text-overflow: ellipsis;\n        max-width: 100%;')
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('style.css'):
            fix_style(os.path.join(root, file))

print("Header mobile fixed.")
