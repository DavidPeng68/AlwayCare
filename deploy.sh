#!/bin/bash

# AlwaysCare Deployment Script
echo "🚀 Deploying AlwaysCare Child Safety Application..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p server/uploads

# Set environment variables
export NODE_ENV=production
export PORT=5000
export JWT_SECRET=${JWT_SECRET:-"your-production-jwt-secret-change-this"}

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up --build -d

# Wait for the application to start
echo "⏳ Waiting for the application to start..."
sleep 10

# Check if the application is running
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ AlwaysCare is successfully deployed!"
    echo "🌐 Access the application at: http://localhost:5000"
    echo "📊 Health check: http://localhost:5000/api/health"
else
    echo "❌ Application failed to start. Check the logs with: docker-compose logs"
    exit 1
fi

echo "🎉 Deployment complete!"