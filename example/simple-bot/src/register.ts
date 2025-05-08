import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import wrappers from './sugerdjs';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) throw new Error('ENV Error!');

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		const commands = wrappers.toJSON();
		await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
			body: commands,
		});
		console.log('Success!');
	} catch (error) {
		console.error(error);
	}
})();
