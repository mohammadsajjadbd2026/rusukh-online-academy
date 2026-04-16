const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, saveDb } = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

function toObjects(result) {
  if (!result || result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => { const o = {}; cols.forEach((c, i) => o[c] = row[i]); return o; });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'সব তথ্য পূরণ করুন' });
    if (password.length < 6) return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' });
    const db = await getDb();
    const existing = toObjects(db.exec('SELECT id FROM users WHERE email = ?', [email]));
    if (existing.length > 0) return res.status(400).json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে' });
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, bcrypt.hashSync(password, 10)]);
    saveDb();
    const userId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'অ্যাকাউন্ট তৈরি হয়েছে!', token, user: { id: userId, name, email } });
  } catch (err) { console.error('Register error:', err); res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'ইমেইল ও পাসওয়ার্ড দিন' });
    const db = await getDb();
    const users = toObjects(db.exec('SELECT * FROM users WHERE email = ?', [email]));
    if (users.length === 0) return res.status(401).json({ error: 'ইমেইল বা পাসওয়ার্ড ভুল' });
    const user = users[0];
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'ইমেইল বা পাসওয়ার্ড ভুল' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'লগইন সফল!', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { console.error('Login error:', err); res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const users = toObjects(db.exec('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId]));
    if (users.length === 0) return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি' });
    res.json({ user: users[0] });
  } catch (err) { res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

module.exports = router;
