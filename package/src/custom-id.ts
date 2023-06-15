//カスタムIDのエンコード用
const encodeList = [
	{
		reg_d: /\$d;/g,
		reg_e: '$$d;',
		string: '$',
	},
	{
		reg_d: /\$a;/g,
		reg_e: '$$a;',
		string: '&',
	},
	{
		reg_d: /\$q;/g,
		reg_e: '$$q;',
		string: '?',
	},
];

/**
 * カスタムID用エンコード関数
 * @param id 文字列
 * @returns エンコード済みカスタムID
 */
export function encodeId(id?: string) {
	if (!id) return '';
	return encodeList.reduce((id, data) => {
		return id.replaceAll(data.string, data.reg_e);
	}, id);
}

/**
 * カスタムID用デコード関数
 * @param id 文字列
 * @returns デコード済み文字列
 */
export function decodeId(id?: string) {
	if (!id) return '';
	return encodeList.reduce((id, data) => {
		return id.replaceAll(data.reg_d, data.string);
	}, id);
}

/**
 * カスタムIDを解析
 * @param id カスタムID
 * @returns カスタムIDと引数のタプル
 */
export function parseCustomId(id: string): [string, string[]] {
	const idWithArgs = id.split('?');
	const customId = decodeId(idWithArgs.shift());
	if (!idWithArgs.length) return [customId, []];
	const args = idWithArgs[0].split('&').map((arg) => decodeId(arg));
	return [customId, args];
}
