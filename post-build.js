import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy manifest.json to dist
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(__dirname, 'dist', 'manifest.json')
);

// Copy assets folder to dist
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

copyRecursive(
  path.join(__dirname, 'assets'),
  path.join(__dirname, 'dist', 'assets')
);

// Copy background.js to dist
fs.copyFileSync(
  path.join(__dirname, 'background.js'),
  path.join(__dirname, 'dist', 'background.js')
);

// Copy popup HTML
const distPopupDir = path.join(__dirname, 'dist', 'popup');
if (!fs.existsSync(distPopupDir)) {
  fs.mkdirSync(distPopupDir, { recursive: true });
}

fs.copyFileSync(
  path.join(__dirname, 'popup', 'popup.html'),
  path.join(distPopupDir, 'popup.html')
);

console.log('✅ Build completed successfully!');
console.log('📦 Extension ready in /dist folder');
console.log('🚀 Load the extension from chrome://extensions');
