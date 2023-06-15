import path from 'node:path';
import { collectBuilder } from '../../../package/dist';

export const { commandDataJSON, handler } = collectBuilder(
	path.join(__dirname, './commands'),
	path.join(__dirname, './components')
);
