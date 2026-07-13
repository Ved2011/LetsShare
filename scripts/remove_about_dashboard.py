import os
import re

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

def remove_about_section():
    all_dirs = DESKTOP_DIRS + MOBILE_DIRS
    for d in all_dirs:
        p = os.path.join(d, "user_Dashboard.html")
        if not os.path.exists(p):
            continue
        
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Regular expression to remove <section class="about">...</section> matching across newlines
        updated = re.sub(r'\s*<section class="about">.*?</section>', '', content, flags=re.DOTALL)
        
        with open(p, "w", encoding="utf-8") as f:
            f.write(updated)
        print(f"Removed About section from: {p}")

if __name__ == "__main__":
    remove_about_section()
    print("Done!")
