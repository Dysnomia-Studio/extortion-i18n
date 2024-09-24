import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import config from '../../config.json' with { type: 'json' };

const COLUMNS_PER_TABLE = 6; // + Language name + Language status

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compute data
const countersPerFilePerLanguage = {};
const countersPerLanguage = {};
for(const language in config.languages) {
	countersPerLanguage[language] = 0;

	for(const file of config.files) {
		try {
			const content = await fs.readFile(path.join(__dirname, `../../${file}/${language}.json`));
			const parsedContent = JSON.parse(content);

			if(!countersPerFilePerLanguage[file]) {
				countersPerFilePerLanguage[file] = {};
			}

			countersPerFilePerLanguage[file][language] = Object.values(parsedContent).filter((x) => x !== '').length;
			countersPerLanguage[language] += Object.values(parsedContent).filter((x) => x !== '').length;
		} catch {}
	}
}

// Generate table from data
const tableList = [];
const tableFirstColumns = [
	['Language', 'Percentage'],
	['---', '---'],
];

for(const language in config.languages) {
	if(countersPerLanguage[language] > 0) {
		tableFirstColumns.push([
			config.languages[language],
			Math.round(countersPerLanguage[language] / countersPerLanguage['en'] * 100) + '%'
		]);
	}
}

console.log(tableFirstColumns);

for(let i = 0; i < config.files.length; i++) {
	const tableIndex = Math.floor(i / COLUMNS_PER_TABLE);
	if(!tableList[tableIndex]) {
		tableList[tableIndex] = JSON.parse(JSON.stringify(tableFirstColumns));
	}

	const fileName = config.files[i];
	if(!countersPerFilePerLanguage[fileName]) {
		continue;
	}

	tableList[tableIndex][0].push(fileName);
	tableList[tableIndex][1].push('---');

	let languageIndex = 0;
	for(const language in config.languages) {
		if(countersPerLanguage[language] > 0) {
			let counter = countersPerFilePerLanguage[fileName][language] || 0;

			console.log(countersPerFilePerLanguage[fileName]);

			tableList[tableIndex][languageIndex + 2].push(
				`${counter}/${countersPerFilePerLanguage[fileName]['en']}`
			);

			languageIndex++;
		}

	}
}


/// Output
let README_Content = `# ${config.title} Translations

${config.description}

## Languages translations
`;

console.log(tableList);

for(const table of tableList) {
	for(const line of table) {
		console.log(line);
		README_Content += ['\n', ...line].join(' |\t') + ' |';
	}
	README_Content += '\n\n';
}

README_Content += `
## How to contribute ?

### Github (Recommended)

- Fork repository
- Edit files, you can use [translatool](https://github.com/Dysnomia-studio/translatool) to help you.
- Create a pull request

### Discord

Join our [Official Discord](https://discord.gg/c8aARey), and send your translations in the **${config.title}** channel.

### Steam Forum

Participate on the official [Translation Thread on Steam](${config.steamTranslationThread})

## Languages without translation yet
`;

for(const language in config.languages) {
	if(countersPerLanguage[language] === 0) {
		README_Content += `- ${language} : ${config.languages[language]}\n`;
	}
}

await fs.writeFile(path.join(__dirname, '../../README.md'), README_Content);
