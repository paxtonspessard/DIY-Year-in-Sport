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
| Strava API | [strava-mcp](https://github.com/r-huijts/strava-mcp) (external) |

## Project Structure

```
apps/web/           → Next.js frontend
.claude/            → Claude Code project guide
```

## Strava MCP Server

For direct Strava access, install [strava-mcp](https://github.com/r-huijts/strava-mcp). It provides 17 tools including:

- `get-athlete-profile` - User profile
- `get-recent-activities` - Recent activities
- `get-activity-details` - Detailed activity data with streams
- `get-athlete-stats` - Aggregated statistics
- `explore-segments` - Find segments by location
- `list-athlete-routes` - Saved routes
- `export-route-gpx` - Export routes to GPX

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

Each user MUST create their own Strava API app - Strava limits one athlete per application.

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

### 3. Database & Run

1. Install dependencies: `npm install`
2. Initialize database: `npm run db:push`
3. Start development server: `npm run dev`
4. Visit http://localhost:3000 and authorize with Strava

### 4. MCP Server Setup (Optional)

For Claude to access Strava data directly, install [strava-mcp](https://github.com/r-huijts/strava-mcp):

1. Clone: `git clone https://github.com/r-huijts/strava-mcp.git`
2. Install: `cd strava-mcp && npm install`
3. Auth setup: `npm run setup-auth` (opens browser for OAuth)
4. Build: `npm run build`
5. Add to Claude: `claude mcp add strava /path/to/strava-mcp/build/index.js`

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
