import { MiddlewareInput } from '../../../package/dist';

export function checkGuildCache({ interaction }: MiddlewareInput) {
	if (interaction.inCachedGuild()) {
		return interaction;
	} else {
		interaction.reply({ content: 'Error: Send the command in the server!', ephemeral: true });
		throw new Error();
	}
}
