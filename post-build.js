import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

// Copy assets
copyRecursive(
  path.join(__dirname, 'assets'),
  path.join(distDir, 'assets')
);

// Copy background.js
fs.copyFileSync(
  path.join(__dirname, 'background.js'),
  path.join(distDir, 'background.js')
);

// Copy popup HTML
const popupDir = path.join(distDir, 'popup');
fs.mkdirSync(popupDir, { recursive: true });
fs.copyFileSync(
  path.join(__dirname, 'popup', 'popup.html'),
  path.join(popupDir, 'popup.html')
);

// Organize content scripts into content-scripts/ subdirectory
// Vite outputs: dist/linkedin.js, dist/indeed.js, dist/naukri.js
// Manifest expects: content-scripts/linkedin.js, etc.
const contentScriptsDir = path.join(distDir, 'content-scripts');
fs.mkdirSync(contentScriptsDir, { recursive: true });

for (const name of ['linkedin', 'indeed', 'naukri']) {
  const srcFile = path.join(distDir, `${name}.js`);
  const destFile = path.join(contentScriptsDir, `${name}.js`);
  if (fs.existsSync(srcFile)) {
    fs.renameSync(srcFile, destFile);
  }
}

// Move vendor chunks into content-scripts/ so MV3 scripts can load them
const chunksDir = path.join(distDir, 'chunks');
if (fs.existsSync(chunksDir)) {
  copyRecursive(chunksDir, path.join(contentScriptsDir, 'chunks'));
}

console.log('Build completed successfully!');
console.log('Extension ready in /dist folder');
console.log('Load the extension from chrome://extensions');
