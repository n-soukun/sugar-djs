import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from 'discord.js';
import { wrapper } from 'sugar-djs';
import pongButton from '../components/PongButton.js';
import helloWorldButton from '../components/ExampleButton.js';
import { isCachedGuild } from '../middlewares.js';

export default wrapper
	.setCommand(
		new SlashCommandBuilder()
			.setName('set-reminder')
			.setDescription('Send a DM to the user!')
			.setDescriptionLocalization('ja', 'リマインダーを設定します')
			.addIntegerOption((option) =>
				option
					.setName('hours')
					.setNameLocalization('ja', '時')
					.setDescription('Hour to send daily reminder')
					.setDescriptionLocalization('ja', '毎日リマイダーを送る時刻')
					.setRequired(true)
			)
			.addIntegerOption((option) =>
				option
					.setName('minutes')
					.setNameLocalization('ja', '分')
					.setDescription('Minute to send daily reminder')
					.setDescriptionLocalization('ja', '毎日リマイダーを送る時刻')
					.setRequired(true)
			)
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
