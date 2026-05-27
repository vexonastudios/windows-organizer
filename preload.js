const { contextBridge, ipcRenderer } = require('electron')

// Fix #14: Map original fn → wrapped fn so off() can actually remove the right listener
const listenerWrappers = new Map()

contextBridge.exposeInMainWorld('filekeeper', {
  // Zones
  getZones: () => ipcRenderer.invoke('get-zones'),
  saveZones: (zones) => ipcRenderer.invoke('save-zones', zones),

  // Scanning
  scanZone: (zone) => ipcRenderer.invoke('scan-zone', zone),
  getInbox: (zones) => ipcRenderer.invoke('get-inbox', zones),

  // File operations
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  moveFile: (from, toDir) => ipcRenderer.invoke('move-file', { from, toDir }),
  openInExplorer: (filePath) => ipcRenderer.invoke('open-in-explorer', filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  openInVscode: (folderPath) => ipcRenderer.invoke('open-in-vscode', folderPath),

  // Clutter finder
  findDuplicates: (zones) => ipcRenderer.invoke('find-duplicates', zones),
  findLargeFiles: (zones) => ipcRenderer.invoke('find-large-files', zones),
  findOldFiles: (zones) => ipcRenderer.invoke('find-old-files', zones),

  // Organized folders
  getOrganizedFolders: () => ipcRenderer.invoke('get-organized-folders'),
  saveOrganizedFolders: (folders) => ipcRenderer.invoke('save-organized-folders', folders),

  // Folder picker
  browseFolder: () => ipcRenderer.invoke('browse-folder'),

  // Stats
  getStats: () => ipcRenderer.invoke('get-stats'),

  // Action log & undo
  getActionLog: () => ipcRenderer.invoke('get-action-log'),
  undoAction: (actionId) => ipcRenderer.invoke('undo-action', actionId),

  // Auto-sort
  getAutoSortSettings: () => ipcRenderer.invoke('get-auto-sort-settings'),
  saveAutoSortSettings: (settings) => ipcRenderer.invoke('save-auto-sort-settings', settings),
  runAutoSortNow: () => ipcRenderer.invoke('run-auto-sort-now'),

  // Dead projects
  findDeadProjects: (opts) => ipcRenderer.invoke('find-dead-projects', opts),

  // Disk space
  getDiskSpaceBreakdown: (paths) => ipcRenderer.invoke('get-disk-space-breakdown', paths),

  // ── Setup Wizard ──────────────────────────────────────────────
  getSetupStatus: () => ipcRenderer.invoke('get-setup-status'),
  completeSetup: () => ipcRenderer.invoke('complete-setup'),
  createFolder: (folderPath) => ipcRenderer.invoke('create-folder', folderPath),
  createFolderStructure: (opts) => ipcRenderer.invoke('create-folder-structure', opts),

  // ── Workflows ──────────────────────────────────────────────────
  getWorkflows: () => ipcRenderer.invoke('get-workflows'),
  saveWorkflows: (workflows) => ipcRenderer.invoke('save-workflows', workflows),

  // Video project workflows
  scanProjects: (dirPath) => ipcRenderer.invoke('scan-projects', dirPath),
  archiveProject: (opts) => ipcRenderer.invoke('archive-project', opts),

  // Audiobook workflows
  checkAudiobook: (opts) => ipcRenderer.invoke('check-audiobook', opts),

  // Reels
  scanReels: (reelsPath) => ipcRenderer.invoke('scan-reels', reelsPath),

  // Photos
  scanPhotos: (photosPath) => ipcRenderer.invoke('scan-photos', photosPath),
  organizePhotosByDate: (opts) => ipcRenderer.invoke('organize-photos-by-date', opts),

  // AI Photo Curation (Gemini Vision)
  saveGeminiKey: (key) => ipcRenderer.invoke('save-gemini-key', key),
  getGeminiKey: () => ipcRenderer.invoke('get-gemini-key'),
  estimateAiCost: (opts) => ipcRenderer.invoke('estimate-ai-cost', opts),
  aiAnalyzeFolder: (opts) => ipcRenderer.invoke('ai-analyze-folder', opts),
  aiGroupBursts: (opts) => ipcRenderer.invoke('ai-group-bursts', opts),
  aiMoveRejects: (opts) => ipcRenderer.invoke('ai-move-rejects', opts),
  aiGetTopics: (opts) => ipcRenderer.invoke('ai-get-topics', opts),

  // Apps
  scanApps: (appsPath) => ipcRenderer.invoke('scan-apps', appsPath),

  // ── Skipped triage files (Fix #17) ────────────────────────────
  getSkippedFiles: () => ipcRenderer.invoke('get-skipped-files'),
  saveSkippedFiles: (paths) => ipcRenderer.invoke('save-skipped-files', paths),

  // ── Command Palette: Global Search ────────────────────────────
  globalSearch: (opts) => ipcRenderer.invoke('global-search', opts),

  // ── Reels Publishing Status ────────────────────────────────────
  getReelsStatus: () => ipcRenderer.invoke('get-reels-status'),
  saveReelsStatus: (statusMap) => ipcRenderer.invoke('save-reels-status', statusMap),

  // ── File Naming Convention Enforcer ───────────────────────────
  renameFile: (opts) => ipcRenderer.invoke('rename-file', opts),
  getNamingConventions: () => ipcRenderer.invoke('get-naming-conventions'),
  saveNamingConventions: (c) => ipcRenderer.invoke('save-naming-conventions', c),

  // Push events from main → renderer
  // Fix #14: wrap fn so off() can remove the exact same reference
  on: (channel, fn) => {
    const allowed = ['navigate', 'tray-scan', 'auto-sort-moved', 'new-download', 'ai-photo-progress', 'update-available', 'update-downloaded']
    if (!allowed.includes(channel)) return
    const wrapper = (_, ...args) => fn(...args)
    // Store: fn → { channel → wrapper }
    if (!listenerWrappers.has(fn)) listenerWrappers.set(fn, new Map())
    listenerWrappers.get(fn).set(channel, wrapper)
    ipcRenderer.on(channel, wrapper)
  },
  off: (channel, fn) => {
    const channelMap = listenerWrappers.get(fn)
    if (!channelMap) return
    const wrapper = channelMap.get(channel)
    if (wrapper) {
      ipcRenderer.removeListener(channel, wrapper)
      channelMap.delete(channel)
    }
    if (channelMap.size === 0) listenerWrappers.delete(fn)
  },

  // Weekly health check
  runWeeklyCheck: (opts) => ipcRenderer.invoke('run-weekly-check', opts),
  getWeeklyCheckStatus: () => ipcRenderer.invoke('get-weekly-check-status'),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Auto-update
  installUpdate: () => ipcRenderer.invoke('install-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Folder icons
  applyFolderIcons: (opts) => ipcRenderer.invoke('apply-folder-icons', opts),
  refreshFolderIcons: () => ipcRenderer.invoke('refresh-folder-icons'),
})
