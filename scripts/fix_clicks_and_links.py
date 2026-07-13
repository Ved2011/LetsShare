import os

ROOT = "/Users/ved/Documents/Coding/LetsShare/LetsShare(OLD)"

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

# 1. Modify SearchPage.html files to fix click on recents/suggestions
def fix_search_pages():
    all_dirs = DESKTOP_DIRS + MOBILE_DIRS
    for d in all_dirs:
        p = os.path.join(d, "SearchPage.html")
        if not os.path.exists(p):
            continue
        
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Update renderRecentBlock inline onclick to data attributes
        old_recent_item = '<div class="recent-item" onclick="useRecent(${JSON.stringify(q)})">'
        new_recent_item = '<div class="recent-item" data-q="${escHtml(q)}">'
        content = content.replace(old_recent_item, new_recent_item)

        old_recent_remove = '<button class="recent-remove" onclick="event.stopPropagation(); removeRecent(${JSON.stringify(q)})" title="Remove">✕</button>'
        new_recent_remove = '<button class="recent-remove" data-remove-q="${escHtml(q)}" title="Remove">✕</button>'
        content = content.replace(old_recent_remove, new_recent_remove)

        # Update renderSuggestions inline onclick to data-name
        old_sugg_item = '<div class="suggestion-item" data-idx="${i}" onclick="pickSuggestion(${JSON.stringify(s.name)})">'
        new_sugg_item = '<div class="suggestion-item" data-idx="${i}" data-name="${escHtml(s.name)}">'
        content = content.replace(old_sugg_item, new_sugg_item)

        # Add event listener on dropdown for event delegation if not already present
        delegation_js = """
        // Event delegation for recent items and suggestions clicks
        document.getElementById('suggestionsDropdown').addEventListener('click', e => {
            const removeBtn = e.target.closest('.recent-remove');
            if (removeBtn) {
                e.stopPropagation();
                const q = removeBtn.getAttribute('data-remove-q');
                if (window.removeRecent) window.removeRecent(q);
                return;
            }

            const recentItem = e.target.closest('.recent-item');
            if (recentItem) {
                const q = recentItem.getAttribute('data-q');
                if (window.useRecent) window.useRecent(q);
                return;
            }

            const suggItem = e.target.closest('.suggestion-item');
            if (suggItem) {
                const name = suggItem.getAttribute('data-name');
                if (window.pickSuggestion) window.pickSuggestion(name);
                return;
            }
        });
        """

        if "Event delegation for recent items and suggestions clicks" not in content:
            # Inject right before the close of the script tag or DOMContentLoaded handler
            content = content.replace("initializeRecentSearches();", "initializeRecentSearches();\n" + delegation_js)

        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed SearchPage.html clicks in: {p}")

# 2. Modify admin_Panel.js to add click-to-view links
def fix_admin_panels():
    # Fix desktop admin panels
    for d in DESKTOP_DIRS:
        p = os.path.join(d, "admin_Panel.js")
        if not os.path.exists(p):
            continue
        
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Wrap User name
        old_user = '<strong>${u.name}</strong>'
        new_user = '<a href="user_View.html?id=${u.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${u.name} 🔗</a>'
        content = content.replace(old_user, new_user)

        # Wrap Item name
        old_item = '<td><strong>${i.name}</strong>'
        new_item = '<td><a href="item_View.html?id=${i.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${i.name} 🔗</a>'
        content = content.replace(old_item, new_item)

        # Wrap Community name
        old_comm = '<strong>${c.name}</strong>'
        new_comm = '<a href="community_Home.html?id=${c.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${c.name} 🔗</a>'
        content = content.replace(old_comm, new_comm)

        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed desktop admin_Panel.js links in: {p}")

    # Fix mobile admin panels
    for d in MOBILE_DIRS:
        p = os.path.join(d, "admin_Panel.js")
        if not os.path.exists(p):
            continue
        
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Wrap User name
        old_user = '<strong>${u.name}</strong>'
        new_user = '<a href="user_View.html?id=${u.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${u.name} 🔗</a>'
        content = content.replace(old_user, new_user)

        # Wrap Item name
        old_item = '<td><strong>${i.name}</strong>'
        new_item = '<td><a href="item_View.html?id=${i.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${i.name} 🔗</a>'
        content = content.replace(old_item, new_item)

        # Wrap Community name
        old_comm = '<strong>${c.name}</strong>'
        new_comm = '<a href="community_Home.html?id=${c.id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:700;">${c.name} 🔗</a>'
        content = content.replace(old_comm, new_comm)

        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed mobile admin_Panel.js links in: {p}")

if __name__ == "__main__":
    fix_search_pages()
    fix_admin_panels()
    print("All tasks complete!")
