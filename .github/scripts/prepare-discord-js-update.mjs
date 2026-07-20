import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const packagePath = 'packages/sugar-djs/package.json';
const latestVersion = process.argv[2];

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(latestVersion ?? '')) {
	throw new Error(`Invalid discord.js version: ${latestVersion}`);
}

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.devDependencies?.['discord.js'];

if (!/^\d+\.\d+\.\d+$/.test(currentVersion ?? '')) {
	throw new Error(`discord.js devDependency must be an exact version, received: ${currentVersion}`);
}

const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
const [latestMajor, latestMinor] = latestVersion.split('.').map(Number);
const hasNewMinor =
	latestMajor > currentMajor || (latestMajor === currentMajor && latestMinor > currentMinor);

const output = process.env.GITHUB_OUTPUT;
if (output) {
	appendFileSync(output, `updated=${hasNewMinor}\nlatest=${latestVersion}\n`);
}

if (!hasNewMinor) {
	console.log(
		`discord.js ${latestVersion} does not introduce a newer major/minor than ${currentVersion}.`,
	);
	process.exit(0);
}

const minimumVersion = packageJson.peerDependencies?.['discord.js']?.match(/>=\s*([^\s]+)/)?.[1];
if (!minimumVersion) {
	throw new Error('Could not determine the discord.js peerDependency minimum version.');
}

const nextMinorVersion = `${latestMajor}.${latestMinor + 1}.0`;
packageJson.devDependencies['discord.js'] = latestVersion;
packageJson.peerDependencies['discord.js'] = `>=${minimumVersion} <${nextMinorVersion}`;
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, '\t')}\n`);

const safeVersion = latestVersion.replaceAll(/[^0-9A-Za-z-]/g, '-');
const changesetPath = `.changeset/discord-js-${safeVersion}.md`;
writeFileSync(
	changesetPath,
	`---\n'sugar-djs': patch\n---\n\nSupport discord.js ${latestMajor}.${latestMinor}.x.\n`,
);

console.log(
	`Prepared discord.js ${latestVersion}; peerDependency is now >=${minimumVersion} <${nextMinorVersion}.`,
);
