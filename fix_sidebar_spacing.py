import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js') or file == 'update_sidebars.py':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            target = """            .sidebar.collapsed .sidebar-footer {
                padding: 0.5rem;
            }"""
            
            replacement = """            .sidebar.collapsed .sidebar-footer {
                padding: 1.25rem 0.5rem;
                gap: 0.75rem;
            }"""
            
            if target in content:
                content = content.replace(target, replacement)
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Updated spacing in {filepath}")

