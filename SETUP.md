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
cd apps/web
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

## Optional: Mapbox for Route Maps

For beautiful map backgrounds on highlight slides, add a free Mapbox token.

1. Create a free account at [https://www.mapbox.com/](https://www.mapbox.com/)

2. Go to your [Access Tokens page](https://account.mapbox.com/access-tokens/)

3. Copy your **Default public token** (starts with `pk.`)

4. Add to your `apps/web/.env.local`:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
   ```

Without Mapbox, highlight slides will show a gradient background instead of route maps.

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

### Strava API rate limits
- Strava allows ~200 requests per 15 minutes
- If you hit rate limits, wait 15 minutes before retrying

---

## Security Considerations

This application is designed for **local development use only**.

### Where your credentials are stored

| Data | Location | Format |
|------|----------|--------|
| Strava Client ID/Secret | `apps/web/.env.local` | Plain text |
| NextAuth Secret | `apps/web/.env.local` | Plain text |
| OAuth Access/Refresh Tokens | `apps/web/data/year-in-sport.db` | SQLite (unencrypted) |

### Why this is OK for local use

- If someone has access to your local files, you have bigger security problems
- Strava tokens only grant **read access** to your activity data
- Tokens cannot delete data, post on your behalf, or access payment info
- Access tokens expire and auto-refresh, limiting exposure window

### Do NOT deploy publicly

If you want to host this on a server for others to use, you would need to add:

- User authentication (so users can't see each other's data)
- HTTPS (to encrypt data in transit)
- Encrypted database or secure token storage
- Proper session management
- Rate limiting and abuse protection

This is beyond the scope of this template, which is intended for personal local use.

### Best practices

- Never commit `.env.local` or `.env` files to git (already in `.gitignore`)
- Don't share your `apps/web/data/` folder
- If you think your tokens are compromised, disconnect the app from Strava at https://www.strava.com/settings/apps
