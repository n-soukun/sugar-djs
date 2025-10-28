import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';
import { wrapper } from '../../../../package/dist';
import { isCachedGuild } from '../middlewares';

export default wrapper
	.setCommand(
		new ContextMenuCommandBuilder().setType(ApplicationCommandType.User).setName('Test Context')
	)
	.addMiddleware(isCachedGuild)
	.setProcess(({ interaction }) => {
		interaction.reply({ content: 'Ping!' });
	});
