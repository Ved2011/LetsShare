import os

ROOT = "/Users/ved/Documents/Coding/LetsShare/LetsShare(OLD)"

DASHBOARD_PATHS = [
    os.path.join(ROOT, "Vnmo", "public", "user_Dashboard.html"),
    os.path.join(ROOT, "Vnmo", "public_mobile", "user_Dashboard.html"),
    os.path.join(ROOT, "V2.0", "public", "user_Dashboard.html"),
    os.path.join(ROOT, "V2.0", "public_mobile", "user_Dashboard.html"),
]

PREMIUM_BANNER_HTML = """        <!-- Early Bird Banner -->
        <div class="card" style="background: linear-gradient(135deg, #4f46e5, #9333ea); color: white; border: none; margin-bottom: 2rem; position: relative; overflow: hidden; padding: 2.25rem 2rem;">
            <!-- Large decorative background SVG -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; right: 2rem; top: 50%; transform: translateY(-50%) rotate(15deg); width: 140px; height: 140px; opacity: 0.12; color: white;">
                <polyline points="20 12 20 22 4 22 4 12"></polyline>
                <rect x="2" y="7" width="20" height="5"></rect>
                <line x1="12" y1="22" x2="12" y2="7"></line>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
            <div style="position: relative; z-index: 1; max-width: 80%;">
                <h2 style="color: white; font-size: 1.75rem; font-weight: 800; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.75rem; letter-spacing: -0.025em;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Early Bird Special
                </h2>
                <p style="font-size: 1.15rem; opacity: 0.95; line-height: 1.6; margin: 0;">
                    Welcome to the Early Bird phase! You get <strong style="color: #fbbf24; font-weight: 800;">5 FREE credits</strong> for listings and borrows this month. Unused credits automatically carry over to the next month!
                </p>
            </div>
        </div>"""

def make_premium():
    for p in DASHBOARD_PATHS:
        if not os.path.exists(p):
            continue
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace the entire old banner card
        # Find start and end of Early Bird Banner comment/code block
        start_tag = "<!-- Early Bird Banner -->"
        end_tag = "</div>\n        </div>"
        
        # Let's locate it via search or re.sub
        import re
        # Match <div class="card" ...> ... </div> ... </div>
        pattern = r"<!-- Early Bird Banner -->.*?</div>\s*</div>"
        
        updated, count = re.subn(pattern, PREMIUM_BANNER_HTML, content, flags=re.DOTALL)
        if count > 0:
            with open(p, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"Updated banner in: {p}")
        else:
            print(f"Could not update banner in (pattern not matched): {p}")

if __name__ == "__main__":
    make_premium()
    print("Done!")
