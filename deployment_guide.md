# Deployment Guide: LMS Antigravity on Render.com

Follow these steps to deploy your full-stack platform permanently.

## Prerequisites
1. A **GitHub** repository containing your code.
2. A **MongoDB Atlas** account (Free Tier is fine).

## Step 1: Prepare MongoDB Atlas
1. Create a new cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** and add `0.0.0.0/0` (or Render's IP ranges if you want more security).
3. Go to **Database Access** and create a user.
4. Copy your **Connection String** (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/dbname`).

## Step 2: Deploy to Render
1. Log in to [Render.com](https://render.com).
2. Click **New** > **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file I created.
5. You will be prompted to fill in the following:
   - **Service Group Name**: (e.g., `lms-antigravity`)
   - **MONGODB_URI**: Paste your Atlas connection string here.
   - **JWT_SECRET**: (Automatically generated, or provide your own).

## Step 3: Connect Frontend to Backend
1. Once the backend is deployed, copy its URL (e.g., `https://lms-backend-antigravity.onrender.com`).
2. Go to your local code in `frontend/src/environments/environment.prod.ts`.
3. Update the `apiUrl` with your new backend URL.
4. Push this change to GitHub. Render will automatically re-deploy your frontend.

## Step 4: Verification
- Visit your frontend URL (e.g., `https://lms-frontend-antigravity.onrender.com`).
- Verify login, course enrollment, and the coding playground.

> [!IMPORTANT]
> Because you are using `localtunnel` for testing, ensure you have removed all `localhost:3000` references (which I have already done for you in the services).
