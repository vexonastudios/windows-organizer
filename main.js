const { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const crypto = require('crypto')

const isDev = !app.isPackaged

// ─── Store ────────────────────────────────────────────────────────────────────
let store
async function getStore() {
  if (!store) {
    const { default: Store } = await import('electron-store')
    store = new Store({
      defaults: {
        zones: [
          {
            id: 'downloads',
            name: 'Downloads',
            path: path.join(os.homedir(), 'Downloads'),
            icon: '📥',
            color: '#6c63ff',
            rules: { maxFiles: 50, maxAgeDays: 30, maxSizeGB: 2 }
          },
          {
            id: 'desktop',
            name: 'Desktop',
            path: path.join(os.homedir(), 'Desktop'),
            icon: '🖥️',
            color: '#f59e0b',
            rules: { maxFiles: 20, maxAgeDays: 7, maxSizeGB: 1 }
          },
          {
            id: 'pictures',
            name: 'Pictures',
            path: path.join(os.homedir(), 'Pictures'),
            icon: '🖼️',
            color: '#10b981',
            rules: { maxFiles: 500, maxAgeDays: 365, maxSizeGB: 20 }
          },
          {
            id: 'videos',
            name: 'Videos',
            path: path.join(os.homedir(), 'Videos'),
            icon: '🎬',
            color: '#ef4444',
            rules: { maxFiles: 100, maxAgeDays: 180, maxSizeGB: 50 }
          },
          {
            id: 'documents',
            name: 'Documents',
            path: path.join(os.homedir(), 'Documents'),
            icon: '📄',
            color: '#3b82f6',
            rules: { maxFiles: 200, maxAgeDays: 365, maxSizeGB: 5 }
          }
        ],
        organizedFolders: [],
        archivedFiles: [],
        deletedCount: 0,
        movedCount: 0,
        spaceReclaimed: 0,
        actionLog: [],   // undo stack: { id, type, from, to, size, timestamp }
        autoSortRules: [ // Downloads auto-sort defaults
          { id: 'videos',    enabled: true,  exts: ['.mp4','.mov','.avi','.mkv','.wmv','.webm','.m4v'], destFolder: 'Staging\\Video',     label: 'Videos' },
          { id: 'images',    enabled: true,  exts: ['.jpg','.jpeg','.png','.gif','.bmp','.webp','.heic','.tiff'], destFolder: 'Staging\\Photos',    label: 'Images' },
          { id: 'raws',      enabled: true,  exts: ['.cr2','.cr3','.nef','.arw','.dng','.orf','.rw2','.raf'],   destFolder: 'Staging\\RAW',       label: 'RAW Photos' },
          { id: 'audio',     enabled: true,  exts: ['.mp3','.wav','.flac','.aac','.ogg','.m4a'],                destFolder: 'Staging\\Audio',      label: 'Audio' },
          { id: 'pdfs',      enabled: true,  exts: ['.pdf'],                                                    destFolder: 'Staging\\PDFs',       label: 'PDFs' },
          { id: 'archives',  enabled: false, exts: ['.zip','.rar','.7z','.tar','.gz'],                          destFolder: 'Staging\\Archives',   label: 'Archives' },
          { id: 'executables', enabled: false, exts: ['.exe','.msi'],                                           destFolder: 'Staging\\Installers', label: 'Installers' },
        ],
        hasCompletedSetup: false,
        autoSortEnabled: false,
        autoSortSourcePath: path.join(os.homedir(), 'Downloads'),
        workflows: [
          {
            id: 'sermons',
            name: 'Church Sermons',
            icon: '🎙️',
            color: '#8b5cf6',
            type: 'video_project',
            workingPath: 'E:\\gccsatx\\Working',
            archivePath: 'E:\\gccsatx\\Archive',
            keepExtensions: ['.mp4', '.mov'],
            keepPatterns: ['final', 'render', 'export'],
            description: 'Sermon editing projects. Archive the final render, trash the rest.',
          },
          {
            id: 'ibh',
            name: "I'll Be Honest",
            icon: '📹',
            color: '#ef4444',
            type: 'video_project',
            workingPath: "E:\\illbehonest\\Working",
            archivePath: "E:\\illbehonest\\Archive",
            keepExtensions: ['.mp4', '.mov'],
            keepPatterns: ['final', 'render', 'export'],
            description: 'IBH video editing. Archive final render, trash working files.',
          },
          {
            id: 'scrollreader',
            name: 'Scroll Reader Audiobooks',
            icon: '📜',
            color: '#f59e0b',
            type: 'audiobook',
            workingPath: 'E:\\Audiobooks\\ScrollReader',
            requiredFiles: [
              { key: 'mp3',      label: 'Final MP3',         extensions: ['.mp3'] },
              { key: 'cover',    label: 'Cover Image',        extensions: ['.jpg', '.jpeg', '.png'] },
              { key: 'thumbnail',label: 'Thumbnail',          extensions: ['.jpg', '.jpeg', '.png'], nameHint: 'thumb' },
              { key: 'indesign', label: 'InDesign File',      extensions: ['.indd', '.idml'] },
              { key: 'pdf',      label: 'PDF (KDP)',          extensions: ['.pdf'] },
              { key: 'kindle',   label: 'Kindle File',        extensions: ['.epub', '.mobi', '.kfx'] },
            ],
            description: 'Scroll Reader audiobook projects.',
          },
          {
            id: 'bodeebooks',
            name: 'Bodee Books Audiobooks',
            icon: '📚',
            color: '#10b981',
            type: 'audiobook',
            workingPath: 'E:\\Audiobooks\\BodeeBooks',
            requiredFiles: [
              { key: 'mp3',      label: 'Final MP3',         extensions: ['.mp3'] },
              { key: 'cover',    label: 'Cover Image',        extensions: ['.jpg', '.jpeg', '.png'] },
              { key: 'thumbnail',label: 'Thumbnail',          extensions: ['.jpg', '.jpeg', '.png'], nameHint: 'thumb' },
              { key: 'indesign', label: 'InDesign File',      extensions: ['.indd', '.idml'] },
              { key: 'pdf',      label: 'PDF (KDP)',          extensions: ['.pdf'] },
              { key: 'kindle',   label: 'Kindle File',        extensions: ['.epub', '.mobi', '.kfx'] },
            ],
            description: 'Bodee Books audiobook projects.',
          },
          {
            id: 'reels',
            name: 'Reels',
            icon: '🎬',
            color: '#3b82f6',
            type: 'reels',
            workingPath: 'E:\\Reels',
            description: 'Short-form video reels — Scroll Reader, Bodee Books, IBH, Hear Him, GCC SATX.',
          },
          {
            id: 'photos',
            name: 'Family Photos',
            icon: '📷',
            color: '#06b6d4',
            type: 'photos',
            workingPath: path.join(os.homedir(), 'Pictures'),
            description: 'Canon 5D photos — JPG + RAW pairs, organized by date.',
          },
          {
            id: 'apps',
            name: 'Dev Apps',
            icon: '💻',
            color: '#a855f7',
            type: 'apps',
            workingPath: 'E:\\',
            description: 'AntiGravity apps and development projects.',
          },
        ],
      }
    })
  }
  return store
}

// ─── Window & Tray ────────────────────────────────────────────────────────────
let mainWindow
let tray = null
let isQuitting = false

function createTray() {
  // Use a blank icon (1x1 png) if no assets folder — fallback gracefully
  let icon
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png')
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath)
  } else {
    // 16x16 transparent PNG as base64 fallback
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADklEQVQ4jWNgGAWkAgABBAABkMrFWQAAAABJRU5ErkJggg=='
    )
  }
  tray = new Tray(icon)

  const buildMenu = () => Menu.buildFromTemplate([
    { label: '📁 FileKeeper', enabled: false },
    { type: 'separator' },
    {
      label: '🏠 Open FileKeeper',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus() }
        else createWindow()
      }
    },
    { label: '📥 Go to Inbox', click: () => { showWindow(); mainWindow?.webContents.send('navigate', 'inbox') } },
    { label: '⚡ My Workflows', click: () => { showWindow(); mainWindow?.webContents.send('navigate', 'workflows') } },
    { type: 'separator' },
    {
      label: '🔍 Scan Now',
      click: () => { showWindow(); mainWindow?.webContents.send('tray-scan') }
    },
    { type: 'separator' },
    { label: '✕ Quit FileKeeper', click: () => { isQuitting = true; app.quit() } },
  ])

  tray.setToolTip('FileKeeper — PC Organizer')
  tray.setContextMenu(buildMenu())
  tray.on('double-click', () => showWindow())
}

function showWindow() {
  if (!mainWindow) { createWindow(); return }
  mainWindow.show()
  mainWindow.focus()
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0f0f13',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow.hide()
      if (tray) {
        tray.displayBalloon?.({
          title: 'FileKeeper is still running',
          content: 'FileKeeper is watching your folders in the background. Right-click the tray icon to quit.',
          icon: 'info',
        })
      }
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Auto-Sort Background Watcher ─────────────────────────────────────────────
let watcherDebounce = {}
let autoSortWatcher = null  // Fix #4: track instance to prevent duplicates

function startAutoSortWatcher() {
  // Fix #4: Close any existing watcher before creating a new one
  if (autoSortWatcher) {
    try { autoSortWatcher.close() } catch {}
    autoSortWatcher = null
  }
  getStore().then(async s => {
    if (!s.get('autoSortEnabled')) return
    const sourcePath = s.get('autoSortSourcePath')
    if (!fs.existsSync(sourcePath)) return

    try {
      const chokidar = require('chokidar')
      const watcher = chokidar.watch(sourcePath, {
        depth: 0,
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 200 },
      })
      autoSortWatcher = watcher  // Fix #4: save reference for cleanup

      watcher.on('add', (filePath) => {
        // Debounce per file
        if (watcherDebounce[filePath]) return
        watcherDebounce[filePath] = true
        setTimeout(() => delete watcherDebounce[filePath], 5000)

        const fileName = path.basename(filePath)
        const ext = path.extname(filePath).toLowerCase()
        const rules = s.get('autoSortRules') || []
        let sorted = false

        for (const rule of rules) {
          if (!rule.enabled) continue
          if (rule.exts.includes(ext)) {
            const destDir = path.join(sourcePath, rule.destFolder)
            try {
              if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
              const dest = path.join(destDir, fileName)
              fs.renameSync(filePath, dest)
              s.set('movedCount', (s.get('movedCount') || 0) + 1)

              // Log the action for undo
              appendActionLog(s, {
                id: crypto.randomUUID(),
                type: 'auto-sort',
                from: filePath,
                to: dest,
                timestamp: Date.now(),
              })

              // Notify renderer
              if (mainWindow) {
                mainWindow.webContents.send('auto-sort-moved', {
                  file: fileName,
                  destFolder: rule.destFolder,
                  label: rule.label,
                })
              }
              sorted = true
            } catch {}
            break
          }
        }

        // ── Route-It Notification ──────────────────────────────────────
        // Files that weren't auto-sorted (no rule matched) get a Windows
        // notification asking where they should go. Clicking opens Inbox.
        if (!sorted) {
          const notif = new Notification({
            title: `📥 New download: ${fileName}`,
            body: 'Click to open FileKeeper and route it to the right project folder.',
            silent: false,
          })
          notif.on('click', () => {
            showWindow()
            setTimeout(() => {
              if (mainWindow) {
                mainWindow.webContents.send('navigate', 'inbox')
                mainWindow.webContents.send('new-download', { filePath, fileName })
              }
            }, 300)
          })
          notif.show()
        }

        // Always ping the renderer so Inbox can refresh and highlight the file
        if (mainWindow) {
          mainWindow.webContents.send('new-download', { filePath, fileName })
        }
      })
    } catch (err) {
      console.error('Watcher failed:', err.message)
    }
  })
}

// ─── Action Log (undo) ────────────────────────────────────────────────────────
function appendActionLog(s, action) {
  const log = s.get('actionLog') || []
  log.unshift(action) // newest first
  s.set('actionLog', log.slice(0, 100)) // keep last 100
}

// ─── Weekly Health Check ───────────────────────────────────────────────────────
async function runWeeklyHealthCheck({ silent = false } = {}) {
  const s = await getStore()
  const workflows = s.get('workflows') || []
  const lines = []
  let urgentCount = 0

  // 1. Check Downloads folder file count
  const downloadsPath = s.get('autoSortSourcePath') || path.join(os.homedir(), 'Downloads')
  if (fs.existsSync(downloadsPath)) {
    const dlFiles = scanDirectory(downloadsPath, true)
    const oldDlFiles = dlFiles.filter(f => f.ageDays > 14)
    if (dlFiles.length > 20) {
      lines.push(`📥 Downloads: ${dlFiles.length} files (${oldDlFiles.length} older than 2 weeks)`)
      urgentCount++
    }
  }

  // 2. Scan video project workflows for dead projects and archive-ready projects
  const videoWorkflows = workflows.filter(w => w.type === 'video_project')
  let archiveReady = 0
  let deadProjects = 0
  for (const wf of videoWorkflows) {
    if (!wf.workingPath || !fs.existsSync(wf.workingPath)) continue
    try {
      const entries = fs.readdirSync(wf.workingPath, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const projPath = path.join(wf.workingPath, entry.name)
        const files = scanDirectory(projPath, false)
        if (files.length === 0) continue
        const lastMod = Math.max(...files.map(f => f.mtimeMs))
        const ageDays = Math.floor((Date.now() - lastMod) / 86400000)
        const hasFinal = files.some(f =>
          ['.mp4', '.mov'].includes(f.ext.toLowerCase()) &&
          ['final', 'render', 'export'].some(p => f.name.toLowerCase().includes(p))
        )
        if (hasFinal) archiveReady++
        else if (ageDays >= 30) deadProjects++
      }
    } catch {}
  }
  if (archiveReady > 0) {
    lines.push(`🗂️ ${archiveReady} project${archiveReady > 1 ? 's' : ''} ready to archive & clean`)
    urgentCount++
  }
  if (deadProjects > 0) {
    lines.push(`💀 ${deadProjects} project${deadProjects > 1 ? 's' : ''} untouched for 30+ days`)
    urgentCount++
  }

  // 3. Space reclaimed this week (encouraging stat)
  const spaceReclaimed = s.get('spaceReclaimed') || 0
  const weeklyLastCheck = s.get('weeklyLastCheckTime') || 0
  const weeklyReclaimedStart = s.get('weeklyReclaimedAtLastCheck') || 0
  const reclaimedThisWeek = spaceReclaimed - weeklyReclaimedStart

  // Update last-check markers
  s.set('weeklyLastCheckTime', Date.now())
  s.set('weeklyReclaimedAtLastCheck', spaceReclaimed)

  // Build the result for the UI
  const summary = {
    lines,
    urgentCount,
    archiveReady,
    deadProjects,
    reclaimedThisWeek,
    reclaimedThisWeekFormatted: formatBytes(reclaimedThisWeek),
    checkedAt: Date.now(),
  }

  if (!silent && urgentCount > 0) {
    // Send a Windows notification
    const title = urgentCount === 1 ? '🔔 FileKeeper — 1 item needs attention' : `🔔 FileKeeper — ${urgentCount} things need attention`
    const body = lines.join('\n')
    const notif = new Notification({ title, body, silent: false })
    notif.on('click', () => showWindow())
    notif.show()
  } else if (!silent && urgentCount === 0) {
    const notif = new Notification({
      title: '✅ FileKeeper — Everything looks clean!',
      body: reclaimedThisWeek > 0
        ? `You reclaimed ${formatBytes(reclaimedThisWeek)} of space this week. Keep it up!`
        : 'All your workflows are in good shape. Great job staying organized!',
      silent: false,
    })
    notif.on('click', () => showWindow())
    notif.show()
  }

  return summary
}

// Schedule weekly check — fires every Sunday at 9 AM local time
function scheduleWeeklyCheck() {
  function msUntilNextSunday9am() {
    const now = new Date()
    const target = new Date(now)
    target.setHours(9, 0, 0, 0)
    // Days until Sunday (0 = Sunday)
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7
    target.setDate(target.getDate() + daysUntilSunday)
    let ms = target - now
    if (ms <= 0) ms += 7 * 24 * 60 * 60 * 1000
    return ms
  }

  function scheduleNext() {
    const delay = msUntilNextSunday9am()
    setTimeout(async () => {
      await runWeeklyHealthCheck()
      scheduleNext() // reschedule for next Sunday
    }, delay)
  }
  scheduleNext()
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  await getStore()
  createWindow()
  createTray()
  startAutoSortWatcher()
  scheduleWeeklyCheck()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => {
  // On Windows, don't quit when all windows close — keep tray running
  if (process.platform === 'darwin') app.quit()
})

app.on('before-quit', () => { isQuitting = true })

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileAge(mtimeMs) {
  return Math.floor((Date.now() - mtimeMs) / (1000 * 60 * 60 * 24))
}

function calcHealthScore(files, rules) {
  let score = 100
  const fileCount = files.length
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0)
  const oldFiles = files.filter(f => getFileAge(f.mtimeMs) > rules.maxAgeDays).length

  if (fileCount > rules.maxFiles) score -= Math.min(40, ((fileCount - rules.maxFiles) / rules.maxFiles) * 40)
  if (totalSize > rules.maxSizeGB * 1024 * 1024 * 1024) score -= 30
  if (oldFiles > 0) score -= Math.min(30, (oldFiles / fileCount) * 30)

  return Math.max(0, Math.round(score))
}

function getFileType(ext) {
  const images = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.heic']
  const videos = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v']
  const audio = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma']
  const docs = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf']
  const code = ['.js', '.ts', '.py', '.html', '.css', '.json', '.xml', '.yml', '.yaml', '.sql']
  const archives = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2']
  const exe = ['.exe', '.msi', '.dmg', '.pkg']

  const e = ext.toLowerCase()
  if (images.includes(e)) return 'image'
  if (videos.includes(e)) return 'video'
  if (audio.includes(e)) return 'audio'
  if (docs.includes(e)) return 'document'
  if (code.includes(e)) return 'code'
  if (archives.includes(e)) return 'archive'
  if (exe.includes(e)) return 'executable'
  return 'other'
}

function scanDirectory(dirPath, shallow = true) {
  const files = []
  if (!fs.existsSync(dirPath)) return files
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      try {
        if (entry.isFile()) {
          const stat = fs.statSync(fullPath)
          const ext = path.extname(entry.name)
          files.push({
            name: entry.name,
            path: fullPath,
            ext,
            type: getFileType(ext),
            size: stat.size,
            sizeFormatted: formatBytes(stat.size),
            mtimeMs: stat.mtimeMs,
            ageDays: getFileAge(stat.mtimeMs),
            directory: dirPath,
          })
        } else if (entry.isDirectory() && !shallow) {
          files.push(...scanDirectory(fullPath, true))
        }
      } catch { /* skip locked files */ }
    }
  } catch { /* skip inaccessible dirs */ }
  return files
}

function hashFile(filePath) {
  return new Promise((resolve) => {
    try {
      const hash = crypto.createHash('md5')
      const stream = fs.createReadStream(filePath)
      stream.on('data', (d) => hash.update(d))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', () => resolve(null))
    } catch {
      resolve(null)
    }
  })
}

// Recursively get folder size
function getFolderSize(dirPath) {
  let total = 0
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name)
      try {
        if (entry.isFile()) {
          total += fs.statSync(full).size
        } else if (entry.isDirectory()) {
          total += getFolderSize(full)
        }
      } catch {}
    }
  } catch {}
  return total
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('get-zones', async () => { const s = await getStore(); return s.get('zones') })
ipcMain.handle('save-zones', async (_, zones) => { const s = await getStore(); s.set('zones', zones); return true })

ipcMain.handle('scan-zone', async (_, zone) => {
  const files = scanDirectory(zone.path, true)
  const health = calcHealthScore(files, zone.rules)
  const totalSize = files.reduce((a, f) => a + f.size, 0)
  const oldFiles = files.filter(f => f.ageDays > zone.rules.maxAgeDays)
  const byType = files.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + 1; return acc }, {})
  return {
    zoneId: zone.id,
    fileCount: files.length,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    health,
    oldFileCount: oldFiles.length,
    byType,
    files: files.slice(0, 200),
  }
})

ipcMain.handle('get-inbox', async (_, zones) => {
  const allFiles = []
  for (const zone of zones) {
    const files = scanDirectory(zone.path, true)
    files.forEach(f => { f.zoneId = zone.id; f.zoneName = zone.name; f.zoneIcon = zone.icon })
    allFiles.push(...files)
  }
  return allFiles.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, 100)
})

ipcMain.handle('delete-file', async (_, filePath) => {
  try {
    const stat = fs.statSync(filePath)
    await shell.trashItem(filePath)
    const s = await getStore()
    s.set('deletedCount', (s.get('deletedCount') || 0) + 1)
    s.set('spaceReclaimed', (s.get('spaceReclaimed') || 0) + stat.size)
    appendActionLog(s, { id: crypto.randomUUID(), type: 'delete', from: filePath, to: 'Recycle Bin', size: stat.size, timestamp: Date.now() })
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('move-file', async (_, { from, toDir }) => {
  try {
    if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true })
    const dest = path.join(toDir, path.basename(from))
    const size = fs.statSync(from).size
    fs.renameSync(from, dest)
    const s = await getStore()
    s.set('movedCount', (s.get('movedCount') || 0) + 1)
    appendActionLog(s, { id: crypto.randomUUID(), type: 'move', from, to: dest, size, timestamp: Date.now() })
    return { success: true, dest }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('browse-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle('find-duplicates', async (_, zones) => {
  const allFiles = []
  for (const zone of zones) {
    const files = scanDirectory(zone.path, false)
    files.forEach(f => { f.zoneId = zone.id; f.zoneName = zone.name })
    allFiles.push(...files)
  }
  const bySize = {}
  for (const f of allFiles) {
    if (f.size < 1024) continue
    if (!bySize[f.size]) bySize[f.size] = []
    bySize[f.size].push(f)
  }
  const potentialDups = Object.values(bySize).filter(g => g.length > 1)
  const duplicateGroups = []
  for (const group of potentialDups.slice(0, 50)) {
    const hashes = {}
    for (const f of group) {
      const hash = await hashFile(f.path)
      if (!hash) continue
      if (!hashes[hash]) hashes[hash] = []
      hashes[hash].push(f)
    }
    for (const [hash, files] of Object.entries(hashes)) {
      if (files.length > 1) {
        duplicateGroups.push({ hash, files, wastedSize: files[0].size * (files.length - 1) })
      }
    }
  }
  return duplicateGroups
})

ipcMain.handle('find-large-files', async (_, zones) => {
  const allFiles = []
  for (const zone of zones) {
    const files = scanDirectory(zone.path, false)
    files.forEach(f => { f.zoneId = zone.id; f.zoneName = zone.name })
    allFiles.push(...files)
  }
  return allFiles.filter(f => f.size > 50 * 1024 * 1024).sort((a, b) => b.size - a.size).slice(0, 50)
})

ipcMain.handle('find-old-files', async (_, zones) => {
  const allFiles = []
  for (const zone of zones) {
    const files = scanDirectory(zone.path, false)
    files.forEach(f => { f.zoneId = zone.id; f.zoneName = zone.name })
    allFiles.push(...files)
  }
  return allFiles.filter(f => f.ageDays > 365).sort((a, b) => b.ageDays - a.ageDays).slice(0, 50)
})

ipcMain.handle('get-stats', async () => {
  const s = await getStore()
  return {
    deletedCount: s.get('deletedCount', 0),
    movedCount: s.get('movedCount', 0),
    spaceReclaimed: s.get('spaceReclaimed', 0),
    spaceReclaimedFormatted: formatBytes(s.get('spaceReclaimed', 0)),
  }
})

ipcMain.handle('get-organized-folders', async () => { const s = await getStore(); return s.get('organizedFolders', []) })
ipcMain.handle('save-organized-folders', async (_, folders) => { const s = await getStore(); s.set('organizedFolders', folders); return true })

ipcMain.handle('open-in-explorer', async (_, filePath) => { shell.showItemInFileExplorer(filePath); return true })
ipcMain.handle('open-file', async (_, filePath) => { shell.openPath(filePath); return true })

// ─── Action Log & Undo ────────────────────────────────────────────────────────
ipcMain.handle('get-action-log', async () => {
  const s = await getStore()
  return s.get('actionLog', [])
})

ipcMain.handle('undo-action', async (_, actionId) => {
  const s = await getStore()
  const log = s.get('actionLog', [])
  const action = log.find(a => a.id === actionId)
  if (!action) return { success: false, error: 'Action not found' }

  try {
    if (action.type === 'move' || action.type === 'auto-sort') {
      // Move it back
      if (!fs.existsSync(path.dirname(action.from))) {
        fs.mkdirSync(path.dirname(action.from), { recursive: true })
      }
      fs.renameSync(action.to, action.from)
    }
    // Remove from log
    s.set('actionLog', log.filter(a => a.id !== actionId))
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ─── Auto-Sort Settings ────────────────────────────────────────────────────────
ipcMain.handle('get-auto-sort-settings', async () => {
  const s = await getStore()
  return {
    enabled: s.get('autoSortEnabled', false),
    sourcePath: s.get('autoSortSourcePath', path.join(os.homedir(), 'Downloads')),
    rules: s.get('autoSortRules', []),
  }
})

ipcMain.handle('save-auto-sort-settings', async (_, { enabled, sourcePath, rules }) => {
  const s = await getStore()
  s.set('autoSortEnabled', enabled)
  s.set('autoSortSourcePath', sourcePath)
  s.set('autoSortRules', rules)
  // Restart watcher
  startAutoSortWatcher()
  return true
})

// Run auto-sort once manually (scan existing files in source)
ipcMain.handle('run-auto-sort-now', async () => {
  const s = await getStore()
  const sourcePath = s.get('autoSortSourcePath', path.join(os.homedir(), 'Downloads'))
  const rules = s.get('autoSortRules', [])
  if (!fs.existsSync(sourcePath)) return { moved: 0, skipped: 0 }

  let moved = 0, skipped = 0
  const files = scanDirectory(sourcePath, true)

  for (const file of files) {
    const ext = file.ext.toLowerCase()
    let matched = false
    for (const rule of rules) {
      if (!rule.enabled) continue
      if (rule.exts.includes(ext)) {
        const destDir = path.join(sourcePath, rule.destFolder)
        try {
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
          const dest = path.join(destDir, file.name)
          fs.renameSync(file.path, dest)
          s.set('movedCount', (s.get('movedCount') || 0) + 1)
          appendActionLog(s, { id: crypto.randomUUID(), type: 'auto-sort', from: file.path, to: dest, size: file.size, timestamp: Date.now() })
          moved++
          matched = true
        } catch { skipped++ }
        break
      }
    }
    if (!matched) skipped++
  }
  return { moved, skipped }
})

// ─── Dead Projects Detector ────────────────────────────────────────────────────
ipcMain.handle('find-dead-projects', async (_, { paths, thresholdDays }) => {
  const deadProjects = []
  const days = thresholdDays || 30

  for (const rootPath of paths) {
    if (!fs.existsSync(rootPath)) continue
    try {
      const entries = fs.readdirSync(rootPath, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const fullPath = path.join(rootPath, entry.name)
        try {
          // Get most recent file mtime in the folder (recursive)
          const files = scanDirectory(fullPath, false)
          if (files.length === 0) continue

          const lastModified = Math.max(...files.map(f => f.mtimeMs))
          const ageDays = Math.floor((Date.now() - lastModified) / (1000 * 60 * 60 * 24))
          const totalSize = files.reduce((a, f) => a + f.size, 0)

          if (ageDays >= days) {
            deadProjects.push({
              name: entry.name,
              path: fullPath,
              ageDays,
              fileCount: files.length,
              totalSize,
              totalSizeFormatted: formatBytes(totalSize),
              lastModified,
              rootPath,
            })
          }
        } catch {}
      }
    } catch {}
  }

  return deadProjects.sort((a, b) => b.ageDays - a.ageDays)
})

// ─── Disk Space Analysis ───────────────────────────────────────────────────────
ipcMain.handle('get-disk-space-breakdown', async (_, paths) => {
  const results = []
  for (const p of paths) {
    if (!fs.existsSync(p)) continue
    const size = getFolderSize(p)
    results.push({ path: p, name: path.basename(p) || p, size, sizeFormatted: formatBytes(size) })
  }
  return results.sort((a, b) => b.size - a.size)
})

// ─── Workflow IPC ──────────────────────────────────────────────────────────────
ipcMain.handle('get-workflows', async () => { const s = await getStore(); return s.get('workflows') })
ipcMain.handle('save-workflows', async (_, workflows) => { const s = await getStore(); s.set('workflows', workflows); return true })

ipcMain.handle('scan-projects', async (_, dirPath) => {
  // Fix #6: Return { exists, projects } so UI can tell empty-folder from missing-folder
  if (!fs.existsSync(dirPath)) return { exists: false, projects: [] }
  const projects = []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const fullPath = path.join(dirPath, entry.name)
      try {
        const stat = fs.statSync(fullPath)
        const files = scanDirectory(fullPath, false)
        const totalSize = files.reduce((a, f) => a + f.size, 0)
        // Detect final files
        const finalFiles = files.filter(f => {
          const extOk = ['.mp4', '.mov'].includes(f.ext.toLowerCase())
          const nameOk = ['final', 'render', 'export'].some(p => f.name.toLowerCase().includes(p))
          return extOk && nameOk
        })
        projects.push({
          name: entry.name,
          path: fullPath,
          fileCount: files.length,
          totalSize,
          totalSizeFormatted: formatBytes(totalSize),
          mtimeMs: stat.mtimeMs,
          ageDays: getFileAge(stat.mtimeMs),
          hasFinalRender: finalFiles.length > 0,
          finalFiles,
          files,
        })
      } catch {}
    }
  } catch {}
  return { exists: true, projects: projects.sort((a, b) => b.mtimeMs - a.mtimeMs) }
})

ipcMain.handle('check-audiobook', async (_, { projectPath, requiredFiles }) => {
  const files = scanDirectory(projectPath, false)
  const results = {}
  for (const req of requiredFiles) {
    const match = files.find(f => {
      const extMatch = req.extensions.some(e => f.ext.toLowerCase() === e.toLowerCase())
      if (!extMatch) return false
      if (req.nameHint) return f.name.toLowerCase().includes(req.nameHint.toLowerCase())
      return true
    })
    results[req.key] = match ? { found: true, file: match } : { found: false }
  }
  const allFound = requiredFiles.every(r => results[r.key]?.found)
  const foundCount = requiredFiles.filter(r => results[r.key]?.found).length
  return { results, allFound, foundCount, total: requiredFiles.length, files }
})

ipcMain.handle('archive-project', async (_, { projectPath, archivePath, keepExtensions, keepPatterns }) => {
  const files = scanDirectory(projectPath, false)
  const kept = [], trashed = []

  const isKeeper = (file) => {
    const extOk = keepExtensions.some(e => file.ext.toLowerCase() === e.toLowerCase())
    if (!extOk) return false
    if (keepPatterns && keepPatterns.length > 0) {
      return keepPatterns.some(p => file.name.toLowerCase().includes(p.toLowerCase()))
    }
    return true
  }

  const projectName = path.basename(projectPath)
  const destDir = path.join(archivePath, projectName)
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

  for (const file of files) {
    if (isKeeper(file)) {
      try {
        const dest = path.join(destDir, file.name)
        fs.copyFileSync(file.path, dest)
        kept.push(file.name)
      } catch {}
    } else {
      try {
        await shell.trashItem(file.path)
        trashed.push(file.name)
      } catch {}
    }
  }

  // Fix #1: Trash the now-empty source project folder (removes ghost folder)
  try { await shell.trashItem(projectPath) } catch {}

  const s = await getStore()
  s.set('deletedCount', (s.get('deletedCount') || 0) + trashed.length)
  s.set('movedCount', (s.get('movedCount') || 0) + kept.length)
  return { kept, trashed, destDir }
})

ipcMain.handle('scan-reels', async (_, reelsPath) => {
  if (!fs.existsSync(reelsPath)) return { channels: [], rootFiles: [] }
  const entries = fs.readdirSync(reelsPath, { withFileTypes: true })
  const channels = [], rootFiles = []

  for (const entry of entries) {
    const fullPath = path.join(reelsPath, entry.name)
    if (entry.isDirectory()) {
      const files = scanDirectory(fullPath, true).filter(f =>
        ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(f.ext.toLowerCase())
      )
      channels.push({
        name: entry.name,
        path: fullPath,
        fileCount: files.length,
        totalSize: files.reduce((a, f) => a + f.size, 0),
        totalSizeFormatted: formatBytes(files.reduce((a, f) => a + f.size, 0)),
        files: files.sort((a, b) => b.mtimeMs - a.mtimeMs),
      })
    } else {
      const ext = path.extname(entry.name)
      if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext.toLowerCase())) {
        try {
          const stat = fs.statSync(fullPath)
          rootFiles.push({ name: entry.name, path: fullPath, ext, size: stat.size, sizeFormatted: formatBytes(stat.size), mtimeMs: stat.mtimeMs, ageDays: getFileAge(stat.mtimeMs) })
        } catch {}
      }
    }
  }
  return { channels, rootFiles }
})

ipcMain.handle('scan-photos', async (_, photosPath) => {
  if (!fs.existsSync(photosPath)) return { dateGroups: [], unorganized: [] }
  const RAW_EXTS = ['.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.raf']
  const IMG_EXTS = ['.jpg', '.jpeg', '.png', '.heic', '.webp']

  const rootFiles = scanDirectory(photosPath, true)
  const unorganized = rootFiles.filter(f => {
    const ext = f.ext.toLowerCase()
    return RAW_EXTS.includes(ext) || IMG_EXTS.includes(ext)
  })

  const dateGroups = []
  try {
    const entries = fs.readdirSync(photosPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const dirPath = path.join(photosPath, entry.name)
      const files = scanDirectory(dirPath, true).filter(f => {
        const ext = f.ext.toLowerCase()
        return RAW_EXTS.includes(ext) || IMG_EXTS.includes(ext)
      })
      if (files.length === 0) continue
      const rawCount = files.filter(f => RAW_EXTS.includes(f.ext.toLowerCase())).length
      const jpgCount = files.filter(f => IMG_EXTS.includes(f.ext.toLowerCase())).length
      const totalSize = files.reduce((a, f) => a + f.size, 0)
      dateGroups.push({ name: entry.name, path: dirPath, fileCount: files.length, rawCount, jpgCount, totalSize, totalSizeFormatted: formatBytes(totalSize), mtimeMs: files[0]?.mtimeMs || 0 })
    }
  } catch {}

  const pairMap = {}
  for (const f of unorganized) {
    const base = path.basename(f.name, f.ext).toUpperCase()
    if (!pairMap[base]) pairMap[base] = { raw: null, jpg: null }
    if (RAW_EXTS.includes(f.ext.toLowerCase())) pairMap[base].raw = f
    else pairMap[base].jpg = f
  }
  const pairs = Object.entries(pairMap).filter(([, v]) => v.raw && v.jpg).map(([name, v]) => ({ name, raw: v.raw, jpg: v.jpg }))

  return { dateGroups: dateGroups.sort((a, b) => b.mtimeMs - a.mtimeMs), unorganized, pairs, unorganizedCount: unorganized.length }
})

ipcMain.handle('organize-photos-by-date', async (_, { photosPath, files }) => {
  let moved = 0
  const errors = []
  for (const file of files) {
    try {
      const date = new Date(file.mtimeMs)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const folderName = `${year}-${month} ${monthNames[date.getMonth()]}`
      const destDir = path.join(photosPath, String(year), folderName)
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
      const dest = path.join(destDir, file.name)
      fs.renameSync(file.path, dest)
      moved++
    } catch (e) {
      errors.push({ file: file.name, error: e.message })
    }
  }
  const s = await getStore()
  s.set('movedCount', (s.get('movedCount') || 0) + moved)
  return { moved, errors }
})

ipcMain.handle('scan-apps', async (_, appsPath) => {
  if (!fs.existsSync(appsPath)) return []
  const entries = fs.readdirSync(appsPath, { withFileTypes: true })
  const apps = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('app-')) continue
    const fullPath = path.join(appsPath, entry.name)
    try {
      const stat = fs.statSync(fullPath)
      const hasPkg = fs.existsSync(path.join(fullPath, 'package.json'))
      let pkgName = entry.name
      let pkgVersion = null
      if (hasPkg) {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(fullPath, 'package.json'), 'utf8'))
          pkgName = pkg.name || entry.name
          pkgVersion = pkg.version || null
        } catch {}
      }
      apps.push({ name: entry.name, pkgName, pkgVersion, path: fullPath, hasPkg, mtimeMs: stat.mtimeMs, ageDays: getFileAge(stat.mtimeMs) })
    } catch {}
  }
  return apps.sort((a, b) => b.mtimeMs - a.mtimeMs)
})

// Open a path in VSCode
ipcMain.handle('open-in-vscode', async (_, folderPath) => {
  try {
    const { exec } = require('child_process')
    exec(`code "${folderPath}"`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ─── Setup Wizard ─────────────────────────────────────────────────────────────
ipcMain.handle('get-setup-status', async () => {
  const s = await getStore()
  return { hasCompletedSetup: s.get('hasCompletedSetup', false) }
})

ipcMain.handle('complete-setup', async () => {
  const s = await getStore()
  s.set('hasCompletedSetup', true)
  return true
})

// Create a single folder
ipcMain.handle('create-folder', async (_, folderPath) => {
  try {
    if (fs.existsSync(folderPath)) {
      return { success: true, existed: true }
    }
    fs.mkdirSync(folderPath, { recursive: true })
    return { success: true, existed: false }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// Create the full folder structure given a drive root
ipcMain.handle('create-folder-structure', async (_, { driveLetter, photosPath, customMappings }) => {
  const drive = driveLetter.replace(/[\\/]+$/, '') // e.g. 'E:'
  const home = os.homedir()

  // Build the folder list
  const folders = [
    // ── Sermons ──
    { path: `${drive}\\gccsatx`,          label: 'gccsatx root',          icon: '🎙️', group: 'Church Sermons' },
    { path: `${drive}\\gccsatx\\Working`, label: 'gccsatx Working',       icon: '🎙️', group: 'Church Sermons' },
    { path: `${drive}\\gccsatx\\Archive`, label: 'gccsatx Archive',       icon: '🎙️', group: 'Church Sermons' },
    // ── IBH ──
    { path: `${drive}\\illbehonest`,             label: 'illbehonest root',   icon: '📹', group: "I'll Be Honest" },
    { path: `${drive}\\illbehonest\\Working`,    label: 'illbehonest Working',           icon: '📹', group: "I'll Be Honest" },
    { path: `${drive}\\illbehonest\\Archive`,    label: 'illbehonest Archive',           icon: '📹', group: "I'll Be Honest" },
    // ── Audiobooks ──
    { path: `${drive}\\Audiobooks`,                    label: 'Audiobooks root',         icon: '📚', group: 'Audiobooks' },
    { path: `${drive}\\Audiobooks\\ScrollReader`,      label: 'Scroll Reader',            icon: '📜', group: 'Audiobooks' },
    { path: `${drive}\\Audiobooks\\BodeeBooks`,        label: 'Bodee Books',              icon: '📚', group: 'Audiobooks' },
    // ── Reels ──
    { path: `${drive}\\Reels`,                label: 'Reels root',              icon: '🎬', group: 'Reels' },
    { path: `${drive}\\Reels\\scrollreader`, label: 'Reels – Scroll Reader',   icon: '🎬', group: 'Reels' },
    { path: `${drive}\\Reels\\bodeebooks`,   label: 'Reels – Bodee Books',     icon: '🎬', group: 'Reels' },
    { path: `${drive}\\Reels\\illbehonest`,  label: 'Reels – IBH',             icon: '🎬', group: 'Reels' },
    { path: `${drive}\\Reels\\hearhim`,      label: 'Reels – Hear Him',        icon: '🎬', group: 'Reels' },
    { path: `${drive}\\Reels\\gccsatx`,      label: 'Reels – GCC SATX',        icon: '🎬', group: 'Reels' },
    // ── Apps ──
    { path: `${drive}\\apps`,       label: 'AntiGravity Apps', icon: '💻', group: 'Dev Apps' },
    // ── Downloads Staging ──
    { path: `${home}\\Downloads\\Staging`,           label: 'Downloads Staging root', icon: '📥', group: 'Downloads' },
    { path: `${home}\\Downloads\\Staging\\Video`,    label: 'Staging – Video',        icon: '📥', group: 'Downloads' },
    { path: `${home}\\Downloads\\Staging\\Photos`,   label: 'Staging – Photos',       icon: '📥', group: 'Downloads' },
    { path: `${home}\\Downloads\\Staging\\RAW`,      label: 'Staging – RAW Photos',   icon: '📥', group: 'Downloads' },
    { path: `${home}\\Downloads\\Staging\\Audio`,    label: 'Staging – Audio',        icon: '📥', group: 'Downloads' },
    { path: `${home}\\Downloads\\Staging\\PDFs`,     label: 'Staging – PDFs',         icon: '📥', group: 'Downloads' },
    // ── Photos ──
    { path: photosPath || `${home}\\Pictures`,       label: 'Family Photos',          icon: '📷', group: 'Family Photos' },
  ]

  // Apply any custom overrides
  if (customMappings) {
    for (const [key, val] of Object.entries(customMappings)) {
      const idx = folders.findIndex(f => f.label === key)
      if (idx !== -1) folders[idx].path = val
    }
  }

  const results = []
  for (const folder of folders) {
    try {
      const existed = fs.existsSync(folder.path)
      if (!existed) fs.mkdirSync(folder.path, { recursive: true })
      results.push({ ...folder, success: true, existed })
    } catch (e) {
      results.push({ ...folder, success: false, error: e.message, existed: false })
    }
  }

  // Auto-update workflows in store to use the new real paths
  const s = await getStore()
  const workflows = s.get('workflows')
  const updates = {
    sermons:      { workingPath: `${drive}\\gccsatx\\Working`,   archivePath: `${drive}\\gccsatx\\Archive` },
    ibh:          { workingPath: `${drive}\\illbehonest\\Working`,        archivePath: `${drive}\\illbehonest\\Archive` },
    scrollreader: { workingPath: `${drive}\\Audiobooks\\ScrollReader` },
    bodeebooks:   { workingPath: `${drive}\\Audiobooks\\BodeeBooks` },
    reels:        { workingPath: `${drive}\\Reels` },
    photos:       { workingPath: photosPath || path.join(home, 'Pictures') },
    apps:         { workingPath: `${drive}\\` },
  }
  const updatedWorkflows = workflows.map(w => updates[w.id] ? { ...w, ...updates[w.id] } : w)
  s.set('workflows', updatedWorkflows)
  s.set('autoSortSourcePath', path.join(home, 'Downloads'))
  s.set('hasCompletedSetup', true)

  return { results, updatedWorkflows }
})

// ─── Window controls ─────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => {
  if (!isQuitting) mainWindow?.hide()
  else mainWindow?.close()
})

// ─── Weekly Health Check IPC ──────────────────────────────────────────────────
ipcMain.handle('run-weekly-check', async (_, { notify = true } = {}) => {
  const summary = await runWeeklyHealthCheck({ silent: !notify })
  return summary
})

ipcMain.handle('get-weekly-check-status', async () => {
  const s = await getStore()
  return {
    lastCheckedAt: s.get('weeklyLastCheckTime', null),
    reclaimedAtLastCheck: s.get('weeklyReclaimedAtLastCheck', 0),
  }
})

// ─── Skipped Downloads Triage (Fix #17) ───────────────────────────────────────
// Persists the set of file paths the user chose to Skip during triage,
// so they don't re-appear on next app launch.
ipcMain.handle('get-skipped-files', async () => {
  const s = await getStore()
  return s.get('skippedFiles', [])
})

ipcMain.handle('save-skipped-files', async (_, paths) => {
  const s = await getStore()
  // Only keep paths that still exist on disk; auto-prune stale entries
  const alive = (paths || []).filter(p => fs.existsSync(p))
  s.set('skippedFiles', alive)
  return true
})

// ─── Global Search (Command Palette) ──────────────────────────────────────────
// Searches file names across all zone paths and the configured workflow paths.
// Returns up to 30 matches sorted by relevance (exact prefix match first).
ipcMain.handle('global-search', async (_, { query, zones, workflows }) => {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  const results = []
  const seen = new Set()

  const searchPath = async (dirPath, label, icon) => {
    if (!dirPath || !fs.existsSync(dirPath)) return
    try {
      const files = scanDirectory(dirPath, true)
      for (const f of files) {
        if (!f.name.toLowerCase().includes(q)) continue
        if (seen.has(f.path)) continue
        seen.add(f.path)
        results.push({
          type: 'file',
          name: f.name,
          path: f.path,
          size: f.sizeFormatted,
          ext: f.ext,
          fileType: f.type,
          ageDays: f.ageDays,
          source: label,
          sourceIcon: icon,
        })
        if (results.length >= 50) return
      }
    } catch {}
  }

  // Search all zone paths
  for (const zone of (zones || [])) {
    await searchPath(zone.path, zone.name, zone.icon)
  }
  // Search all workflow working paths
  for (const wf of (workflows || [])) {
    if (wf.workingPath) await searchPath(wf.workingPath, wf.name, wf.icon)
    if (wf.archivePath) await searchPath(wf.archivePath, wf.name + ' Archive', wf.icon)
  }

  // Sort: exact filename match first, then prefix match, then contains
  results.sort((a, b) => {
    const an = a.name.toLowerCase(), bn = b.name.toLowerCase()
    const aExact = an === q, bExact = bn === q
    const aPrefix = an.startsWith(q), bPrefix = bn.startsWith(q)
    if (aExact !== bExact) return aExact ? -1 : 1
    if (aPrefix !== bPrefix) return aPrefix ? -1 : 1
    return an.localeCompare(bn)
  })

  return results.slice(0, 30)
})

// ─── Reels Publishing Status (Feature #2) ─────────────────────────────────────
// Stores per-file status: 'draft' | 'ready' | 'published'
// Key structure: { [filePath]: { status, publishedAt, notes } }
ipcMain.handle('get-reels-status', async () => {
  const s = await getStore()
  return s.get('reelsStatus', {})
})

ipcMain.handle('save-reels-status', async (_, statusMap) => {
  const s = await getStore()
  s.set('reelsStatus', statusMap)
  return true
})

// ─── Rename File (Naming Convention Enforcer) ──────────────────────────────────
ipcMain.handle('rename-file', async (_, { oldPath, newName }) => {
  try {
    const dir = path.dirname(oldPath)
    const newPath = path.join(dir, newName)
    if (fs.existsSync(newPath)) return { success: false, error: 'A file with that name already exists.' }
    fs.renameSync(oldPath, newPath)
    const s = await getStore()
    appendActionLog(s, { id: crypto.randomUUID(), type: 'rename', from: oldPath, to: newPath, timestamp: Date.now() })
    return { success: true, newPath }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ─── Naming Conventions Store (Feature #3) ────────────────────────────────────
ipcMain.handle('get-naming-conventions', async () => {
  const s = await getStore()
  // Default conventions per workflow id
  return s.get('namingConventions', {
    sermons:  { pattern: '{channel}-{YYYY}-{MM}-{DD}-{title}-final', example: 'gccsatx-2026-05-25-title-here-final.mp4' },
    ibh:      { pattern: '{channel}-{YYYY}-{MM}-{DD}-{title}-final', example: 'illbehonest-2026-05-25-title-here-final.mp4' },
  })
})

ipcMain.handle('save-naming-conventions', async (_, conventions) => {
  const s = await getStore()
  s.set('namingConventions', conventions)
  return true
})

