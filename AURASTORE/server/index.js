require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

app.use(cors());
app.use(express.json());

// Initialize Database
initDb();

// --- Auth Routes ---

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hashedPassword], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
      return res.status(500).json({ error: err.message });
    }
    const token = jwt.sign({ id: this.lastID, name }, JWT_SECRET);
    res.json({ token, user: { id: this.lastID, name, email } });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
});

// --- Product Routes ---

app.get('/api/products', (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/products/:id', (req, res) => {
  db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  });
});

// --- Order Routes ---

app.post('/api/orders', (req, res) => {
  const { userId, items, totalPrice } = req.body;
  
  db.serialize(() => {
    db.run(`INSERT INTO orders (user_id, total_price) VALUES (?, ?)`, [userId, totalPrice], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const orderId = this.lastID;
      const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`);
      
      items.forEach(item => {
        stmt.run(orderId, item.id, item.quantity, item.price);
      });
      
      stmt.finalize(() => {
        res.json({ message: 'Order placed successfully', orderId });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
