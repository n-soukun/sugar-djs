import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { wraper } from '../../../../package/dist';
import { checkGuildCache, exampleMiddlewareA, exampleMiddlewareB } from '../middlewares';

export default wraper
	.setCommand(
		new SlashCommandBuilder()
			.setName('middleware-test')
			.setDescription('Return result of middleware test.')
	)
	.addMiddleware(checkGuildCache)
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
