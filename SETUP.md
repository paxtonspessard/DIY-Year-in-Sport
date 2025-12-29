# Setup Guide

This guide walks you through setting up Year in Sport from scratch.

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **A Strava account** - [Sign up](https://www.strava.com/)

---

## Step 1: Create Your Strava API Application

> **Important:** Each user MUST create their own Strava API application. Strava limits one athlete per application, so you cannot share credentials with others.

1. Log into Strava and go to [https://www.strava.com/settings/api](https://www.strava.com/settings/api)

2. Click **"Create an App"** (or you'll see your existing app if you have one)

3. Fill in the application form:
   - **Application Name:** `Year in Sport` (or anything you like)
   - **Category:** Choose any category
   - **Club:** Leave blank
   - **Website:** `http://localhost:3000`
   - **Authorization Callback Domain:** `localhost`

4. Click **Create** and note your:
   - **Client ID** (a number like `12345`)
   - **Client Secret** (a long string)

---

## Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/year-in-sport.git
cd year-in-sport

# Install dependencies
npm install
```

---

## Step 3: Configure Environment

1. Copy the environment template:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Edit `apps/web/.env.local` with your values:
   ```bash
   # From your Strava API application (Step 1)
   STRAVA_CLIENT_ID=your_client_id_here
   STRAVA_CLIENT_SECRET=your_client_secret_here

   # Generate a random secret for NextAuth
   # Run: openssl rand -base64 32
   NEXTAUTH_SECRET=your_generated_secret_here

   # Leave these as-is for local development
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL=./data/year-in-sport.db
   ```

3. Generate the NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as your `NEXTAUTH_SECRET` value.

---

## Step 4: Initialize Database

Create the SQLite database with the required schema:

```bash
npm run db:push
```

This creates `apps/web/data/year-in-sport.db`.

---

## Step 5: Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

1. Click **"Connect with Strava"**
2. Authorize the application to access your Strava data
3. You'll be redirected to your dashboard with your activities!

---

## Optional: MCP Server for Claude Code

The MCP server lets Claude access your Strava data directly, enabling Claude to help you analyze activities and build features.

### Setup MCP Server

1. After logging in via the web app, your OAuth tokens are stored in the database. Extract them:
   ```bash
   cd apps/web
   npm run db:studio
   ```
   Look in the `users` table for `accessToken`, `refreshToken`, and `tokenExpiresAt`.

2. Create the MCP server environment file:
   ```bash
   cp packages/mcp-server/.env.example packages/mcp-server/.env
   ```

3. Edit `packages/mcp-server/.env`:
   ```bash
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   STRAVA_ACCESS_TOKEN=token_from_database
   STRAVA_REFRESH_TOKEN=refresh_token_from_database
   STRAVA_EXPIRES_AT=expiry_timestamp_from_database
   ```

4. Build the MCP server:
   ```bash
   cd packages/mcp-server
   npm run build
   ```

5. Add to Claude Code:
   ```bash
   claude mcp add strava-mcp /path/to/year-in-sport/packages/mcp-server/start.sh
   ```

### Available MCP Tools

Once configured, Claude has access to:

- `get_athlete` - Get your Strava profile
- `get_activities` - List activities (paginated)
- `get_year_activities` - Get all activities for a specific year
- `get_activity_stats` - Get aggregated statistics

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Database commands (run from apps/web)
npm run db:push    # Push schema to database
npm run db:studio  # Open Drizzle Studio (database GUI)
```

---

## Troubleshooting

### "Invalid redirect_uri" error from Strava
- Make sure your Strava app's **Authorization Callback Domain** is set to `localhost`
- Ensure `NEXTAUTH_URL` in `.env.local` is `http://localhost:3000`

### Database errors
- Delete `apps/web/data/year-in-sport.db` and run `npm run db:push` again

### OAuth token expired
- Log out and log back in via the web app to refresh tokens
- Or manually update tokens in `packages/mcp-server/.env`

### Strava API rate limits
- Strava allows ~200 requests per 15 minutes
- If you hit rate limits, wait 15 minutes before retrying
