# Legacy League Discord Bot - Home Assistant Add-on

A Discord bot for Legacy League with player value calculation, event management, and team coordination features.

## Features

- **Player Value Calculator**: Calculate player values based on stats
- **Event Management**: Create and manage Discord scheduled events with RSVP
- **Team Management**: Manage teams, leaders, and player signings
- **Slash Commands**: Easy-to-use Discord slash commands
- **Data Persistence**: Settings and team data persist across restarts

## Installation

1. Add this repository to your Home Assistant add-on store:
   ```
   https://github.com/dn1ghtm/LegacyBot-HASS
   ```

2. Install the "Legacy League Discord Bot" add-on

3. Configure your Discord bot token in the add-on options

4. Start the add-on

## Configuration

### Required Settings

- **discord_token**: Your Discord bot token from the Discord Developer Portal

### Optional Settings

- **log_level**: Logging level (debug, info, warning, error, critical)

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token and add it to the add-on configuration
5. Enable these permissions:
   - Send Messages
   - Use Slash Commands
   - Manage Events
   - Manage Roles
   - Read Message History
6. Generate an invite URL with the `applications.commands` scope
7. Invite the bot to your server

## Bot Commands

### Player Value Commands
- `/value <player_name>` - Calculate player value
- `/compare <player1> <player2>` - Compare two players

### Event Commands
- `/event create <title> <date> <time>` - Create a scheduled event
- `/event list` - List upcoming events
- `/event rsvp <event_id> <response>` - RSVP to an event

### Team Commands
- `/team create <team_name> <leader_id>` - Create a new team
- `/team join <team_name> <player_id>` - Add player to team
- `/team leave <team_name> <player_id>` - Remove player from team
- `/team list` - List all teams

### Settings Commands
- `/settings coaches_channel <channel_id>` - Set coaches channel
- `/settings timezone <timezone>` - Set default timezone

## Data Storage

The add-on stores data in the `/data` directory:
- `bot_settings.json` - Bot configuration and guild settings
- `teams.json` - Team data and member information

This data persists across add-on updates and restarts.

## Troubleshooting

### Bot not responding
- Check that the Discord token is correct
- Verify the bot has the required permissions
- Check the add-on logs for errors

### Commands not working
- Ensure the bot has the "Use Slash Commands" permission
- Check that slash commands are registered in your Discord server

### Data not persisting
- Verify the add-on has write access to the `/data` directory
- Check the add-on logs for file permission errors

## Support

For issues and questions:
- Check the add-on logs in Home Assistant
- Review the Discord bot permissions
- Ensure all required environment variables are set

## License

This add-on is provided as-is for personal use.