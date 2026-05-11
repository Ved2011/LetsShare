const { pool } = require('./db');
pool.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count,
        EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $2) as is_member,
        EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $2 AND is_admin = true) as is_current_user_admin
      FROM communities c
      WHERE c.id = $1
    `, [5, 1]).then(res => {
  console.log('ROWS:', res.rows);
  process.exit();
}).catch(err => { console.log('ERROR:', err); process.exit(); });
