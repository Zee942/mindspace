# 🚀 Deployment Guide for Mind Space

This guide walks you through deploying Mind Space to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [GitHub Setup](#github-setup)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment Options](#backend-deployment-options)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Backend hosting account (Render/Railway/Fly.io/Heroku)

---

## GitHub Setup

### 1. Initialize Git Repository

```bash
# Navigate to project root
cd c:\Users\Zisha\Desktop\Mindspace

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Mind Space v1.0"

# Set main branch
git branch -M main
```

### 2. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `mindspace`
3. Description: "Personal productivity and learning hub with knowledge graph visualization"
4. Visibility: Public or Private
5. **Do NOT** initialize with README (we already have one)
6. Click **Create repository**

### 3. Push to GitHub

```bash
# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/mindspace.git

# Push to GitHub
git push -u origin main
```

---

## Frontend Deployment (Vercel)

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click **Add New** → **Project**

2. **Import Repository**
   - Select your `mindspace` repository
   - Click **Import**

3. **Configure Project**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables**
   - Click **Environment Variables**
   - Add variable:
     - **Name:** `VITE_API_URL`
     - **Value:** `https://your-backend-url.com` (you'll get this after deploying backend)

5. **Deploy**
   - Click **Deploy**
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `https://mindspace-xyz.vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Confirm settings
# - Deploy!

# For production deployment
vercel --prod
```

---

## Backend Deployment Options

### Option A: Render (Recommended)

**Why Render?**
- Free tier available
- Auto-deploys from GitHub
- Built-in PostgreSQL database
- Easy environment variable management

**Steps:**

1. **Create Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Dashboard → **New** → **Web Service**
   - Connect your GitHub repository
   - Select `mindspace` repo

3. **Configure Service**
   - **Name:** `mindspace-api`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Environment Variables**
   - Add variable:
     - **Key:** `CORS_ORIGINS`
     - **Value:** `https://your-frontend-url.vercel.app`
   - (Optional) Add `DATABASE_URL` if using PostgreSQL

5. **Deploy**
   - Click **Create Web Service**
   - Wait 5-10 minutes for deployment
   - Copy your backend URL (e.g., `https://mindspace-api.onrender.com`)

6. **Update Frontend on Vercel**
   - Go back to Vercel dashboard
   - Select your project → **Settings** → **Environment Variables**
   - Update `VITE_API_URL` to your Render backend URL
   - **Redeploy** frontend

---

### Option B: Railway

1. **Create Account** at [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Select `mindspace` repository
4. **Add Variables:**
   - `CORS_ORIGINS`: Your Vercel frontend URL
5. **Deploy**
6. Copy backend URL and update Vercel environment variable

---

### Option C: Fly.io

```bash
# Install Fly CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Navigate to backend
cd backend

# Login to Fly
fly auth login

# Launch app
fly launch
# Follow prompts, select region, confirm settings

# Set environment variables
fly secrets set CORS_ORIGINS=https://your-frontend-url.vercel.app

# Deploy
fly deploy
```

---

### Option D: Heroku

```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create Procfile in backend directory
echo "web: uvicorn app.main:app --host 0.0.0.0 --port $PORT" > backend/Procfile

# Create app
heroku create mindspace-api

# Set buildpack
heroku buildpacks:set heroku/python

# Set environment variables
heroku config:set CORS_ORIGINS=https://your-frontend-url.vercel.app

# Deploy
git subtree push --prefix backend heroku main

# Or use Heroku dashboard to connect GitHub repo
```

---

## Environment Variables

### Frontend (.env)

Create `.env` file in `frontend/` directory:

```bash
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env)

Create `.env` file in `backend/` directory:

```bash
# For SQLite (not recommended for production)
DATABASE_URL=sqlite:///./mindspace.db

# For PostgreSQL (recommended)
DATABASE_URL=postgresql://user:password@host:port/database

# CORS (add your Vercel URL)
CORS_ORIGINS=https://mindspace-xyz.vercel.app,http://localhost:5173
```

---

## Post-Deployment

### 1. Test Your Deployment

- Visit your Vercel frontend URL
- Open browser DevTools → Network tab
- Check that API calls reach your backend
- Test creating a node, task, or journal entry

### 2. Update CORS Settings

If you see CORS errors:

1. Go to backend deployment platform
2. Update `CORS_ORIGINS` environment variable
3. Add your Vercel domain
4. Redeploy backend

### 3. Database Migration (if using PostgreSQL)

Your SQLite database won't transfer to production. For PostgreSQL:

```python
# The app will auto-create tables on first run
# If you need to migrate data, use a migration tool or manually export/import
```

### 4. Custom Domain (Optional)

**Vercel:**
- Dashboard → Project → Settings → Domains
- Add custom domain (e.g., `mindspace.yourdomain.com`)
- Follow DNS configuration instructions

**Render:**
- Dashboard → Service → Settings → Custom Domain
- Add domain and configure DNS

---

## Troubleshooting

### Frontend can't connect to backend

**Solution:**
1. Check `VITE_API_URL` in Vercel environment variables
2. Ensure backend URL is correct and HTTPS
3. Redeploy frontend after changing env vars

### CORS errors in production

**Solution:**
1. Add Vercel domain to backend `CORS_ORIGINS`
2. Format: `https://mindspace-xyz.vercel.app` (no trailing slash)
3. Redeploy backend

### Backend crashes on startup

**Solution:**
1. Check build logs on deployment platform
2. Verify `requirements.txt` includes all dependencies
3. Ensure start command is correct: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Database errors

**Solution:**
1. For production, use PostgreSQL instead of SQLite
2. Add DATABASE_URL environment variable
3. Tables will auto-create on first run

---

## Continuous Deployment

Both Vercel and Render support auto-deployment:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Automatic Deployment:**
   - Vercel and Render detect the push
   - Automatically build and deploy
   - Check deployment status in dashboards

---

## Cost Estimates

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Vercel** | 100 GB bandwidth/month | $20/month (Pro) |
| **Render** | 750 hours/month | $7/month (Starter) |
| **Railway** | $5 free credit | Pay-as-you-go |
| **Fly.io** | 3 VMs free | $1.94/month per VM |
| **Heroku** | No free tier | $5/month (Eco) |

**Recommendation:** Start with Vercel (frontend) + Render free tier (backend)

---

## Support

If you encounter issues:
1. Check deployment platform logs
2. Review environment variables
3. Test locally first: `npm run dev` (frontend) + `uvicorn app.main:app --reload` (backend)

---

**Congratulations! Your Mind Space app is now live! 🎉**
