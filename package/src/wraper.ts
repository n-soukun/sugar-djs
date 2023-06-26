import {
	ApplicationCommandType,
	AutocompleteInteraction,
	ContextMenuCommandBuilder,
	ContextMenuCommandType,
} from 'discord.js';
import { z } from 'zod';

import {
	AnyCommandBuilder,
	AnyCommandInteraction,
	AnyComponentBuilder,
	AnyComponentInteraction,
	DiscateMiddleware,
	MiddlewareInput,
	UnwrapOrDefault,
	inferBuilder,
	inferCommandType,
} from './types';
import { encodeId } from './custom-id';

/*////////////////////////////////////////////////////////////
	CommandBuilderWraper
////////////////////////////////////////////////////////////*/

type AutocompleteProcess = (input: AutocompleteInteraction) => void;

/**
 * コマンドビルダーの型情報
 */
interface CommandBuilderParms<
	Builder extends AnyCommandBuilder = AnyCommandBuilder,
	BuilderType extends ApplicationCommandType = ApplicationCommandType,
	Interaction extends AnyCommandInteraction = AnyCommandInteraction<any>
> {
	_builder: Builder;
	_builderType: BuilderType;
	_processInputData: MiddlewareInput<Interaction>;
	_interaction: Interaction;
}

/**
 * コマンドビルダーが保持するデータ
 */
interface CommandBuilderDef<TParms extends CommandBuilderParms> {
	builder: TParms['_builder'];
	autocomplete?: AutocompleteProcess;
	middlewares: DiscateMiddleware<TParms['_interaction']>[];
	type: ApplicationCommandType;
}

type AnyCommandBuilderDef = CommandBuilderDef<any>;

type CommandBuilder = <T extends AnyCommandBuilder = AnyCommandBuilder>(
	command: T
) => AutocompleteRegister<{
	_builder: T;
	_builderType: ApplicationCommandType;
	_processInputData: MiddlewareInput<inferBuilder<T>>;
	_interaction: inferBuilder<T>;
}>;

/**
 * コマンドの処理を登録する関数集
 */
interface CommandProcessRegister<TParms extends CommandBuilderParms> {
	_def: CommandBuilderDef<TParms>;
	addMiddleware<T extends TParms['_processInputData']>(
		fc: (input: TParms['_processInputData']) => T | Promise<T>
	): CommandProcessRegister<{
		_builder: TParms['_builder'];
		_builderType: TParms['_builderType'];
		_processInputData: Awaited<T>;
		_interaction: Awaited<T['interaction']>;
	}>;
	setProcess(process: (input: TParms['_processInputData']) => void): CommandData<{
		_builder: TParms['_builder'];
		_builderType: TParms['_builderType'];
		_processInputData: TParms['_processInputData'];
		_interaction: TParms['_interaction'];
	}>;
}

interface AutocompleteRegister<TParms extends CommandBuilderParms> extends CommandProcessRegister<TParms> {
	setAutocomplete(fc: (input: AutocompleteInteraction) => void): CommandProcessRegister<{
		_builder: TParms['_builder'];
		_builderType: TParms['_builderType'];
		_processInputData: TParms['_processInputData'];
		_interaction: TParms['_interaction'];
	}>;
}

/**
 * コマンドレジスターやイベントハンドラー用のデータ
 */
interface CommandData<TParms extends CommandBuilderParms> {
	data: TParms['_builder'];
	autocomplete?: AutocompleteProcess;
	middlewares: DiscateMiddleware<TParms['_interaction']>[];
	execute(input: TParms['_processInputData']): void;
}

export type AnyCommandData = CommandData<any>;

const createCommandBuilder: CommandBuilder = function (command) {
	const _def = {
		middlewares: [],
		type: ApplicationCommandType.ChatInput,
		builder: command,
	};
	return {
		...createCommandProcessRegister(_def),
		setAutocomplete: (process) => {
			return createCommandProcessRegister({
				..._def,
				autocomplete: process,
			});
		},
	};
};

function createCommandProcessRegister<TParms extends CommandBuilderParms>(
	initDef: AnyCommandBuilderDef
): CommandProcessRegister<TParms> {
	const _def: CommandBuilderDef<TParms> = {
		...initDef,
	};
	return {
		_def,
		addMiddleware: (fc) => {
			return createCommandProcessRegister({
				..._def,
				middlewares: [..._def.middlewares, fc],
			});
		},
		setProcess(process) {
			return {
				data: _def.builder,
				autocomplete: _def.autocomplete,
				middlewares: _def.middlewares,
				execute: process,
			};
		},
	};
}

/*////////////////////////////////////////////////////////////
	ContectMenuCommandBuilderWraper
////////////////////////////////////////////////////////////*/

type ContextBuilder = <T extends ContextMenuCommandBuilder = ContextMenuCommandBuilder>(
	command: T
) => ContextMenuCommandTypeRegister;

/**
 * コンテキストメニューコマンドのタイプを登録する関数
 */
interface ContextMenuCommandTypeRegister {
	setType<T extends ContextMenuCommandType>(
		type: T
	): CommandProcessRegister<{
		_builder: ContextMenuCommandBuilder;
		_builderType: T;
		_processInputData: MiddlewareInput<inferCommandType<T>>;
		_interaction: inferCommandType<T>;
	}>;
}

const createCtxCommandBuilder: ContextBuilder = function (command) {
	return createCommandTypeRegister(command);
};

function createCommandTypeRegister<T extends ContextMenuCommandBuilder>(builder: T): ContextMenuCommandTypeRegister {
	return {
		setType: (type) => {
			builder.setType(type);
			return createCommandProcessRegister({
				type,
				middlewares: [],
				builder: builder,
			});
		},
	};
}

/*////////////////////////////////////////////////////////////
	ComponentBuilderWraper
////////////////////////////////////////////////////////////*/

// for customId
let componentLength = 0;

function getCurrentId() {
	componentLength++;
	return componentLength.toString(36);
}

interface ComponentBuilderParms<
	Schema = any,
	Args extends z.ZodArray<z.ZodString> = z.ZodArray<z.ZodString>,
	Builder extends AnyComponentBuilder = AnyComponentBuilder,
	Interaction extends AnyComponentInteraction = AnyComponentInteraction<any>
> {
	_schema: Schema;
	_builder: Builder;
	_args: Args | undefined;
	_processInputData: MiddlewareInput<Interaction>;
	_interaction: Interaction;
}

type BuilderFC<TParms extends Omit<ComponentBuilderParms, '_args' | '_interaction' | '_processInputData'>> = (
	input: TParms['_schema']
) => TParms['_builder'];

interface ComponentBuilderDef<TParms extends ComponentBuilderParms> {
	customId: string;
	args: TParms['_args'];
	middlewares: DiscateMiddleware<TParms['_interaction']>[];
	component: BuilderFC<TParms>;
}

type AnyComponentBuilderDef = ComponentBuilderDef<any>;

type ComponentBuilder = <T = undefined, U extends AnyComponentBuilder = AnyComponentBuilder>(
	component: (input: T) => U
) => ComponentProcessRegister<{
	_schema: T;
	_builder: ReturnType<typeof component>;
	_args: undefined;
	_processInputData: MiddlewareInput<inferBuilder<ReturnType<typeof component>>>;
	_interaction: inferBuilder<ReturnType<typeof component>>;
}>;

interface ComponentProcessRegister<TParms extends ComponentBuilderParms> {
	_def: ComponentBuilderDef<TParms>;
	useArgs<Schema extends ComponentBuilderParms['_args'] = undefined>(
		schema?: (z: z.ZodArray<z.ZodString, any>) => Schema
	): ComponentProcessRegister<{
		_schema: TParms['_schema'];
		_builder: TParms['_builder'];
		_args: UnwrapOrDefault<Schema, z.ZodArray<z.ZodString, any>>;
		_processInputData: TParms['_processInputData'] & {
			args: z.infer<UnwrapOrDefault<Schema, z.ZodArray<z.ZodString, any>>>;
		};
		_interaction: TParms['_interaction'];
	}>;
	addMiddleware<T extends TParms['_processInputData']>(
		fc: (input: TParms['_processInputData']) => T | Promise<T>
	): ComponentProcessRegister<{
		_schema: TParms['_schema'];
		_builder: TParms['_builder'];
		_args: TParms['_args'];
		_processInputData: Awaited<T>;
		_interaction: Awaited<T['interaction']>;
	}>;
	setProcess(process: (input: TParms['_processInputData']) => void): ComponentData<{
		_builder: TParms['_builder'];
		_args: TParms['_args'];
		_schema: TParms['_schema'];
		_processInputData: TParms['_processInputData'];
		_interaction: TParms['_interaction'];
	}>;
}

type componentFC<TParms extends Omit<ComponentBuilderParms, '_interaction' | '_processInputData'>> =
	TParms['_schema'] extends undefined
		? TParms['_args'] extends undefined
			? (input?: any, args?: string[]) => TParms['_builder']
			: (input: any | undefined, args: z.infer<Exclude<TParms['_args'], undefined>>) => TParms['_builder']
		: TParms['_args'] extends undefined
		? (input: TParms['_schema'], args?: string[]) => TParms['_builder']
		: (input: TParms['_schema'], args: z.infer<Exclude<TParms['_args'], undefined>>) => TParms['_builder'];

interface ComponentData<TParms extends ComponentBuilderParms> {
	args: TParms['_args'];
	customId: string;
	component: componentFC<TParms>;
	middlewares: DiscateMiddleware<TParms['_interaction']>[];
	execute(input: TParms['_processInputData']): void;
}

export type AnyComponentData = ComponentData<any>;

const createComponentBuilder: ComponentBuilder = function (component) {
	const customId = getCurrentId();
	return createComponentProcessRegister({
		customId,
		args: undefined,
		middlewares: [],
		component,
	});
};

function createComponentProcessRegister<TParms extends ComponentBuilderParms>(
	initDef: AnyComponentBuilderDef
): ComponentProcessRegister<TParms> {
	const _def = { ...initDef };
	return {
		_def,
		useArgs: (fc?) => {
			const arrayString = z.array(z.string());
			const schema = fc ? fc(arrayString) : arrayString;
			return createComponentProcessRegister({
				..._def,
				args: schema,
			});
		},
		addMiddleware: (fc) => {
			return createComponentProcessRegister({
				..._def,
				middlewares: [..._def.middlewares, fc],
			});
		},
		setProcess(process) {
			return createComponentData(_def, process);
		},
	};
}

function createComponentData<TParms extends ComponentBuilderParms>(
	initdef: AnyComponentBuilderDef,
	process: (input: TParms['_processInputData']) => void
): ComponentData<{
	_schema: TParms['_schema'];
	_builder: TParms['_builder'];
	_args: TParms['_args'];
	_processInputData: TParms['_processInputData'];
	_interaction: TParms['_interaction'];
}> {
	const component = (input?: TParms['_schema'], args?: z.infer<Exclude<TParms['_args'], undefined>>) => {
		const builder = initdef.component(input);
		let customId: string;
		if (args?.length) {
			const argsString = args?.map((arg: string) => encodeId(arg)).join('&');
			customId = initdef.customId + '?' + argsString;
		} else {
			customId = initdef.customId;
		}
		builder.setCustomId(customId);
		return builder;
	};
	return {
		args: initdef.args,
		customId: initdef.customId,
		middlewares: initdef.middlewares,
		component,
		execute: process,
	};
}

/*////////////////////////////////////////////////////////////
	discordjsBuilderWraper
////////////////////////////////////////////////////////////*/

export const wraper = {
	setCommand: createCommandBuilder,
	setCtxCommand: createCtxCommandBuilder,
	setComponent: createComponentBuilder,
};
