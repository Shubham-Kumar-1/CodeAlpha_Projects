const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      category TEXT
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Order Items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )`);

    // Seed products if empty
    db.get("SELECT count(*) as count FROM products", (err, row) => {
      if (row.count === 0) {
        const stmt = db.prepare("INSERT INTO products (name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)");
        const products = [
          ['Premium Nebula Watch', 'A sleek, futuristic timepiece with a sapphire crystal and titanium body.', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', 'Accessories'],
          ['Obsidian Audio X1', 'High-fidelity noise-canceling headphones with spatial audio support.', 349.50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800', 'Electronics'],
          ['CyberPack V2', 'A weatherproof, modular backpack designed for the modern nomad.', 129.00, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800', 'Travel'],
          ['Lumina Smart Lamp', 'Minimalist desk lamp with customizable ambient lighting and voice control.', 89.99, 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800', 'Home'],
          ['Titanium Key Organizer', 'Eliminate key jingle with this ultra-lightweight titanium organizer.', 45.00, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800', 'Accessories'],
          ['Infinity Wireless Charger', 'Fast charging pad with a unique semi-transparent glass design.', 59.99, 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?auto=format&fit=crop&q=80&w=800', 'Electronics']
        ];
        products.forEach(p => stmt.run(p));
        stmt.finalize();
      }
    });
  });
};

module.exports = { db, initDb };
