#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Legacy League Discord Bot..."

# Check if Discord token is configured
if bashio::config.is_empty 'discord_token'; then
    bashio::log.error "DISCORD_TOKEN is not set. Please configure it in the add-on options."
    exit 1
fi

# Set environment variables
export DISCORD_TOKEN=$(bashio::config 'discord_token')
export NODE_ENV=production
LOG_LEVEL=$(bashio::config 'log_level')
export LOG_LEVEL=${LOG_LEVEL:-info}

# Create data directory and ensure data persistence
mkdir -p /data

# Initialize bot_settings.json if it doesn't exist
if [ ! -f /data/bot_settings.json ]; then
    bashio::log.info "Creating default bot_settings.json"
    cp /app/bot_settings.json /data/bot_settings.json 2>/dev/null || echo '{}' > /data/bot_settings.json
fi

# Initialize teams.json if it doesn't exist
if [ ! -f /data/teams.json ]; then
    bashio::log.info "Creating default teams.json"
    cp /app/teams.json /data/teams.json 2>/dev/null || echo '{}' > /data/teams.json
fi

# Create symlinks for data persistence
ln -sf /data/bot_settings.json /app/bot_settings.json
ln -sf /data/teams.json /app/teams.json

bashio::log.info "Starting Discord bot..."
exec node /app/index.js 