const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Test endpoint to check if users route is working
router.get('/test', (req, res) => {
    console.log('🧪 Users test endpoint called');
    res.json({ message: 'Users route is working', timestamp: new Date().toISOString() });
});

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        console.log('🔍 Users Admin check - Session ID:', req.sessionID);
        console.log('🔍 Users Admin check - Is authenticated:', req.isAuthenticated());
        console.log('🔍 Users Admin check - User:', req.user);
        
        if (!req.isAuthenticated()) {
            console.log('❌ Users Admin check - Not authenticated');
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = await User.findById(req.user._id);
        console.log('🔍 Users Admin check - User from DB:', user);
        
        if (!user || user.role !== 'admin') {
            console.log('❌ Users Admin check - Not admin');
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        console.log('✅ Users Admin check - Admin verified');
        next();
    } catch (error) {
        console.error('❌ Users Admin check - Error:', error);
        res.status(500).json({ message: 'Error checking admin status' });
    }
};

// Get all users (Temporarily allowing access for testing)
router.get('/', async (req, res) => {
    try {
        console.log('👥 Fetching all users...');
        console.log('👥 Request headers:', req.headers);
        console.log('👥 Session ID:', req.sessionID);
        console.log('👥 User making request:', req.user);
        
        const users = await User.find({}, {
            username: 1,
            email: 1,
            role: 1,
            googleName: 1,
            createdAt: 1,
            lastLogin: 1
        }).sort({ createdAt: -1 });
        
        console.log(`✅ Found ${users.length} users:`, users.map(u => ({ 
            id: u._id, 
            name: u.googleName || u.username, 
            email: u.email, 
            role: u.role 
        })));
        res.json(users);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get currently active/signed-in users
router.get('/active', async (req, res) => {
    try {
        console.log('🟢 Fetching active users...');
        console.log('🟢 Current time:', new Date());
        
        // Get users who have logged in within the last 30 minutes
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        console.log('🟢 30 minutes ago:', thirtyMinutesAgo);
        
        const activeUsers = await User.find({
            lastLogin: { $gte: thirtyMinutesAgo }
        }, {
            username: 1,
            email: 1,
            role: 1,
            googleName: 1,
            lastLogin: 1
        }).sort({ lastLogin: -1 });
        
        console.log(`✅ Found ${activeUsers.length} active users:`, activeUsers.map(u => ({ 
            id: u._id, 
            name: u.googleName || u.username, 
            email: u.email, 
            lastLogin: u.lastLogin 
        })));
        
        res.json(activeUsers);
    } catch (error) {
        console.error('❌ Error fetching active users:', error);
        res.status(500).json({ message: 'Error fetching active users', error: error.message });
    }
});

// Debug endpoint to check all users and their lastLogin times (temporarily without auth for testing)
router.get('/debug', async (req, res) => {
    try {
        console.log('🔍 Debug: Fetching all users with lastLogin info...');
        
        const allUsers = await User.find({}, {
            username: 1,
            email: 1,
            role: 1,
            googleName: 1,
            lastLogin: 1,
            createdAt: 1
        }).sort({ lastLogin: -1 });
        
        const currentTime = new Date();
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        console.log('🔍 Current time:', currentTime);
        console.log('🔍 30 minutes ago:', thirtyMinutesAgo);
        console.log('🔍 All users:', allUsers.map(u => ({ 
            name: u.googleName || u.username, 
            email: u.email, 
            lastLogin: u.lastLogin,
            isActive: u.lastLogin && u.lastLogin >= thirtyMinutesAgo
        })));
        
        res.json({
            currentTime,
            thirtyMinutesAgo,
            totalUsers: allUsers.length,
            users: allUsers
        });
    } catch (error) {
        console.error('❌ Error in debug endpoint:', error);
        res.status(500).json({ message: 'Error in debug endpoint', error: error.message });
    }
});

// Get user by ID (Admin only)
router.get('/:id', isAdmin, async (req, res) => {
    try {
        console.log('👤 Fetching user by ID:', req.params.id);
        
        const user = await User.findById(req.params.id, {
            username: 1,
            email: 1,
            role: 1,
            googleName: 1,
            createdAt: 1,
            lastLogin: 1
        });
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('✅ User found:', user.username);
        res.json(user);
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// Update user role (Admin only)
router.put('/:id/role', isAdmin, async (req, res) => {
    try {
        console.log('🔄 Updating user role:', req.params.id, req.body.role);
        
        const { role } = req.body;
        
        if (!role || !['admin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        );
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('✅ User role updated:', user.username, 'to', user.role);
        res.json({ message: 'User role updated successfully', user });
    } catch (error) {
        console.error('❌ Error updating user role:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
});

// Delete user (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        console.log('🗑️ Deleting user:', req.params.id);
        
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('✅ User deleted:', user.username);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router;
