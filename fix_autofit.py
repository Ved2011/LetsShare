import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('style.css'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Change dashboard-grid to auto-fit so it stretches
            content = content.replace('grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;', 
                                      'grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important;')
            
            with open(filepath, 'w') as f:
                f.write(content)

print("dashboard-grid set to auto-fit.")
