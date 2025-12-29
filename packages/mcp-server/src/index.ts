#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StravaClient } from './strava/client.js';

// Initialize Strava client from environment variables
function getStravaClient(): StravaClient {
  const accessToken = process.env.STRAVA_ACCESS_TOKEN;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const expiresAt = process.env.STRAVA_EXPIRES_AT
    ? parseInt(process.env.STRAVA_EXPIRES_AT)
    : undefined;

  if (!accessToken || !refreshToken || !clientId || !clientSecret) {
    throw new Error(
      'Missing required environment variables: STRAVA_ACCESS_TOKEN, STRAVA_REFRESH_TOKEN, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET'
    );
  }

  return new StravaClient({
    accessToken,
    refreshToken,
    clientId,
    clientSecret,
    expiresAt,
  });
}

const server = new Server(
  {
    name: 'strava-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_athlete',
        description: 'Get the authenticated athlete profile from Strava',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_activities',
        description: 'Get a list of activities from Strava',
        inputSchema: {
          type: 'object',
          properties: {
            before: {
              type: 'number',
              description: 'Unix timestamp - only return activities before this time',
            },
            after: {
              type: 'number',
              description: 'Unix timestamp - only return activities after this time',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
            per_page: {
              type: 'number',
              description: 'Number of activities per page (default: 30, max: 100)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_activity_stats',
        description: 'Get aggregated statistics for the authenticated athlete',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_year_activities',
        description: 'Get all activities for a specific year',
        inputSchema: {
          type: 'object',
          properties: {
            year: {
              type: 'number',
              description: 'The year to get activities for (default: current year)',
            },
          },
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = getStravaClient();

  switch (request.params.name) {
    case 'get_athlete': {
      const athlete = await client.getAthlete();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(athlete, null, 2),
          },
        ],
      };
    }

    case 'get_activities': {
      const args = request.params.arguments as {
        before?: number;
        after?: number;
        page?: number;
        per_page?: number;
      };
      const activities = await client.getActivities(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(activities, null, 2),
          },
        ],
      };
    }

    case 'get_activity_stats': {
      const athlete = await client.getAthlete();
      const stats = await client.getActivityStats(athlete.id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }

    case 'get_year_activities': {
      const args = request.params.arguments as { year?: number };
      const year = args.year || new Date().getFullYear();
      const activities = await client.getAllActivitiesForYear(year);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                year,
                total_activities: activities.length,
                activities,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'strava://athlete/profile',
        name: 'Athlete Profile',
        description: 'The authenticated athlete profile',
        mimeType: 'application/json',
      },
      {
        uri: 'strava://athlete/stats',
        name: 'Athlete Stats',
        description: 'Aggregated statistics for the athlete',
        mimeType: 'application/json',
      },
    ],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const client = getStravaClient();

  switch (request.params.uri) {
    case 'strava://athlete/profile': {
      const athlete = await client.getAthlete();
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: 'application/json',
            text: JSON.stringify(athlete, null, 2),
          },
        ],
      };
    }

    case 'strava://athlete/stats': {
      const athlete = await client.getAthlete();
      const stats = await client.getActivityStats(athlete.id);
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: 'application/json',
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${request.params.uri}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Strava MCP Server running on stdio');
}

main().catch(console.error);
