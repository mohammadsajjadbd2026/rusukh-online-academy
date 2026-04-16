const express = require('express');
const { getDb, saveDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

function toObjects(result) {
  if (!result || result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => { const o = {}; cols.forEach((c, i) => o[c] = row[i]); return o; });
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const items = toObjects(db.exec(`
      SELECT ci.id, ci.user_id, ci.item_type, ci.item_id, ci.quantity,
        CASE WHEN ci.item_type='book' THEN b.title WHEN ci.item_type='course' THEN c.title END as title,
        CASE WHEN ci.item_type='book' THEN b.price WHEN ci.item_type='course' THEN c.price END as price,
        CASE WHEN ci.item_type='book' THEN b.image WHEN ci.item_type='course' THEN c.image END as image,
        CASE WHEN ci.item_type='book' THEN b.author WHEN ci.item_type='course' THEN c.instructor END as creator
      FROM cart_items ci
      LEFT JOIN books b ON ci.item_type='book' AND ci.item_id=b.id
      LEFT JOIN courses c ON ci.item_type='course' AND ci.item_id=c.id
      WHERE ci.user_id=? ORDER BY ci.id DESC
    `, [req.userId]));
    const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    res.json({ items, total, count: items.length });
  } catch (err) { console.error(err); res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { item_type, item_id, quantity = 1 } = req.body;
    if (!item_type || !item_id) return res.status(400).json({ error: 'আইটেম তথ্য দিন' });
    const db = await getDb();
    if (item_type === 'book' && toObjects(db.exec('SELECT id FROM books WHERE id=?', [item_id])).length === 0) return res.status(404).json({ error: 'বই পাওয়া যায়নি' });
    if (item_type === 'course' && toObjects(db.exec('SELECT id FROM courses WHERE id=?', [item_id])).length === 0) return res.status(404).json({ error: 'কোর্স পাওয়া যায়নি' });
    const existing = toObjects(db.exec('SELECT * FROM cart_items WHERE user_id=? AND item_type=? AND item_id=?', [req.userId, item_type, item_id]));
    if (existing.length > 0) { db.run('UPDATE cart_items SET quantity=quantity+? WHERE id=?', [quantity, existing[0].id]); }
    else { db.run('INSERT INTO cart_items (user_id,item_type,item_id,quantity) VALUES (?,?,?,?)', [req.userId, item_type, item_id, quantity]); }
    saveDb();
    const countR = db.exec('SELECT SUM(quantity) as count FROM cart_items WHERE user_id=?', [req.userId]);
    res.status(201).json({ message: 'কার্টে যোগ হয়েছে!', cartCount: countR.length > 0 ? countR[0].values[0][0] || 0 : 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'সঠিক পরিমাণ দিন' });
    const db = await getDb();
    if (toObjects(db.exec('SELECT * FROM cart_items WHERE id=? AND user_id=?', [parseInt(req.params.id), req.userId])).length === 0) return res.status(404).json({ error: 'আইটেম পাওয়া যায়নি' });
    db.run('UPDATE cart_items SET quantity=? WHERE id=?', [quantity, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'আপডেট হয়েছে' });
  } catch (err) { res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    if (toObjects(db.exec('SELECT * FROM cart_items WHERE id=? AND user_id=?', [parseInt(req.params.id), req.userId])).length === 0) return res.status(404).json({ error: 'আইটেম পাওয়া যায়নি' });
    db.run('DELETE FROM cart_items WHERE id=?', [parseInt(req.params.id)]);
    saveDb();
    const countR = db.exec('SELECT SUM(quantity) as count FROM cart_items WHERE user_id=?', [req.userId]);
    res.json({ message: 'সরানো হয়েছে', cartCount: countR.length > 0 ? countR[0].values[0][0] || 0 : 0 });
  } catch (err) { res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

module.exports = router;
