# Suger-DJS (discordjs-builder-wrapper)

Library for writing discord.js in TypeScript for more fun!

# Usege

SlashCommand Example

```typescript
import { wrapper } from 'suger-djs';
import { SlashCommandBuilder } from 'discord.js';

export default wrapper
	.setCommand(
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Send "Pong!"')
    )
	.setProcess(({ interaction }) => {
		interaction.reply('Ping!');
	});
```

# What is useful?

This library frees developers from the hassle of type specification.