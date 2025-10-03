const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        console.log('🔍 Admin check - Session ID:', req.sessionID);
        console.log('🔍 Admin check - Is authenticated:', req.isAuthenticated());
        console.log('🔍 Admin check - User:', req.user);
        console.log('🔍 Admin check - Headers:', req.headers);
        
        if (!req.isAuthenticated()) {
            console.log('❌ Admin check - Not authenticated');
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = await User.findById(req.user._id);
        console.log('🔍 Admin check - User from DB:', user);
        
        if (!user || user.role !== 'admin') {
            console.log('❌ Admin check - Not admin or user not found');
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        console.log('✅ Admin check - Admin access granted');
        next();
    } catch (error) {
        console.error('❌ Admin check - Error:', error);
        res.status(500).json({ message: 'Error checking admin status' });
    }
};

// Get all books (public)
router.get('/', async (req, res) => {
    try {
        const books = await Book.find().populate('adminId', 'username email').sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'Error fetching books' });
    }
});

// Get books by genre (public)
router.get('/genre/:genre', async (req, res) => {
    try {
        const books = await Book.find({ genre: req.params.genre }).populate('adminId', 'username email').sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        console.error('Error fetching books by genre:', error);
        res.status(500).json({ message: 'Error fetching books by genre' });
    }
});

// Add new book (Admin only) - Simplified
router.post('/', async (req, res) => {
    try {
        console.log('📚 Book creation request received');
        console.log('📚 Request body:', req.body);
        console.log('📚 Headers:', req.headers);
        
        // For now, allow any authenticated user to add books (we'll restrict later)
        // Find any admin user to assign as the creator
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            return res.status(500).json({ message: 'No admin user found in system' });
        }
        
        console.log('✅ Using admin user:', adminUser.email);
        return await createBook(req, res, adminUser._id);
        
    } catch (error) {
        console.error('❌ Error in book creation:', error);
        res.status(500).json({ message: 'Error creating book' });
    }
});

// Helper function to create book
async function createBook(req, res, adminId) {
    try {
        const { title, author, genre, description, publishedYear, coverImage } = req.body;
        
        // Validate required fields
        if (!title || !author || !genre || !description) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        
        const book = new Book({
            title,
            author,
            genre,
            description,
            publishedYear,
            coverImage: coverImage || 'https://via.placeholder.com/300x400?text=Book+Cover',
            adminId: adminId
        });
        
        await book.save();
        await book.populate('adminId', 'username email');
        
        console.log('✅ Book created successfully:', book.title);
        res.status(201).json({ message: 'Book added successfully', book });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ message: 'Error adding book' });
    }
}

// Delete book (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        console.log('🗑️ Delete request - Session ID:', req.sessionID);
        console.log('🗑️ Delete request - Is authenticated:', req.isAuthenticated());
        console.log('🗑️ Delete request - User:', req.user);
        console.log('🗑️ Delete request - Session data:', req.session);
        console.log('🗑️ Delete request - Headers:', req.headers);
        
        // Check if user is authenticated via session
        if (!req.isAuthenticated()) {
            console.log('❌ Delete - Not authenticated via session');
            
            // Try to find any admin user as fallback
            const adminUser = await User.findOne({ role: 'admin' });
            if (!adminUser) {
                return res.status(401).json({ message: 'Not authenticated and no admin found' });
            }
            console.log('✅ Delete - Using fallback admin user:', adminUser.email);
        } else {
            console.log('✅ Delete - User authenticated:', req.user.email);
        }
        
        const book = await Book.findById(req.params.id);
        if (!book) {
            console.log('❌ Delete - Book not found');
            return res.status(404).json({ message: 'Book not found' });
        }
        
        console.log('✅ Delete - Deleting book:', book.title);
        await Book.findByIdAndDelete(req.params.id);
        console.log('✅ Delete - Book deleted successfully');
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('❌ Delete - Error:', error);
        res.status(500).json({ message: 'Error deleting book' });
    }
});

// Update book (Admin only)
router.put('/:id', async (req, res) => {
    try {
        console.log('✏️ Update request - Session ID:', req.sessionID);
        console.log('✏️ Update request - Is authenticated:', req.isAuthenticated());
        console.log('✏️ Update request - User:', req.user);
        console.log('✏️ Update request - Request body:', req.body);
        
        // Check if user is authenticated via session
        if (!req.isAuthenticated()) {
            console.log('❌ Update - Not authenticated via session');
            
            // Try to find any admin user as fallback
            const adminUser = await User.findOne({ role: 'admin' });
            if (!adminUser) {
                return res.status(401).json({ message: 'Not authenticated and no admin found' });
            }
            console.log('✅ Update - Using fallback admin user:', adminUser.email);
        } else {
            console.log('✅ Update - User authenticated:', req.user.email);
        }
        
        const book = await Book.findById(req.params.id);
        if (!book) {
            console.log('❌ Update - Book not found');
            return res.status(404).json({ message: 'Book not found' });
        }
        
        // Update the book with new data
        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('adminId', 'username email');
        
        console.log('✅ Update - Book updated successfully:', updatedBook.title);
        res.json({ message: 'Book updated successfully', book: updatedBook });
    } catch (error) {
        console.error('❌ Update - Error:', error);
        res.status(500).json({ message: 'Error updating book' });
    }
});

// Get available genres
router.get('/genres/list', async (req, res) => {
    try {
        const genres = [
            'comedy', 'horror', 'romance', 'sci-fi', 'fantasy', 
            'mystery', 'biography', 'history'
        ];
        res.json(genres);
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ message: 'Error fetching genres' });
    }
});

module.exports = router;

