with open('./Vnmo/public/sidebar.js', 'r') as f:
    for i, line in enumerate(f):
        if 'sidebar-header' in line or 'sidebarHeader' in line:
            print(f"{i+1}: {line.strip()}")
