# Deployment Guide

This guide describes how to deploy the WorkLog AI application. The request uses a Node.js/Express backend and a React/Vite frontend.

## Prerequisites

- Allowed GitHub repository containing your code.
- Accounts on [Render](https://render.com/) (for Backend) and [Vercel](https://vercel.com/) (for Frontend).
- A MongoDB Connection String (e.g., from MongoDB Atlas).
- A Hugging Face API Key (for AI features).

## 1. Deploy Backend (Render)

1.  Log in to your **Render** dashboard.
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Select the **backend** folder as the `Root Directory` (if it's in a monorepo) or ensure the build context is correct.
    - **Build Command:** `npm install`
    - **Start Command:** `npm start`
5.  Scroll down to **Environment Variables** and add the following:
    - `MONGO_URI`: Your MongoDB connection string.
    - `JWT_SECRET`: A secure random string for authentication.
    - `HUGGING_FACE_API_KEY`: Your Hugging Face API token.
    - `PORT`: `5000` (Optional, Render sets `PORT` automatically, but your code supports it).
6.  Click **Create Web Service**.
7.  Wait for the deployment to finish. **Copy the backend URL** (e.g., `https://worklog-backend.onrender.com`) once it's live.

## 2. Deploy Frontend (Vercel)

1.  Log in to your **Vercel** dashboard.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    - **Framework Preset:** Vite
    - **Root Directory:** Edit and select `frontend`.
5.  Open the **Environment Variables** section and add:
    - `VITE_API_URL`: The URL of your deployed backend **appended with `/api`**.
      - Example: `https://worklog-backend.onrender.com/api`
6.  Click **Deploy**.

## 3. Verification

1.  Open your deployed frontend URL.
2.  Register a new user.
3.  Create a log entry.
4.  Test the AI Summary feature (requires valid Hugging Face key).

## Troubleshooting

- **CORS Issues:** If you see CORS errors in the console, ensure your backend `app.js` allows the frontend domain. Currently, `app.use(cors())` allows all origins, which is fine for initial deployment.
- **Connection Errors:** Double-check the `VITE_API_URL` variable in Vercel. It *must* allow HTTPS and end with `/api`.
