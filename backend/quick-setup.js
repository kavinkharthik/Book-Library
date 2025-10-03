// Quick MongoDB Setup Script
// This script helps you set up MongoDB quickly

const fs = require('fs');
const path = require('path');

console.log('🚀 Quick MongoDB Setup');
console.log('=====================');

// Create .env file with MongoDB Atlas configuration
const envContent = `# MongoDB Configuration
# For quick setup, use MongoDB Atlas (free cloud database)
# Get your connection string from: https://www.mongodb.com/atlas
# Replace the connection string below with your actual Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booklibrary?retryWrites=true&w=majority

# Session Secret
SESSION_SECRET=your-super-secret-session-key-here-change-this-in-production

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Server Configuration
PORT=5000`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file');
} else {
    console.log('⚠️  .env file already exists');
}

console.log('\n📋 Next Steps:');
console.log('1. Go to https://www.mongodb.com/atlas');
console.log('2. Create a free account');
console.log('3. Create a new cluster (free tier)');
console.log('4. Get your connection string');
console.log('5. Replace the MONGODB_URI in .env file with your actual connection string');
console.log('6. Run: node server.js');

console.log('\n🔧 Alternative: Install MongoDB locally');
console.log('1. Download from: https://www.mongodb.com/try/download/community');
console.log('2. Install MongoDB Community Server');
console.log('3. Start MongoDB service');
console.log('4. Run: node server.js');
