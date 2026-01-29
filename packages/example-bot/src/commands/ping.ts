import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from 'discord.js';
import { wrapper } from 'sugar-djs';
import pongButton from '../components/PongButton.js';
import helloWorldButton from '../components/ExampleButton.js';
import { isCachedGuild } from '../middlewares.js';

export default wrapper
	.setCommand(
		new SlashCommandBuilder().setName('ping').setDescription('Send button and message!')
	)
	.addMiddleware(isCachedGuild)
	.setProcess(({ interaction }) => {
		const components = [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				pongButton.component({ label: 'Pong!' }, [interaction.member.displayName]),
				helloWorldButton.component
			),
		];
		interaction.reply({ content: 'Ping!', components });
	});
