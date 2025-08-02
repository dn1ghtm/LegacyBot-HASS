# Legacy League Discord Bot - Setup Guide

This guide will walk you through setting up the Legacy League Discord Bot as a Home Assistant add-on.

## Prerequisites

- Home Assistant instance with add-on support
- Discord account
- Discord server where you have administrator permissions

## Step 1: Discord Bot Setup

### 1.1 Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter a name for your bot (e.g., "Legacy League Bot")
4. Click "Create"

### 1.2 Create Bot

1. In your application, go to the "Bot" section
2. Click "Add Bot"
3. Click "Yes, do it!"
4. Copy the bot token (you'll need this later)

### 1.3 Configure Bot Permissions

1. In the Bot section, scroll down to "Privileged Gateway Intents"
2. Enable:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent

3. Scroll down to "Bot Permissions" and enable:
   - Send Messages
   - Use Slash Commands
   - Manage Events
   - Manage Roles
   - Read Message History
   - Embed Links
   - Attach Files

### 1.4 Generate Invite URL

1. Go to the "OAuth2" → "URL Generator" section
2. In "Scopes", select:
   - `bot`
   - `applications.commands`
3. In "Bot Permissions", select the permissions listed above
4. Copy the generated URL
5. Open the URL in your browser and invite the bot to your server

## Step 2: Home Assistant Add-on Installation

### 2.1 Add Repository

1. In Home Assistant, go to **Settings** → **Add-ons**
2. Click the three dots in the top right → **Add-on Store**
3. Click **Repositories**
4. Add this repository URL:
   ```
   https://github.com/dn1ghtm/LegacyBot-HASS
   ```
5. Click **Add**

### 2.2 Install Add-on

1. Go back to the **Add-on Store**
2. Find "Legacy League Discord Bot"
3. Click **Install**
4. Wait for the installation to complete

### 2.3 Configure Add-on

1. Click on the installed add-on
2. Go to the **Configuration** tab
3. Enter your Discord bot token in the `discord_token` field
4. Set your preferred log level (default: info)
5. Click **Save**

### 2.4 Start Add-on

1. Go to the **Info** tab
2. Click **Start**
3. Check the logs to ensure the bot is running properly

## Step 3: Verify Installation

### 3.1 Check Bot Status

1. In your Discord server, you should see the bot online
2. Try using a slash command like `/help` or `/value`
3. Check the add-on logs in Home Assistant for any errors

### 3.2 Test Basic Commands

Try these commands in your Discord server:
- `/help` - Should show available commands
- `/value` - Should open the player value calculator
- `/settings` - Should show current settings

## Step 4: Configure Bot Settings

### 4.1 Set Up Channels

Use these commands to configure your bot:

- `/settings coaches_channel <channel_id>` - Set the coaches channel
- `/settings timezone <timezone>` - Set your server's timezone

### 4.2 Create Teams

- `/team create <team_name> <leader_id>` - Create a new team
- `/team join <team_name> <player_id>` - Add players to teams

## Troubleshooting

### Bot Not Responding

1. Check the add-on logs in Home Assistant
2. Verify the Discord token is correct
3. Ensure the bot has the required permissions
4. Check that the bot is online in your Discord server

### Commands Not Working

1. Make sure slash commands are registered:
   - The bot needs the "Use Slash Commands" permission
   - Commands may take a few minutes to appear after bot startup
2. Check that the bot has access to the channel where you're using commands

### Add-on Won't Start

1. Check the configuration:
   - Discord token is required
   - Token should not have extra spaces
2. Check the logs for specific error messages
3. Try restarting the add-on

### Data Not Persisting

1. The add-on automatically creates data files in `/data`
2. Check that the add-on has write permissions
3. Verify the symlinks are created correctly in the logs

## Support

If you encounter issues:

1. Check the add-on logs in Home Assistant
2. Verify your Discord bot permissions
3. Ensure all environment variables are set correctly
4. Try restarting the add-on

## Next Steps

Once your bot is running:

1. Set up your teams using `/team create`
2. Configure your coaches channel
3. Set your server's timezone
4. Start creating events with `/event create`

Your Legacy League Discord Bot is now ready to use! 