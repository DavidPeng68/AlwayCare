# Quick Backend Deployment to Render

## Steps:

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with your GitHub account
3. **Create New Web Service**
4. **Connect your GitHub repository**
5. **Configure the service:**

   - **Name**: `alwaycare-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Root Directory**: Leave empty (root of repo)

6. **Add Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-key-change-this
   PORT=10000
   ```

7. **Click "Create Web Service"**

## After Deployment:

1. **Copy the URL** (e.g., `https://alwaycare-backend.onrender.com`)
2. **Update your frontend config** in `client/src/config.js`:
   ```javascript
   production: 'https://alwaycare-backend.onrender.com'
   ```
3. **Redeploy your frontend** to Netlify

## Test the Backend:

Visit: `https://alwaycare.onrender.com/api/health`

Should return: `{"status":"OK","message":"AlwayCare server is running"}`

## Common Issues:

- **Build fails**: Check if all dependencies are in `package.json`
- **Runtime errors**: Check Render logs
- **CORS errors**: Verify the frontend URL is in the CORS list
- **Database errors**: SQLite should work on Render

## Next Steps:

1. Deploy backend to Render
2. Update frontend config with backend URL
3. Redeploy frontend to Netlify
4. Test the full application
