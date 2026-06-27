import os
import re

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file == 'style.css':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Replace repeat(4, 1fr) with auto-fit, minmax(240px, 1fr)
            new_content = re.sub(r'grid-template-columns:\s*repeat\(4,\s*1fr\);', 'grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));', content)
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

