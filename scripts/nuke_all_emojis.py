import os
import glob

ROOT = "/Users/ved/Documents/Coding/LetsShare/LetsShare(OLD)"

# All directories to scan (excluding node_modules and scripts)
SCAN_DIRS = [
    os.path.join(ROOT, "public"),
    os.path.join(ROOT, "public_mobile"),
    os.path.join(ROOT, "Vnmo", "public"),
    os.path.join(ROOT, "Vnmo", "public_mobile"),
    os.path.join(ROOT, "V2.0", "public"),
    os.path.join(ROOT, "V2.0", "public_mobile"),
]

# SVG icon templates (inline Lucide-style)
SVG = {
    'check': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    'x': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    'lock': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    'lock_lg': '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    'globe': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    'search': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    'search_lg': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    'map_pin': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    'users': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'user': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    'package': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    'trash': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    'edit': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    'alert': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    'star': '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;color:#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    'chat': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    'rocket': '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3"/></svg>',
    'refresh': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    'sparkle': '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="color:#f59e0b"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z"/></svg>',
    'check_circle': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    'party': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
}

# Comprehensive emoji → replacement map
REPLACEMENTS = [
    # Admin Panel HTML tabs (desktop) - already done for some, catch remaining
    ("👤 Users", "Users"),
    ("👥 Users", "Users"),
    ("📦 Items", "Items"),
    ("👥 Communities", "Communities"),
    ("🏘️ Communities", "Communities"),
    ("⚠️ Complaints", "Complaints"),
    ("⚠️ Unresolved", "Unresolved"),

    # Search placeholders
    ("🔍 Search users by name or email…", "Search users by name or email…"),
    ("🔍 Search items by name or owner…", "Search items by name or owner…"),
    ("🔍 Search communities…", "Search communities…"),
    ("🔍 Search users…", "Search users…"),
    ("🔍 Search items…", "Search items…"),

    # Search icons in HTML
    ('<span class="search-icon">🔍</span>', f'<span class="search-icon">{SVG["search"]}</span>'),
    ('<span class="empty-icon">🔍</span>', f'<span class="empty-icon">{SVG["search_lg"]}</span>'),

    # Dashboard emojis
    ("<span>🌟</span>", f'<span>{SVG["sparkle"]}</span>'),
    ("⚠️ Admin Warning Notice", "Admin Warning Notice"),
    ("⚠️ Overdue Items", "Overdue Items"),
    ("⚠️ Active Complaints", "Active Complaints"),
    ("⚠️ Issue Warning", "Issue Warning"),
    ("⚠️ Error:", "Error:"),

    # Welcome greeting
    ("! 👋`", "!`"),

    # Community/search pills
    ("'🔒 Private'", f"'{SVG['lock']} Private'"),
    ("'🌐 Public'", f"'{SVG['globe']} Public'"),
    ("'💬 Chat'", f"'{SVG['chat']} Chat'"),

    # Mobile admin_Panel.js communities
    ("'🔒'", f"'{SVG['lock']}'"),
    ("'🌐'", f"'{SVG['globe']}'"),

    # Map pins
    ("`📍 ${", f"`{SVG['map_pin']} ${{"),
    (">📍 ", f">{SVG['map_pin']} "),
    ("📍 Loading address...", f"{SVG['map_pin']} Loading address..."),
    ("📍 no address", f"{SVG['map_pin']} no address"),

    # Members/items counts
    (">👥 ${", f">{SVG['users']} ${{"),
    (">📦 ${", f">{SVG['package']} ${{"),

    # User profile
    ("'✏️ Manage Profile'", f"'{SVG['edit']} Manage Profile'"),
    (">✏️ Manage Profile<", f">{SVG['edit']} Manage Profile<"),
    ("'❌ Cancel Edit'", f"'{SVG['x']} Cancel Edit'"),

    # UPI verification
    ("'✅ <strong>Verified:", f"'{SVG['check']} <strong>Verified:"),
    ("'❌ <strong>Unrecognized", f"'{SVG['x']} <strong>Unrecognized"),

    # Admin Panel JS: verified column
    ("'✅ Yes'", f"'{SVG['check']} Yes'"),
    ("'❌ No'", f"'{SVG['x']} No'"),

    # Delete button
    (">🗑️</button>", f">{SVG['trash']}</button>"),

    # Complaints
    ("👤 against", "against"),
    ('<span class="ei">✅</span>', f'<span class="ei">{SVG["check_circle"]}</span>'),
    ('<span class="ei">🎉</span>', f'<span class="ei">{SVG["party"]}</span>'),
    ('<span class="ei">🔄</span>', f'<span class="ei">{SVG["refresh"]}</span>'),
    ('<span class="empty-icon">🔄</span>', f'<span class="empty-icon">{SVG["refresh"]}</span>'),
    ('<span class="empty-icon">⚠️</span>', f'<span class="empty-icon">{SVG["alert"]}</span>'),

    # Star plan badge
    ("⭐ ${", f"{SVG['star']} ${{"),

    # Large lock (private community gate)
    ('<span style="font-size: 3rem;">🔒</span>', f'<span style="display:inline-block">{SVG["lock_lg"]}</span>'),

    # Rocket (pricing)
    ('>🚀</div>', f'>{SVG["rocket"]}</div>'),
]

def process_all():
    count = 0
    for d in SCAN_DIRS:
        for ext in ['*.html', '*.js']:
            for filepath in glob.glob(os.path.join(d, ext)):
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                original = content
                for old, new in REPLACEMENTS:
                    content = content.replace(old, new)

                if content != original:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    count += 1
                    print(f"  [fix] {os.path.relpath(filepath, ROOT)}")

    print(f"\nFixed {count} files total.")

if __name__ == "__main__":
    process_all()
