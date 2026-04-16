const express = require('express');
const { getDb, saveDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

function toObjects(result) {
  if (!result || result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => { const o = {}; cols.forEach((c, i) => o[c] = row[i]); return o; });
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !phone || !address) return res.status(400).json({ error: 'নাম, ফোন এবং ঠিকানা আবশ্যক' });
    const db = await getDb();
    const cartItems = toObjects(db.exec(`
      SELECT ci.id, ci.item_type, ci.item_id, ci.quantity,
        CASE WHEN ci.item_type='book' THEN b.title WHEN ci.item_type='course' THEN c.title END as title,
        CASE WHEN ci.item_type='book' THEN b.price WHEN ci.item_type='course' THEN c.price END as price
      FROM cart_items ci LEFT JOIN books b ON ci.item_type='book' AND ci.item_id=b.id
      LEFT JOIN courses c ON ci.item_type='course' AND ci.item_id=c.id WHERE ci.user_id=?
    `, [req.userId]));
    if (cartItems.length === 0) return res.status(400).json({ error: 'কার্ট খালি' });
    const total = cartItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    db.run('INSERT INTO orders (user_id,total,name,email,phone,address) VALUES (?,?,?,?,?,?)', [req.userId, total, name, email || '', phone, address]);
    const orderId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    for (const item of cartItems) db.run('INSERT INTO order_items (order_id,item_type,item_id,item_title,price,quantity) VALUES (?,?,?,?,?,?)', [orderId, item.item_type, item.item_id, item.title, item.price, item.quantity]);
    db.run('DELETE FROM cart_items WHERE user_id=?', [req.userId]);
    saveDb();
    res.status(201).json({ message: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!', order: { id: orderId, total, itemCount: cartItems.length } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const orders = toObjects(db.exec('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC', [req.userId]));
    for (const o of orders) o.items = toObjects(db.exec('SELECT * FROM order_items WHERE order_id=?', [o.id]));
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: 'সার্ভার ত্রুটি' }); }
});

module.exports = router;
