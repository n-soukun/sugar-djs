import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from 'discord.js';
import { wrapper } from '../../../../package/dist';
import pongButton from '../components/PongButton';
import helloWorldButton from '../components/ExampleButton';
import { isCachedGuild } from '../middlewares';

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
