# FileKeeper — Developer Notes & Guidelines

This document contains critical setup, build instructions, architectural notes, and coding constraints for the FileKeeper application. **Please read this before making any modifications to the codebase.**

---

## 🛠️ Build and Development Commands

### ⚡ Running in Development Mode
Since PowerShell execution policy blocks directly executing scripts in this environment, always use Node's `child_process` wrapper:
```powershell
node -e "const { execSync } = require('child_process'); execSync('npm run dev', { cwd: 'e:\\\\app-organzier', stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } })"
```
> [!IMPORTANT]
> **Vite HMR** handles frontend changes dynamically, but if you modify [main.js](file:///e:/app-organzier/main.js), you **must** stop the background process (via task manager or agent tools) and restart the dev server to load the changes.

### 📦 Rebuilding the Installer (.exe)
Whenever you finish a batch of edits, rebuild the installer:
```powershell
# Step 1: Build the React frontend
node -e "const { execSync } = require('child_process'); execSync('npm run build', { cwd: 'e:\\\\app-organzier', stdio: 'inherit' })"

# Step 2: Package with electron-builder
node -e "const { execSync } = require('child_process'); execSync('node_modules\\.bin\\electron-builder --win --x64', { cwd: 'e:\\\\app-organzier', stdio: 'inherit' })"
```
Or use the combined npm command:
```powershell
node -e "const { execSync } = require('child_process'); execSync('npm run package', { cwd: 'e:\\\\app-organzier', stdio: 'inherit' })"
```
The output installer `FileKeeper Setup 1.0.0.exe` is generated in `e:\app-organzier\release\`.

---

## 📂 Folder & Workflow Naming Conventions

All folder structures and workflow names must follow strict lowercase naming rules:
- **No uppercase characters or spaces** are permitted in the target directories.
- **Sermons:** folder name is `gccsatx`
- **Ill Be Honest (IBH):** folder name is `illbehonest`
- **Reels channels:**
  - `scrollreader`
  - `bodeebooks`
  - `illbehonest`
  - `hearhim`
  - `gccsatx`

---

## 🛡️ Safety & Deletion Policy

* **No Permanent Deletion:** Files must never be permanently deleted from the disk directly via `fs.unlink()` or similar.
* **Recycle Bin:** Always use Electron's `shell.trashItem()` to safely move files to the system Recycle Bin.

---

## 🏗️ Architecture & Technology Stack

* **Electron Main Process:** [main.js](file:///e:/app-organzier/main.js) (manages OS interactions, system tray, watch folders via `chokidar`, weekly health checks).
* **Electron Preload:** [preload.js](file:///e:/app-organzier/preload.js) (safely exposes IPC channels to the renderer process via `contextBridge`).
* **Vite + React Frontend:** Code is under `e:\app-organzier\src\`.
* **State & Configuration:** Saved via `electron-store`.
  * Config file path: `C:\Users\James Jennings\AppData\Roaming\filekeeper\config.json`.
  * Deleting this file will reset the application configuration (e.g., to rerun the Setup Wizard).

---

## 📝 Remaining Features / Next Steps
If you are starting a new editing session, consider picking up these tasks:
1. **Keyboard Shortcuts in Inbox/Workflows:** Add handlers for `D` (delete), `A` (archive), `M` (move), and `Space` (preview).
2. **Audiobook Auto-Detect:** Automatically scan the audiobook folder on component load instead of requiring a manual scan click.
3. **Reels Post Status Tracker:** A Draft/Published toggle per reels video.
4. **Apps Tab - Open in VSCode:** Wire up the UI button to trigger the existing `open-in-vscode` IPC handler in `main.js`.

---

## 🚀 Releasing a New Version

FileKeeper uses **GitHub Actions + electron-updater** to auto-build and publish releases.
Installed copies of the app check GitHub for updates on every launch and update silently.

### One-Time Setup (GitHub Secret)
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic)
2. Give it **`repo`** scope → copy the token
3. Go to your repo → **Settings → Secrets and Variables → Actions → New repository secret**
4. Name: `GH_TOKEN` · Value: paste your token → Save

### Releasing a New Version (3 commands)
```powershell
# 1. Bump the version in package.json (e.g. "1.0.0" → "1.1.0")
#    Edit package.json manually, then:

# 2. Commit the version bump
git add package.json
git commit -m "chore: bump version to v1.1.0"

# 3. Tag and push — this triggers the GitHub Action automatically
git tag v1.1.0
git push origin main --tags
```

GitHub Actions will then:
- Build the React frontend (Vite)
- Package with electron-builder
- Create a GitHub Release with `FileKeeper Setup 1.1.0.exe` + `latest.yml`

Users running the installed app will be notified automatically on next launch.

