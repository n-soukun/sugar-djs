import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { wrapper } from '../../../../package/dist';
import { exampleMiddlewareA, exampleMiddlewareB, isCachedGuild } from '../middlewares';

export default wrapper
	.setCommand(
		new SlashCommandBuilder()
			.setName('middleware-test')
			.setDescription('Return result of middleware test.')
	)
	.addMiddleware(isCachedGuild)
	.addMiddleware(exampleMiddlewareA)
	.addMiddleware(exampleMiddlewareB)
	.setProcess(({ interaction, exampleA, exampleB }) => {
		const embed = new EmbedBuilder()
			.setTitle('Middleware Test Result')
			.setDescription(`exampleA: ${exampleA}, exampleB: ${exampleB}`);
		interaction.reply({
			embeds: [embed],
		});
	});
