#!/usr/bin/env node
// scripts/genPublicDepts.mjs
//
// Writes public/depts.json — the department list the navbar fetches at runtime
// (code / name / uploadUrl only; Drive folder ids stay out of the browser).
//
// Source: depts.resolved.json (written by genIndex.mjs from the SA backend)
// when present, otherwise the repo's depts.json. Runs before `next build`.

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'depts.json');

const source = ['depts.resolved.json', 'depts.json']
    .map((f) => path.join(ROOT_DIR, f))
    .find((p) => fs.existsSync(p));

if (!source) {
    console.error('Error: neither depts.resolved.json nor depts.json exists. Aborting.');
    process.exit(1);
}

const list = JSON.parse(fs.readFileSync(source, 'utf8'))
    .filter((d) => d.code && String(d.enabled) !== 'false')
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((d) => ({ code: d.code, name: d.name, uploadUrl: d.uploadUrl || '' }));

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(list), 'utf8');

console.log(`Wrote ${list.length} departments to public/depts.json (from ${path.basename(source)})`);
