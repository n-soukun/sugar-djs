import { SlashCommandBuilder, inlineCode } from 'discord.js';
import { wraper } from '../../../../package/dist';

export default wraper
	.setCommand(
		new SlashCommandBuilder()
			.setName('color')
			.setDescription('Get color code.')
			.addStringOption((option) =>
				option
					.setName('name')
					.setDescription('Plase type color name.')
					.setAutocomplete(true)
					.setRequired(true)
			)
	)
	.setAutocomplete(async (interaction) => {
		const focusedValue = interaction.options.getFocused();
		const choices = [
			{
				name: 'white',
				value: '#ffffff',
			},
			{
				name: 'black',
				value: '#000000',
			},
			{
				name: 'red',
				value: '#ff0000',
			},
			{
				name: 'green',
				value: '#00ff00',
			},
			{
				name: 'blue',
				value: '#0000ff',
			},
		];
		const filtered = choices.filter((choices) => choices.name.startsWith(focusedValue));
		await interaction.respond(filtered);
	})
	.setProcess(async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;
		const colorCode = interaction.options.getString('name', true);
		await interaction.reply('Color code: ' + inlineCode(colorCode));
	});
