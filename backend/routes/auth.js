const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or username' });
        }

        // Create new user (password is stored as-is without hashing as per requirements)
        const user = new User({
            username,
            email,
            password // Storing password as-is (not recommended for production)
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully', userId: user._id });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare passwords (as we're storing them as-is)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Login successful
        res.json({ 
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});


// Google OAuth Routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:3001/login?error=google_auth_failed' }),
    (req, res) => {
        console.log('✅ Google OAuth successful for user:', req.user);
        console.log('✅ Session ID:', req.sessionID);
        console.log('✅ User authenticated:', req.isAuthenticated());
        
        // Ensure session is saved before redirecting
        req.session.save((err) => {
            if (err) {
                console.error('❌ Session save error:', err);
                return res.redirect('http://localhost:3001/login?error=session_error');
            }
            
            // Successful authentication, redirect to dashboard with success message
            console.log('✅ Session saved, redirecting to dashboard');
            res.redirect('http://localhost:3001/dashboard?google_auth=success');
        });
    }
);

// Test endpoint to check session
router.get('/test-session', (req, res) => {
    console.log('🧪 Test session endpoint called');
    console.log('🧪 Session ID:', req.sessionID);
    console.log('🧪 Session data:', req.session);
    console.log('🧪 Is authenticated:', req.isAuthenticated());
    console.log('🧪 User:', req.user);
    
    res.json({
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        sessionData: req.session
    });
});

// Check if user is authenticated
router.get('/check-auth', (req, res) => {
    console.log('🔍 Auth check - Session ID:', req.sessionID);
    console.log('🔍 Auth check - Is authenticated:', req.isAuthenticated());
    console.log('🔍 Auth check - User:', req.user ? 'Present' : 'Not present');
    console.log('🔍 Auth check - Session data:', req.session);
    console.log('🔍 Auth check - Headers:', req.headers);
    
    if (req.isAuthenticated()) {
        console.log('✅ Auth check - User authenticated, returning user data');
        res.json({
            isAuthenticated: true,
            user: {
                id: req.user._id,
                email: req.user.email,
                username: req.user.username,
                googleName: req.user.googleName,
                googleId: req.user.googleId,
                role: req.user.role
            }
        });
    } else {
        console.log('❌ Auth check - User not authenticated');
        res.json({ isAuthenticated: false });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
