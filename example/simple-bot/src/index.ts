import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { handler } from './builders';

dotenv.config();

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
	console.log(`Ready! Logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', handler);

client.login(process.env.DISCORD_TOKEN);
