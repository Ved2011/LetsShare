import os

injection = """
            .sidebar-header:hover .main-logo { opacity: 0 !important; }
            .sidebar-header:hover .hover-icon { opacity: 1 !important; }
"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            if ".sidebar-header:hover" not in content:
                content = content.replace(".sidebar-footer {", injection + "            .sidebar-footer {")
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Injected CSS into {filepath}")

