import type {
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
	PrimaryEntryPointCommandInteraction,
	SlashCommandBuilder as SCB,
	ChatInputCommandInteraction,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction,
	SlashCommandSubcommandsOnlyBuilder,
	ApplicationCommandType,
	UserContextMenuCommandInteraction,
	MessageContextMenuCommandInteraction,
	SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

export type UnwrapOrDefault<V, D> = V extends undefined ? D : Exclude<V, undefined>;

export type MaybePromise<T> = T | Promise<T>;

/**
 * スマートコンポーネントで作れるコマンド
 */

type SlashCommandBuilder =
	| SCB
	| Omit<SCB, 'addSubcommand' | 'addSubcommandGroup'>
	| SlashCommandOptionsOnlyBuilder
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
	| MessageContextMenuCommandInteraction<Cached>
	| PrimaryEntryPointCommandInteraction<Cached>;

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
export type inferInteraction<
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
	? CommandType extends ApplicationCommandType.User
		? UserContextMenuCommandInteraction
		: CommandType extends ApplicationCommandType.Message
		? MessageContextMenuCommandInteraction
		: never
	: never;

/**
 * コマンドビルダーからコマンドタイプへ変換
 */
export type inferInteractionType<T extends AnyCommandBuilder> = T extends SlashCommandBuilder
	? ApplicationCommandType.ChatInput
	: T extends ContextMenuCommandBuilder
	? T['type']
	: never;

/**
 * コマンドタイプからコンテキストメニューインタラクションへ変換
 */
// export type inferCommandType<CommandType extends ApplicationCommandType> =
// 	CommandType extends ApplicationCommandType.User
// 		? UserContextMenuCommandInteraction
// 		: CommandType extends ApplicationCommandType.Message
// 		? MessageContextMenuCommandInteraction
// 		: never;

export type MiddlewarePayload<T extends AnyInteraction = AnyInteraction<any>, U extends any = {}> = {
	interaction: T;
} & U;

export interface MiddlewarePayloadWithArgs<T extends AnyComponentInteraction = AnyComponentInteraction<any>>
	extends MiddlewarePayload<T, { args: string[] }> {
	interaction: T;
	args: string[];
}

export type Middleware<
	T extends AnyInteraction = AnyInteraction<any>,
	U extends any = {},
	V extends MiddlewarePayload<T, U> = MiddlewarePayload<T, U>
> = (input: MiddlewarePayload<T, U>) => MaybePromise<V | void>;
