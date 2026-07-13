import os

ROOT = "/Users/ved/Documents/Coding/LetsShare/LetsShare(OLD)"

COMMUNITIES_PATHS = [
    os.path.join(ROOT, "routes", "communities.js"),
    os.path.join(ROOT, "Vnmo", "routes", "communities.js"),
    os.path.join(ROOT, "V2.0", "routes", "communities.js"),
]

DB_PATHS = [
    os.path.join(ROOT, "db.js"),
    os.path.join(ROOT, "Vnmo", "db.js"),
    os.path.join(ROOT, "V2.0", "db.js"),
]

def fix_routes():
    for p in COMMUNITIES_PATHS:
        if not os.path.exists(p):
            continue
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Bypass plan check in PUT /:id/chat (allow anyone who is community admin)
        old_check = """    const userResult = await pool.query('SELECT plan_type FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    if (userResult.rows[0].plan_type !== 'Premium') {
      return res.status(403).json({ error: 'Only admins with a Premium plan can enable or disable chat.' });
    }"""
        
        # Replace with a simpler check that doesn't restrict by plan_type
        new_check = """    // Premium plan restriction bypassed for development/testing
    const userResult = await pool.query('SELECT plan_type FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });"""
        
        content = content.replace(old_check, new_check)

        # 2. Insert communities with chat_enabled = true by default
        old_insert = "'INSERT INTO communities (name, address, description, max_limit, is_private, admin_id, city, state, locality, country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *'"
        new_insert = "'INSERT INTO communities (name, address, description, max_limit, is_private, admin_id, city, state, locality, country, chat_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING *'"
        content = content.replace(old_insert, new_insert)

        # Log actual server errors in chat catches to make debugging easier
        old_get_catch = """    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }"""
        new_get_catch = """    res.json(messages.rows);
  } catch (err) {
    console.error('Error in GET /chat:', err);
    res.status(500).json({ error: 'Server error' });
  }"""
        content = content.replace(old_get_catch, new_get_catch)

        old_post_catch = """    await pool.query('INSERT INTO community_messages (community_id, user_id, message) VALUES ($1, $2, $3)', [communityId, userId, message]);
    res.status(201).json({ message: 'Sent' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }"""
        new_post_catch = """    await pool.query('INSERT INTO community_messages (community_id, user_id, message) VALUES ($1, $2, $3)', [communityId, userId, message]);
    res.status(201).json({ message: 'Sent' });
  } catch (err) {
    console.error('Error in POST /chat:', err);
    res.status(500).json({ error: 'Server error' });
  }"""
        content = content.replace(old_post_catch, new_post_catch)

        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed community chat routes in: {p}")

def fix_db_schemas():
    for p in DB_PATHS:
        if not os.path.exists(p):
            continue
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()

        # Update database schema to default chat_enabled to true
        content = content.replace("chat_enabled BOOLEAN DEFAULT false", "chat_enabled BOOLEAN DEFAULT true")
        content = content.replace("chat_enabled BOOLEAN DEFAULT FALSE", "chat_enabled BOOLEAN DEFAULT TRUE")
        
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated default database schema in: {p}")

if __name__ == "__main__":
    fix_routes()
    fix_db_schemas()
    print("Done!")
