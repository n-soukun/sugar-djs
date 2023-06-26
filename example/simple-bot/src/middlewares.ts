import { EmbedBuilder } from 'discord.js';
import { AnyInteraction, MiddlewareInput } from '../../../package/dist';

export const checkGuildCache = <T extends AnyInteraction>({ interaction }: MiddlewareInput<T>) => {
	if (!interaction.inCachedGuild()) {
		const embed = new EmbedBuilder()
			.setTitle('不正な操作です')
			.setDescription('サーバー内で実行してください');
		interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
		throw new Error();
	}
	return { interaction };
};
