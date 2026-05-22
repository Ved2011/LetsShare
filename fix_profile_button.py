import os
import re

injection = """            .sidebar.collapsed .sidebar-footer .nav-item {
                width: 44px !important;
                height: 44px !important;
                padding: 0 !important;
                margin: 0.25rem auto !important;
                justify-content: center !important;
            }"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js') or file == 'update_sidebars.py':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Remove previous bad margin rule
            target_to_remove = """            .sidebar-footer .nav-item {
                margin: 0.2rem 0.3rem !important;
            }"""
            if target_to_remove in content:
                content = content.replace(target_to_remove, "")
                
            # Add the new specific rule right after .sidebar.collapsed .sidebar-footer { ... }
            target_to_inject_after = """            .sidebar.collapsed .sidebar-footer {
                padding: 1.25rem 0.5rem;
                gap: 0.75rem;
            }"""
            
            if target_to_inject_after in content and injection not in content:
                content = content.replace(target_to_inject_after, target_to_inject_after + "\n" + injection)
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Updated {filepath}")
            elif target_to_remove in content:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Removed bad margin from {filepath}")

