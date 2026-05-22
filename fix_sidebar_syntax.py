import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file.endswith('sidebar.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            # Fix the const header redeclaration
            new_content = content.replace("const header = document.querySelector('.header');", "const stickyHeader = document.querySelector('.header');")
            # But wait! I want to ONLY replace the second one, OR I can rename the first one.
            # Actually, renaming the first one might break its usage inside that block.
            # Let's just find the Smart Sticky Header Logic section and rename it there.
            
            # The section looks like:
            #     // Smart Sticky Header Logic
            #     let lastScroll = 0;
            #     const header = document.querySelector('.header');
            #     if (header) {
            
            search_block = """    // Smart Sticky Header Logic
    let lastScroll = 0;
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll <= 0) {
                header.classList.remove('header-hidden');
                return;
            }
            if (currentScroll > lastScroll && !header.classList.contains('header-hidden')) {
                // Scroll Down
                header.classList.add('header-hidden');
            } else if (currentScroll < lastScroll && header.classList.contains('header-hidden')) {
                // Scroll Up
                header.classList.remove('header-hidden');
            }
            lastScroll = currentScroll;
        });
    }"""
            
            replace_block = """    // Smart Sticky Header Logic
    let lastScroll = 0;
    const stickyHeader = document.querySelector('.header');
    if (stickyHeader) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll <= 0) {
                stickyHeader.classList.remove('header-hidden');
                return;
            }
            if (currentScroll > lastScroll && !stickyHeader.classList.contains('header-hidden')) {
                // Scroll Down
                stickyHeader.classList.add('header-hidden');
            } else if (currentScroll < lastScroll && stickyHeader.classList.contains('header-hidden')) {
                // Scroll Up
                stickyHeader.classList.remove('header-hidden');
            }
            lastScroll = currentScroll;
        });
    }"""

            if search_block in content:
                new_content = content.replace(search_block, replace_block)
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Fixed syntax error in {filepath}")
            else:
                print(f"Could not find exact block in {filepath}, trying fallback...")
                # Fallback: rename the first one inside the header standardization block
                old_stand = "const header = document.querySelector('.header');\n        const isWelcomePage ="
                new_stand = "const headerMain = document.querySelector('.header');\n        const isWelcomePage ="
                if old_stand in content:
                    content = content.replace(old_stand, new_stand)
                    content = content.replace("if (header && !isWelcomePage)", "if (headerMain && !isWelcomePage)")
                    content = content.replace("const existingSpan = header.querySelector", "const existingSpan = headerMain.querySelector")
                    content = content.replace("const existingH2 = header.querySelector", "const existingH2 = headerMain.querySelector")
                    content = content.replace("const existingH1 = header.querySelector", "const existingH1 = headerMain.querySelector")
                    content = content.replace("header.style.", "headerMain.style.")
                    content = content.replace("header.innerHTML", "headerMain.innerHTML")
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Fixed using fallback in {filepath}")

