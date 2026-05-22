import os
import re

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file == 'Notifications.html':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Find the line: const notifications = await response.json();
            # Replace it with a robust check
            robust_check = """
            const notifications = await response.json();
            if (!Array.isArray(notifications)) {
                console.error("API returned non-array:", notifications);
                list.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 2rem;">Server error: failed to load notifications</div>`;
                return;
            }
"""
            content = content.replace('const notifications = await response.json();', robust_check)
            
            with open(filepath, 'w') as f:
                f.write(content)

print("Frontend Notifications.html fixed to handle server errors gracefully.")
