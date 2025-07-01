// Import necessary classes and functions from discord.js
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ChannelType } = require('discord.js');
// Load environment variables from a .env file
require('dotenv').config();
const express = require('express')
const app = express()
const port = process.env.PORT || 5000

const DISCORD_BOT_TOKEN = process.env.TOKEN
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID

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
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Bot ID: ${client.user.id}`);
    console.log(`Target channel ID: ${TARGET_CHANNEL_ID}`);
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

app.use(express.json())

app.post('/github-pr-webhook', async (req, res) => {
  try {
        const payload = req.body;
        console.log("Received GitHub webhook:", JSON.stringify(payload, null, 2));

        // Extract relevant information from the GitHub payload
        const action = payload.action;
        const pullRequest = payload.pull_request;
        const repository = payload.repository;

        if (!pullRequest || !repository) {
            console.error("Invalid GitHub payload: Missing pull_request or repository.");
            return res.status(400).json({ message: "Invalid GitHub payload: Missing pull_request or repository." });
        }

        const prTitle = pullRequest.title;
        const prUrl = pullRequest.html_url;
        const prAuthor = pullRequest.user ? pullRequest.user.login : 'Unknown';
        const repoFullName = repository.full_name;

        // Find the target channel
        const channel = await client.channels.fetch(TARGET_CHANNEL_ID);

        if (!channel) {
            console.error(`Error: Channel with ID ${TARGET_CHANNEL_ID} not found.`);
            return res.status(500).json({ message: "Discord channel not found." });
        }

        if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.PrivateThread && channel.type !== ChannelType.PublicThread) {
            console.error(`Error: Channel ${TARGET_CHANNEL_ID} is not a text channel or thread.`);
            return res.status(500).json({ message: "Target channel is not a text channel or thread." });
        }

        // Construct the Discord message embed
        const embed = new EmbedBuilder()
            .setTitle(`New Pull Request: ${prTitle}`)
            .setURL(prUrl)
            .setDescription(`Action: **${action.charAt(0).toUpperCase() + action.slice(1)}**\nRepository: \`${repoFullName}\`\nAuthor: \`${prAuthor}\``)
            .setColor(0x0099FF) // A nice blue color
            .addFields(
                { name: 'Link', value: `[View Pull Request](${prUrl})`, inline: false }
            )
            .setTimestamp(new Date(pullRequest.created_at)) // Use PR creation timestamp
            .setFooter({ text: 'Via GitHub Actions' });

        // Send the message
        await channel.send({ embeds: [embed] });
        console.log("Notification sent to Discord.");
        res.status(200).json({ message: "Notification sent to Discord." });

    } catch (error) {
        console.error('Error handling GitHub webhook:', error);
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Log the client into Discord using the token from environment variables
client.login(DISCORD_BOT_TOKEN).catch(error => {
  // Log an error message if the login fails
  console.error('Failed to login:', error);
});
