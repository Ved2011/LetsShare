import os
import re

def fix_style(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    content = content.replace('padding: 0.6rem 0;', 'padding: 0.6rem 0.5rem;')
    
    # Update page-wrapper padding in all media queries where it is 0.5rem
    content = re.sub(r'(\.page-wrapper\s*\{\s*padding:\s*)0\.5rem(;?\s*\})', r'\g<1>1rem\g<2>', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

def fix_server(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if "app.use('/api/notifications'" not in content:
        content = content.replace("app.use('/api/communities', communitiesRoutes);", 
                                  "app.use('/api/communities', communitiesRoutes);\napp.use('/api/notifications', require('./routes/notifications'));")
        
        with open(filepath, 'w') as f:
            f.write(content)

def fix_dashboard(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    pattern = r'<div class="hero-stat-card">\s*<strong id="dashboardItems">0</strong>\s*<span>Total Items</span>\s*</div>'
    content = re.sub(pattern, '', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

def fix_sidebar(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    if "const logoSrc = isMobile ? 'assets/Logo2.png' : 'assets/Logo1.png';" in content:
        content = content.replace(
            "const logoSrc = isMobile ? 'assets/Logo2.png' : 'assets/Logo1.png';",
            "const logoSrc = isMobile ? `assets/${prefix}Logo2.png` : `assets/${prefix}Logo3.png`;"
        )
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('style.css'):
            fix_style(os.path.join(root, file))
        if file.endswith('server.js'):
            fix_server(os.path.join(root, file))
        if file.endswith('user_Dashboard.html'):
            fix_dashboard(os.path.join(root, file))
        if file.endswith('sidebar.js'):
            fix_sidebar(os.path.join(root, file))

print("All fixes applied.")
