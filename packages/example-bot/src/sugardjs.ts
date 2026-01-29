import path from 'node:path';
import { WrapperCollection } from 'sugar-djs';

const commandsPath = path.join(import.meta.dirname, './commands');
const componentsPath = path.join(import.meta.dirname, './components');

const collection = await WrapperCollection.create({
	paths: [commandsPath, componentsPath],
});

export default collection;
