import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { wraper } from '../../../../package/dist/';

interface PongButtonInput {
	label: string;
}

const pongButton = wraper
	.setComponent((input: PongButtonInput) =>
		new ButtonBuilder().setLabel(input.label).setStyle(ButtonStyle.Primary)
	)
	.useArgs((z) => z.nonempty().length(1))
	.setProcess(({ interaction, args }) => {
		interaction.reply('Pong! by' + args[0]);
	});

export default pongButton;
