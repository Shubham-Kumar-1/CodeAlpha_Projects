const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'super_secret_key_change_this_in_production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Create uploads folder if not exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Database Setup
const db = new sqlite3.Database('./social.db', (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to SQLite database.');
});

// Initialize Tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        bio TEXT,
        profile_pic TEXT DEFAULT '/uploads/default-avatar.png',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Posts table
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        content TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Comments table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        user_id INTEGER,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES posts(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Likes table
    db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        user_id INTEGER,
        UNIQUE(post_id, user_id),
        FOREIGN KEY(post_id) REFERENCES posts(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Follows table
    db.run(`CREATE TABLE IF NOT EXISTS follows (
        follower_id INTEGER,
        following_id INTEGER,
        PRIMARY KEY(follower_id, following_id),
        FOREIGN KEY(follower_id) REFERENCES users(id),
        FOREIGN KEY(following_id) REFERENCES users(id)
    )`);
});

// Multer storage for uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- AUTH ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, 
        [username, email, hashedPassword], 
        function(err) {
            if (err) return res.status(400).json({ error: 'Username or email already exists' });
            res.json({ message: 'User registered successfully', userId: this.lastID });
        }
    );
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'User not found' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid password' });
        
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
        res.json({ token, user: { id: user.id, username: user.username, profile_pic: user.profile_pic } });
    });
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- POST ROUTES ---

// Get Feed (all posts with user info, like count, comment count)
app.get('/api/posts', (req, res) => {
    const sql = `
        SELECT posts.*, users.username, users.profile_pic,
        (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY posts.created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create Post
app.post('/api/posts', authenticateToken, upload.single('image'), (req, res) => {
    const { content } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run(`INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
        [req.user.id, content, image_url],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Post created', id: this.lastID });
        }
    );
});

// Like/Unlike Post
app.post('/api/posts/:id/like', authenticateToken, (req, res) => {
    const postId = req.params.id;
    db.get(`SELECT * FROM likes WHERE post_id = ? AND user_id = ?`, [postId, req.user.id], (err, row) => {
        if (row) {
            db.run(`DELETE FROM likes WHERE post_id = ? AND user_id = ?`, [postId, req.user.id], () => {
                res.json({ message: 'Unliked' });
            });
        } else {
            db.run(`INSERT INTO likes (post_id, user_id) VALUES (?, ?)`, [postId, req.user.id], () => {
                res.json({ message: 'Liked' });
            });
        }
    });
});

// Comment on Post
app.post('/api/posts/:id/comment', authenticateToken, (req, res) => {
    const { content } = req.body;
    db.run(`INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`,
        [req.params.id, req.user.id, content],
        () => res.json({ message: 'Comment added' })
    );
});

// Get Comments for Post
app.get('/api/posts/:id/comments', (req, res) => {
    db.all(`SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = ? ORDER BY created_at ASC`,
        [req.params.id],
        (err, rows) => res.json(rows)
    );
});

// --- USER ROUTES ---

// Get Profile
app.get('/api/users/:id', (req, res) => {
    db.get(`SELECT id, username, bio, profile_pic, created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = users.id) as following
        FROM users WHERE id = ?`, [req.params.id], (err, user) => {
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    });
});

// Suggestions (random users to follow)
app.get('/api/users/list/suggestions', authenticateToken, (req, res) => {
    db.all(`SELECT id, username, profile_pic FROM users WHERE id != ? LIMIT 5`, [req.user.id], (err, rows) => {
        res.json(rows);
    });
});

// Follow/Unfollow
app.post('/api/users/:id/follow', authenticateToken, (req, res) => {
    const targetId = req.params.id;
    if (targetId == req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    db.get(`SELECT * FROM follows WHERE follower_id = ? AND following_id = ?`, [req.user.id, targetId], (err, row) => {
        if (row) {
            db.run(`DELETE FROM follows WHERE follower_id = ? AND following_id = ?`, [req.user.id, targetId], () => {
                res.json({ message: 'Unfollowed' });
            });
        } else {
            db.run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [req.user.id, targetId], () => {
                res.json({ message: 'Followed' });
            });
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
