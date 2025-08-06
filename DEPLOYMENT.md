# 🚀 AlwaysCare Deployment Guide

This guide provides step-by-step instructions for deploying the AlwaysCare Child Safety Application to various platforms.

## 📋 Prerequisites

- Node.js 16+ installed
- Git repository set up
- Account on your chosen deployment platform

## 🐳 Docker Deployment (Recommended)

### Local Docker Deployment

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd alwayscare-child-safety
   ```

2. **Set environment variables**
   ```bash
   export JWT_SECRET="your-super-secret-jwt-key"
   ```

3. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api/health

### Manual Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t alwayscare .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name alwayscare \
     -p 5000:5000 \
     -e NODE_ENV=production \
     -e JWT_SECRET=your-secret-key \
     -v $(pwd)/server/uploads:/app/server/uploads \
     -v $(pwd)/server/alwayscare.db:/app/server/alwayscare.db \
     alwayscare
   ```

3. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

## ☁️ Cloud Platform Deployments

### 1. Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`

4. **Access your application**
   - Your app will be available at: `https://your-app-name.vercel.app`

### 2. Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Deploy to Railway**
   ```bash
   railway init
   railway up
   ```

4. **Set environment variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-secret-key
   ```

### 3. Render Deployment

1. **Connect your GitHub repository to Render**

2. **Create a new Web Service**
   - Connect your repository
   - Set build command: `npm install && cd client && npm install && npm run build && cd ../server && npm install`
   - Set start command: `npm start`

3. **Set environment variables**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`

4. **Deploy**
   - Render will automatically deploy your application

### 4. Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

4. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   ```

5. **Deploy to Heroku**
   ```bash
   git push heroku main
   ```

### 5. DigitalOcean App Platform

1. **Connect your GitHub repository to DigitalOcean**

2. **Create a new App**
   - Choose your repository
   - Set build command: `npm install && cd client && npm install && npm run build && cd ../server && npm install`
   - Set run command: `npm start`

3. **Set environment variables**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`

4. **Deploy**
   - DigitalOcean will automatically deploy your application

## 🔧 Environment Variables

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=5000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database (optional - defaults to SQLite)
DB_PATH=./alwayscare.db
```

### Optional Environment Variables

```bash
# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Monitoring and Health Checks

### Health Check Endpoint

All deployments include a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "AlwaysCare Child Safety API"
}
```

### Logs and Monitoring

1. **Docker logs**
   ```bash
   docker-compose logs -f
   ```

2. **Platform-specific logs**
   - Vercel: `vercel logs`
   - Railway: `railway logs`
   - Render: Dashboard → Logs
   - Heroku: `heroku logs --tail`

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change default JWT secret
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Set up proper CORS configuration
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Database backups (if using external database)

### SSL/HTTPS

Most cloud platforms automatically provide SSL certificates. For custom domains:

1. **Vercel**: Automatic SSL
2. **Railway**: Automatic SSL
3. **Render**: Automatic SSL
4. **Heroku**: Automatic SSL with paid plans
5. **DigitalOcean**: Automatic SSL

## 🗄️ Database Considerations

### SQLite (Default)

- ✅ Good for small to medium applications
- ✅ No additional setup required
- ✅ File-based storage
- ❌ Limited concurrent users
- ❌ No built-in backup

### PostgreSQL (Recommended for Production)

1. **Add PostgreSQL dependency**
   ```bash
   npm install pg
   ```

2. **Update database configuration**
   ```javascript
   // server/database.js
   const { Pool } = require('pg');
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   });
   ```

3. **Set environment variable**
   ```bash
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

## 🚀 Performance Optimization

### Production Optimizations

1. **Enable compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Set up caching**
   ```javascript
   app.use(express.static('client/build', {
     maxAge: '1y',
     etag: false
   }));
   ```

3. **Optimize images**
   - Images are automatically optimized using Sharp
   - Maximum file size: 10MB
   - Supported formats: JPEG, PNG, GIF, WebP

## 🔄 Continuous Deployment

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database connection issues**
   - Check if database file exists
   - Ensure write permissions
   - Verify database path

3. **Build failures**
   - Check Node.js version (16+ required)
   - Clear node_modules and reinstall
   - Check for missing dependencies

4. **Environment variables**
   - Verify all required variables are set
   - Check variable names and values
   - Restart application after changes

### Support

For deployment issues:

1. Check platform-specific documentation
2. Review application logs
3. Verify environment variables
4. Test locally first
5. Check GitHub issues

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use platform load balancers
2. **Database**: Migrate to PostgreSQL or MongoDB
3. **File Storage**: Use cloud storage (AWS S3, Google Cloud Storage)
4. **Caching**: Implement Redis for session storage
5. **CDN**: Use platform CDN for static assets

### Vertical Scaling

1. **Memory**: Increase RAM allocation
2. **CPU**: Upgrade to higher-tier instances
3. **Storage**: Increase disk space
4. **Network**: Use dedicated bandwidth

---

## 🎉 Deployment Complete!

Your AlwaysCare application is now deployed and ready to protect children with AI-powered safety detection!

### Quick Links

- [Application](https://your-app-url)
- [API Documentation](https://your-app-url/api/health)
- [GitHub Repository](https://github.com/yourusername/alwayscare-child-safety)

### Next Steps

1. **Test the application** thoroughly
2. **Set up monitoring** and alerts
3. **Configure backups** for data
4. **Set up CI/CD** pipeline
5. **Monitor performance** and scale as needed

---

**AlwaysCare** - Protecting children with AI-powered safety detection. 🛡️