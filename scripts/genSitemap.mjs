#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const foldersDir = path.join(root, 'folders');
const outputPath = path.join(root, 'public', 'sitemap.xml');
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ntu-coss.github.io/database').replace(/\/$/, '');

const urls = new Set([`${siteUrl}/`, `${siteUrl}/curriculum`, `${siteUrl}/announcement`]);

if (fs.existsSync(foldersDir) && fs.statSync(foldersDir).isDirectory()) {
  for (const fileName of fs.readdirSync(foldersDir).filter(name => name.endsWith('.json'))) {
    const courseId = fileName.slice(0, -'.json'.length);
    const filePath = path.join(foldersDir, fileName);
    let folders;
    try {
      folders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`Error: failed to parse ${filePath}: ${err.message}`);
      process.exit(1);
    }
    for (const folderId of Object.keys(folders)) {
      urls.add(`${siteUrl}/folder/${encodeURIComponent(courseId)}/${encodeURIComponent(folderId)}`);
    }
  }
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Array.from(urls).sort().map(url => `  <url><loc>${url}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, xml, 'utf8');
console.log(`Wrote ${urls.size} URLs to ${path.relative(root, outputPath)}`);
