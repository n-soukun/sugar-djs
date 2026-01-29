import { ApplicationCommandType, type AutocompleteInteraction, Collection, type Interaction } from 'discord.js';
import fs from 'fs';
import path from 'path';

import { parseCustomId } from './custom-id.js';
import type { AnyCommandData, AnyComponentData } from './wrapper.js';
import type {
	AnyCommandInteraction,
	AnyComponentInteraction,
	AnyInteraction,
	MaybePromise,
	Middleware,
	MiddlewarePayload,
} from './types.js';

const pathToFileURL = (filePath: string): URL => {
	const isAbsolute = path.isAbsolute(filePath);
	const resolvedPath = isAbsolute ? path.resolve(filePath) : path.resolve(process.cwd(), filePath);
	const fileUrl = new URL(`file://${resolvedPath.split(path.sep).join('/')}`);
	return fileUrl;
};

export interface WrapperCollectionOptions {
	paths: string[];
}

export interface WrapperCollectionCollections {
	slashCommands: Collection<string, AnyCommandData>;
	userCtxCommands: Collection<string, AnyCommandData>;
	messageCtxCommands: Collection<string, AnyCommandData>;
	components: Collection<string, AnyComponentData>;
}

export class WrapperCollection {
	constructor(
		public readonly collections: WrapperCollectionCollections,
		public readonly options: WrapperCollectionOptions
	) {}

	public static async create(options: WrapperCollectionOptions): Promise<WrapperCollection> {
		const collections = {
			slashCommands: new Collection<string, AnyCommandData>(),
			userCtxCommands: new Collection<string, AnyCommandData>(),
			messageCtxCommands: new Collection<string, AnyCommandData>(),
			components: new Collection<string, AnyComponentData>(),
		};

		// ファイル探索
		let pathList = options.paths;
		while (pathList.length) {
			const currentDir = pathList.shift();
			if (!currentDir) continue;

			const dirents = fs.readdirSync(currentDir, { withFileTypes: true });
			for (const dirent of dirents) {
				const filePath = path.join(currentDir, dirent.name);
				if (dirent.isDirectory()) {
					pathList.push(filePath); // ディレクトリの場合は探索キューに追加
				} else if (
					dirent.name.endsWith('.js') ||
					(dirent.name.endsWith('.ts') && !dirent.name.endsWith('.d.ts'))
				) {
					const fileUrl = pathToFileURL(filePath).href;
					let fileData: unknown = await import(fileUrl);
					if (!fileData) continue;
					if (typeof fileData === 'object' && 'default' in fileData) {
						fileData = fileData.default;
					}
					const item = fileData as AnyCommandData | AnyComponentData;
					if (!('execute' in item)) continue;

					if ('data' in item) {
						// Any Command
						if ('type' in item.data) {
							// AnyContextMenuCommand
							if (item.data.type == ApplicationCommandType.User) {
								// UserContextMenuCommand
								collections.userCtxCommands.set(item.data.name, item);
							} else if (item.data.type == ApplicationCommandType.Message) {
								// MessageContextMenuCommand
								collections.messageCtxCommands.set(item.data.name, item);
							}
						} else {
							// SlashCommand
							collections.slashCommands.set(item.data.name, item);
						}
					} else if ('customId' in item) {
						// Any Component
						collections.components.set(item.customId, item);
					}
				}
			}
		}
		return new WrapperCollection(collections, options);
	}

	/**
	 * Return json list for registering commands to Discord.
	 */
	public toJSON = (): string[] => {
		let commands = this.collections.slashCommands;
		commands = commands.concat(this.collections.userCtxCommands);
		commands = commands.concat(this.collections.messageCtxCommands);
		return commands.map((c) => c.data.toJSON());
	};

	public interactionCreateHandler = async <T extends Interaction>(interaction: T) => {
		if (interaction.isCommand()) {
			await this.executeCommand(interaction);
		} else if (interaction.isAutocomplete()) {
			await this.executeAutocomplete(interaction);
		} else if (interaction.isButton() || interaction.isModalSubmit() || interaction.isAnySelectMenu()) {
			await this.executeComponent(interaction);
		}
	};

	/**
	 * Execute a component process.
	 * @param interaction AnyComponentInteraction
	 * @param collection AnyCollection
	 */
	private async executeComponent<T extends AnyComponentInteraction>(interaction: T) {
		const [customId, args] = parseCustomId(interaction.customId);
		const component = this.collections.components.get(customId);
		if (!component) {
			console.log(`Component "${interaction.customId}" not found.`);
		} else {
			try {
				this.execute({ interaction, args }, component.execute, [...component.middlewares]);
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
	private async executeCommand<T extends AnyCommandInteraction>(interaction: T) {
		let command;
		let commandType: string = 'Unknown';
		if (interaction.isChatInputCommand()) {
			commandType = 'SlashCommand';
			command = this.collections.slashCommands.get(interaction.commandName);
		} else if (interaction.isUserContextMenuCommand()) {
			commandType = 'UserContextMenuCommand';
			command = this.collections.userCtxCommands.get(interaction.commandName);
		} else if (interaction.isMessageContextMenuCommand()) {
			commandType = 'MessageContextMenuCommand';
			command = this.collections.messageCtxCommands.get(interaction.commandName);
		}
		if (!command) {
			console.log(`${commandType} "${interaction.commandName}" not found.`);
		} else {
			try {
				this.execute({ interaction }, command.execute, [...command.middlewares]);
			} catch (error) {
				console.log(`Error on ${commandType} "${interaction.commandName}"`);
				console.error(error);
			}
		}
	}

	/**
	 * Execute an autocomplete process.
	 * @param interaction
	 * @param collection
	 *
	 */
	private async executeAutocomplete(interaction: AutocompleteInteraction) {
		const command = this.collections.slashCommands.get(interaction.commandName);
		if (!command) {
			console.log(`Command "${interaction.commandName}" not found.`);
		} else if (command.autocomplete) {
			await command.autocomplete(interaction);
		}
	}

	/**
	 * Execute middlewares and command.
	 * @param payload MiddlewarePayload
	 * @param command AnyCommand and AnyComponent execute function
	 * @param middlewares Array of Middleware
	 */
	private async execute<
		T extends AnyInteraction = AnyInteraction<any>,
		U extends object = {},
		V extends MiddlewarePayload<T, U> = MiddlewarePayload<T, U>,
	>(
		payload: V,
		command: (input: MiddlewarePayload<T>) => MaybePromise<void>,
		middlewares: Middleware<T, U>[]
	): Promise<void> {
		const middleware = middlewares.shift();
		if (middleware) {
			const mwResult = await middleware(payload);
			if (mwResult) {
				return await this.execute(mwResult, command, middlewares);
			}
		} else {
			return command(payload);
		}
	}
}
