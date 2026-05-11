const fs = require('fs');
let code = fs.readFileSync('routes/communities.js', 'utf8');

const invitesStr = `// Get user invites
router.get('/invites', authenticateToken, async (req, res) => {
  try {
    // get user email
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const userEmail = userResult.rows[0].email;

    const result = await pool.query(\`
      SELECT i.*, c.name as community_name 
      FROM community_invites i 
      JOIN communities c ON i.community_id = c.id 
      WHERE i.invitee_email = $1 AND i.status = 'pending'
    \`, [userEmail]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Server error' });
  }
});`;

// Remove it from original
code = code.replace(invitesStr, '');

// Insert it before router.get('/:id'
code = code.replace('// Get single community details', invitesStr + '\n\n// Get single community details');

fs.writeFileSync('routes/communities.js', code);
console.log('patched');
