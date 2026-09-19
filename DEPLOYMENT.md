# 🚀 Sahaj Deployment Guide

This guide details how to deploy **Sahaj** (Next.js 14 Web + Fastify API + MongoDB) across the most popular cloud platforms.

---

## 🏗 Architecture Overview

| Component | Technology | Recommended Host | Production URL Example |
|---|---|---|---|
| **Frontend** (`apps/web`) | Next.js 14 App Router, WebGL, Tailwind | **Vercel** or **Render** | `https://sahaj-web.vercel.app` |
| **Backend API** (`apps/api`) | Fastify 4, SSE Streaming, Node.js | **Render**, **Railway**, or **Fly.io** | `https://sahaj-api.onrender.com` |
| **Database** | MongoDB 7.0 | **MongoDB Atlas** (Free Tier) | `mongodb+srv://...` |

---

## ⚡ Option 1: Vercel (Frontend) + Render (Backend) + MongoDB Atlas (Recommended & 100% Free)

This is the fastest, standard modern deployment for Next.js monorepos.

### Step 1: Set Up MongoDB Atlas (Free Cloud Database)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a free **M0 Shared Cluster** (choose AWS or GCP in Mumbai or Singapore).
3. Under **Database Access**, create a user (e.g. `sahaj_admin` with password).
4. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** → **Drivers** and copy your connection string:
   ```
   mongodb+srv://sahaj_admin:<password>@cluster0.xxxxx.mongodb.net/sahaj?retryWrites=true&w=majority
   ```

### Step 2: Push Code to GitHub
If you haven't pushed the project to GitHub yet:
```bash
git init
git add .
git commit -m "feat: complete Sahaj financial journey companion"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sahaj.git
git push -u origin main
```

### Step 3: Deploy Backend API to Render
1. Go to [render.com](https://render.com) and connect your GitHub account.
2. Click **New +** → **Web Service**.
3. Select your `sahaj` GitHub repository.
4. Configure:
   - **Name**: `sahaj-api`
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter @sahaj/shared build && pnpm --filter @sahaj/api build
     ```
   - **Start Command**:
     ```bash
     pnpm --filter @sahaj/api start
     ```
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `API_PORT`: `10000`
   - `API_HOST`: `0.0.0.0`
   - `MONGODB_URI`: *<Your MongoDB Atlas connection string from Step 1>*
   - `SESSION_SECRET`: *<Any long random string>*
   - `CORS_ORIGINS`: `https://YOUR_VERCEL_FRONTEND.vercel.app,http://localhost:3000`
   - `DEMO_MODE`: `mock` *(or set `GROQ_API_KEY` and `SARVAM_API_KEY` for live AI)*
6. Click **Create Web Service**. Render will assign a public URL (e.g., `https://sahaj-api.onrender.com`).

### Step 4: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import your `sahaj` repository from GitHub.
3. In Project Settings:
   - **Root Directory**: `apps/web` (click Edit and select `apps/web`)
   - **Framework Preset**: `Next.js`
   - **Build Command**:
     ```bash
     cd ../.. && pnpm install && pnpm --filter @sahaj/shared build && pnpm --filter @sahaj/web build
     ```
   - **Install Command**:
     ```bash
     cd ../.. && pnpm install
     ```
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `https://sahaj-api.onrender.com` *(from Step 3)*
   - `NODE_ENV`: `production`
5. Click **Deploy**. Vercel will build and launch the site globally on an edge CDN!

---

## 🚄 Option 2: Railway (Everything in 1 Single Dashboard)

Railway is an all-in-one PaaS where you can host your Next.js app, Fastify API, and MongoDB in a single canvas.

1. Go to [railway.app](https://railway.app) and create a **New Project**.
2. Click **Provision MongoDB** (Railway sets up a managed MongoDB instance automatically).
3. Click **Add Service** → **GitHub Repo** → select `sahaj`.
   - Set Root Directory to `/`
   - Set Build Command: `pnpm install && pnpm --filter @sahaj/shared build && pnpm --filter @sahaj/api build`
   - Set Start Command: `pnpm --filter @sahaj/api start`
   - Link the MongoDB URI environment variable `${{MongoDB.MONGO_URL}}`.
4. Click **Add Service** → **GitHub Repo** again for the frontend:
   - Set Root Directory to `apps/web`
   - Set `NEXT_PUBLIC_API_URL` to your backend Railway domain.
5. Railway provisions custom HTTPS domains for both services automatically.

---

## 🐳 Option 3: Single VPS (DigitalOcean, AWS EC2, Hetzner) using Docker Compose

If you have a Linux server (Ubuntu/Debian) with Docker and Docker Compose installed:

1. Clone your repository on the server:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sahaj.git
   cd sahaj
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` with production secrets (`SESSION_SECRET`, live API keys if available).
4. Launch all services in the background:
   ```bash
   docker compose --profile full up -d --build
   ```
5. Set up Caddy or Nginx reverse proxy to route port `80/443` to `localhost:3000` (Web) and `localhost:3001` (API).

---

## 📋 Required Production Environment Variables Checklist

| Variable | Required For | Recommended Value |
|---|---|---|
| `NODE_ENV` | Both | `production` |
| `MONGODB_URI` | API | MongoDB Atlas URI: `mongodb+srv://...` |
| `NEXT_PUBLIC_API_URL` | Web | Backend API domain: `https://sahaj-api.onrender.com` |
| `CORS_ORIGINS` | API | Frontend domain: `https://sahaj-web.vercel.app` |
| `SESSION_SECRET` | API | 32+ character random string |
| `GROQ_API_KEY` | API (Optional) | Live LLM completions (fallback to mock if absent) |
| `SARVAM_API_KEY` | API (Optional) | Live Indic speech and translations |
