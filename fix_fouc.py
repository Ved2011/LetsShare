import os

injection = """
    <script>
        (function() {
            var savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', savedTheme);
        })();
    </script>"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # Insert right after <head> if not already there
            if "localStorage.getItem('theme')" not in content and "<head>" in content:
                content = content.replace("<head>", "<head>" + injection)
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Fixed FOUC in {filepath}")

