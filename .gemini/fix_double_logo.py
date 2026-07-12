#!/usr/bin/env python3
"""Remove duplicate 'LetsShare' text spans next to Logo3 images.
Logo3.png already contains the 'LetsShare' text in the image itself,
so the adjacent <span>LetsShare</span> creates a visual duplicate."""

import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Pattern 1: <span ...>LetsShare</span> with font-weight 800 (desktop pages)
PATTERN_800 = re.compile(
    r'\s*<span style="font-weight: 800; font-size: 1\.5rem; color: var\(--accent\);">LetsShare</span>\n?'
)

# Pattern 2: <span ...>LetsShare</span> with font-weight 700 (mobile pages)
PATTERN_700 = re.compile(
    r'\s*<span style="font-weight: 700; font-size: 1\.1rem; color: var\(--accent\);(?: margin-right: 0\.5rem;)?">LetsShare</span>\n?'
)

fixed_files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    # Skip node_modules and .git
    if 'node_modules' in dirpath or '.git' in dirpath or '.gemini' in dirpath:
        continue
    for fn in filenames:
        if not fn.endswith('.html'):
            continue
        fpath = os.path.join(dirpath, fn)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue

        original = content
        content = PATTERN_800.sub('\n', content)
        content = PATTERN_700.sub('\n', content)

        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            rel = os.path.relpath(fpath, ROOT)
            fixed_files.append(rel)
            print(f"  FIXED: {rel}")

print(f"\n✅ Fixed {len(fixed_files)} files with duplicate LetsShare text.")
