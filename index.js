// Import necessary classes and functions from discord.js
const { Client, GatewayIntentBits, Partials } = require('discord.js');
// Load environment variables from a .env file
require('dotenv').config();

// Create a new client instance with specified intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Allows the bot to receive guild-related events
    GatewayIntentBits.GuildMembers,     // Required to listen for the guildMemberAdd event
    GatewayIntentBits.GuildMessages,    // Allows the bot to send and receive messages in guild text channels
    GatewayIntentBits.MessageContent     // Required to read the content of messages
  ],
  partials: [Partials.GuildMember]      // Enables handling of partial guild member data (useful for caching)
});

// Event fired when the bot is ready and successfully logged in
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`); // Log the bot's username to the console
});

// Event fired whenever a new member joins any guild the bot is in
client.on('guildMemberAdd', async (member) => {
  try {
    // Attempt to find a text channel named 'welcome' in the guild
    const welcomeChannel = member.guild.channels.cache.find(
      channel => channel.name === 'welcome' && channel.isTextBased() // Check if the channel is text-based
    );

    // Create a welcome message mentioning the new member
    const welcomeMessage = `Welcome <@${member.id}>! It's a pleasure to have you with us!`;

    if (welcomeChannel) {
      // If the welcome channel exists, send the welcome message there
      await welcomeChannel.send(welcomeMessage);
    } else if (member.guild.systemChannel && member.guild.systemChannel.isTextBased()) {
      // If no 'welcome' channel is found, fallback to the system channel if it exists and is text-based
      await member.guild.systemChannel.send(welcomeMessage);
    } else {
      // If neither channel is found, log a message to the console
      console.log(`No welcome or system channel found in guild: ${member.guild.name}`);
    }
  } catch (error) {
    // Catch and log any errors that occur while sending the welcome message
    console.error('Error sending welcome message:', error);
  }
});

// Log the client into Discord using the token from environment variables
client.login(process.env.TOKEN).catch(error => {
  // Log an error message if the login fails
  console.error('Failed to login:', error);
});
