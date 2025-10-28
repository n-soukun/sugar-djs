# Sugar-DJS (discordjs-builder-wrapper)

Library for writing discord.js in TypeScript for more fun!

## Supported Versions

| package version | discord.js version |
|----|----|
| 0.4.0 | >=14.23.2 <15 |
| 0.3.0 | 14.24.0 |
| 0.2.1 | 14.23.2 |

# Usege

SlashCommand Example

```typescript
import { wrapper } from 'sugar-djs';
import { SlashCommandBuilder } from 'discord.js';

export default wrapper
	.setCommand(
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Send "Pong!"')
    )
	.setProcess(({ interaction }) => {
		interaction.reply('Pong!');
	});
```

# What is useful?

This library frees developers from the hassle of type specification.