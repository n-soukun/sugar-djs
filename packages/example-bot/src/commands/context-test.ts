import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';
import { wrapper } from 'sugar-djs';
import { isCachedGuild } from '../middlewares.js';

export default wrapper
	.setCtxCommand(new ContextMenuCommandBuilder().setName('Test Context'))
	.setType(ApplicationCommandType.Message)
	.addMiddleware(isCachedGuild)
	.setProcess(({ interaction }) => {
		interaction.targetMessage.reply('This is a context menu command!');
	});
