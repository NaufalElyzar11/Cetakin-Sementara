'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { isPublicFile, publicDirectories, publicFiles } = require('../src/config/public-files.js');

const root = fs.realpathSync(path.resolve(__dirname, '..'));
const output = path.join(root, 'dist-public');

function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.lstatSync(source).isFile()) throw new Error(`File publik tidak valid: ${relativePath}`);
  const target = path.join(output, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectory(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relativePath = `${directory}/${entry.name}`;
    if (entry.isDirectory()) copyDirectory(relativePath);
    else if (entry.isFile() && isPublicFile(relativePath)) copyFile(relativePath);
  }
}

const existing = fs.lstatSync(output, { throwIfNoEntry: false });
if (existing && (!existing.isDirectory() || fs.realpathSync(output) !== output)) {
  throw new Error(`Folder output tidak valid: ${output}`);
}
fs.rmSync(output, { recursive: true, force: true });
for (const file of publicFiles) copyFile(file);
for (const directory of publicDirectories) copyDirectory(directory);
