import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { wrapper } from '../../../../package/dist/';
import { exampleMiddlewareC } from '../middlewares';

interface PongButtonInput {
	label: string;
}

const pongButton = wrapper
	.setComponent(
		(input: PongButtonInput) =>
			new ButtonBuilder()
				.setCustomId('pong_button')
				.setLabel(input.label)
				.setStyle(ButtonStyle.Primary),
		{ label: 'Pong!' }
	)
	.addMiddleware(exampleMiddlewareC)
	.useArgs((z) => z.nonempty().length(1))
	.setProcess(({ interaction, args }) => {
		interaction.reply('Pong! by' + args[0]);
	});

export default pongButton;
