import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                
            original_content = content
            content = content.replace("var(--card, #1e1e2f)", "var(--card-bg, #1e1e2f)")
            content = content.replace("var(--text-main, #fff)", "var(--text, #fff)")
            content = content.replace("var(--bg, #13131f)", "var(--bg-main, #13131f)")

            if content != original_content:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Fixed CSS variables in {filepath}")

