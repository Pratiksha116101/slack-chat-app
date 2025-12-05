# Slack-like Chat App

**Short description:** A full-stack Slack-like chat application with channels, real-time messaging using Socket.IO, JWT auth, and MongoDB persistence.

**Repo root:** `d:\FullStackDevlopmentAssignment`

**Setup & Run (local - Windows PowerShell)**

1. Prerequisites
   - Node.js (v16+ recommended)
   - npm (bundled with Node)
   - A running MongoDB instance (local or Atlas)

2. Backend

- Create `.env` in `backend` (copy `backend/.env.example` if present) and set:
  - `MONGODB_URI` - MongoDB connection string (include DB name)
  - `JWT_SECRET` - secret for JWT
  - `PORT` (optional, default 5000)
  - `FRONTEND_URL` (optional, e.g. `http://localhost:3000`)

- Install and start backend:

```powershell
cd d:\FullStackDevlopmentAssignment\backend
npm install
npm start
```

Backend will listen on port `5000` by default. Health endpoint: `http://localhost:5000/health`.

3. Frontend

- Install and run frontend (Vite dev server):

```powershell
cd d:\FullStackDevlopmentAssignment\frontend
npm install
npm run dev
```

- Open app at: `http://localhost:3000`

Notes:
- The frontend uses a Vite proxy (`/api` and `/socket.io`) to forward requests to the backend. If you change backend host/port, update `frontend/vite.config.js`.
- If you see proxy `ECONNREFUSED`, confirm the backend is running and accessible on `127.0.0.1:5000` (or the host set in `vite.config.js`).

4. Clear browser state (if troubleshooting)
- Open DevTools → Application → Local Storage → remove keys `authToken` and `user` then refresh.


**Tech Stack**
- Backend: Node.js, Express, Socket.IO, Mongoose (MongoDB), JSON Web Tokens (JWT)
- Frontend: React (Vite), Tailwind CSS, react-router, axios, socket.io-client
- Dev tooling: Vite, npm


**Assumptions & Limitations**
- This project is a dev/demo setup (not production-ready out of the box).
- Single backend process: presence & typing state are stored in-memory (Map). For horizontal scaling you should use a central store (Redis) and a Socket.IO adapter.
- Security: Basic JWT auth used — consider refresh tokens, HTTPS, rate-limiting, and input validation for production.
- File uploads, advanced search, and extensive audit logging are not implemented.


**Optional Features Implemented**
- Typing indicators: per-channel typing shown to other users with server-side TTL to clear stale typing.
- Message editing & deletion: messages can be edited or deleted; backend verifies author and broadcasts edits/deletes to the channel.
- Pagination: messages are paginated with limit/skip and a "Load More" flow in the UI.
- Online presence per-channel: server tracks sockets and emits channel online user lists.


**Key files changed / locations**
- Backend:
  - `backend/routes/auth.js` — returns both `_id` and `id` in user payload for compatibility
  - `backend/routes/messages.js` — pagination + broadcasts on edit/delete
  - `backend/server.js` — Socket.IO handlers (typing TTL, online user tracking), `app.set('io', io)`
- Frontend:
  - `frontend/src/App.jsx` — token verification and localStorage validation
  - `frontend/src/main.jsx` — global error overlay (uncaught errors shown in browser)
  - `frontend/src/components/ChatView.jsx` — safe channel lookup, message rendering, socket client through proxy
  - `frontend/src/components/ChannelList.jsx` — safer localStorage parsing + defensive rendering
  - `frontend/src/components/Message.jsx` — null-safe access to message properties
  - `frontend/src/services/api.js` — uses `/api` (Vite proxy)
  - `frontend/vite.config.js` — proxy targets (defaults to `127.0.0.1:5000`)


**How I fixed the `Cannot read properties of null (reading '_id')` error**
- Added defensive checks before accessing `_id` or nested properties (e.g., `msg?.sender?._id` or check `if (msg && msg.sender)`).
- Normalized auth response to include both `_id` and `id` so frontend components can use either form safely.
- Cleaned malformed `localStorage.user` on app start to avoid downstream null references.
- Added a visible error overlay to show uncaught exceptions and stack traces in the browser.


**Quick test flow**
1. Start backend and frontend as above.
2. In browser clear Local Storage (Application tab) keys: `authToken`, `user`.
3. Register a new account via UI (username/email/password).
4. Login with the same credentials.
5. Create or join a channel and send messages. Test editing and deleting a message.
6. Open a second browser/window, log in as a different user, and verify typing indicators and presence updates.


**Troubleshooting tips**
- If Vite shows `http proxy error` / `ECONNREFUSED`: Ensure the backend is running and listening on the address in `vite.config.js` (default changed to `127.0.0.1:5000`). Check firewall rules.
- If login/register fails with `Login failed` UI: check backend logs and Vite proxy logs. Use Postman or PowerShell `Invoke-RestMethod` to call `http://127.0.0.1:5000/api/auth/login`.
- If the app shows a white screen: open DevTools Console; the global error overlay will also show the uncaught error.


**Deployment notes**
- For deployment use a host that supports long-lived processes for the backend (Railway, Render, Heroku classic). For frontend you can use Vercel (but backend must be separate) or host both on the same host.
- For production, set environment variables in your host: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`.


## Deploying to Render (single-host, Docker)

- Overview: Render can build your repository using the `Dockerfile` in the repo root. The provided multi-stage `Dockerfile` builds the frontend (`frontend/dist`) and copies it into the backend so a single web service can serve both the API and static assets. Render web services support WebSockets, so Socket.IO will work over the same service.

- Quick steps:
  1. Push your repository to GitHub/GitLab.
  2. In the Render dashboard click **New** → **Web Service**.
  3. Connect the repo and choose the branch (e.g., `main`).
  4. For "Environment", choose **Docker**. Point Render to the repo root and leave the `Dockerfile` path as-is (it will use the `Dockerfile` in the repo root).
  5. Set environment variables in the Render service settings (Environment section):
     - `MONGODB_URI` — your MongoDB connection string (MongoDB Atlas recommended).
     - `JWT_SECRET` — a strong secret for signing JWTs.
     - `FRONTEND_URL` — optional (e.g., `https://your-app.onrender.com`) used to set allowed origins for CORS in development; not required in production but useful for clarity.
  6. Set the Health Check path to `/health` (the backend already exposes `GET /health`).
  7. Deploy. Render will build the image using the repo `Dockerfile` and run your service.

- Notes & tips:
  - Render provides an environment variable `PORT` to your container; the app uses `process.env.PORT || 5000` so it will honor Render's port automatically.
  - WebSockets: Render web services support WebSockets. Because the frontend and backend live on the same host/port (single service), Socket.IO connects via the same origin and the Vite proxy is not used in production.
  - MongoDB: Render does not currently provide a managed MongoDB; use MongoDB Atlas (recommended) or a self-hosted MongoDB and set `MONGODB_URI` accordingly.
  - Secrets: Do NOT commit secrets into the repo. Use Render Dashboard environment variables or a secrets manager.
  - Scaling: The app stores presence/typing state in memory — if you scale to multiple instances, add a Socket.IO adapter (Redis) and a central session/presence store.

- Local Docker test commands (Windows PowerShell):

```powershell
# Build the Docker image (from repo root)
docker build -t slack-chat-app:local .

# Run MongoDB locally (optional) - or use Atlas and set MONGODB_URI
# Quick docker run for a local Mongo container (development only):
docker run -d --name chat-mongo -p 27017:27017 mongo:6

# Run the app with environment vars (replace values with your own)
docker run -it --rm -p 5000:5000 `
  -e MONGODB_URI="mongodb://host.docker.internal:27017/slack-chat" `
  -e JWT_SECRET="devsecret" `
  slack-chat-app:local

# After the container starts, visit: http://localhost:5000 (API) and http://localhost:5000 (frontend served by backend in production build)
# Note: in the local container the frontend is served from / (built assets exist at backend/frontend/dist)
```

- Render CLI (optional):
  - You can use the `render` CLI to create and manage services, but the dashboard UI is usually simpler for initial setup.


## Summary of Render artifacts added
- `render.yaml` — example Render service manifest pointing to the repo `Dockerfile` and declaring required env var placeholders.

If you'd like, I can:
- Create a Render dashboard-ready `render.yaml` with concrete values for your Render service name and branch.
- Help you set up a MongoDB Atlas cluster and generate a secure `MONGODB_URI`.
- Push a working `main` branch and walk through the Render dashboard steps interactively.


 
