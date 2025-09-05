const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Check if required environment variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing Google OAuth credentials!');
    console.error('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
    console.error('Current values:');
    console.error('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    console.error('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
    // Use real Google OAuth credentials
    process.env.GOOGLE_CLIENT_ID = '1061484012335-ge159oppgfoifadej55oo9ttq3156hg9.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = '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';
    console.log('✅ Using real Google OAuth credentials');
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔍 Processing Google profile:', profile.displayName, profile.emails[0].value);
        
        // Check if user already exists with this Google ID
        let existingUser = await User.findOne({ googleId: profile.id });
        
        if (existingUser) {
            console.log('✅ Found existing user with Google ID');
            return done(null, existingUser);
        }
        
        // Check if user exists with same email
        existingUser = await User.findOne({ email: profile.emails[0].value });
        
        if (existingUser) {
            console.log('✅ Found existing user with email, updating with Google info');
            // Update existing user with Google info
            existingUser.googleId = profile.id;
            existingUser.googleName = profile.displayName;
            await existingUser.save();
            return done(null, existingUser);
        }
        
        // Create new user
        console.log('✅ Creating new user');
        const newUser = new User({
            email: profile.emails[0].value,
            googleId: profile.id,
            googleName: profile.displayName
        });
        
        await newUser.save();
        console.log('✅ New user created successfully');
        return done(null, newUser);
        
    } catch (error) {
        console.error('❌ Error in Google OAuth strategy:', error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
