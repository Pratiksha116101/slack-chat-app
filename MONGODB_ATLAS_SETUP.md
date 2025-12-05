# MongoDB Atlas Setup Guide for Slack Chat App

This guide walks you through provisioning a free MongoDB Atlas cluster and connecting it to Render.

## Step 1: Create a MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Click **Sign Up** (or log in if you have an account)
3. Complete the registration (email, password, organization name)
4. Verify your email

## Step 2: Create a New Project

1. After login, click **New Project**
2. Enter a project name (e.g., `slack-chat-project`)
3. Click **Next** → **Create Project**

## Step 3: Create a Free Cluster

1. In the project dashboard, click **Build a Database**
2. Choose the **Free Tier** plan (M0 Sandbox, 512 MB storage)
3. Click **Create**
4. Select your cloud provider (AWS, Google Cloud, or Azure) and region
   - **Recommendation:** Choose a region close to your Render region (e.g., `us-east-1` for US-based deployments)
5. Click **Create Cluster** (takes ~1-3 minutes to deploy)

## Step 4: Create a Database User

1. Once the cluster is deployed, go to **Security** → **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Choose **Password** as the authentication method
4. Enter:
   - **Username:** `slackchat` (or any username)
   - **Password:** Generate a strong password (or use the auto-generated one)
   - **Save the password somewhere safe** — you'll need it for the connection string
5. For **Built-in Role**, select **Atlas admin** (for development; use read/write for production)
6. Click **Add User**

## Step 5: Whitelist Your IP Address

1. Go to **Security** → **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Choose **Allow Access from Anywhere** (for development; for production, whitelist Render's IP range)
   - If you want to be specific, use `0.0.0.0/0` for now
4. Click **Confirm**

## Step 6: Get Your Connection String

1. Go to **Databases** → click **Connect** on your cluster
2. Choose **Drivers** → **Node.js**
3. Copy the connection string (it looks like):
   ```
   mongodb+srv://slackchat:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `PASSWORD` with the password you created in Step 4

### Full MONGODB_URI Format

```
mongodb+srv://slackchat:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/slack-chat?retryWrites=true&w=majority
```

**Important:** 
- Replace `YOUR_PASSWORD` with your actual password
- Add `/slack-chat` at the end to specify the database name
- The format is: `mongodb+srv://USERNAME:PASSWORD@CLUSTER_NAME.mongodb.net/DB_NAME?retryWrites=true&w=majority`

## Step 7: Set Environment Variables on Render

1. Go to [render.com](https://render.com) and log in
2. Click **New** → **Web Service**
3. Connect your GitHub repo (`Pratiksha116101/slack-chat-app`)
4. Choose branch: `main`
5. Set Environment to **Docker**
6. In the **Environment** section, add:

| Key | Value | Example |
|---|---|---|
| `MONGODB_URI` | Your connection string from Step 6 | `mongodb+srv://slackchat:mypassword123@cluster0.abc123.mongodb.net/slack-chat?retryWrites=true&w=majority` |
| `JWT_SECRET` | A strong random secret (min 32 chars) | `your-super-secret-jwt-key-min-32-chars-long` |
| `FRONTEND_URL` | Your Render app URL (optional, set after deploy) | `https://slack-chat-app.onrender.com` |
| `NODE_ENV` | Always `production` | `production` |

7. Set Health Check Path to `/health`
8. Click **Deploy**

## Step 8: Verify Connection

After deployment on Render:

1. Check the Render logs for:
   ```
   MongoDB connected
   Server listening on port 5000
   ```
2. Visit your app URL (e.g., `https://slack-chat-app.onrender.com`)
3. Try registering a new account — if it works, MongoDB is connected!

## Troubleshooting

### "Cannot connect to MongoDB"
- **Check:** Is your IP whitelisted in Network Access?
- **Check:** Is the connection string correct (no typos)?
- **Check:** Is the password URL-encoded if it contains special chars? (e.g., `@` → `%40`)

### "Connection timeout"
- **Check:** MongoDB Atlas free tier has limits. If many connections, upgrade to paid tier.
- **Check:** Render free tier may have cold starts. Give it 30 seconds on first visit.

### "Authentication failed"
- **Check:** Is the username/password correct?
- **Check:** Did you update the `JWT_SECRET` on Render? (Different from MongoDB password)

## Optional: MongoDB Compass (Local GUI)

To view your MongoDB data locally:

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Open Compass and paste your connection string (from Step 6)
3. Explore your collections (users, channels, messages)

## Summary

- **Cluster:** Free tier (512 MB)
- **Database Name:** `slack-chat`
- **Username:** `slackchat`
- **Collections auto-created:** `users`, `channels`, `messages`
- **Cost:** Free tier included with MongoDB Atlas

You're all set! 🎉

