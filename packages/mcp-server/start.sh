#!/bin/bash
# Wrapper script to start Strava MCP server
# Reads credentials from .env file in this directory

cd "$(dirname "$0")"

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

exec node dist/index.js
