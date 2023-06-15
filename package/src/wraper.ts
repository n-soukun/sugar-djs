//!依存パッケージ!//
import {
	ApplicationCommandType,
	ContextMenuCommandBuilder,
	ContextMenuCommandType,
} from 'discord.js';
import { z } from 'zod';
//!依存パッケージ!//

import {
	AnyCommandBuilder,
	AnyCommandInteraction,
	AnyComponentBuilder,
	AnyComponentInteraction,
	DiscateMiddleware,
	MiddlewareInput,
	inferBuilder,
	inferCommandType,
} from './types';
import { encodeId } from './custom-id';

/*////////////////////////////////////////////////////////////
	CommandBuilderWraper
////////////////////////////////////////////////////////////*/

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
	autocomplete?: () => void;
	middlewares: DiscateMiddleware<TParms['_interaction']>[];
	type: ApplicationCommandType;
}

type AnyCommandBuilderDef = CommandBuilderDef<any>;

type CommandBuilder = <T extends AnyCommandBuilder = AnyCommandBuilder>(
	command: T
) => CommandProcessRegister<{
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
		fc: (input: TParms['_processInputData']) => T
	): CommandProcessRegister<{
		_builder: TParms['_builder'];
		_builderType: TParms['_builderType'];
		_processInputData: T;
		_interaction: T['interaction'];
	}>;
	setProcess(process: (input: TParms['_processInputData']) => void): CommandData<{
		_builder: TParms['_builder'];
		_builderType: TParms['_builderType'];
		_processInputData: TParms['_processInputData'];
		_interaction: TParms['_interaction'];
	}>;
}

interface AutocompleteRegister<TParms extends CommandBuilderParms> {
	setAutocomplete<T extends TParms['_processInputData']>(
		fc: (input: TParms['_processInputData']) => T
	): CommandProcessRegister<{
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
	middlewares: DiscateMiddleware<TParms['_interaction']>[];
	execute(input: TParms['_processInputData']): void;
}

export type AnyCommandData = CommandData<any>;

const createCommandBuilder: CommandBuilder = function (command) {
	return createCommandProcessRegister({
		middlewares: [],
		type: ApplicationCommandType.ChatInput,
		builder: command,
	});
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

function createCommandTypeRegister<T extends ContextMenuCommandBuilder>(
	builder: T
): ContextMenuCommandTypeRegister {
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
	Args = z.ZodArray<z.ZodString, any>,
	Builder extends AnyComponentBuilder = AnyComponentBuilder,
	Interaction extends AnyComponentInteraction = AnyComponentInteraction<any>
> {
	_schema: Schema;
	_builder: Builder;
	_args: Args;
	_processInputData: MiddlewareInput<Interaction>;
	_interaction: Interaction;
}

type BuilderFC<
	TParms extends Omit<ComponentBuilderParms, '_args' | '_interaction' | '_processInputData'>
> = (input: TParms['_schema']) => TParms['_builder'];

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
	_args: z.ZodArray<z.ZodString, any>;
	_processInputData: MiddlewareInput<inferBuilder<ReturnType<typeof component>>>;
	_interaction: inferBuilder<ReturnType<typeof component>>;
}>;

interface ComponentProcessRegister<TParms extends ComponentBuilderParms> {
	_def: ComponentBuilderDef<TParms>;
	useArgs<Schema extends z.ZodArray<z.ZodString, any>>(
		schema: Schema
	): ComponentProcessRegister<{
		_schema: TParms['_schema'];
		_builder: TParms['_builder'];
		_args: Schema;
		_processInputData: TParms['_processInputData'] & {
			args: z.infer<Schema>;
		};
		_interaction: TParms['_interaction'];
	}>;
	addMiddleware<T extends TParms['_processInputData']>(
		fc: (input: TParms['_processInputData']) => T
	): ComponentProcessRegister<{
		_schema: TParms['_schema'];
		_builder: TParms['_builder'];
		_args: TParms['_args'];
		_processInputData: T;
		_interaction: T['interaction'];
	}>;
	setProcess(process: (input: TParms['_processInputData']) => void): ComponentData<{
		_builder: TParms['_builder'];
		_args: TParms['_args'];
		_schema: TParms['_schema'];
		_processInputData: TParms['_processInputData'];
		_interaction: TParms['_interaction'];
	}>;
}

interface ComponentData<TParms extends ComponentBuilderParms> {
	args: TParms['_args'];
	customId: string;
	component: TParms['_schema'] extends undefined
		? (args?: z.infer<TParms['_args']>) => TParms['_builder']
		: (input: TParms['_schema'], args?: z.infer<TParms['_args']>) => TParms['_builder'];
	middlewares: DiscateMiddleware<TParms['_interaction']>[];
	execute(input: TParms['_processInputData']): void;
}

export type AnyComponentData = ComponentData<any>;

const createComponentBuilder: ComponentBuilder = function (component) {
	const customId = getCurrentId();
	return createComponentProcessRegister({
		customId,
		args: z.array(z.string()).optional(),
		middlewares: [],
		component,
	});
};

function createComponentProcessRegister<TParms extends ComponentBuilderParms>(
	initDef: AnyComponentBuilderDef
): ComponentProcessRegister<TParms> {
	//ToDo: componentsフォルダ配下でなくても動くように変更したい
	const _def = { ...initDef };
	return {
		_def,
		useArgs: (schema) => {
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
	const component = (input?: TParms['_schema'], args?: z.infer<TParms['_args']>) => {
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
