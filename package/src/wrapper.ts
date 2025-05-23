import type {
	ApplicationCommandType,
	AutocompleteInteraction,
	ContextMenuCommandBuilder,
	ContextMenuCommandType,
} from 'discord.js';
import { z } from 'zod';

import {
	AnyBuilder,
	AnyCommandBuilder,
	AnyCommandInteraction,
	AnyComponentBuilder,
	AnyComponentInteraction,
	AnyInteraction,
	MaybePromise,
	Middleware,
	MiddlewarePayload,
	UnwrapOrDefault,
	inferBuilder,
	inferCommandType,
} from './types';
import { encodeId } from './custom-id';

/*////////////////////////////////////////////////////////////
	Base
////////////////////////////////////////////////////////////*/

interface BaseWrapperReturnData<T extends AnyInteraction = AnyInteraction<any>> {
	middlewares: Middleware<T>[];
	execute: (input: MiddlewarePayload<T>) => void;
}

interface BaseBuilderParms<
	Builder extends AnyBuilder = AnyBuilder,
	Interaction extends AnyInteraction = AnyInteraction<any>
> {
	_builder: Builder;
	_processInputData: MiddlewarePayload<Interaction>;
	_interaction: Interaction;
}

/*////////////////////////////////////////////////////////////
	CommandBuilderWrapper
////////////////////////////////////////////////////////////*/

type AutocompleteProcess = (input: AutocompleteInteraction) => void;

/**
 * コマンドビルダーの型情報
 */
interface CommandBuilderParms<
	Builder extends AnyCommandBuilder = AnyCommandBuilder,
	BuilderType extends ApplicationCommandType = ApplicationCommandType,
	Interaction extends AnyCommandInteraction = AnyCommandInteraction<any>
> extends BaseBuilderParms<Builder, Interaction> {
	_builderType: BuilderType;
}

/**
 * コマンドビルダーが保持するデータ
 */
interface CommandBuilderDef<TParms extends CommandBuilderParms> {
	builder: TParms['_builder'];
	autocomplete?: AutocompleteProcess;
	middlewares: Middleware<TParms['_interaction']>[];
	type: ApplicationCommandType;
}

type AnyCommandBuilderDef = CommandBuilderDef<any>;

type CommandBuilder = <T extends AnyCommandBuilder = AnyCommandBuilder>(
	command: T
) => AutocompleteRegister<{
	_builder: T;
	_builderType: ApplicationCommandType;
	_processInputData: MiddlewarePayload<inferBuilder<T>>;
	_interaction: inferBuilder<T>;
}>;

/**
 * コマンドの処理を登録する関数集
 */
interface CommandProcessRegister<TParms extends CommandBuilderParms> {
	_def: CommandBuilderDef<TParms>;
	addMiddleware<T extends TParms['_processInputData']>(
		fc: (input: TParms['_processInputData']) => MaybePromise<T | undefined>
	): CommandProcessRegister<{
		_builder: TParms['_builder'];
		_builderType: TParms['_builderType'];
		_processInputData: Exclude<Awaited<T>, undefined>;
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
interface CommandData<TParms extends CommandBuilderParms> extends BaseWrapperReturnData<TParms['_interaction']> {
	data: TParms['_builder'];
	autocomplete?: AutocompleteProcess;
	middlewares: Middleware<TParms['_interaction']>[];
	execute(input: TParms['_processInputData']): void;
}

export type AnyCommandData = CommandData<any>;

const createCommandBuilder: CommandBuilder = function (command) {
	const _def = {
		middlewares: [],
		type: 1, // ApplicationCommandType.ChatInput
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
			if (typeof fc !== 'function') {
				throw new Error('Middleware must be a function.');
			}
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
	ContectMenuCommandBuilderWrapper
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
		_processInputData: MiddlewarePayload<inferCommandType<T>>;
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
	ComponentBuilderWrapper
////////////////////////////////////////////////////////////*/

interface ComponentBuilderParms<
	Schema = any,
	Args extends z.ZodArray<z.ZodString, any> = z.ZodArray<z.ZodString, any>,
	Builder extends AnyComponentBuilder = AnyComponentBuilder,
	ComponentType extends 'function' | 'builder' = 'function' | 'builder',
	Interaction extends AnyComponentInteraction = AnyComponentInteraction<any>
> extends BaseBuilderParms<Builder, Interaction> {
	_schema: Schema;
	_args: Args | undefined;
	_componentType: ComponentType;
}

type BuilderFC<TParms extends Omit<ComponentBuilderParms, '_args' | '_interaction' | '_processInputData'>> = (
	input: TParms['_schema']
) => TParms['_builder'];

type UnwrapBuilderFC<T> = T extends (...args: any) => infer U ? U : T;

type inferComponentType<T> = T extends (...args: any) => any ? 'function' : 'builder';

interface ComponentBuilderDef<TParms extends ComponentBuilderParms> {
	customId: string;
	args: TParms['_args'];
	middlewares: Middleware<TParms['_interaction']>[];
	component: BuilderFC<TParms> | TParms['_builder'];
}

type AnyComponentBuilderDef = ComponentBuilderDef<any>;

type ComponentBuilder = <T extends AnyComponentBuilder | ((input: V) => AnyComponentBuilder), V extends {}>(
	component: T,
	defaultValue?: T extends (...args: any) => any ? V : undefined
) => ComponentProcessRegister<{
	_schema: T extends (i: infer U, ...args: any) => any ? U : undefined;
	_builder: UnwrapBuilderFC<T>;
	_componentType: inferComponentType<T>;
	_args: undefined;
	_processInputData: MiddlewarePayload<inferBuilder<UnwrapBuilderFC<T>>>;
	_interaction: inferBuilder<UnwrapBuilderFC<T>>;
}>;

interface ComponentProcessRegister<TParms extends ComponentBuilderParms> {
	_def: ComponentBuilderDef<TParms>;
	setCustomId(customId: string): ComponentProcessRegister<TParms>;
	useArgs<Schema extends ComponentBuilderParms['_args'] = undefined>(
		schema?: (z: z.ZodArray<z.ZodString, any>) => Schema
	): ComponentProcessRegister<{
		_schema: TParms['_schema'];
		_builder: TParms['_builder'];
		_componentType: TParms['_componentType'];
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
		_componentType: TParms['_componentType'];
		_args: TParms['_args'];
		_processInputData: Awaited<T>;
		_interaction: Awaited<T['interaction']>;
	}>;
	setProcess(process: (input: TParms['_processInputData']) => void): ComponentData<{
		_schema: TParms['_schema'];
		_builder: TParms['_builder'];
		_componentType: TParms['_componentType'];
		_args: TParms['_args'];
		_processInputData: TParms['_processInputData'];
		_interaction: TParms['_interaction'];
	}>;
}

type componentFC<TParms extends Omit<ComponentBuilderParms, '_interaction' | '_processInputData'>> =
	TParms['_componentType'] extends 'function'
		? TParms['_schema'] extends undefined
			? TParms['_args'] extends undefined
				? (input?: any, args?: string[]) => TParms['_builder']
				: (input: any | undefined, args: z.infer<Exclude<TParms['_args'], undefined>>) => TParms['_builder']
			: TParms['_args'] extends undefined
			? (input: TParms['_schema'], args?: string[]) => TParms['_builder']
			: (input: TParms['_schema'], args: z.infer<Exclude<TParms['_args'], undefined>>) => TParms['_builder']
		: TParms['_builder'];

interface ComponentData<TParms extends ComponentBuilderParms> extends BaseWrapperReturnData<TParms['_interaction']> {
	args: TParms['_args'];
	customId: string;
	component: componentFC<TParms>;
	middlewares: Middleware<TParms['_interaction']>[];
	execute(input: TParms['_processInputData']): void;
}

export type AnyComponentData = ComponentData<any>;

const extractComponentCustomId = (component: AnyComponentBuilder) => {
	const json = component.toJSON();
	if ('custom_id' in json) {
		return json.custom_id;
	} else {
		throw new Error('Component does not have a custom_id.');
	}
};

const createComponentBuilder: ComponentBuilder = function (component, defaultValue) {
	let customId;
	if (typeof component === 'function') {
		if (!defaultValue) throw new Error('Default value is required for function component.');
		customId = extractComponentCustomId(component(defaultValue));
	} else {
		customId = extractComponentCustomId(component);
	}
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
		setCustomId(customId) {
			return createComponentProcessRegister({
				..._def,
				customId,
			});
		},
		useArgs: (fc?) => {
			const arrayString: z.ZodArray<z.ZodString, any> = z.array(z.string());
			const schema = fc ? fc(arrayString) : arrayString;
			return createComponentProcessRegister({
				..._def,
				args: schema,
			});
		},
		addMiddleware: (fc) => {
			if (typeof fc !== 'function') {
				throw new Error('Middleware must be a function.');
			}
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
	_componentType: TParms['_componentType'];
	_args: TParms['_args'];
	_processInputData: TParms['_processInputData'];
	_interaction: TParms['_interaction'];
}> {
	let component;
	if (typeof initdef.component === 'function') {
		component = (input?: TParms['_schema'], args?: z.infer<Exclude<TParms['_args'], undefined>>) => {
			const builder = initdef.component(input) as AnyComponentBuilder;
			if (!('custom_id' in builder.data)) return builder;
			let customId = initdef.customId;
			if (args?.length) {
				const argsString = args?.map((arg: string) => encodeId(arg)).join('&');
				customId = customId + '?' + argsString;
			}
			builder.setCustomId(customId);
			return builder;
		};
	} else {
		component = initdef.component;
	}

	return {
		args: initdef.args,
		customId: initdef.customId,
		middlewares: initdef.middlewares,
		component,
		execute: process,
	};
}

/*////////////////////////////////////////////////////////////
	discordjsBuilderWrapper
////////////////////////////////////////////////////////////*/

export const wrapper = {
	setCommand: createCommandBuilder,
	setCtxCommand: createCtxCommandBuilder,
	setComponent: createComponentBuilder,
};
