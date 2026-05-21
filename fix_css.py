import os
import re

def polish_css(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    original = content
    
    # 1. Remove the duplicate .card rule that's messing up the design
    bad_card = """
.card {
    background: var(--card-bg);
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    border: 1px solid var(--border);
}"""
    content = content.replace(bad_card, "")

    # 2. Update the main .card to be more premium
    old_main_card = """
.card {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 24px;
    margin-bottom: 2rem;
    border: 1px solid var(--border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
}"""
    
    new_main_card = """
.card {
    background: var(--card-bg);
    padding: 1.75rem;
    border-radius: 16px;
    margin-bottom: 1.5rem;
    border: 1px solid var(--border);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    backdrop-filter: blur(10px);
    transition: box-shadow 0.25s ease, border-color 0.25s ease;
}"""
    content = content.replace(old_main_card.strip(), new_main_card.strip())
    
    # 3. Enhance .header styling
    # We want a softer shadow for the header
    content = content.replace('box-shadow: var(--shadow);', 'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);', 1)

    # 4. Add global scrollbar styling if not present
    if '::-webkit-scrollbar {' not in content:
        scrollbar_css = """
/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
    background: var(--muted);
}
"""
        content += scrollbar_css

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('style.css'):
            polish_css(os.path.join(root, file))

