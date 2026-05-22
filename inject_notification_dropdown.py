import os

injection = """
    // Notification Dropdown Logic
    const notificationLinks = document.querySelectorAll('.notification-link');
    notificationLinks.forEach(bellLink => {
        if (!bellLink.closest('.header-right') && !bellLink.closest('.header')) return;

        bellLink.style.position = 'relative';
        
        let badge = bellLink.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.style.cssText = 'display:none; position:absolute; top:-2px; right:2px; background:var(--danger, #ef4444); color:white; font-size:0.6rem; font-weight:bold; padding:2px 5px; border-radius:10px; pointer-events:none;';
            bellLink.appendChild(badge);
        }

        const parent = bellLink.parentElement;
        parent.style.position = 'relative';

        let dropdown = parent.querySelector('.notification-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'notification-dropdown';
            dropdown.style.cssText = 'display:none; position:absolute; top:45px; right:0; width:280px; max-height:400px; background:var(--card, #1e1e2f); border:1px solid var(--border, #2d2d3f); border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:1000; flex-direction:column; overflow:hidden;';
            
            dropdown.innerHTML = `
                <div style="padding:10px 12px; border-bottom:1px solid var(--border, #2d2d3f); font-weight:bold; color:var(--text-main, #fff); font-size:0.9rem;">Unread Notifications</div>
                <div class="notification-dropdown-list" style="display:flex; flex-direction:column; max-height:300px; overflow-y:auto;">
                    <div style="padding:15px 10px; text-align:center; color:var(--muted, #9ca3af); font-size:0.85rem;">Loading...</div>
                </div>
                <div style="padding:10px; border-top:1px solid var(--border, #2d2d3f); text-align:center; background:rgba(0,0,0,0.1);">
                    <a href="Notifications.html" style="color:var(--accent, #6366f1); text-decoration:none; font-size:0.85rem; font-weight:600; display:block;">View All</a>
                </div>
            `;
            parent.appendChild(dropdown);
        }

        const list = dropdown.querySelector('.notification-dropdown-list');

        bellLink.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'flex';
            if (isVisible) {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.display = 'flex';
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const res = await fetch('/api/notifications', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const notifs = await res.json();
                        const unread = notifs.filter(n => !n.is_read);
                        if (unread.length > 0) {
                            badge.style.display = 'block';
                            badge.textContent = unread.length;
                            list.innerHTML = unread.map(n => `
                                <a href="Notifications.html" style="padding:12px; border-bottom:1px solid var(--border, #2d2d3f); text-decoration:none; color:var(--text-main, #fff); font-size:0.85rem; display:block; transition:background 0.2s;">
                                    <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500;">${n.message}</div>
                                </a>
                            `).join('');
                        } else {
                            badge.style.display = 'none';
                            list.innerHTML = '<div style="padding:15px 10px; text-align:center; color:var(--muted, #9ca3af); font-size:0.85rem;">No unread messages</div>';
                        }
                    }
                } catch (err) {
                    list.innerHTML = '<div style="padding:15px 10px; text-align:center; color:var(--danger, #ef4444); font-size:0.85rem;">Failed to load</div>';
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (!bellLink.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` }})
                .then(r => r.json())
                .then(notifs => {
                    if(Array.isArray(notifs)) {
                        const unread = notifs.filter(n => !n.is_read);
                        if (unread.length > 0) {
                            badge.style.display = 'block';
                            badge.textContent = unread.length;
                        }
                    }
                }).catch(e => console.error(e));
        }
    });
"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            if "Notification Dropdown Logic" not in content:
                # Find the end of injectSidebar function to inject before the closing brace
                # We can hook before "// Hide sidebar on landing if not logged in"
                hook = "// Hide sidebar on landing if not logged in (visual only)"
                if hook in content:
                    content = content.replace(hook, injection + "\n    " + hook)
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Injected dropdown into {filepath}")

