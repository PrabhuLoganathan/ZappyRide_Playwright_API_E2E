import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// pdf-parse ships as CommonJS.
const pdfParse = require('pdf-parse');

const { PDFParse, VerbosityLevel } = pdfParse;

function usage() {
	const cmd = path.basename(process.argv[1] ?? 'extract-pdf-text.mjs');
	console.error(`Usage: node ${cmd} <path-to-pdf> [--json]`);
	process.exit(2);
}

const args = process.argv.slice(2);
if (!args.length) usage();

const filePath = args[0];
const asJson = args.includes('--json');

const dataBuffer = await fs.readFile(filePath);

const parser = new PDFParse({
	data: dataBuffer,
	verbosity: VerbosityLevel.ERRORS,
});
await parser.load();
const result = await parser.getText();

const pages = (result.pages ?? []).map((p, idx) => ({
	page: idx + 1,
	text: (p.text ?? '').replace(/\s+/g, ' ').trim(),
}));

if (asJson) {
	process.stdout.write(
		JSON.stringify(
			{
				filePath,
				numpages: pages.length,
				pages,
				text: result.text,
			},
			null,
			2
		)
	);
} else {
	for (const p of pages) {
		process.stdout.write(`\n--- Page ${p.page} ---\n`);
		process.stdout.write(`${p.text}\n`);
	}
}
