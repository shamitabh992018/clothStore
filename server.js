const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
let db;
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
    try {
        await client.connect();
        db = client.db('cloth_store');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Error:', error);
    }
}
connectDB();

// Auth Middleware
const auth = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// API Routes
app.get('/api/check-session', auth, (req, res) => {
    res.json({ logged_in: true, user_id: req.user.id, user_name: req.user.name });
});

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, address, password } = req.body;
        
        const exists = await db.collection('users').findOne({ email });
        if (exists) return res.status(400).json({ error: 'Email already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({
            name, email, phone, address, password: hashed, created_at: new Date()
        });

        const token = jwt.sign(
            { id: result.insertedId, name, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.collection('users').findOne({ email });
        
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

app.get('/api/profile', auth, async (req, res) => {
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.id) },
            { projection: { password: 0 } }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/orders', auth, async (req, res) => {
    try {
        const orders = await db.collection('orders')
            .find({ user_id: new ObjectId(req.user.id) })
            .sort({ order_date: -1 })
            .toArray();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/place-order', auth, async (req, res) => {
    try {
         const { cart, total, payment_method } = req.body;
         let status = "confirmed";

    if (payment_method === "cod") {
        status = "pending";
    }
        const order = {
            order_id: '#FS' + Math.floor(Math.random() * 10000),
            user_id: new ObjectId(req.user.id),
            total_amount: parseFloat(total),
            items: cart,
            payment_method: payment_method,
            status: status,
            order_date: new Date()
        };

        await db.collection('orders').insertOne(order);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});