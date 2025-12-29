# Year in Sport

DIY Strava year-end review app. Build your own personalized dashboard with Claude Code.

## Tech Stack

| Layer | Tech |
|-------|------|
| Monorepo | npm workspaces + Turborepo |
| Web | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | SQLite + Drizzle ORM |
| Auth | NextAuth.js (Strava OAuth) |
| Strava API | Custom MCP server |

## Project Structure

```
apps/web/           → Next.js frontend
packages/mcp-server/ → Strava MCP server for Claude
.claude/            → Claude Code project guide
```

## Strava MCP Server

Claude has access to Strava via MCP tools:
- `get_athlete` - Get authenticated user profile
- `get_activities` - List activities (paginated)
- `get_year_activities` - Get all activities for a year
- `get_activity_stats` - Aggregated stats

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

After first login, set up MCP server for direct Strava access:

1. Get tokens from database: `cd apps/web && npm run db:studio`
   - Look in the `users` table for `accessToken`, `refreshToken`, `tokenExpiresAt`
2. Create MCP config: `cp packages/mcp-server/.env.example packages/mcp-server/.env`
3. Fill in the tokens from the database
4. Build the server: `cd packages/mcp-server && npm run build`
5. Add to Claude: `claude mcp add strava-mcp ./packages/mcp-server/start.sh`

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
