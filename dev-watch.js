// dev-watch.js — Auto-rebuild on file change
// Usage: node dev-watch.js

import { watch } from 'chokidar';
import { spawn } from 'child_process';
import { resolve } from 'path';

const watched = ['src/**/*.*', 'content-scripts/**/*.*', 'background.js', 'manifest.json', 'popup/*.*'];
let isBuilding = false;

console.log('🔍 Watching for file changes...');
console.log('   Files: src/, content-scripts/, background.js, manifest.json, popup/');
console.log('   Press Ctrl+C to stop\n');

const watcher = watch(watched, {
  ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  ignoreInitial: true,
  persistent: true
});

watcher.on('all', (event, path) => {
  if (isBuilding) return;
  isBuilding = true;
  console.log(`\n📝 ${path} changed (${event}) — rebuilding...`);

  const build = spawn('node', ['post-build.js'], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  const vite = spawn('npx', ['vite', 'build'], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  vite.stdout?.on('data', () => {});
  vite.stderr?.on('data', () => {});

  vite.on('close', (code) => {
    if (code === 0) {
      build.stdin?.write('');
      build.stdin?.end();
    }
  });

  build.on('close', (code) => {
    isBuilding = false;
    if (code === 0) {
      console.log('✅ Build complete — extension auto-reloading in Chrome!\n');
    } else {
      console.log('❌ Build failed. Check errors above.\n');
    }
  });
});

process.on('SIGINT', () => {
  watcher.close();
  console.log('\n👋 Watch stopped.');
  process.exit(0);
});
