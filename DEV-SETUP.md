# Development Setup — Auto Build + Reload

## One-Time Setup

### 1. Install Dependencies
```bash
cd chrome-exention-job
yarn install
```

### 2. Initial Build
```bash
yarn build
```

### 3. Load Extension in Chrome

1. Chrome me `chrome://extensions/` open karo
2. **Developer mode** ON karo (top right)
3. **Load unpacked** → `/dist` folder select karo
4. Extension loaded ho jayega! ✅

### 4. Enable Auto-Reload
1. `chrome://extensions/` me jaao
2. "Smart Job Auto Apply Assistant" pe click
3. **"Extension reload notifications"** ON karo
4. Ab build hote hi Chrome auto-reload karega ✅

## Development Workflow

### Option A: Auto Watch Mode (Recommended)
```bash
yarn dev:watch
```

Kya hota hai:
- File change detect karta hai
- Auto rebuild karta hai (`yarn build`)
- Chrome extension auto-reload hoti hai
- Zero manual work!

### Option B: Manual Build
```bash
yarn build
```

Har file change ke baad manually run karo.

## Chrome Extensions Page Setup

```
chrome://extensions/
├── Developer mode: ON
├── Load unpacked: /dist folder
├── Extension reload notifications: ON
└── Auto-update: ON (for seamless dev)
```

## Quick Reference

| Command | Kya Karta Hai |
|---------|-------------|
| `yarn dev:watch` | File watch + auto build |
| `yarn build` | Single build |
| `yarn install` | Dependencies install |

## Full Pipeline (Push to GitHub)

```
Code Change → yarn dev:watch → Auto Build → Chrome Auto-Reload → Test
              ↓
        git add . → git commit → git push → GitHub
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not reloading | "Extension reload notifications" ON karo |
| Build not detecting changes | `yarn dev:watch` dobara run karo |
| Chrome cache issue | `chrome://extensions/` me manual reload |
