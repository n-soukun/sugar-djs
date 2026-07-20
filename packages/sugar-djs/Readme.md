# Sugar-DJS

**English** | [日本語](./Readme.ja.md)

A library that makes writing discord.js bots in TypeScript easier and more enjoyable!

## Supported Versions

See `package.json` for the supported `discord.js` versions of each release.

## Usage Example

Example `SlashCommand`:

```typescript
import { wrapper } from 'sugar-djs';
import { SlashCommandBuilder } from 'discord.js';
import { isCachedInteraction } from './middlewares.ts';

export default wrapper
	.setCommand(
		// Use a discord.js builder as-is
		new SlashCommandBuilder()
			.setName('ping')
			.setDescription('Send "Pong!"')
	)
	.addMiddleware(isCachedInteraction) // Allow only cached interactions
	.setProcess(({ interaction }) => {
		// interaction: ChatInputCommandInteraction<"cached">;
		interaction.reply('Pong!');
	});
```

## Features

`Sugar-DJS` helps you build bots quickly by reducing the amount of explicit type annotation you need and making it easy to insert shared processing logic.

### Infers the Appropriate Interaction Type

`Sugar-DJS` infers the command handler's `interaction` type from the provided `Builder`.

```typescript
// Specifying the type manually
export const command = new SlashCommandBuilder().setName('ping');
export const execute = (interaction: ChatInputCommandInteraction) => {
	interaction.reply('Pong!');
};
```

```typescript
// With Sugar-DJS
export default wrapper
	.setCommand(new SlashCommandBuilder().setName('ping'))
	.setProcess(({ interaction }) => {
		// The correct type is inferred automatically
		interaction.reply('Pong!');
	});
```

### Middleware Support

You can add middleware before command or component handlers. Middleware processes a payload containing an `Interaction` and may return additional data. It can also narrow the shape of the payload.

#### Checking That an Interaction Is Cached

```typescript
import { AnyInteraction, MiddlewarePayload } from 'sugar-djs';

export const isCachedInteraction = <T extends AnyInteraction, U>({
	interaction,
	...payload
}: MiddlewarePayload<T, U>) => {
	if (!interaction.inCachedGuild()) {
		interaction.reply('Please run this command in a server.');
		return; // Returning void prevents the next handler from running.
	}
	return { interaction, ...payload };
};
```

## Setup

### 1. Create `sugardjs.ts`

Create a `WrapperCollection` instance by specifying the directories that contain your commands and components.

```typescript
// sugardjs.ts
import path from 'path';
import { WrapperCollection } from 'sugar-djs';

const commandsPath = path.join(__dirname, './commands');
const componentsPath = path.join(__dirname, './components');

export default await WrapperCollection.create({
	paths: [commandsPath, componentsPath],
});
```

### 2. Connect It to discord.js

Pass the `interactionCreateHandler` from the `WrapperCollection` created in step 1 to the discord.js `InteractionCreate` event handler.

```typescript
// index.ts
import wrappers from './sugardjs';
// ...
client.on('interactionCreate', wrappers.interactionCreateHandler);
// ...
```

### 3. Create `register.ts`

The `toJSON` method on the `WrapperCollection` created in step 1 makes it easy to register commands and components.

```typescript
// register.ts
import { REST, Routes } from 'discord.js';
import wrappers from './sugardjs';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const rest = new REST({ version: '10' }).setToken(TOKEN);
const commands = wrappers.toJSON(); // Returns a list of JSON objects accepted by the Discord API.
await rest.put(Routes.applicationCommands(CLIENT_ID), {
	body: commands,
});
```

## License

MIT License (see the `LICENSE` file).
