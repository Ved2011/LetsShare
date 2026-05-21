import os
import re

def fix_html(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    is_mobile = 'public_mobile' in filepath
    
    # Favicons (always Logo1 Icon Only)
    content = re.sub(r'href="assets/Logo[1234]\.jpe?g"', 'href="assets/Light_Logo1.png"', content)
    content = re.sub(r'href="assets/Logo[1234]\.png"', 'href="assets/Light_Logo1.png"', content)
    
    # Images in Mobile vs Desktop
    if is_mobile:
        content = re.sub(r'src="assets/Logo[1234]\.jpe?g"', 'src="assets/Light_Logo2.png"', content)
        content = re.sub(r'src="assets/Logo[1234]\.png"', 'src="assets/Light_Logo2.png"', content)
    else:
        content = re.sub(r'src="assets/Logo[1234]\.jpe?g"', 'src="assets/Light_Logo3.png"', content)
        content = re.sub(r'src="assets/Logo[1234]\.png"', 'src="assets/Light_Logo3.png"', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            fix_html(os.path.join(root, file))

print("HTML logos fixed.")
