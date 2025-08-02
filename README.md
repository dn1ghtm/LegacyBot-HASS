# LL Value Bot

A Discord bot that calculates player value based on various stats like tackles, interceptions, saves, goals, passes, assists, dribbles, shots, and games played.

## Features

- Calculate player value based on predefined stat weights
- Display detailed breakdown of value calculation
- Simple command interface

## Stat Weights

The bot uses the following weights for each stat:

- Tackles: 200
- Interceptions: 100
- Saves: 500
- Goals: 600
- Passes: 250
- Assists: 400
- Dribbles: 100
- Shots: 300
- Games: 200

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a Discord bot on the [Discord Developer Portal](https://discord.com/developers/applications)
4. Get your bot token and add it to the `.env` file:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   ```
5. Invite the bot to your server with the following permissions:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Use Slash Commands
   
   Make sure to enable the "applications.commands" scope when generating the invite URL.

## Usage

Start the bot:
```
npm start
```

### Commands

- `/value` - Calculate player value (interactive slash command with fields for each stat)
- `/help` - Display help information

### Example

Use the `/value` command and fill in all the required fields:

- tackles: 10
- inters: 5
- saves: 2
- goals: 20
- passes: 150
- assists: 15
- dribbles: 30
- shots: 40
- games: 50

This will calculate the player value based on:
- 10 tackles
- 5 interceptions
- 2 saves
- 20 goals
- 150 passes
- 15 assists
- 30 dribbles
- 40 shots
- 50 games

## Customization

You can modify the stat weights in the `index.js` file by changing the values in the `STAT_WEIGHTS` object.