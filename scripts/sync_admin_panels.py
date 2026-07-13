import os
import shutil
import re

ROOT = "/Users/ved/Documents/Coding/LetsShare/LetsShare(OLD)"

# 1. Directories where files need to exist
DESKTOP_DIRS = [
    os.path.join(ROOT, "public"),
    os.path.join(ROOT, "Vnmo", "public"),
    os.path.join(ROOT, "V2.0", "public")
]

MOBILE_DIRS = [
    os.path.join(ROOT, "public_mobile"),
    os.path.join(ROOT, "Vnmo", "public_mobile"),
    os.path.join(ROOT, "V2.0", "public_mobile")
]

# Source files (desktop is root public/admin_Panel.*, mobile is V2.0/public_mobile/AdminPanel.*)
src_desktop_html = os.path.join(ROOT, "public", "admin_Panel.html")
src_desktop_js = os.path.join(ROOT, "public", "admin_Panel.js")

src_mobile_html = os.path.join(ROOT, "V2.0", "public_mobile", "AdminPanel.html")
src_mobile_js = os.path.join(ROOT, "V2.0", "public_mobile", "AdminPanel.js")

# Copy/Sync files
def sync_files():
    # Sync desktops
    for d in DESKTOP_DIRS:
        os.makedirs(d, exist_ok=True)
        dest_html = os.path.join(d, "admin_Panel.html")
        dest_js = os.path.join(d, "admin_Panel.js")
        
        if d != os.path.join(ROOT, "public"):
            print(f"Syncing desktop files to: {d}")
            shutil.copy2(src_desktop_html, dest_html)
            shutil.copy2(src_desktop_js, dest_js)
        
        # Remove old camelCase files if present
        for old in ["AdminPanel.html", "AdminPanel.js"]:
            old_path = os.path.join(d, old)
            if os.path.exists(old_path):
                print(f"Removing old desktop file: {old_path}")
                os.remove(old_path)

    # Sync mobiles
    for d in MOBILE_DIRS:
        os.makedirs(d, exist_ok=True)
        dest_html = os.path.join(d, "admin_Panel.html")
        dest_js = os.path.join(d, "admin_Panel.js")
        
        print(f"Syncing mobile files to: {d}")
        shutil.copy2(src_mobile_html, dest_html)
        shutil.copy2(src_mobile_js, dest_js)
        
        # Remove old camelCase files if present
        for old in ["AdminPanel.html", "AdminPanel.js"]:
            old_path = os.path.join(d, old)
            if os.path.exists(old_path):
                print(f"Removing old mobile file: {old_path}")
                os.remove(old_path)

# Update internal HTML script src to admin_Panel.js
def fix_html_references():
    all_dirs = DESKTOP_DIRS + MOBILE_DIRS
    for d in all_dirs:
        html_path = os.path.join(d, "admin_Panel.html")
        if os.path.exists(html_path):
            with open(html_path, "r", encoding="utf-8") as f:
                content = f.read()
            # Replace AdminPanel.js with admin_Panel.js
            updated = re.sub(r'src=["\']AdminPanel\.js["\']', 'src="admin_Panel.js"', content)
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"Updated HTML script reference in: {html_path}")

# Update sidebars to use admin_Panel.html/admin_Panel
def update_sidebars():
    all_dirs = DESKTOP_DIRS + MOBILE_DIRS
    for d in all_dirs:
        sidebar_path = os.path.join(d, "sidebar.js")
        if os.path.exists(sidebar_path):
            with open(sidebar_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Replace AdminPanel.html with admin_Panel.html
            updated = content.replace("AdminPanel.html", "admin_Panel.html")
            updated = updated.replace("AdminPanel", "admin_Panel")
            
            # Ensure the conditional is_site_admin block is present after Complains.html
            # Let's check if the sidebar already has admin_Panel / AdminPanel
            # If it has complaints but no admin panel block, let's inject it.
            if "admin_Panel.html" not in updated:
                target = 'href="Complains.html" class="nav-item ${window.location.pathname.includes(\'Complains\') ? \'active\' : \'\'}">\n                <i data-lucide="triangle-alert"></i> <span class="nav-text">Complaints</span>\n            </a>'
                replacement = target + '\n            ${user && user.is_site_admin ? `\n            <a href="admin_Panel.html" class="nav-item ${window.location.pathname.includes(\'admin_Panel\') ? \'active\' : \'\'}" style="color: #f59e0b;">\n                <i data-lucide="shield-check"></i> <span class="nav-text">Admin Panel</span>\n            </a>` : \'\'}'
                if target in updated:
                    updated = updated.replace(target, replacement)
                else:
                    # Try double quotes variation
                    target_dq = 'href="Complains.html" class="nav-item ${window.location.pathname.includes("Complains") ? "active" : ""}">\n                <i data-lucide="triangle-alert"></i> <span class="nav-text">Complaints</span>\n            </a>'
                    replacement_dq = target_dq + '\n            ${user && user.is_site_admin ? `\n            <a href="admin_Panel.html" class="nav-item ${window.location.pathname.includes(\'admin_Panel\') ? \'active\' : \'\'}" style="color: #f59e0b;">\n                <i data-lucide="shield-check"></i> <span class="nav-text">Admin Panel</span>\n            </a>` : \'\'}'
                    updated = updated.replace(target_dq, replacement_dq)
            
            with open(sidebar_path, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"Updated sidebar references in: {sidebar_path}")

if __name__ == "__main__":
    sync_files()
    fix_html_references()
    update_sidebars()
    print("Sync complete!")
