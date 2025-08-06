#!/bin/bash

# AlwaysCare Vercel Deployment Script
echo "🚀 Deploying AlwaysCare to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Set environment variables
echo "🔧 Setting environment variables..."
vercel env add JWT_SECRET production
vercel env add NODE_ENV production

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment to Vercel complete!"
echo "🌐 Your application is now live!"