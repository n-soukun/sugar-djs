import {
	ActionRowBuilder,
	ApplicationCommandType,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ContextMenuCommandBuilder,
	MentionableSelectMenuBuilder,
	ModalBuilder,
	RoleSelectMenuBuilder,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle,
	UserSelectMenuBuilder,
} from 'discord.js';
import { describe, expect, jest, test } from '@jest/globals';

import { wrapper } from '../dist/index.js';

describe('discord.js compatibility', () => {
	const modalInput = new TextInputBuilder()
		.setCustomId('value')
		.setLabel('Value')
		.setStyle(TextInputStyle.Short);

	test('wraps a slash command and preserves its discord.js builder', () => {
		const builder = new SlashCommandBuilder().setName('ping').setDescription('Replies with pong');
		const autocomplete = jest.fn();
		const process = jest.fn();

		const command = wrapper
			.setCommand(builder)
			.setAutocomplete(autocomplete)
			.addMiddleware((payload) => payload)
			.setProcess(process);

		expect(command.data).toBe(builder);
		expect(command.data.toJSON()).toMatchObject({ name: 'ping', description: 'Replies with pong' });
		expect(command.autocomplete).toBe(autocomplete);
		expect(command.middlewares).toHaveLength(1);
		command.execute({ interaction: {} });
		expect(process).toHaveBeenCalledTimes(1);
	});

	test.each([
		['user', ApplicationCommandType.User],
		['message', ApplicationCommandType.Message],
	])('wraps a %s context menu command', (name, type) => {
		const builder = new ContextMenuCommandBuilder().setName(name);
		const command = wrapper.setCtxCommand(builder).setType(type).setProcess(jest.fn());

		expect(command.data.toJSON()).toMatchObject({ name, type });
	});

	test.each([
		[
			'button',
			new ButtonBuilder().setCustomId('button').setLabel('Button').setStyle(ButtonStyle.Primary),
		],
		[
			'modal',
			new ModalBuilder()
				.setCustomId('modal')
				.setTitle('Modal')
				.addComponents(new ActionRowBuilder().addComponents(modalInput)),
		],
		['string select', new StringSelectMenuBuilder().setCustomId('string-select')],
		['user select', new UserSelectMenuBuilder().setCustomId('user-select')],
		['role select', new RoleSelectMenuBuilder().setCustomId('role-select')],
		['mentionable select', new MentionableSelectMenuBuilder().setCustomId('mentionable-select')],
		['channel select', new ChannelSelectMenuBuilder().setCustomId('channel-select')],
	])('wraps a discord.js %s builder', (_name, builder) => {
		const component = wrapper.setComponent(builder).setProcess(jest.fn());

		expect(component.component).toBe(builder);
		expect(component.customId).toBe(builder.toJSON().custom_id);
	});

	test('creates a component from a factory and encodes arguments in its custom id', () => {
		const factory = ({ label }) =>
			new ButtonBuilder().setCustomId('action').setLabel(label).setStyle(ButtonStyle.Primary);
		const component = wrapper
			.setComponent(factory, { label: 'Default' })
			.useArgs((schema) => schema.length(2))
			.setProcess(jest.fn());

		const builder = component.component({ label: 'Run' }, ['a&b', 'c?d']);

		expect(builder.toJSON()).toMatchObject({
			custom_id: 'action?a$a;b&c$q;d',
			label: 'Run',
		});
		expect(component.args.safeParse(['first', 'second']).success).toBe(true);
		expect(component.args.safeParse(['only-one']).success).toBe(false);
	});
});
