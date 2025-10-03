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
        enum: ['comedy', 'horror', 'romance', 'sci-fi', 'fantasy', 'mystery', 'biography', 'history']
    },
    description: {
        type: String,
        required: true
    },
    publishedYear: {
        type: Number,
        required: false,
        min: 1000,
        max: new Date().getFullYear() + 1
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


