import {
	ButtonBuilder,
	ModalBuilder,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
	RoleSelectMenuBuilder,
	MentionableSelectMenuBuilder,
	ChannelSelectMenuBuilder,
	CacheType,
	ButtonInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
	RoleSelectMenuInteraction,
	MentionableSelectMenuInteraction,
	ChannelSelectMenuInteraction,
	SlashCommandBuilder as SCB,
	ChatInputCommandInteraction,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction,
	SlashCommandSubcommandsOnlyBuilder,
	ApplicationCommandType,
	UserContextMenuCommandInteraction,
	MessageContextMenuCommandInteraction,
} from 'discord.js';

/**
 * スマートコンポーネントで作れるコマンド
 */

type SlashCommandBuilder =
	| SCB
	| Omit<SCB, 'addSubcommand' | 'addSubcommandGroup'>
	| SlashCommandSubcommandsOnlyBuilder;

export type AnyCommandBuilder = SlashCommandBuilder | ContextMenuCommandBuilder;

/**
 * スマートコンポーネントで作れるコンポーネント
 */
export type AnyComponentBuilder =
	| ButtonBuilder
	| ModalBuilder
	| StringSelectMenuBuilder
	| UserSelectMenuBuilder
	| RoleSelectMenuBuilder
	| MentionableSelectMenuBuilder
	| ChannelSelectMenuBuilder;

export type AnyBuilder = AnyCommandBuilder | AnyComponentBuilder;

/**
 * スマートコンポーネントで扱うコマンドインタラクション
 */
export type AnyCommandInteraction<Cached extends CacheType = CacheType> =
	| ChatInputCommandInteraction<Cached>
	| ContextMenuCommandInteraction<Cached>
	| UserContextMenuCommandInteraction<Cached>
	| MessageContextMenuCommandInteraction<Cached>;

/**
 * スマートコンポーネントで扱うコンポーネントインタラクション
 */
export type AnyComponentInteraction<Cached extends CacheType = CacheType> =
	| ButtonInteraction<Cached>
	| ModalSubmitInteraction<Cached>
	| StringSelectMenuInteraction<Cached>
	| StringSelectMenuInteraction<Cached>
	| UserSelectMenuInteraction<Cached>
	| RoleSelectMenuInteraction<Cached>
	| MentionableSelectMenuInteraction<Cached>
	| ChannelSelectMenuInteraction<Cached>;

export type AnyInteraction<Cached extends CacheType = CacheType> =
	| AnyCommandInteraction<Cached>
	| AnyComponentInteraction<Cached>;

/**
 * ビルダーからインターフェースへ変換
 */
export type inferBuilder<
	Builder extends AnyBuilder,
	CommandType extends ApplicationCommandType = ApplicationCommandType
> = Builder extends ButtonBuilder
	? ButtonInteraction
	: Builder extends ModalBuilder
	? ModalSubmitInteraction
	: Builder extends StringSelectMenuBuilder
	? StringSelectMenuInteraction
	: Builder extends UserSelectMenuBuilder
	? UserSelectMenuInteraction
	: Builder extends RoleSelectMenuBuilder
	? RoleSelectMenuInteraction
	: Builder extends MentionableSelectMenuBuilder
	? MentionableSelectMenuInteraction
	: Builder extends ChannelSelectMenuBuilder
	? ChannelSelectMenuInteraction
	: Builder extends SlashCommandBuilder
	? ChatInputCommandInteraction
	: Builder extends ContextMenuCommandBuilder
	? inferCommandType<CommandType>
	: never;

export type inferCommandType<CommandType extends ApplicationCommandType> =
	CommandType extends ApplicationCommandType.User
		? UserContextMenuCommandInteraction
		: CommandType extends ApplicationCommandType.Message
		? MessageContextMenuCommandInteraction
		: never;

export interface MiddlewareInput<T extends AnyInteraction = AnyInteraction<any>> {
	interaction: T;
}

export interface MiddlewareInputWithArgs<
	T extends AnyComponentInteraction = AnyComponentInteraction<any>
> extends MiddlewareInput<T> {
	interaction: T;
	args: string[];
}

export type DiscateMiddleware<
	T extends AnyInteraction = AnyInteraction,
	U extends MiddlewareInput<T> = MiddlewareInput<T>
> = (input: MiddlewareInput<T>) => U;
