# MongoDB Setup Guide

## Quick Fix Options

### Option 1: MongoDB Atlas (Cloud Database) - Recommended for Quick Start

1. **Create a free MongoDB Atlas account:**
   - Go to https://www.mongodb.com/atlas
   - Sign up for a free account
   - Create a new cluster (choose the free tier)

2. **Get your connection string:**
   - In Atlas dashboard, click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

3. **Set up environment variable:**
   - Create a `.env` file in the backend directory
   - Add: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booklibrary?retryWrites=true&w=majority`
   - Replace username, password, and cluster details with your actual values

### Option 2: Install MongoDB Locally

1. **Download MongoDB Community Server:**
   - Go to https://www.mongodb.com/try/download/community
   - Download the Windows MSI installer

2. **Install MongoDB:**
   - Run the MSI installer
   - Choose "Complete" installation
   - Install MongoDB as a Windows Service
   - Install MongoDB Compass (optional GUI tool)

3. **Start MongoDB:**
   - MongoDB should start automatically as a Windows Service
   - You can verify it's running by opening Services (services.msc) and looking for "MongoDB"

### Option 3: Use Docker (if you have Docker installed)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Testing the Connection

After setting up MongoDB (any option), restart your server:

```bash
cd D:\Library\book-library\backend
node server.js
```

You should see: `✅ MongoDB connected successfully`

## Troubleshooting

- If you still get connection errors, make sure:
  - MongoDB is running (for local installation)
  - Your connection string is correct (for Atlas)
  - No firewall is blocking port 27017 (for local)
  - Your internet connection is working (for Atlas)
