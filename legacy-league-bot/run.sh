#!/bin/sh

echo "🚀 RUN.SH SCRIPT EXECUTED - Legacy League Discord Bot"
echo "Starting Legacy League Discord Bot..."

# Check if we're in Home Assistant environment
if [ -n "$HASSIO_TOKEN" ]; then
    echo "🏠 Running in Home Assistant environment"
    
    # Check if Discord token is configured via environment
    if [ -n "$DISCORD_TOKEN" ]; then
        echo "✅ DISCORD_TOKEN found in environment"
        echo "DISCORD_TOKEN length: ${#DISCORD_TOKEN}"
        echo "DISCORD_TOKEN first 10 chars: ${DISCORD_TOKEN:0:10}..."
    else
        echo "❌ DISCORD_TOKEN not found in environment"
        echo "Available environment variables: $DISCORD_TOKEN"
        exit 1
    fi
else
    echo "Not running in Home Assistant environment"
fi

# Set environment variables
export NODE_ENV=production
export LOG_LEVEL=${LOG_LEVEL:-info}

echo "NODE_ENV: $NODE_ENV"
echo "LOG_LEVEL: $LOG_LEVEL"

# Create data directory and ensure data persistence
mkdir -p /data

# Initialize bot_settings.json if it doesn't exist
if [ ! -f /data/bot_settings.json ]; then
    echo "Creating default bot_settings.json"
    cp /app/bot_settings.json /data/bot_settings.json 2>/dev/null || echo '{}' > /data/bot_settings.json
fi

# Initialize teams.json if it doesn't exist
if [ ! -f /data/teams.json ]; then
    echo "Creating default teams.json"
    cp /app/teams.json /data/teams.json 2>/dev/null || echo '{}' > /data/teams.json
fi

# Create symlinks for data persistence
ln -sf /data/bot_settings.json /app/bot_settings.json
ln -sf /data/teams.json /app/teams.json

echo "Starting Discord bot..."
exec node /app/index.js 