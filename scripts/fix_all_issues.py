import os
import re

ROOT = "/Users/ved/Documents/Coding/LetsShare/LetsShare(OLD)"

ALL_DIRS = [
    os.path.join(ROOT, "public"),
    os.path.join(ROOT, "Vnmo", "public"),
    os.path.join(ROOT, "V2.0", "public"),
    os.path.join(ROOT, "public_mobile"),
    os.path.join(ROOT, "Vnmo", "public_mobile"),
    os.path.join(ROOT, "V2.0", "public_mobile"),
]

DELEGATION_CODE = """
        // ── Event delegation for recent items and suggestions clicks ──────────
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

def fix_search_pages():
    """Inject event delegation into SearchPage.html files."""
    for d in ALL_DIRS:
        p = os.path.join(d, "SearchPage.html")
        if not os.path.exists(p):
            continue

        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Skip if already injected
        if "Event delegation for recent items" in content:
            print(f"  [skip] delegation already in {p}")
            continue

        # Inject before "window.addRecent = addRecent;"
        anchor = "window.addRecent = addRecent;"
        if anchor in content:
            content = content.replace(anchor, DELEGATION_CODE + "\n        " + anchor)
            with open(p, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  [fix] injected delegation in {p}")
        else:
            print(f"  [WARN] anchor not found in {p}")


def fix_admin_panels():
    """Remove link emoji from admin names, replace all emojis with SVG icons."""
    for d in ALL_DIRS:
        p = os.path.join(d, "admin_Panel.js")
        if not os.path.exists(p):
            continue

        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Remove 🔗 from link text
        content = content.replace(" 🔗", "")

        # Replace ✅ with green check SVG
        check_svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
        content = content.replace("'✅'", f"'{check_svg}'")

        # Replace ❌ with red X SVG
        x_svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        content = content.replace("'❌'", f"'{x_svg}'")

        # Replace 🔒 Private with lock SVG + Private
        lock_svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
        content = content.replace("'🔒 Private'", f"'{lock_svg} Private'")

        # Replace 🌐 Public with globe SVG + Public
        globe_svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
        content = content.replace("'🌐 Public'", f"'{globe_svg} Public'")

        # Replace 👤 in viewUser modal
        content = content.replace("'👤 '", "''")

        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [fix] admin_Panel.js emojis replaced in {p}")


def fix_admin_html():
    """Remove emojis from admin_Panel.html files (tab labels, etc.)."""
    for d in ALL_DIRS:
        p = os.path.join(d, "admin_Panel.html")
        if not os.path.exists(p):
            continue

        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Replace emoji tab labels with plain text
        content = content.replace("👥 Users", "Users")
        content = content.replace("📦 Items", "Items")
        content = content.replace("🏘️ Communities", "Communities")
        content = content.replace("⚠️ Complaints", "Complaints")
        content = content.replace("🛡️ ", "")

        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [fix] admin_Panel.html emojis replaced in {p}")


if __name__ == "__main__":
    print("=== Fixing search page recents clicks ===")
    fix_search_pages()
    print("\n=== Fixing admin panel emojis → SVG icons ===")
    fix_admin_panels()
    print("\n=== Fixing admin HTML emojis ===")
    fix_admin_html()
    print("\nDone!")
