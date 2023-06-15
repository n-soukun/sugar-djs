//!依存パッケージ!//
import {
	ApplicationCommandType,
	AutocompleteInteraction,
	Collection,
	Interaction,
} from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
//!依存パッケージ!//

import { parseCustomId } from './custom-id';
import { AnyCommandData, AnyComponentData } from './wraper';
import { AnyCommandInteraction, AnyComponentInteraction, MiddlewareInput } from './types';

export function collectBuilder(...pathList: string[]) {
	const collections = {
		slashCommand: new Collection<string, AnyCommandData>(),
		userContext: new Collection<string, AnyCommandData>(),
		messageContext: new Collection<string, AnyCommandData>(),
		component: new Collection<string, AnyComponentData>(),
	};

	// ファイル探索
	while (pathList.length) {
		const currentDir = pathList.shift();
		if (!currentDir) continue;

		const dirents = fs.readdirSync(currentDir, { withFileTypes: true });
		dirents.forEach((dirent) => {
			const filePath = path.join(currentDir, dirent.name);
			if (dirent.isDirectory()) {
				pathList.push(filePath); // ディレクトリの場合は探索キューに追加
			} else if (dirent.name.endsWith('.js')) {
				const item = require(filePath).default as AnyCommandData | AnyComponentData;
				if (!item || !('execute' in item)) return console.log('return');

				if ('data' in item) {
					// コマンドの場合
					if ('type' in item.data) {
						//コンテキストメニューコマンド
						if (item.data.type == ApplicationCommandType.User) {
							collections.userContext.set(item.data.name, item); // ユーザータイプ
						} else {
							collections.messageContext.set(item.data.name, item); // メッセージタイプ
						}
					} else {
						// スラッシュコマンド
						collections.slashCommand.set(item.data.name, item);
					}
				} else if ('customId' in item) {
					// コンポーネントの場合
					collections.component.set(item.customId, item);
				}
			}
		});
	}
	return {
		collections,
		commandDataJSON: () => {
			let commands = collections.slashCommand;
			commands = commands.concat(collections.userContext);
			commands = commands.concat(collections.messageContext);
			return commands.map((c) => c.data.toJSON());
		},
		handler: async (interaction: Interaction) => {
			if (interaction.isChatInputCommand()) {
				await executeCommand(interaction, collections.slashCommand);
			} else if (interaction.isAutocomplete()) {
				await executeAutocomplete(interaction, collections.slashCommand);
			} else if (interaction.isUserContextMenuCommand()) {
				await executeCommand(interaction, collections.userContext);
			} else if (interaction.isMessageContextMenuCommand()) {
				await executeCommand(interaction, collections.messageContext);
			} else if (
				interaction.isButton() ||
				interaction.isModalSubmit() ||
				interaction.isAnySelectMenu()
			) {
				await executeComponent(interaction, collections.component);
			}
		},
	};
}

/**
 * Execute a component process.
 * @param interaction AnyComponentInteraction
 * @param collection AnyCollection
 */
async function executeComponent<T extends AnyComponentInteraction>(
	interaction: T,
	collection: Collection<string, AnyComponentData>
) {
	const [customId, args] = parseCustomId(interaction.customId);
	const component = collection.get(customId);
	if (!component) {
		console.log(`Component "${interaction.customId}" not found.`);
	} else {
		try {
			let processInput: MiddlewareInput<T> & { args?: string[] } = {
				interaction,
				args,
			};
			let result: boolean = true;
			for (let i = 0; i < component.middlewares.length; i++) {
				const middleware = component.middlewares[i];
				try {
					processInput = await middleware(processInput);
				} catch (error) {
					console.error(error);
					result = false;
					break;
				}
			}
			if (result) {
				await component.execute(processInput);
			}
		} catch (error) {
			console.log(`Error on component "${interaction.customId}"`);
			console.error(error);
		}
	}
}

/**
 * Execute a command process.
 * @param interaction AnyComponentInteraction
 * @param collection AnyCollection
 */
async function executeCommand<T extends AnyCommandInteraction>(
	interaction: T,
	collection: Collection<string, AnyCommandData>
) {
	const command = collection.get(interaction.commandName);
	if (!command) {
		console.log(`Command "${interaction.commandName}" not found.`);
	} else {
		try {
			let processInput: MiddlewareInput<T> = { interaction };
			let result: boolean = true;
			for (let i = 0; i < command.middlewares.length; i++) {
				const middleware = command.middlewares[i];
				try {
					processInput = await middleware(processInput);
				} catch (error) {
					result = false;
					break;
				}
			}
			if (result) {
				await command.execute(processInput);
			}
		} catch (error) {
			console.log(`Error on component "${interaction.commandName}"`);
			console.error(error);
		}
	}
}

async function executeAutocomplete(
	interaction: AutocompleteInteraction,
	collection: Collection<string, AnyCommandData>
) {
	const command = collection.get(interaction.commandName);
	if (!command) {
		console.log(`Command "${interaction.commandName}" not found.`);
	} else {
		if (!command.autocomplete) return;
		await command.autocomplete(interaction);
	}
}
