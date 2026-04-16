const express = require('express');
const { getDb } = require('../database');
const router = express.Router();

function toObjects(result) {
  if (!result || result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => { const o = {}; cols.forEach((c, i) => o[c] = row[i]); return o; });
}

router.get('/books', async (req, res) => {
  try {
    const db = await getDb();
    const { category, search } = req.query;
    let q = 'SELECT * FROM books WHERE 1=1'; const p = [];
    if (category) { q += ' AND category = ?'; p.push(category); }
    if (search) { q += ' AND (title LIKE ? OR author LIKE ? OR description LIKE ?)'; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    q += ' ORDER BY id DESC';
    res.json({ books: toObjects(db.exec(q, p)) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.get('/books/:id', async (req, res) => {
  try {
    const db = await getDb();
    const books = toObjects(db.exec('SELECT * FROM books WHERE id = ?', [parseInt(req.params.id)]));
    if (books.length === 0) return res.status(404).json({ error: 'বই পাওয়া যায়নি' });
    res.json({ book: books[0] });
  } catch (err) { res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.get('/courses', async (req, res) => {
  try {
    const db = await getDb();
    const { category, search, level } = req.query;
    let q = 'SELECT * FROM courses WHERE 1=1'; const p = [];
    if (category) { q += ' AND category = ?'; p.push(category); }
    if (level) { q += ' AND level = ?'; p.push(level); }
    if (search) { q += ' AND (title LIKE ? OR instructor LIKE ? OR description LIKE ?)'; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    q += ' ORDER BY id DESC';
    res.json({ courses: toObjects(db.exec(q, p)) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.get('/courses/:id', async (req, res) => {
  try {
    const db = await getDb();
    const courses = toObjects(db.exec('SELECT * FROM courses WHERE id = ?', [parseInt(req.params.id)]));
    if (courses.length === 0) return res.status(404).json({ error: 'কোর্স পাওয়া যায়নি' });
    res.json({ course: courses[0] });
  } catch (err) { res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

module.exports = router;
