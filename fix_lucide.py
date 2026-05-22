import os
import shutil

# Copy lucide.min.js to all assets directories
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    if os.path.basename(root) == 'assets':
        shutil.copy('lucide.min.js', os.path.join(root, 'lucide.min.js'))

# Update sidebar.js to use local lucide
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js') or file == 'update_sidebars.py':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            content = content.replace('"https://unpkg.com/lucide@latest"', '"assets/lucide.min.js"')
            content = content.replace("'https://unpkg.com/lucide@latest'", '"assets/lucide.min.js"')
            
            with open(filepath, 'w') as f:
                f.write(content)

print("Lucide CDN replaced with local asset.")
