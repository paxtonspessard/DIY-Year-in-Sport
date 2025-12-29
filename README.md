# Year in Sport

Build your own Strava year-end review. Strava put their "Year in Sport" behind a paywall, so we're building our own.

## Features

- **Strava OAuth Login** - Securely connect your Strava account
- **Activity Dashboard** - View your year's stats at a glance
- **Interactive Heatmap** - Calendar view of all your activities
- **Sport Distribution** - See how your time breaks down by activity type
- **Monthly Charts** - Track your progress throughout the year
- **Highlights Slideshow** - Relive your best moments with an animated presentation
- **Activity Filtering** - Filter by sport type (running, cycling, etc.)
- **Claude MCP Integration** - Let Claude access your Strava data directly

## Tech Stack

| Layer | Tech |
|-------|------|
| Monorepo | npm workspaces + Turborepo |
| Web | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | SQLite + Drizzle ORM |
| Auth | NextAuth.js (Strava OAuth) |
| Claude Integration | Custom MCP Server |

## Quick Start

1. **Create a Strava API Application** (required - see [SETUP.md](./SETUP.md))
2. Clone this repo: `git clone https://github.com/YOUR_USERNAME/year-in-sport.git`
3. Install dependencies: `npm install`
4. Copy environment template: `cp apps/web/.env.example apps/web/.env.local`
5. Add your Strava credentials to `.env.local`
6. Initialize database: `npm run db:push`
7. Run: `npm run dev`
8. Visit http://localhost:3000

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Using with Claude Code

This project includes an MCP server that lets Claude access your Strava data directly. After initial setup, you can:

1. Ask Claude to analyze your activities
2. Have Claude help you customize the dashboard
3. Build new features with Claude's assistance

See [SETUP.md](./SETUP.md#optional-mcp-server-for-claude-code) for MCP setup instructions.

## Project Structure

```
year-in-sport/
├── apps/web/           # Next.js frontend
│   ├── src/
│   │   ├── app/       # Pages and API routes
│   │   ├── components/ # UI components
│   │   ├── db/        # Database schema
│   │   └── lib/       # Utilities
├── packages/mcp-server/ # Strava MCP server for Claude
└── .claude/            # Claude Code project guide
```

## Security Note

This application is designed for **local use only**. Your Strava OAuth tokens are stored in a local SQLite database and `.env` files on your machine.

**Do not deploy this to a public server** without adding proper security measures (authentication, HTTPS, encrypted storage, etc.).

For local use, the risk is minimal - Strava tokens only grant read access to your activity data, and if someone has access to your local files, you have bigger problems.

See [SETUP.md](./SETUP.md#security-considerations) for more details.

## License

MIT
