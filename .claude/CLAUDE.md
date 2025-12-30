# Year in Sport

DIY Strava year-end review app. Build your own personalized dashboard with Claude Code.

## Tech Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | SQLite + Drizzle ORM |
| Auth | NextAuth.js (Strava OAuth) |
| Maps | Mapbox Static Images (optional) |

## Project Structure

```
apps/web/           → Next.js frontend
.claude/            → Claude Code project guide
```

## Development

```bash
npm run dev      # Start web app (localhost:3000)
npm run build    # Build all packages
```

Database:
```bash
cd apps/web
npm run db:push    # Push schema to SQLite
npm run db:studio  # Open Drizzle Studio
```

---

## Helping Users Get Started

If a user is setting up this project for the first time, guide them through these steps:

### 1. Create a Strava API Application (REQUIRED)

Each user MUST create their own Strava API app.

1. Go to https://www.strava.com/settings/api
2. Create a new application:
   - **Application Name:** "Year in Sport" (or custom)
   - **Website:** `http://localhost:3000`
   - **Authorization Callback Domain:** `localhost`
3. Note the **Client ID** and **Client Secret**

### 2. Environment Setup

1. Copy the template: `cp apps/web/.env.example apps/web/.env.local`
2. Fill in `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` from Step 1
3. Generate NextAuth secret: `openssl rand -base64 32`
4. Add the generated secret as `NEXTAUTH_SECRET`

### 3. Mapbox Setup (Optional)

For map backgrounds on highlight slides:

1. Create a free account at https://www.mapbox.com/
2. Get your public token from https://account.mapbox.com/access-tokens/
3. Add `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx` to `.env.local`

### 4. Database & Run

1. Install dependencies: `npm install`
2. Initialize database: `cd apps/web && npm run db:push`
3. Start development server: `npm run dev`
4. Visit http://localhost:3000 and authorize with Strava

---

## Troubleshooting

### "Invalid redirect_uri" from Strava
- Ensure Strava app's **Authorization Callback Domain** is `localhost`
- Ensure `NEXTAUTH_URL=http://localhost:3000` in `.env.local`

### Database errors
- Delete `apps/web/data/year-in-sport.db` and run `npm run db:push` again

### Strava API rate limits
- Strava allows ~200 requests per 15 minutes
- Wait 15 minutes if you hit rate limits
