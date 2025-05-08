import { EmbedBuilder } from 'discord.js';
import { AnyInteraction, MiddlewarePayload } from '../../../package/dist';

type CachedAnyInteraction = AnyInteraction<'cached'>;

export const isCachedGuild = <T extends AnyInteraction, U>({
	interaction,
	...payload
}: MiddlewarePayload<T, U>) => {
	if (!interaction.inCachedGuild()) {
		const embed = new EmbedBuilder()
			.setTitle('不正な操作です')
			.setDescription('サーバー内で実行してください');
		interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
		return; // エラーをスローせずに終了
	}
	return { interaction, ...payload };
};

export const exampleMiddlewareA = <T extends CachedAnyInteraction, U>(
	payload: MiddlewarePayload<T, U>
) => {
	return {
		exampleA: 'exampleA',
		...payload,
	};
};

export const exampleMiddlewareB = <T extends CachedAnyInteraction, U extends { exampleA: string }>(
	payload: MiddlewarePayload<T, U>
) => {
	return {
		exampleB: payload.exampleA + ', exampleB',
		...payload,
	};
};
