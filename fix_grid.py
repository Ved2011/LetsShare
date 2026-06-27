import os

css_append = """

/* ====== TRULY RESPONSIVE GRIDS (Galaxy Fold / Desktop / Tablet) ====== */
/* These rules use auto-fill and minmax to dynamically adjust columns 
   based on available width without strict media query breakpoints. */

.items-square-grid, .items-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
    gap: 1.25rem !important;
}

.dashboard-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
    gap: 1rem !important;
}

.grid-container, .community-grid, .stats-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
    gap: 1.25rem !important;
}

.features-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
    gap: 1.5rem !important;
}
"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('style.css'):
            filepath = os.path.join(root, file)
            with open(filepath, 'a') as f:
                f.write(css_append)

print("Grids made fully responsive.")
