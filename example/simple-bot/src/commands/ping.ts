import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from 'discord.js';
import { wraper } from '../../../../package/dist';
import pongButton from '../components/PongButton';

export default wraper
	.setCommand(
		new SlashCommandBuilder().setName('ping').setDescription('Send button and message!')
	)
	.setProcess(({ interaction }) => {
		if (!interaction.inCachedGuild()) return;
		const button = pongButton.component({ label: 'Pong!' }, [interaction.member.displayName]);
		const components = [new ActionRowBuilder<ButtonBuilder>().addComponents(button)];
		interaction.reply({ content: 'Ping!', components });
	});
