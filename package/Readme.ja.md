# Sugar-DJS (discordjs-builder-wrapper)

discord.jsをTypeScriptでもっと楽しく書くためのライブラリ！

## 対応バージョン

```
discord.js: "^14.23.2"
```

## 使い方の例

`SlashCommand`のサンプル

```typescript
import { wrapper } from 'sugar-djs';
import { SlashCommandBuilder } from 'discord.js';
import { isCachedInteraction } from './middlewares.ts';

export default wrapper
	.setCommand(
        // discord.jsのBuilderをそのまま使用
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Send "Pong!"')
    )
    .addMiddleware(isCachedInteraction) // キャッシュされたインタラクションのみ許可
	.setProcess(({ interaction }) => {
        // interaction: ChatInputCommandInteraction<"cached">;
		interaction.reply('Ping!');
	});
```

## 特徴

`Sugar-DJS`を使うと、一部の型指定を省略したり、共通の処理を簡単に挿入できたりすることで、スピーディーにボットを制作することができます。

### 適切なInteraction型を推論

`Sugar-DJS`は、渡された`Builder`から適切な`Interaction`を選択して、`setProcess`メソッドの引数の型に指定します。

### ミドルウェア概念の導入

コマンドやコンポーネントの処理の前に、ミドルウェアを追加することができます。ミドルウェアは、`Interaction`を含むペイロードを使って処理を行い、元のペイロードと追加のデータを返すことができます。また、ペイロードに含まれる形を絞る事もできます。

#### Interactionが'cached'であることを確認する例
```typescript
import { AnyInteraction, MiddlewarePayload } from 'sugar-djs';

export const isCachedInteraction = <T extends AnyInteraction, U>({
	interaction,
	...payload
}: MiddlewarePayload<T, U>) => {
	if (!interaction.inCachedGuild()) {
		interaction.reply("サーバー内で実行してください");
		return; // voidを返した場合、次の処理は実行されません。
	}
	return { interaction, ...payload };
};
```

## 導入方法

### 1. sugardjs.tsの作成

コマンドやコンポーネントが格納されているディレクトリを指定して、`WrapperCollection`に渡します。

```typescript
// sugardjs.ts
import path from 'path';
import { WrapperCollection } from 'sugar-djs';

const commandsPath = path.join(__dirname, './commands');
const componentsPath = path.join(__dirname, './components');

export default new WrapperCollection({
	paths: [commandsPath, componentsPath],
});
```

### 2.discord.jsに接続

手順1で作成した`WrapperCollection`の`interactionCreateHandler`をdiscord.jsの`InteractionCreate`イベントにイベントハンドラーとして渡します。

```typescript
// index.ts
import wrappers from "./sugardjs";
...
client.on('interactionCreate', wrappers.interactionCreateHandler);
...
```

### 3.register.tsの作成

手順1で作成した`WrapperCollection`の`toJSON`メソッドを活用すると、簡単にコマンドやコンポーネントを登録する処理が書けます。

```typescript
// register.ts
import { REST, Routes } from 'discord.js';
import wrappers from './sugardjs';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const rest = new REST({ version: '10' }).setToken(TOKEN);
const commands = wrappers.toJSON(); // Discord API に渡せるJSONのリストを返します。
await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: commands,
});
```

## ライセンス
MIT License (see `LICENSE` file).