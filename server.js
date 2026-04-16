const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes (loaded after DB init)
async function startServer() {
  await initDatabase();

  const authRoutes = require('./routes/auth');
  const productRoutes = require('./routes/products');
  const cartRoutes = require('./routes/cart');
  const orderRoutes = require('./routes/orders');

  app.use('/api/auth', authRoutes);
  app.use('/api', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ✅ রুসুখ অনলাইন একাডেমি server running at:`);
    console.log(`  ➜  http://localhost:${PORT}\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
