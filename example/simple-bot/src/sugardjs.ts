import path from 'node:path';
import { WrapperCollection } from '../../../package/dist';

const commandsPath = path.join(__dirname, './commands');
const componentsPath = path.join(__dirname, './components');

export default new WrapperCollection({
	paths: [commandsPath, componentsPath],
});
