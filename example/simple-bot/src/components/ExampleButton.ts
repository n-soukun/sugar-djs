import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { wrapper } from '../../../../package/dist/';

const helloWorldButton = wrapper
	.setComponent(
		new ButtonBuilder()
			.setCustomId('hello_world_button')
			.setLabel('Greet')
			.setStyle(ButtonStyle.Primary)
	)
	.setProcess(({ interaction }) => {
		interaction.reply('hello, world!');
	});

export default helloWorldButton;
