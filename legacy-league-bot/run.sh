#!/bin/sh

echo "🚀 RUN.SH SCRIPT EXECUTED - Legacy League Discord Bot"
echo "Starting Legacy League Discord Bot..."

# Check if we're in Home Assistant environment
if [ -n "$HASSIO_TOKEN" ]; then
    echo "🏠 Running in Home Assistant environment"
    
    # Try to read Discord token from various sources
    DISCORD_TOKEN=""
    
    # Method 1: Try environment variable (if set by Home Assistant)
    if [ -n "$DISCORD_TOKEN" ] && [ "$DISCORD_TOKEN" != "{{ discord_token }}" ]; then
        echo "✅ DISCORD_TOKEN found in environment"
    else
        echo "DISCORD_TOKEN not in environment, trying other methods..."
        
        # Method 2: Try to read from config file if it exists (with error handling)
        if [ -f /data/options.json ]; then
            echo "Found options.json, extracting discord_token..."
            if [ -r /data/options.json ]; then
                DISCORD_TOKEN=$(grep -o '"discord_token":"[^"]*"' /data/options.json | cut -d'"' -f4)
                if [ -n "$DISCORD_TOKEN" ]; then
                    echo "✅ DISCORD_TOKEN extracted from options.json"
                fi
            else
                echo "Cannot read options.json due to permissions"
            fi
        fi
        
        # Method 3: Try to read from environment file
        if [ -z "$DISCORD_TOKEN" ] && [ -f /data/.env ]; then
            echo "Found .env file, extracting DISCORD_TOKEN..."
            if [ -r /data/.env ]; then
                DISCORD_TOKEN=$(grep "^DISCORD_TOKEN=" /data/.env | cut -d'=' -f2-)
                if [ -n "$DISCORD_TOKEN" ]; then
                    echo "✅ DISCORD_TOKEN extracted from .env file"
                fi
            else
                echo "Cannot read .env file due to permissions"
            fi
        fi
        
        # Method 4: Try to read from config directory
        if [ -z "$DISCORD_TOKEN" ] && [ -f /config/options.json ]; then
            echo "Found options.json in /config, extracting discord_token..."
            if [ -r /config/options.json ]; then
                DISCORD_TOKEN=$(grep -o '"discord_token":"[^"]*"' /config/options.json | cut -d'"' -f4)
                if [ -n "$DISCORD_TOKEN" ]; then
                    echo "✅ DISCORD_TOKEN extracted from /config/options.json"
                fi
            else
                echo "Cannot read /config/options.json due to permissions"
            fi
        fi
    fi
    
    # Validate token
    if [ -n "$DISCORD_TOKEN" ] && [ "$DISCORD_TOKEN" != "your_token_here" ] && [ "$DISCORD_TOKEN" != "{{ discord_token }}" ]; then
        echo "DISCORD_TOKEN length: ${#DISCORD_TOKEN}"
        echo "DISCORD_TOKEN first 10 chars: ${DISCORD_TOKEN:0:10}..."
        export DISCORD_TOKEN
    else
        echo "❌ DISCORD_TOKEN not found or invalid"
        echo "Please configure your Discord token in the Home Assistant add-on options"
        echo "Current DISCORD_TOKEN value: '$DISCORD_TOKEN'"
        echo "Available environment variables: $(env | grep -E '(DISCORD|TOKEN)' || echo 'None found')"
        echo "All environment variables: $(env | cut -d'=' -f1 | tr '\n' ' ')"
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

# Initialize bot_settings.json if it doesn't exist (run as root to avoid permission issues)
if [ ! -f /data/bot_settings.json ]; then
    echo "Creating default bot_settings.json"
    cp /app/bot_settings.json /data/bot_settings.json 2>/dev/null || echo '{}' > /data/bot_settings.json
    chown nodejs:nodejs /data/bot_settings.json 2>/dev/null || echo "Could not change ownership"
fi

# Initialize teams.json if it doesn't exist (run as root to avoid permission issues)
if [ ! -f /data/teams.json ]; then
    echo "Creating default teams.json"
    cp /app/teams.json /data/teams.json 2>/dev/null || echo '{}' > /data/teams.json
    chown nodejs:nodejs /data/teams.json 2>/dev/null || echo "Could not change ownership"
fi

# Create symlinks for data persistence
ln -sf /data/bot_settings.json /app/bot_settings.json
ln -sf /data/teams.json /app/teams.json

echo "Starting Discord bot..."
exec node /app/index.js 