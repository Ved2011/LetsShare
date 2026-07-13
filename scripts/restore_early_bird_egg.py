import os
import re

ROOT = "/Users/ved/Documents/Coding/LetsShare/LetsShare(OLD)"

DASHBOARD_PATHS = [
    os.path.join(ROOT, "Vnmo", "public", "user_Dashboard.html"),
    os.path.join(ROOT, "Vnmo", "public_mobile", "user_Dashboard.html"),
    os.path.join(ROOT, "V2.0", "public", "user_Dashboard.html"),
    os.path.join(ROOT, "V2.0", "public_mobile", "user_Dashboard.html"),
]

# Better and bigger bird logo next to the text (28px height, detailed wings/bird Lucide path)
BIRD_SVG = """<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #fbbf24; flex-shrink: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
                        <path d="M16 12a4 4 0 0 1-8 0"></path>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
                        <path d="M12 6a6 6 0 0 1 6 6"></path>
                    </svg>"""

NEW_BANNER_HTML = """        <!-- Early Bird Banner -->
        <div class="card" style="background: linear-gradient(135deg, #4f46e5, #9333ea); color: white; border: none; margin-bottom: 2rem; position: relative; overflow: hidden; padding: 2.25rem 2rem;">
            <!-- Hatching chick bird-in-the-egg background decorator -->
            <div style="position: absolute; top: -10px; right: -10px; font-size: 8rem; opacity: 0.15; transform: rotate(15deg); user-select: none; pointer-events: none;">🐣</div>
            <div style="position: relative; z-index: 1; max-width: 80%;">
                <h2 style="color: white; font-size: 1.85rem; font-weight: 800; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.85rem; letter-spacing: -0.025em;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M16 8A6 6 0 0 1 22 14v7h-4v-7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v7H2v-7a6 6 0 0 1 6-6h8z"/><path d="M12 2v6"/></svg>
                    Early Bird Special
                </h2>
                <p style="font-size: 1.15rem; opacity: 0.95; line-height: 1.6; margin: 0;">
                    Welcome to the Early Bird phase! You get <strong style="color: #fbbf24; font-weight: 800;">5 FREE credits</strong> for listings and borrows this month. Unused credits automatically carry over to the next month!
                </p>
            </div>
        </div>"""

def restore_egg():
    for p in DASHBOARD_PATHS:
        if not os.path.exists(p):
            continue
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Match <div class="card" ...> ... </div> ... </div>
        pattern = r"<!-- Early Bird Banner -->.*?</div>\s*</div>"
        
        updated, count = re.subn(pattern, NEW_BANNER_HTML, content, flags=re.DOTALL)
        if count > 0:
            with open(p, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"Restored bird egg in: {p}")
        else:
            print(f"Pattern match failed in: {p}")

if __name__ == "__main__":
    restore_egg()
    print("Done!")
