import os
import re
import shutil
import glob

# 1. Copy logos to all asset folders
source_public_assets = glob.glob('./public/assets/*Logo*.png')
source_mobile_assets = glob.glob('./public_mobile/assets/*Logo*.png')

dest_publics = ['./V2.0/public/assets/', './Vnmo/public/assets/']
dest_mobiles = ['./V2.0/public_mobile/assets/', './Vnmo/public_mobile/assets/']

for d in dest_publics:
    os.makedirs(d, exist_ok=True)
    for src in source_public_assets:
        shutil.copy(src, d)

for d in dest_mobiles:
    os.makedirs(d, exist_ok=True)
    for src in source_mobile_assets:
        shutil.copy(src, d)

print("Logos copied to all versions.")

# 2. Fix style.css header responsiveness
def fix_style(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    original = content
    
    # Remove bad max-width 640px and 600px rules for .header
    bad_640 = r'@media \(max-width:\s*640px\)\s*\{\s*\.header\s*\{[^}]+\}\s*\.logo\s*\{[^}]+\}\s*\.header-left\s*\{[^}]+\}\s*\}'
    bad_600 = r'@media \(max-width:\s*600px\)\s*\{\s*\.header\s*\{[^}]+\}\s*\.auth-buttons\s*\{[^}]+\}\s*\}'
    
    content = re.sub(bad_640, '', content)
    content = re.sub(bad_600, '', content)
    
    # Add proper responsive rule for header
    responsive_header = """
@media (max-width: 768px) {
    .header {
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 0.75rem 1rem !important;
        gap: 0.5rem !important;
    }
    .header-left {
        flex-direction: row !important;
        width: auto !important;
        gap: 0.5rem !important;
    }
    .header-center {
        position: static !important;
        transform: none !important;
        flex: 1;
        text-align: center;
        display: flex;
        justify-content: center;
        min-width: 0;
    }
    .page-title {
        font-size: 1.25rem !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .header-logo {
        height: 32px !important;
        max-width: 120px;
    }
}
"""
    if '@media (max-width: 768px) {\n    .header {' not in content:
        content += responsive_header

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)

# 3. Fix sidebar.js logic
def fix_sidebar(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    original = content
    
    is_mobile_folder = 'public_mobile' in filepath
    
    # We need theme logic.
    theme_logic = "const theme = document.documentElement.getAttribute('data-theme') || 'light';\n            const prefix = theme === 'dark' ? 'Dark_' : 'Light_';"
    
    # Replace Mobile Header logo (Logo2 for mobile, Logo3 for desktop)
    # Actually mobileHeader is just injected in both, but we can just use Logo1 (Icon) or Logo2 (Mini)
    if 'assets/Logo3.png' in content or 'assets/Logo1.jpeg' in content:
        # In sidebar-header (the actual sidebar menu top)
        content = re.sub(r'<img src="assets/Logo3\.png" alt="Logo" style="width: 32px; height: 32px;[^>]*>', 
                         r'<img src="assets/${prefix}Logo1.png" alt="Logo" style="width: 32px; height: 32px; border-radius: 6px;">', content)
        
        # In mobile-header
        content = re.sub(r'<img src="assets/Logo3\.png" alt="Logo" style="width: 32px; height: 32px; border-radius: 6px;" onerror="this\.src=\'assets/Logo1\.jpeg\'">', 
                         r'<img src="assets/${prefix}Logo2.png" alt="Logo" style="height: 32px; border-radius: 6px; object-fit: contain;">', content)
                         
    # Main Header logic in sidebar.js
    if "const logoSrc = isMobile ? 'assets/Logo2.jpeg' : 'assets/Logo1.jpeg';" in content:
        # If we are in public_mobile, use Logo2 (Mini), else Logo3 (Horizontal)
        logo_desktop = 'Logo3.png'
        logo_mobile = 'Logo2.png'
        replacement = f"""
            {theme_logic}
            const logoSrc = isMobile ? `assets/${{prefix}}{logo_mobile}` : `assets/${{prefix}}{logo_desktop}`;
        """
        content = content.replace("const logoSrc = isMobile ? 'assets/Logo2.jpeg' : 'assets/Logo1.jpeg';", replacement)
        
        content = re.sub(r'<img src="\$\{logoSrc\}" alt="Logo" class="header-logo" onerror="this\.src=\'/assets/Logo1\.jpeg\'">', 
                         r'<img src="${logoSrc}" alt="Logo" class="header-logo">', content)
        content = re.sub(r'<img src="\$\{logoSrc\}" alt="Logo" class="header-logo" onerror="this\.src=\'assets/Logo1\.jpeg\'">', 
                         r'<img src="${logoSrc}" alt="Logo" class="header-logo">', content)

    # Need to inject prefix logic at the top of injectSidebar for the string templates!
    if "const prefix = " not in content and "const isLandingPage" in content:
        content = content.replace(
            "const isLandingPage = window.location.pathname.endsWith('welcome.html') || window.location.pathname === '/';",
            "const isLandingPage = window.location.pathname.endsWith('welcome.html') || window.location.pathname === '/';\n    const theme = document.documentElement.getAttribute('data-theme') || 'light';\n    const prefix = theme === 'dark' ? 'Dark_' : 'Light_';"
        )

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('style.css'):
            fix_style(os.path.join(root, file))
        if file.endswith('sidebar.js'):
            fix_sidebar(os.path.join(root, file))

print("Done.")

