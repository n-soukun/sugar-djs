import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';
import { wrapper } from '../../../../package/dist';
import { isCachedGuild } from '../middlewares';

export default wrapper
	.setCommand(new ContextMenuCommandBuilder().setName('Test Context'))
	.setType(ApplicationCommandType.Message)
	.addMiddleware(isCachedGuild)
	.setProcess(({ interaction }) => {
		interaction.targetMessage.reply('This is a context menu command!');
	});
