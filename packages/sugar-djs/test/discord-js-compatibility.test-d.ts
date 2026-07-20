import {
	ApplicationCommandType,
	ButtonBuilder,
	type ButtonInteraction,
	type ChatInputCommandInteraction,
	ContextMenuCommandBuilder,
	type UserContextMenuCommandInteraction,
	SlashCommandBuilder,
} from 'discord.js';

import { wrapper, type AnyInteraction, type MiddlewarePayload } from '../src/index.js';

const slash = wrapper
	.setCommand(new SlashCommandBuilder().setName('ping').setDescription('Replies with pong'))
	.addMiddleware((payload) => ({ ...payload, authorized: true as const }))
	.setProcess(({ interaction, authorized }) => {
		const typedInteraction: ChatInputCommandInteraction = interaction;
		const typedAuthorized: true = authorized;
		void typedInteraction;
		void typedAuthorized;
	});

const userContextMenu = wrapper
	.setCtxCommand(new ContextMenuCommandBuilder().setName('Inspect user'))
	.setType(ApplicationCommandType.User)
	.setProcess(({ interaction }) => {
		const typedInteraction: UserContextMenuCommandInteraction = interaction;
		void typedInteraction;
	});

const button = wrapper
	.setComponent(new ButtonBuilder().setCustomId('confirm').setLabel('Confirm'))
	.useArgs((schema) => schema.length(2))
	.setProcess(({ interaction, args }) => {
		const typedInteraction: ButtonInteraction = interaction;
		const typedArgs: string[] = args;
		void typedInteraction;
		void typedArgs;
	});

const payload: MiddlewarePayload<AnyInteraction> = { interaction: {} as AnyInteraction };

void slash;
void userContextMenu;
void button;
void payload;
