const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: function() {
            return !this.googleId; // Username required only if not Google user
        },
        unique: true,
        sparse: true, // Allows multiple null values
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password required only if not Google user
        }
    },
    // Google OAuth fields
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    googleName: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
