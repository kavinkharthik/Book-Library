const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

// Load environment variables first
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');
require('./config/passport');

const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.url} from origin: ${req.headers.origin || 'no-origin'}`);
    next();
});

// Middleware - Temporary permissive CORS for development
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: false, // Allow JavaScript access for debugging
        sameSite: 'lax' // CSRF protection
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/booklibrary';

// Enhanced MongoDB connection with better error handling
mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Connected to: ${mongoUri}`);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will continue without MongoDB connection');
    console.log('💡 To fix this issue:');
    console.log('   1. Install MongoDB Community Server locally, OR');
    console.log('   2. Use MongoDB Atlas (cloud database)');
    console.log('   3. Set MONGODB_URI environment variable');
});

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to Book Library API');
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Book Routes
app.use('/api/books', bookRoutes);

// User Routes
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
