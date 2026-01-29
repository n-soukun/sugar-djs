import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import wrappers from './sugardjs.js';

dotenv.config();

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

client.once('clientReady', () => {
	console.log(`Ready! Logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', wrappers.interactionCreateHandler);

client.login(process.env.DISCORD_TOKEN);
