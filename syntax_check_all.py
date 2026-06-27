import os
import subprocess

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            filepath = os.path.join(root, file)
            res = subprocess.run(['node', '-c', filepath], capture_output=True, text=True)
            if res.returncode != 0:
                print(f"SYNTAX ERROR IN {filepath}:")
                print(res.stderr)
            else:
                print(f"OK: {filepath}")
