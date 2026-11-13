# StudyFlow — Student Task Planner

StudyFlow is a student task planner built with vanilla HTML/CSS/JavaScript, Node.js, Express, MongoDB, and Mongoose.

## What is implemented

- Responsive dashboard, tasks, calendar/deadlines, progress, notifications, and profile pages.
- Registration and sign-in using bcryptjs-hashed passwords and JWT authentication.
- Authenticated task create, list, search, filter, sort, read, edit, status update, and delete, with Low/Medium/High priority tags.
- User-specific dashboard statistics, upcoming deadlines, and progress calculations.
- Request validation, protected API routes, CORS allowlisting, and rate-limited login/registration.

The frontend stores the JWT in `sessionStorage` for the current browser session. The backend and Atlas configuration are required; the app does not use sample task data as an API fallback.

## Run locally

Prerequisites: Node.js 20 or newer, a configured MongoDB Atlas cluster, and a private `backend/.env` file. Do not share that file or its values.

1. In VS Code, open a terminal and install backend dependencies:

   ```powershell
   cd "E:\wtmp product\backend"
   npm install
   ```

2. Start the API (keep this terminal open):

   ```powershell
   npm start
   ```

   The API connects to the configured MongoDB database and listens on `http://localhost:3000`. If it fails to connect with an IP-not-allowed message, open Atlas **Security → Network Access → Add IP Address → Add Current IP Address**, save the entry, wait for it to become active, then retry. If authentication fails, check the database user's username/password in the URI. The server reports connection failures; it does not pretend the database is connected.

3. Serve the frontend in a second terminal. Install the VS Code **Live Server** extension (publisher: Ritwick Dey) if needed. From the project root, run:

   ```powershell
   cd "E:\wtmp product"
   ```

   In VS Code Explorer, right-click `frontend/login.html` and choose **Open with Live Server**. Register an account or sign in. The default frontend API address is `http://localhost:3000/api`, configured near the top of `frontend/js/app.js`.

4. If Live Server uses an origin other than `http://127.0.0.1:5500` or `http://localhost:5500`, add that exact origin to `CORS_ORIGIN` in `backend/.env`, then restart the backend.

## API routes

- `POST /api/auth/register` — create an account and return a JWT.
- `POST /api/auth/login` — verify credentials and return a JWT.
- `GET /api/auth/me` — return the authenticated account.
- `GET /api/tasks` — list tasks; supports `status`, `priority` (Low/Medium/High), `search`, `sort`, `order`, `page`, and `limit`.
- `POST /api/tasks` — create a task.
- `GET /api/tasks/:id` — retrieve one owned task.
- `PUT /api/tasks/:id` — update task fields.
- `PUT /api/tasks/:id/status` — update status.
- `DELETE /api/tasks/:id` — delete an owned task.
- `GET /api/dashboard/stats` — task counts, progress, recent tasks, and upcoming deadlines.
- `GET /api/health` — API process health (does not by itself verify MongoDB).

Protected routes require an `Authorization: Bearer <token>` header. Task dates are sent as `YYYY-MM-DD` strings and stored as UTC calendar dates. Priority is optional when creating or updating a task and defaults to Medium. Task queries always include the authenticated user's ID.

## Tests

From `backend/`, run:

```powershell
npm test
npm audit
```

The automated tests cover date/stat calculations, health, CORS, validation, protected routes, and rate limiting. Database-backed integration checks should use temporary test accounts and clean them up afterward.

## Deployment overview

Deployment is not configured from this workspace. Before putting the app online, select a hosting provider that supports a Node.js/Express service and a static-site host (or a provider that supports both). Configure the backend environment variables (`MONGODB_URI`, a new production-only `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`, and the frontend's exact HTTPS origin in `CORS_ORIGIN`) in the provider's secret/environment settings, not in source control. Set the static frontend's API base URL to the deployed HTTPS API origin plus `/api`, and update Atlas **Network Access** to permit the backend host's outbound IP addresses. Do not use a broad `0.0.0.0/0` rule as a shortcut. Then verify registration, login, owner isolation, CRUD, and dashboard stats against the deployed services.

## Environment and secrets

`backend/.env.example` documents the variables needed by the API. Configure Atlas and create `backend/.env` locally before starting the server. `.env` is ignored by Git. Never commit or share the MongoDB URI or JWT secret.
"# study_flow" 
