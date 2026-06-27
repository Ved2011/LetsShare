import os

db_snippet = """
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        related_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
"""

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '(OLD)' in root:
        continue
    for file in files:
        if file == 'db.js':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            if 'CREATE TABLE IF NOT EXISTS notifications' not in content:
                # insert after CREATE TABLE IF NOT EXISTS community_messages
                content = content.replace('CREATE TABLE IF NOT EXISTS community_messages', db_snippet + '\n      CREATE TABLE IF NOT EXISTS community_messages')
                
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Added notifications table to {filepath}")

