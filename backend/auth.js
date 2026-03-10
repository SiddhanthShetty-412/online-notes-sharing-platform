const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const SALT_ROUNDS = 10;
const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'student', course = null, semester = null, subjects = null } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    db.run(
      `INSERT INTO users (name,email,password_hash,role,course,semester,subjects) VALUES (?,?,?,?,?,?,?)`,
      [name, email, hash, role, course, semester, subjects ? JSON.stringify(subjects) : null],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const user = { user_id: this.lastID, email, role };
        const token = jwt.sign(user, SECRET, { expiresIn: '8h' });
        res.json({ token, user });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  db.get(`SELECT user_id, email, password_hash, role FROM users WHERE email = ?`, [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const user = { user_id: row.user_id, email: row.email, role: row.role };
    const token = jwt.sign(user, SECRET, { expiresIn: '8h' });
    res.json({ token, user });
  });
});

module.exports = router;
