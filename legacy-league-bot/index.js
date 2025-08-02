// Load environment variables - support both .env file and Home Assistant add-on environment
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using environment variables');
}
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActivityType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, StringSelectMenuBuilder, Collection } = require('discord.js');
const fs = require('fs');
const SETTINGS_FILE = 'bot_settings.json';
const { parse } = require('date-fns');
const chrono = require('chrono-node');
const TEAMS_FILE = 'teams.json';
const { DateTime } = require('luxon');
const EVENT_SELECT_TZ = 'event_select_timezone';
// Diversified timezone list with city/region names
const COMMON_TIMEZONES = [
  { name: 'UTC', value: 'UTC' },
  { name: 'London (UK)', value: 'Europe/London' },
  { name: 'Budapest (Hungary, GMT+1/+2)', value: 'Europe/Budapest' },
  { name: 'Berlin (Germany)', value: 'Europe/Berlin' },
  { name: 'Athens (Greece)', value: 'Europe/Athens' },
  { name: 'Moscow (Russia)', value: 'Europe/Moscow' },
  { name: 'Dubai (UAE)', value: 'Asia/Dubai' },
  { name: 'New Delhi (India)', value: 'Asia/Kolkata' },
  { name: 'Bangkok (Thailand)', value: 'Asia/Bangkok' },
  { name: 'Singapore', value: 'Asia/Singapore' },
  { name: 'Tokyo (Japan)', value: 'Asia/Tokyo' },
  { name: 'Sydney (Australia)', value: 'Australia/Sydney' },
  { name: 'Sao Paulo (Brazil)', value: 'America/Sao_Paulo' },
  { name: 'Santiago (Chile)', value: 'America/Santiago' },
  { name: 'New York (USA)', value: 'America/New_York' },
  { name: 'Chicago (USA)', value: 'America/Chicago' },
  { name: 'Denver (USA)', value: 'America/Denver' },
  { name: 'Los Angeles (USA)', value: 'America/Los_Angeles' },
  { name: 'Honolulu (USA)', value: 'Pacific/Honolulu' },
  { name: 'Auckland (New Zealand)', value: 'Pacific/Auckland' },
  { name: 'Anchorage (Alaska, USA)', value: 'America/Anchorage' },
  { name: 'Azores (Portugal)', value: 'Atlantic/Azores' },
  { name: 'Karachi (Pakistan)', value: 'Asia/Karachi' },
  { name: 'Cape Town (South Africa)', value: 'Africa/Johannesburg' }
];

// Expanded preset time options for event creation
const EVENT_TIME_PRESETS = [
  { label: 'In 30 minutes', value: 'in 30 minutes' },
  { label: 'In 1 hour', value: 'in 1 hour' },
  { label: 'In 2 hours', value: 'in 2 hours' },
  { label: 'In 4 hours', value: 'in 4 hours' },
  { label: 'Tonight (19:00)', value: 'tonight' },
  { label: 'Tomorrow (18:00)', value: 'tomorrow' },
  { label: 'This weekend (Saturday 18:00)', value: 'this weekend' },
  { label: 'Next Monday (18:00)', value: 'next monday' },
  { label: 'Next month (1st, 18:00)', value: 'next month' },
  { label: 'In a week', value: 'in a week' },
  { label: 'Custom date/time...', value: 'custom' }
];

// Load settings from file
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch (e) { console.error('Failed to load settings:', e); }
  return {};
}

// Save settings to file
function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (e) { console.error('Failed to save settings:', e); }
}

// Save settings per guild
function saveGuildSetting(guildId, key, value) {
  if (!botSettings.guilds) botSettings.guilds = {};
  if (!botSettings.guilds[guildId]) botSettings.guilds[guildId] = {};
  botSettings.guilds[guildId][key] = value;
  saveSettings(botSettings);
}
function getGuildSetting(guildId, key) {
  return botSettings.guilds && botSettings.guilds[guildId] && botSettings.guilds[guildId][key];
}

let botSettings = loadSettings();

// Load teams from file
function loadTeams() {
  try {
    if (fs.existsSync(TEAMS_FILE)) {
      return JSON.parse(fs.readFileSync(TEAMS_FILE, 'utf8'));
    }
  } catch (e) { console.error('Failed to load teams:', e); }
  return {};
}
function saveTeams(teams) {
  try {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(teams, null, 2));
  } catch (e) { console.error('Failed to save teams:', e); }
}
let teamsData = loadTeams();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages // Add DM intent
  ],
  partials: ['CHANNEL'] // Needed for DMs
});

// Create slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('value')
    .setDescription('Calculate player value based on stats')
    .addIntegerOption(option => option.setName('tackles').setDescription('Number of tackles').setRequired(true))
    .addIntegerOption(option => option.setName('inters').setDescription('Number of interceptions').setRequired(true))
    .addIntegerOption(option => option.setName('saves').setDescription('Number of saves').setRequired(true))
    .addIntegerOption(option => option.setName('goals').setDescription('Number of goals').setRequired(true))
    .addIntegerOption(option => option.setName('passes').setDescription('Number of passes').setRequired(true))
    .addIntegerOption(option => option.setName('assists').setDescription('Number of assists').setRequired(true))
    .addIntegerOption(option => option.setName('dribbles').setDescription('Number of dribbles').setRequired(true))
    .addIntegerOption(option => option.setName('shots').setDescription('Number of shots').setRequired(true))
    .addIntegerOption(option => option.setName('games').setDescription('Number of games').setRequired(true)),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display help information about the bot')
].map(command => command.toJSON());

// Redesigned event command with better UX
commands.splice(commands.findIndex(cmd => cmd.name === 'event'), 1);
commands.push(
  new SlashCommandBuilder()
    .setName('event')
    .setDescription('Create a training event with improved timezone support')
    .addStringOption(option => option.setName('title').setDescription('Event title').setRequired(true))
    .addStringOption(option => option.setName('description').setDescription('Event description/details').setRequired(false))
    .addStringOption(option => option.setName('date').setDescription('Event date (YYYY-MM-DD)').setRequired(false))
    .addStringOption(option => option.setName('time').setDescription('Event time (HH:MM, 24h format)').setRequired(false))
    .addStringOption(option => option.setName('timezone').setDescription('Event timezone').setRequired(false).addChoices(...COMMON_TIMEZONES))
    .addStringOption(option => option.setName('location').setDescription('Event location (VC, channel, or description)').setRequired(false))
    .addStringOption(option => option.setName('duration').setDescription('Event duration in hours').setRequired(false).addChoices(
      { name: '1 hour', value: '1' },
      { name: '1.5 hours', value: '1.5' },
      { name: '2 hours', value: '2' },
      { name: '2.5 hours', value: '2.5' },
      { name: '3 hours', value: '3' },
      { name: '4 hours', value: '4' }
    ))
);

// Add settings command
commands.push(
  new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure bot settings')
    .addSubcommand(sub =>
      sub.setName('set-coaches-channel')
        .setDescription('Set the private coaches channel')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Coaches channel').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('set-sign-channel')
        .setDescription('Set the channel for sign notifications')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Sign notifications channel').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('set-default-timezone')
        .setDescription('Set the default timezone for this server')
        .addStringOption(opt =>
          opt.setName('timezone').setDescription('Timezone').setRequired(true).addChoices(...COMMON_TIMEZONES)
        )
    )
    .addSubcommand(sub =>
      sub.setName('reset-default-timezone')
        .setDescription('Reset the default timezone to UTC')
    )
);

// Add team management and sign commands
commands.push(
  new SlashCommandBuilder()
    .setName('teams')
    .setDescription('Manage teams (admin only)')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a team')
        .addStringOption(opt => opt.setName('name').setDescription('Team name').setRequired(true))
        .addUserOption(opt => opt.setName('leader').setDescription('Team leader').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Team role').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a team')
        .addStringOption(opt => opt.setName('name').setDescription('Team name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Remove a user from their team')
        .addUserOption(opt => opt.setName('user').setDescription('User to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all teams')
    )
);
commands.push(
  new SlashCommandBuilder()
    .setName('sign')
    .setDescription('Sign a user to your team (leader only)')
    .addUserOption(opt => opt.setName('user').setDescription('User to sign').setRequired(true))
);

// Define the weights for each stat
const STAT_WEIGHTS = {
  tackles: 200,
  inters: 100,
  saves: 500,
  goals: 600,
  passes: 250,
  assists: 400,
  dribbles: 100,
  shots: 300,
  games: 200
};

// --- Event RSVP Constants ---
const EVENT_BUTTONS = {
  GOING: 'event_going',
  MAYBE: 'event_maybe',
  CANT: 'event_cant',
};
const EVENT_MODAL = {
  CANT_REASON: 'cant_reason_modal',
  CANT_REASON_INPUT: 'cant_reason_input',
};
const EVENT_SELECT_TIME = 'event_select_time';
const EVENT_MODAL_TIME = 'event_modal_time';
const EVENT_MODAL_DATE_TIME = 'event_modal_date_time';
const EVENT_MODAL_LOCATION = 'event_modal_location';
const EVENT_BUTTON_SET_LOCATION = 'event_button_set_location';
// --- RSVP State ---
const eventRSVPs = {}; // { [messageId]: { going: Set, maybe: Set, cant: Map<userId, reason> } }

// Store the persistent location button message ID for cleanup
const eventLocationButtonMessages = {};

// Track pending location text fallbacks
const pendingLocationText = new Collection(); // userId -> { temp, channelId, timeout }

// Helper: Parse 'when' string to a Date object (supports 'in a day', 'in a week', or direct date)
function parseWhenToDate(when) {
  const now = new Date();
  const lower = when.toLowerCase();
  if (lower === 'in a day') return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (lower === 'in a week') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  // Try to parse as date string (e.g. 2024-06-10 18:00)
  const parsed = Date.parse(when);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

// Helper: Google Calendar event link
function googleCalendarLink({ title, description, start, end }) {
  const fmt = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description || '',
    dates: `${fmt(start)}/${fmt(end)}`
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

// When the client is ready, run this code (only once)
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  try {
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    console.log('Started refreshing application (/) commands.');
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    
    console.log('Successfully reloaded application (/) commands.');
    
    // Set up alternating activities and status
    let activityIndex = 0;
    const activities = [
      { name: 'Rematch', type: ActivityType.Playing, status: 'online' }, // Playing Rematch
      { name: 'The Legacy League 🏆', type: ActivityType.Watching, status: 'online' }, // Watching Legacy League
      { name: 'Scrims', type: ActivityType.Streaming, url: 'https://www.twitch.tv/itsn1ghtm', status: 'dnd' } // Streaming Scrims
    ];
    
    // Update activity and status every 25 seconds
    setInterval(() => {
      const activity = activities[activityIndex];
      client.user.setPresence({
        activities: [{ name: activity.name, type: activity.type, url: activity.url }],
        status: activity.status
      });
      
      // Switch to the next activity
      activityIndex = (activityIndex + 1) % activities.length;
    }, 2500); // 25 seconds
    
    // Set initial activity and status
    const initialActivity = activities[0];
    client.user.setPresence({
      activities: [{ name: initialActivity.name, type: initialActivity.type }],
      status: initialActivity.status
    });
  } catch (error) {
    console.error('Error refreshing application commands:', error);
  }
});

// --- Event RSVP Handlers ---

// Listen for interactions (slash commands, buttons, modals)
client.on('interactionCreate', async (interaction) => {
  try {
    // --- SLASH COMMANDS ---
    if (interaction.isCommand()) {
  const { commandName } = interaction;
      // Only defer if not already replied or deferred
      if ((commandName === 'help' || commandName === 'teams' || commandName === 'sign') && !interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }

  if (commandName === 'value') {
    try {
      // Get the stats from the options
      const stats = {
        tackles: interaction.options.getInteger('tackles'),
        inters: interaction.options.getInteger('inters'),
        saves: interaction.options.getInteger('saves'),
        goals: interaction.options.getInteger('goals'),
        passes: interaction.options.getInteger('passes'),
        assists: interaction.options.getInteger('assists'),
        dribbles: interaction.options.getInteger('dribbles'),
        shots: interaction.options.getInteger('shots'),
        games: interaction.options.getInteger('games')
      };

      // Calculate the player value
      const playerValue = calculatePlayerValue(stats);
      
      // Calculate contribution percentages for visualization
      const statContributions = {};
      let totalContribution = 0;
      
      for (const [stat, value] of Object.entries(stats)) {
        const contribution = value * STAT_WEIGHTS[stat];
        statContributions[stat] = contribution;
        totalContribution += contribution;
      }
      
      // Find the highest contributing stat for highlighting
      const highestStat = Object.entries(statContributions).reduce((a, b) => a[1] > b[1] ? a : b);
      const playerType = getPlayerType(statContributions);
      
      // Group stats by category
      const defensiveStats = {
        tackles: stats.tackles,
        inters: stats.inters,
        saves: stats.saves
      };
      
      const offensiveStats = {
        goals: stats.goals,
        shots: stats.shots,
        dribbles: stats.dribbles
      };
      
      const playmakerStats = {
        assists: stats.assists,
        passes: stats.passes,
        games: stats.games
      };
      
      // Format stat fields with contribution percentages
       const formatStatField = (statName, statValue, weight, contribution) => {
         return {
           name: formatStatName(statName),
           value: `**${statValue}**`,
           inline: true
         };
       };
      
      // Create defensive stat fields
      const defensiveFields = Object.entries(defensiveStats).map(([stat, value]) => 
        formatStatField(stat, value, STAT_WEIGHTS[stat], statContributions[stat])
      );
      
      // Create offensive stat fields
      const offensiveFields = Object.entries(offensiveStats).map(([stat, value]) => 
        formatStatField(stat, value, STAT_WEIGHTS[stat], statContributions[stat])
      );
      
      // Create playmaker stat fields
      const playmakerFields = Object.entries(playmakerStats).map(([stat, value]) => 
        formatStatField(stat, value, STAT_WEIGHTS[stat], statContributions[stat])
      );
      
      // Calculate category totals
      const defensiveTotal = Object.entries(defensiveStats).reduce((total, [stat, value]) => total + (value * STAT_WEIGHTS[stat]), 0);
      const offensiveTotal = Object.entries(offensiveStats).reduce((total, [stat, value]) => total + (value * STAT_WEIGHTS[stat]), 0);
      const playmakerTotal = Object.entries(playmakerStats).reduce((total, [stat, value]) => total + (value * STAT_WEIGHTS[stat]), 0);
      
      // Calculate percentages for visual representation
      const defensivePercent = Math.round((defensiveTotal / playerValue) * 100);
      const offensivePercent = Math.round((offensiveTotal / playerValue) * 100);
      const playmakerPercent = Math.round((playmakerTotal / playerValue) * 100);
      
      // Create visual bars for stat distribution with fixed width
      const createBar = (percent) => {
        const fullBlocks = Math.floor(percent / 10);
        let bar = '';
        for (let i = 0; i < 10; i++) {
          bar += i < fullBlocks ? '█' : '░';
        }
        return bar;
      };
      
      const defensiveBar = createBar(defensivePercent);
      const offensiveBar = createBar(offensivePercent);
      const playmakerBar = createBar(playmakerPercent);
      
      // Calculate per-game averages
      const gamesPlayed = stats.games || 1; // Prevent division by zero
      const avgValue = Math.round(playerValue / gamesPlayed);
      const avgGoals = (stats.goals / gamesPlayed).toFixed(2);
      const avgAssists = (stats.assists / gamesPlayed).toFixed(2);
      const avgTackles = (stats.tackles / gamesPlayed).toFixed(2);
      const avgInters = (stats.inters / gamesPlayed).toFixed(2);
      const avgSaves = (stats.saves / gamesPlayed).toFixed(2);
      const avgPasses = (stats.passes / gamesPlayed).toFixed(2);
      const avgDribbles = (stats.dribbles / gamesPlayed).toFixed(2);
      const avgShots = (stats.shots / gamesPlayed).toFixed(2);
      
      // Create a more compact embed for the response
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`⚽ ${interaction.user.username}'s Player Value Analysis`)
        .setDescription(`**$${playerValue.toLocaleString()}** | **${playerType}** | **$${avgValue.toLocaleString()}/Game**`)
        .addFields(
          // Category distribution with bars - aligned without monetary values
          { name: 'Stat Distribution', value: `🛡️ **${defensivePercent}%** ${defensiveBar}\n⚽ **${offensivePercent}%** ${offensiveBar}\n🔄 **${playmakerPercent}%** ${playmakerBar}`, inline: false },
          
          // Main stats in improved format
          { name: '🛡️ Defensive', value: `**Tackles:** ${stats.tackles}\n**Interceptions:** ${stats.inters}\n**Saves:** ${stats.saves}`, inline: true },
          { name: '⚽ Offensive', value: `**Goals:** ${stats.goals}\n**Shots:** ${stats.shots}\n**Dribbles:** ${stats.dribbles}`, inline: true },
          { name: '🔄 Playmaker', value: `**Assists:** ${stats.assists}\n**Passes:** ${stats.passes}\n**Games:** ${stats.games}`, inline: true },
          
          // Per game stats in improved format
          { name: 'Per Game Averages', value: `**Goals:** ${avgGoals} • **Assists:** ${avgAssists} • **Tackles:** ${avgTackles}
**Inters:** ${avgInters} • **Saves:** ${avgSaves} • **Passes:** ${avgPasses}
**Dribbles:** ${avgDribbles} • **Shots:** ${avgShots}`, inline: false }
        )
        .setFooter({ text: 'LL Value Bot | Advanced Player Analysis' })
        .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error calculating player value:', error);
          await interaction.reply({ content: 'An error occurred while calculating the player value.' });
    }
      } else if (commandName === 'help') {
      try {
        // Provide help information
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('⚽ Legacy League Bot Help')
            .setDescription('Player value calculator and event management system')
            .addFields(
              { name: '📊 Player Value', value: '`/value` - Calculate player value with all required stats (public response)' },
              { name: '📅 Event Management', value: '`/event` - Create training events with improved timezone support\n• Quick creation with date/time parameters\n• Interactive timezone selection\n• RSVP system with attendance tracking' },
              { name: '⚙️ Settings', value: '`/settings` - Configure server defaults (admin only)\n• Set default timezone\n• Configure coaches channel\n• Configure sign notifications channel' },
              { name: '👥 Team Management', value: '`/teams` - Manage teams (admin only)\n`/sign` - Sign players to your team (leader only)' },
              { name: '⚖️ Stat Weights', value: Object.entries(STAT_WEIGHTS).map(([stat, weight]) => `${formatStatName(stat)}: **$${weight}**`).join(' | ') },
              { name: '🏆 Player Types', value: '🛡️ Defensive | ⚽ Offensive | 🔄 Playmaker | ⚖️ Two-Way | 🧠 Def-Play | 🎯 Creative | 🌟 Complete' }
            )
            .setFooter({ text: 'Legacy League Bot - Advanced Player Analysis & Event Management' })
            .setTimestamp();

          await interaction.editReply({ embeds: [helpEmbed] });
          } catch (error) {
            console.error('Error displaying help information:', error);
            await interaction.editReply({ content: 'An error occurred while displaying help information.' });
          }
      } else if (commandName === 'event') {
        if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
          await interaction.reply({ content: '❌ Only server administrators/coaches can create events.', ephemeral: true });
          return;
        }
        
        const title = interaction.options.getString('title');
        const desc = interaction.options.getString('description') || '';
        const dateStr = interaction.options.getString('date');
        const timeStr = interaction.options.getString('time');
        const timezone = interaction.options.getString('timezone') || getGuildSetting(interaction.guild.id, 'defaultTimezone') || 'UTC';
        const location = interaction.options.getString('location') || '';
        const duration = parseFloat(interaction.options.getString('duration') || '2');
        
        // If date and time are provided, create event directly
        if (dateStr && timeStr) {
          const whenString = `${dateStr} ${timeStr}`;
          await handleEventTime(interaction, whenString, title, desc, false, timezone, location, duration);
          return;
        }
        
        // If only some parameters are provided, show a modal for missing ones
        if (dateStr || timeStr || location) {
          const modal = new ModalBuilder()
            .setCustomId('event_complete_modal')
            .setTitle('Complete Event Details')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('event_date_input')
                  .setLabel('Date (YYYY-MM-DD)')
                  .setPlaceholder('e.g. 2025-07-18')
                  .setValue(dateStr || '')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(!dateStr)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('event_time_input')
                  .setLabel('Time (HH:MM, 24h)')
                  .setPlaceholder('e.g. 14:00')
                  .setValue(timeStr || '')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(!timeStr)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('event_location_input')
                  .setLabel('Location (VC, channel, or description)')
                  .setPlaceholder('e.g. Main VC, #general, Stadium')
                  .setValue(location || '')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
              )
            );
          
          eventRSVPs[interaction.user.id] = { title, desc, timezone, duration };
          await interaction.showModal(modal);
          return;
        }
        
        // If no parameters provided, show the time selection menu
        const select = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(EVENT_SELECT_TIME)
            .setPlaceholder('Choose when the event will be')
            .addOptions(EVENT_TIME_PRESETS)
        );
        eventRSVPs[interaction.user.id] = { title, desc, timezone, duration };
        await interaction.reply({ content: '🕒 When is the event?', components: [select], ephemeral: true });
        return;
      } else if (commandName === 'settings') {
        // Only allow admins to use settings
        if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
          await interaction.reply({ content: '❌ Only server administrators can use this command.', ephemeral: true });
          return;
        }
        try {
          if (interaction.options.getSubcommand() === 'set-default-timezone') {
            if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
              await interaction.reply({ content: '❌ Only server administrators can set the default timezone.', ephemeral: true });
              return;
            }
            const tz = interaction.options.getString('timezone');
            if (!COMMON_TIMEZONES.some(t => t.value === tz)) {
              await interaction.reply({ content: '❌ Invalid timezone selected.', ephemeral: true });
              return;
            }
            saveGuildSetting(interaction.guild.id, 'defaultTimezone', tz);
            await interaction.reply({ content: `✅ Default timezone set to **${tz}** for this server.`, ephemeral: true });
            return;
          } else if (interaction.options.getSubcommand() === 'reset-default-timezone') {
            if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
              await interaction.reply({ content: '❌ Only server administrators can reset the default timezone.', ephemeral: true });
              return;
            }
            saveGuildSetting(interaction.guild.id, 'defaultTimezone', undefined);
            await interaction.reply({ content: '✅ Default timezone reset to UTC for this server.', ephemeral: true });
            return;
          } else if (interaction.options.getSubcommand() === 'set-coaches-channel') {
            const channel = interaction.options.getChannel('channel');
            saveGuildSetting(interaction.guild.id, 'coachesChannelId', channel.id);
            await interaction.reply({ content: `✅ Coaches channel set to <#${channel.id}> for this server.`, ephemeral: true });
            return;
          } else if (interaction.options.getSubcommand() === 'set-sign-channel') {
            const channel = interaction.options.getChannel('channel');
            saveGuildSetting(interaction.guild.id, 'signChannelId', channel.id);
            await interaction.reply({ content: `✅ Sign notifications channel set to <#${channel.id}> for this server.`, ephemeral: true });
            return;
          } else {
            await interaction.reply({ content: '❌ Unknown settings subcommand.', ephemeral: true });
            return;
          }
        } catch (err) {
          console.error('Error in /settings:', err);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ An error occurred while processing the settings command.', ephemeral: true });
          }
        }
      }
    }
    // --- TEAMS COMMAND (admin only) ---
    if (interaction.isCommand() && interaction.commandName === 'teams') {
      if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
        await interaction.editReply({ embeds: [teamErrorEmbed('Only server administrators can manage teams.')] });
        return;
      }
      const guildId = interaction.guild.id;
      if (!teamsData[guildId]) teamsData[guildId] = {};
      const sub = interaction.options.getSubcommand();
      if (sub === 'add') {
        const name = interaction.options.getString('name');
        const leader = interaction.options.getUser('leader');
        const role = interaction.options.getRole('role');
        if (teamsData[guildId][name]) {
          await interaction.editReply({ embeds: [teamErrorEmbed(`Team \`${name}\` already exists.`)] });
          return;
        }
        teamsData[guildId][name] = { leaderId: leader.id, roleId: role.id, members: [] };
        saveTeams(teamsData);
        await interaction.editReply({ embeds: [teamSuccessEmbed('Team Created', `Team **${name}** created!`, [
          { name: 'Leader', value: `<@${leader.id}>`, inline: true },
          { name: 'Role', value: `<@&${role.id}>`, inline: true }
        ])] });
        return;
      } else if (sub === 'remove') {
        const name = interaction.options.getString('name');
        if (!teamsData[guildId][name]) {
          await interaction.editReply({ embeds: [teamErrorEmbed(`Team \`${name}\` does not exist.`)] });
          return;
        }
        delete teamsData[guildId][name];
        saveTeams(teamsData);
        await interaction.editReply({ embeds: [teamSuccessEmbed('Team Removed', `Team **${name}** has been removed!`)] });
        return;
      } else if (sub === 'kick') {
        const user = interaction.options.getUser('user');
        // Find the team this user leads
        const teamEntry = Object.entries(teamsData[guildId] || {}).find(([name, t]) => t.leaderId === interaction.user.id);
        if (!teamEntry) {
          await interaction.editReply({ embeds: [teamErrorEmbed('You are not a leader of any team in this server.')] });
          return;
        }
        const [teamName, team] = teamEntry;
        if (!team.members.includes(user.id)) {
          await interaction.editReply({ embeds: [teamErrorEmbed(`<@${user.id}> is not a member of your team.`)] });
          return;
        }
        team.members = team.members.filter(id => id !== user.id);
        saveTeams(teamsData);
        // Remove the role from the user
        try {
          const member = await interaction.guild.members.fetch(user.id);
          await member.roles.remove(team.roleId);
        } catch {}
        await interaction.editReply({ embeds: [teamSuccessEmbed('Member Removed', `<@${user.id}> has been removed from **${teamName}** and the role taken away.`)] });
        return;
      } else if (sub === 'list') {
        const teams = Object.entries(teamsData[guildId] || {});
        if (!teams.length) {
          await interaction.editReply({ embeds: [teamErrorEmbed('No teams found for this server.')] });
          return;
        }
        const fields = teams.map(([name, t]) => ({
          name: `**${name}**`,
          value: `Leader: <@${t.leaderId}>\nRole: <@&${t.roleId}>\nMembers: ${t.members.length}`,
          inline: false
        }));
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#0099ff').setTitle('Teams List').addFields(fields)] });
        return;
      }
    }
    // --- SIGN COMMAND (leader only) ---
    if (interaction.isCommand() && interaction.commandName === 'sign') {
      const guildId = interaction.guild.id;
      const user = interaction.options.getUser('user');
      
      // Find the team this user leads
      const teamEntry = Object.entries(teamsData[guildId] || {}).find(([name, t]) => t.leaderId === interaction.user.id);
      if (!teamEntry) {
        await interaction.editReply({ embeds: [teamErrorEmbed('You are not a leader of any team in this server.')] });
        return;
      }
      
      const [teamName, team] = teamEntry;
      
      // Check if user is already on a team
      const existingTeam = Object.entries(teamsData[guildId] || {}).find(([name, t]) => t.members.includes(user.id));
      if (existingTeam) {
        const [existingTeamName, existingTeamData] = existingTeam;
        await interaction.editReply({ embeds: [teamErrorEmbed(`<@${user.id}> is already a member of **${existingTeamName}**. They must be removed from their current team first.`)] });
        return;
      }
      
      if (team.members.includes(user.id)) {
        await interaction.editReply({ embeds: [teamErrorEmbed(`<@${user.id}> is already a member of your team.`)] });
        return;
      }
      
      // Add user to team
      team.members.push(user.id);
      saveTeams(teamsData);
      
      // Give the user the team role
      try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.add(team.roleId);
      } catch (error) {
        console.error('Error adding role to user:', error);
      }
      
      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Player Signed Successfully')
        .setDescription(`<@${user.id}> has been signed to **${teamName}**!`)
        .addFields(
          { name: 'Player', value: `<@${user.id}>`, inline: true },
          { name: 'Team', value: `**${teamName}**`, inline: true },
          { name: 'Captain', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Role Assigned', value: `<@&${team.roleId}>`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Legacy League Team Management' });
      
      await interaction.editReply({ embeds: [successEmbed] });
      
      // Send notification to sign channel if configured
      const signChannelId = getGuildSetting(interaction.guild.id, 'signChannelId');
      if (signChannelId) {
        try {
          const signChannel = interaction.client.channels.cache.get(signChannelId);
          if (signChannel) {
            const notificationEmbed = new EmbedBuilder()
              .setColor('#0099ff')
              .setTitle('🎯 New Player Signing')
              .setDescription(`<@${user.id}> has been signed to **${teamName}**!`)
              .addFields(
                { name: 'Player', value: `<@${user.id}>`, inline: true },
                { name: 'Team', value: `**${teamName}**`, inline: true },
                { name: 'Captain', value: `<@${interaction.user.id}>`, inline: true }
              )
              .setTimestamp()
              .setFooter({ text: 'Legacy League Signing Notification' });
            
            await signChannel.send({ embeds: [notificationEmbed] });
          }
        } catch (error) {
          console.error('Error sending sign notification:', error);
        }
      }
      
      return;
    }
    // --- SELECT MENU ---
    if (interaction.isStringSelectMenu && interaction.customId === EVENT_SELECT_TIME) {
      const choice = interaction.values[0];
      if (choice !== 'custom') {
        // Save the preset value as whenString (never empty)
        eventRSVPs[interaction.user.id] = { ...eventRSVPs[interaction.user.id], whenString: choice };
        const defaultTz = getGuildSetting(interaction.guild.id, 'defaultTimezone') || 'UTC';
        // Move default timezone to the top and show current time in each timezone
        const now = DateTime.now();
        const tzOptions = [
          ...COMMON_TIMEZONES.filter(tz => tz.value === defaultTz),
          ...COMMON_TIMEZONES.filter(tz => tz.value !== defaultTz)
        ].map(tz => {
          const tzTime = now.setZone(tz.value);
          return { 
            label: `${tz.name} (${tzTime.toFormat('HH:mm')})`, 
            value: tz.value 
          };
        });
        const tzSelect = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(EVENT_SELECT_TZ)
            .setPlaceholder('Select a timezone (showing current time)')
            .addOptions(tzOptions)
        );
        await interaction.reply({ content: '🌍 Select the timezone for the event (current time shown):', components: [tzSelect], ephemeral: true });
        return;
      }
      // Show modal for custom date and time, vertical layout
      const modal = new ModalBuilder()
        .setCustomId(EVENT_MODAL_DATE_TIME)
        .setTitle('Event Date & Time')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('event_date_input')
              .setLabel('Date (YYYY-MM-DD)')
              .setPlaceholder('e.g. 2025-07-18')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('event_time_input')
              .setLabel('Time (HH:mm, 24h)')
              .setPlaceholder('e.g. 14:00')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      await interaction.showModal(modal);
      return;
    }
    // --- MODAL FOR CUSTOM DATE & TIME ---
    if (interaction.isModalSubmit() && interaction.customId === EVENT_MODAL_DATE_TIME) {
      const temp = eventRSVPs[interaction.user.id];
      if (!temp) {
        console.error(`[Event Creation] Missing temp event data for user ${interaction.user.id} at modal submit. eventRSVPs:`, eventRSVPs);
        await interaction.reply({ content: '❌ Could not find your event data. This may happen if the bot was restarted. Please start the event creation process again.', ephemeral: true });
        return;
      }
      const dateStr = interaction.fields.getTextInputValue('event_date_input');
      const timeStr = interaction.fields.getTextInputValue('event_time_input');
      const whenString = `${dateStr} ${timeStr}`;
      eventRSVPs[interaction.user.id] = { ...temp, whenString };
      const defaultTz = temp.timezone || 'UTC';
      const now = DateTime.now();
      const tzOptions = [
        ...COMMON_TIMEZONES.filter(tz => tz.value === defaultTz),
        ...COMMON_TIMEZONES.filter(tz => tz.value !== defaultTz)
      ].map(tz => {
        const tzTime = now.setZone(tz.value);
        return { 
          label: `${tz.name} (${tzTime.toFormat('HH:mm')})`, 
          value: tz.value 
        };
      });
      const tzSelect = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(EVENT_SELECT_TZ)
          .setPlaceholder('Select a timezone (showing current time)')
          .addOptions(tzOptions)
      );
      await interaction.reply({ content: '🌍 Select the timezone for the event (current time shown):', components: [tzSelect], ephemeral: true });
      return;
    }
    // --- BUTTONS ---
    if (interaction.isButton()) {
      // Find the event message
      const message = interaction.message;
      const event = eventRSVPs[message.id];
      if (!event) return;
      // Remove user from all RSVP lists first
      event.going.delete(interaction.user.id);
      event.maybe.delete(interaction.user.id);
      event.cant.delete(interaction.user.id);
      if (interaction.customId === EVENT_BUTTONS.GOING) {
        event.going.add(interaction.user.id);
        await updateEventEmbed(message, event, interaction.client);
        await interaction.reply({ content: '✅ You are going! Your RSVP has been recorded.', ephemeral: true });
        return;
      }
      if (interaction.customId === EVENT_BUTTONS.MAYBE) {
        event.maybe.add(interaction.user.id);
        await updateEventEmbed(message, event, interaction.client);
        await interaction.reply({ content: '🤔 You marked as maybe. Your RSVP has been recorded.', ephemeral: true });
        return;
      }
      if (interaction.customId === EVENT_BUTTONS.CANT) {
        // Show modal for reason
        const modal = new ModalBuilder()
          .setCustomId(`${EVENT_MODAL.CANT_REASON}:${message.id}`)
          .setTitle("Can't Attend Reason")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId(EVENT_MODAL.CANT_REASON_INPUT)
                .setLabel('Why can\'t you attend?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );
        await interaction.showModal(modal);
        return;
      }
    }
    // --- MODALS ---
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith(EVENT_MODAL.CANT_REASON)) {
        const messageId = interaction.customId.split(':')[1];
        const event = eventRSVPs[messageId];
        if (!event) {
          await interaction.reply({ content: 'Something went wrong. Please try again.', ephemeral: true });
          return;
        }
        const reason = interaction.fields.getTextInputValue(EVENT_MODAL.CANT_REASON_INPUT);
        // Remove user from other lists
        event.going.delete(interaction.user.id);
        event.maybe.delete(interaction.user.id);
        event.cant.set(interaction.user.id, reason);
        // Update event embed
        const channel = interaction.channel;
        const msg = await channel.messages.fetch(messageId);
        await updateEventEmbed(msg, event, interaction.client);
        // Always reply to the modal
        await interaction.reply({ content: '❌ Your reason has been sent to the coaches.', ephemeral: true });
        // Send improved embed to coaches
        const channelId = getGuildSetting(interaction.guild.id, 'coachesChannelId');
        if (channelId) {
          const coachesChannel = interaction.client.channels.cache.get(channelId);
          if (coachesChannel) {
            const coachEmbed = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('❌ RSVP: Not Attending')
              .setDescription(`<@${interaction.user.id}> cannot attend the event.`)
              .addFields(
                { name: 'Event', value: event.title, inline: false },
                { name: 'When', value: event.when, inline: false },
                { name: 'Reason', value: reason, inline: false }
              )
              .setTimestamp();
            coachesChannel.send({ embeds: [coachEmbed] });
          }
        }
        return;
      }
    }
    // Handle timezone select
    if (interaction.isStringSelectMenu && interaction.customId === EVENT_SELECT_TZ) {
      const temp = eventRSVPs[interaction.user.id];
      if (!temp) {
        console.error(`[Event Creation] Missing temp event data for user ${interaction.user.id}. eventRSVPs:`, eventRSVPs);
        await interaction.reply({ content: '❌ Could not find your event data. This may happen if the bot was restarted. Please start the event creation process again.', ephemeral: true });
        return;
      }
      if (!temp.whenString) {
        console.error(`[Event Creation] Missing whenString for user ${interaction.user.id}. eventRSVPs:`, eventRSVPs[interaction.user.id]);
        await interaction.reply({ content: '❌ Could not find the event time. Please restart the event creation process.', ephemeral: true });
        return;
      }
      const timezone = interaction.values[0] || temp.timezone || 'UTC';
      eventRSVPs[interaction.user.id].timezone = timezone;
      // Always show modal for location
      const locationModal = new ModalBuilder()
        .setCustomId(EVENT_MODAL_LOCATION)
        .setTitle('Event Location')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('event_location_input')
              .setLabel('Event location (VC, channel, or description)')
              .setPlaceholder('e.g. Main VC, #general, Stadium')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      await interaction.showModal(locationModal);
      // Hybrid fallback: after 15s, prompt for text if not set
      if (pendingLocationText.has(interaction.user.id)) {
        clearTimeout(pendingLocationText.get(interaction.user.id).timeout);
        pendingLocationText.delete(interaction.user.id);
      }
      const timeout = setTimeout(async () => {
        const temp2 = eventRSVPs[interaction.user.id];
        if (temp2 && !temp2.location) {
          try {
            const dm = await interaction.user.createDM();
            await dm.send('Please reply with the event location (e.g. Main VC, #general, Stadium).');
            pendingLocationText.set(interaction.user.id, { temp: temp2, channel: interaction.channel, timeout });
          } catch (err) {
            await interaction.channel.send(`<@${interaction.user.id}>, I could not DM you. Please enable DMs or type the location here.`);
            pendingLocationText.set(interaction.user.id, { temp: temp2, channelId: interaction.channel.id, timeout });
          }
        }
      }, 15000);
      pendingLocationText.set(interaction.user.id, { temp, channelId: interaction.channel.id, timeout });
      return;
    }
    // Handle Set Location button
    if (interaction.isButton() && interaction.customId.startsWith(EVENT_BUTTON_SET_LOCATION)) {
      const userId = interaction.customId.split(':')[1];
      if (interaction.user.id !== userId) {
        await interaction.reply({ content: '❌ Only the event creator can set the location.', ephemeral: true });
        return;
      }
      const temp = eventRSVPs[interaction.user.id];
      if (!temp) {
        await interaction.reply({ content: '❌ Could not find your event data. Please restart the event creation process.', ephemeral: true });
        return;
      }
      try {
        const locationModal = new ModalBuilder()
          .setCustomId(EVENT_MODAL_LOCATION)
          .setTitle('Event Location')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('event_location_input')
                .setLabel('Event location (VC, channel, or description)')
                .setPlaceholder('e.g. Main VC, #general, Stadium')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );
        await interaction.showModal(locationModal);
      } catch (err) {
        console.error('Error showing location modal:', err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Failed to show the location modal. Please try again.', ephemeral: true });
        }
      }
      return;
    }
    // Handle event completion modal submit
    if (interaction.isModalSubmit() && interaction.customId === 'event_complete_modal') {
      const temp = eventRSVPs[interaction.user.id];
      if (!temp) {
        console.error(`[Event Creation] Missing temp event data for user ${interaction.user.id} at completion modal. eventRSVPs:`, eventRSVPs);
        await interaction.reply({ content: '❌ Could not find your event data. This may happen if the bot was restarted. Please start the event creation process again.', ephemeral: true });
        return;
      }
      const dateStr = interaction.fields.getTextInputValue('event_date_input');
      const timeStr = interaction.fields.getTextInputValue('event_time_input');
      const location = interaction.fields.getTextInputValue('event_location_input');
      
      if (!dateStr || !timeStr) {
        await interaction.reply({ content: '❌ Date and time are required. Please try again.', ephemeral: true });
        return;
      }
      
      const whenString = `${dateStr} ${timeStr}`;
      eventRSVPs[interaction.user.id].location = location;
      await handleEventTime(interaction, whenString, temp.title, temp.desc, true, temp.timezone, location, temp.duration);
      if (eventRSVPs[interaction.user.id]) delete eventRSVPs[interaction.user.id];
      return;
    }
    
    // Handle location modal submit
    if (interaction.isModalSubmit() && interaction.customId === EVENT_MODAL_LOCATION) {
      const temp = eventRSVPs[interaction.user.id];
      if (!temp) {
        console.error(`[Event Creation] Missing temp event data for user ${interaction.user.id} at location modal. eventRSVPs:`, eventRSVPs);
        await interaction.reply({ content: '❌ Could not find your event data. This may happen if the bot was restarted. Please start the event creation process again.', ephemeral: true });
        return;
      }
      const location = interaction.fields.getTextInputValue('event_location_input');
      eventRSVPs[interaction.user.id].location = location;
      if (pendingLocationText.has(interaction.user.id)) {
        clearTimeout(pendingLocationText.get(interaction.user.id).timeout);
        pendingLocationText.delete(interaction.user.id);
      }
      await handleEventTime(interaction, temp.whenString, temp.title, temp.desc, true, temp.timezone, location, temp.duration);
      if (eventRSVPs[interaction.user.id]) delete eventRSVPs[interaction.user.id];
      return;
    }
  } catch (error) {
    console.error('Interaction error:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: 'An error occurred. Please try again later.' }).catch(() => {});
    } else {
      await interaction.reply({ content: 'An error occurred. Please try again later.', ephemeral: true }).catch(() => {});
    }
  }
});

/**
 * Calculate the player value based on their stats
 * @param {Object} stats - The player's stats
 * @returns {number} - The calculated player value
 */
function calculatePlayerValue(stats) {
  let totalValue = 0;

  // Calculate the value for each stat
  for (const [stat, value] of Object.entries(stats)) {
    totalValue += value * STAT_WEIGHTS[stat];
  }

  return totalValue;
}

/**
 * Determine the player type based on their stat contributions
 * @param {Object} statContributions - The contribution of each stat to the total value
 * @returns {string} - The player type description
 */
function getPlayerType(statContributions) {
  // Group stats by category
  const defensiveContribution = statContributions.tackles + statContributions.inters + statContributions.saves;
  const offensiveContribution = statContributions.goals + statContributions.shots + statContributions.dribbles;
  const playmakerContribution = statContributions.assists + statContributions.passes;
  const experienceContribution = statContributions.games;
  
  const totalContribution = defensiveContribution + offensiveContribution + playmakerContribution + experienceContribution;
  
  // Calculate percentages
  const defensivePercentage = (defensiveContribution / totalContribution) * 100;
  const offensivePercentage = (offensiveContribution / totalContribution) * 100;
  const playmakerPercentage = (playmakerContribution / totalContribution) * 100;
  
  // Determine primary player type
  if (defensivePercentage > 50) {
    return '🛡️ Defensive Specialist';
  } else if (offensivePercentage > 50) {
    return '⚽ Offensive Powerhouse';
  } else if (playmakerPercentage > 50) {
    return '🔄 Elite Playmaker';
  } else if (defensivePercentage >= 33 && offensivePercentage >= 33) {
    return '⚖️ Two-Way Player';
  } else if (defensivePercentage >= 33 && playmakerPercentage >= 33) {
    return '🧠 Defensive Playmaker';
  } else if (offensivePercentage >= 33 && playmakerPercentage >= 33) {
    return '🎯 Creative Attacker';
  } else {
    return '🌟 Complete Player';
  }
}

/**
 * Format a stat name to be more readable
 * @param {string} stat - The stat name
 * @returns {string} - The formatted stat name
 */
function formatStatName(stat) {
  const statIcons = {
    tackles: '🛡️ Tackles',
    inters: '🔒 Interceptions',
    saves: '🧤 Saves',
    goals: '⚽ Goals',
    shots: '🎯 Shots',
    dribbles: '👟 Dribbles',
    assists: '🅰️ Assists',
    passes: '🔄 Passes',
    games: '🏟️ Games'
  };
  
  return statIcons[stat] || stat.charAt(0).toUpperCase() + stat.slice(1);
}

// Helper functions for team embeds
function teamErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('❌ Team Management Error')
    .setDescription(message)
    .setTimestamp();
}

function teamSuccessEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
  
  if (fields.length > 0) {
    embed.addFields(fields);
  }
  
  return embed;
}

// Helper to update the event embed with RSVP lists
async function updateEventEmbed(message, event, client) {
  const goingList = event.going.size ? Array.from(event.going).map(id => `<@${id}>`).join(' | ') : 'No one yet';
  const maybeList = event.maybe.size ? Array.from(event.maybe).map(id => `<@${id}>`).join(' | ') : 'No one yet';
  const cantList = event.cant.size ? Array.from(event.cant.keys()).map(id => `<@${id}>`).join(' | ') : 'No one yet';
  const links = [
    event.scheduledEventUrl ? `[🔗 Event](${event.scheduledEventUrl})` : null,
    event.gcalLink ? `[📅 Calendar](${event.gcalLink})` : null
  ].filter(Boolean).join(' ');
  
  const embed = new EmbedBuilder()
    .setColor('#00b0f4')
    .setTitle(`📅 **${event.title.toUpperCase()}**`);
  if (event.desc) embed.setDescription(`_${event.desc}_`);
  
  embed.addFields(
    { name: 'Time', value: event.when, inline: true },
    { name: 'Duration', value: `${event.durationHours || 2} hour${(event.durationHours || 2) !== 1 ? 's' : ''}`, inline: true },
    { name: '\u200B', value: '\u200B', inline: true }, // Spacer
    { name: `✅ Attendees (${event.going.size})`, value: goingList, inline: true },
    { name: `🤔 Maybe (${event.maybe.size})`, value: maybeList, inline: true },
    { name: `❌ No (${event.cant.size})`, value: cantList, inline: true },
    { name: 'Links', value: links, inline: false }
  );
  
  embed.setFooter({ text: `Created by ${event.username || (event.creator ? (client.users.cache.get(event.creator)?.username || 'Unknown') : 'Unknown')}` });
  await message.edit({ embeds: [embed] });
}

// Robust time calculation for all presets
function parsePresetTime(preset, timezone) {
  const now = DateTime.now().setZone(timezone);
  switch (preset) {
    case 'in 30 minutes':
      return now.plus({ minutes: 30 });
    case 'in 1 hour':
      return now.plus({ hours: 1 });
    case 'in 2 hours':
      return now.plus({ hours: 2 });
    case 'in 4 hours':
      return now.plus({ hours: 4 });
    case 'tonight': {
      let tonight = now.set({ hour: 19, minute: 0, second: 0, millisecond: 0 });
      if (tonight < now) tonight = tonight.plus({ days: 1 });
      return tonight;
    }
    case 'tomorrow': {
      return now.plus({ days: 1 }).set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
    }
    case 'this weekend': {
      // Saturday 18:00
      let daysToSat = (6 - now.weekday) % 7;
      if (daysToSat === 0 && now.hour >= 18) daysToSat = 7;
      return now.plus({ days: daysToSat }).set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
    }
    case 'next monday': {
      let daysToMon = (8 - now.weekday) % 7;
      if (daysToMon === 0 && now.hour >= 18) daysToMon = 7;
      return now.plus({ days: daysToMon }).set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
    }
    case 'next month': {
      let nextMonth = now.plus({ months: 1 }).set({ day: 1, hour: 18, minute: 0, second: 0, millisecond: 0 });
      return nextMonth;
    }
    case 'in a week':
      return now.plus({ weeks: 1 });
    default:
      return null;
  }
}

// Helper to handle event creation after time selection
async function handleEventTime(interaction, whenString, title, desc, fromModal = false, timezone = 'UTC', location = '', duration = 2) {
  let dt;
  // If whenString matches a preset, use parsePresetTime
  if (EVENT_TIME_PRESETS.some(opt => opt.value === whenString)) {
    dt = parsePresetTime(whenString, timezone);
  } else {
    dt = DateTime.fromFormat(whenString, 'yyyy-MM-dd HH:mm', { zone: timezone });
    if (!dt.isValid) {
      // Try chrono fallback
      const results = chrono.parse(whenString, new Date(), { forwardDate: true });
      if (!results.length) {
        if (fromModal) {
          await interaction.reply({ content: '❌ Could not understand the date/time. Please try again with a format like "2024-06-10 18:00", "next Friday at 7pm", or "in 2 days".', ephemeral: true });
        } else {
          await interaction.editReply({ content: '❌ Could not understand the date/time. Please try again with a format like "2024-06-10 18:00", "next Friday at 7pm", or "in 2 days".' });
        }
        return;
      }
      dt = DateTime.fromJSDate(results[0].start.date()).setZone(timezone);
    }
  }
  if (dt < DateTime.now()) {
    const errorMsg = '❌ The event time must be in the future. Please provide a valid future date/time.';
    if (fromModal) {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.editReply({ content: errorMsg });
    }
    return;
  }
  
  // Add timezone validation
  if (!dt.isValid) {
    const errorMsg = '❌ Invalid date/time format. Please use YYYY-MM-DD HH:MM format or try a preset option.';
    if (fromModal) {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.editReply({ content: errorMsg });
    }
    return;
  }
  const discordTimestamp = `<t:${Math.floor(dt.toSeconds())}:F>`;
  const startTime = dt.toJSDate();
  const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000); // Use provided duration
  const durationHours = duration;
  // Create Discord Scheduled Event
  let scheduledEvent = null;
  try {
    scheduledEvent = await interaction.guild.scheduledEvents.create({
      name: title,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
      entityType: GuildScheduledEventEntityType.External,
      description: desc,
      entityMetadata: { location: location || 'TBA' }
    });
  } catch (e) {
    console.error('Failed to create scheduled event:', e);
  }
  // Google Calendar link
  const gcalLink = googleCalendarLink({ title, description: desc, start: startTime, end: endTime });
  // Minimal, wide event embed styled like the example
  const links = [
    scheduledEvent ? `[🔗 Event](${scheduledEvent.url})` : null,
    `[📅 Calendar](${gcalLink})`
  ].filter(Boolean).join(' ');
  const embed = new EmbedBuilder()
    .setColor('#00b0f4')
    .setTitle(`📅 **${title.toUpperCase()}**`);
  if (desc) embed.setDescription(`_${desc}_`);
  // Format timezone info
  const tzInfo = `${dt.offsetNameShort} (${dt.zoneName})`;
  
  embed.addFields(
    { name: 'Time', value: `${discordTimestamp}\n${tzInfo}`, inline: true },
    { name: 'Duration', value: `${durationHours} hour${durationHours !== 1 ? 's' : ''}`, inline: true },
    { name: '\u200B', value: '\u200B', inline: true }, // Spacer
    { name: 'Location', value: location || 'TBA', inline: false },
    { name: `✅ Attendees (0)`, value: 'No one yet', inline: true },
    { name: `🤔 Maybe (0)`, value: 'No one yet', inline: true },
    { name: `❌ No (0)`, value: 'No one yet', inline: true },
    { name: 'Links', value: links, inline: false }
  );
  embed.setFooter({ text: `Created by ${interaction.user.username}` });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(EVENT_BUTTONS.GOING)
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(EVENT_BUTTONS.MAYBE)
      .setEmoji('🤔')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(EVENT_BUTTONS.CANT)
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger)
  );
  const reply = await interaction.channel.send({ embeds: [embed], components: [row] });
  // Initialize RSVP state
  eventRSVPs[reply.id] = { going: new Set(), maybe: new Set(), cant: new Map(), title, when: `${discordTimestamp}\n${tzInfo}`, creator: interaction.user.id, desc, scheduledEventUrl: scheduledEvent?.url, gcalLink, durationHours, username: interaction.user.username, timezone, location };
  // Delete the persistent location button message if it exists
  if (eventLocationButtonMessages[interaction.user.id]) {
    try {
      const msg = await interaction.channel.messages.fetch(eventLocationButtonMessages[interaction.user.id]);
      await msg.delete();
    } catch {}
    delete eventLocationButtonMessages[interaction.user.id];
  }
  // Always reply to the modal interaction with a confirmation
  if (fromModal) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '✅ Event created and posted in this channel!', ephemeral: true });
    }
  } else {
    // For slash command, use editReply
    if (interaction.deferred) {
      await interaction.editReply({ content: '✅ Event created and posted in this channel!' });
    } else if (!interaction.replied) {
      await interaction.reply({ content: '✅ Event created and posted in this channel!' });
    }
  }
}

// Top-level error logging
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

// Ensure client.login is at the end and check for token
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_token_here') {
  console.error('❌ DISCORD_TOKEN is missing or invalid. Please set it in your Home Assistant add-on configuration.');
  process.exit(1);
}

console.log('🤖 Starting Legacy League Discord Bot...');
console.log('📊 Bot features: Player value calculator, event management, team coordination');

client.login(process.env.DISCORD_TOKEN);

// Global DM logger and simple DM reply for debugging
client.on('messageCreate', (msg) => {
  if (msg.channel.type === 1 && !msg.author.bot) {
    console.log(`[GLOBAL DM] Received DM from ${msg.author.tag}: ${msg.content}`);
    msg.reply('I got your DM!');
  }
});