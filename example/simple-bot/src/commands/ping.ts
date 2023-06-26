import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from 'discord.js';
import { wraper } from '../../../../package/dist';
import pongButton from '../components/PongButton';
import helloWorldButton from '../components/ExampleButton';
import { checkGuildCache } from '../middlewares';

export default wraper
	.setCommand(
		new SlashCommandBuilder().setName('ping').setDescription('Send button and message!')
	)
	.addMiddleware(checkGuildCache)
	.setProcess(({ interaction }) => {
		const components = [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				pongButton.component({ label: 'Pong!' }, [interaction.member.displayName]),
				helloWorldButton.component()
			),
		];
		interaction.reply({ content: 'Ping!', components });
	});
