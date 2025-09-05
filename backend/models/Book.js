const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    genre: {
        type: String,
        required: true,
        enum: ['comedy', 'horror', 'romance', 'sci-fi', 'fantasy', 'mystery', 'thriller', 'biography', 'history', 'self-help']
    },
    description: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: 'https://via.placeholder.com/300x400?text=Book+Cover'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Book', bookSchema);

