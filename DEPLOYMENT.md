# Backend Deployment to Render

This guide will help you deploy your backend to Render and configure your frontend to use the deployed backend.

## Step 1: Prepare Your Repository

1. Make sure all your changes are committed and pushed to your Git repository (GitHub, GitLab, etc.)
2. Your backend server is configured in `server.ts`

## Step 2: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Use these settings:
   - **Name**: `mpp-exam-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:server`
   - **Plan**: Free (or paid if needed)

5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: Leave empty (Render will set this automatically)

6. Click "Create Web Service"

### Option B: Using render.yaml (Alternative)

1. The `render.yaml` file is already configured in your project
2. In Render dashboard, choose "Infrastructure as Code" instead
3. Connect your repository

## Step 3: Configure Frontend

After your backend is deployed, you'll get a URL like: `https://your-app-name.onrender.com`

1. Create a `.env.local` file in your project root:
```env
NEXT_PUBLIC_BACKEND_URL=https://your-app-name.onrender.com
NEXT_PUBLIC_WEBSOCKET_URL=https://your-app-name.onrender.com
```

2. Replace `https://your-app-name.onrender.com` with your actual Render URL

3. Update the CORS configuration in `server.ts`:
   - Replace `'https://your-frontend-domain.vercel.app'` with your actual frontend URL
   - If deploying frontend to Vercel, it will be like `https://your-project.vercel.app`

## Step 4: Deploy Frontend

Deploy your frontend to Vercel, Netlify, or your preferred platform with the environment variables set.

## Step 5: Test the Deployment

1. Visit your frontend URL
2. Check browser console for any CORS errors
3. Verify that data is loading from your deployed backend
4. Test the health endpoint: `https://your-backend-url.onrender.com/health`

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Update the `corsOptions` in `server.ts` with your frontend URL
2. **502 Bad Gateway**: Wait a few minutes for the service to fully start
3. **Build Failures**: Check the build logs in Render dashboard
4. **Environment Variables**: Make sure `NEXT_PUBLIC_BACKEND_URL` is set correctly

### Checking Logs:

1. Go to your Render dashboard
2. Click on your service
3. Go to "Logs" tab to see real-time logs

### Free Tier Limitations:

- Render free tier services sleep after 15 minutes of inactivity
- First request after sleeping may take 30+ seconds to respond
- Consider upgrading to paid plan for production use

## Backend Endpoints

Your deployed backend will provide:
- `GET /health` - Health check
- `POST /api/trpc/*` - tRPC API endpoints
- WebSocket support for real-time updates

## Environment Variables Reference

### Backend (Render):
- `NODE_ENV=production`
- `PORT` (automatically set by Render)

### Frontend (Local & Deployed):
- `NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com`
- `NEXT_PUBLIC_WEBSOCKET_URL=https://your-backend.onrender.com` 