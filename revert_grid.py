import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('style.css'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            content = content.replace('.items-square-grid, .items-grid {', '.items-square-grid {')
            
            with open(filepath, 'w') as f:
                f.write(content)

