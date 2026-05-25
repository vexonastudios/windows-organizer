import React, { useState, useEffect, useCallback } from 'react'
import TitleBar from './components/TitleBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import Inbox from './components/Inbox/Inbox.jsx'
import ClutterFinder from './components/ClutterFinder/ClutterFinder.jsx'
import MyFolders from './components/Folders/MyFolders.jsx'
import Settings from './components/Settings/Settings.jsx'
import Workflows from './components/Workflows/Workflows.jsx'
import SetupWizard from './components/SetupWizard/SetupWizard.jsx'
import CommandPalette from './components/CommandPalette/CommandPalette.jsx'
import { ToastProvider, useToast } from './context/ToastContext.jsx'

function AppContent() {
  const [page, setPage] = useState('dashboard')
  const [zones, setZones] = useState([])
  const [inboxCount, setInboxCount] = useState(0)
  const [showSetup, setShowSetup] = useState(false)
  const [setupChecked, setSetupChecked] = useState(false)
  const [lastAutoSort, setLastAutoSort] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false) // Command Palette
  const toast = useToast()

  // Global Ctrl+K handler for Command Palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Command Palette actions
  const handlePaletteAction = useCallback(async (actionId) => {
    const fk = window.filekeeper
    if (!fk) return
    if (actionId === 'health') {
      toast.info('🔔 Running health check…')
      const result = await fk.runWeeklyCheck({ notify: true })
      if (result.urgentCount === 0) toast.success('✅ Everything looks clean!')
      else toast.info(`🔔 ${result.urgentCount} items need attention`)
    }
    if (actionId === 'setup') setShowSetup(true)
    if (actionId === 'autosort') {
      toast.info('🗂️ Sorting Downloads…')
      const r = await fk.runAutoSortNow()
      toast.success(`⚡ Moved ${r.moved} file${r.moved !== 1 ? 's' : ''}`)
    }
  }, [toast])

  // Check if first run
  useEffect(() => {
    const fk = window.filekeeper
    if (!fk) { setSetupChecked(true); return }
    fk.getSetupStatus().then(({ hasCompletedSetup }) => {
      setShowSetup(!hasCompletedSetup)
      setSetupChecked(true)
    }).catch(() => setSetupChecked(true))
  }, [])

  // Load zones
  useEffect(() => {
    const fk = window.filekeeper
    if (!fk) return
    fk.getZones().then(z => {
      setZones(z)
      fk.getInbox(z).then(files => {
        const recent = files.filter(f => f.ageDays <= 30)
        setInboxCount(recent.length)
      })
    })
  }, [])

  // Listen for tray navigation events
  useEffect(() => {
    const fk = window.filekeeper
    if (!fk?.on) return
    const handleNavigate = (dest) => setPage(dest)
    const handleAutoSortMoved = ({ file, destFolder, label, actionId }) => {
      // Fix #7: proper toast call (no bad optional chaining) + track action for undo
      toast.info(`📥 Auto-sorted: ${file} → ${label || destFolder}`)
      setLastAutoSort({ file, destFolder, actionId })
      refreshZones()
    }
    fk.on('navigate', handleNavigate)
    fk.on('auto-sort-moved', handleAutoSortMoved)
    return () => {
      fk.off('navigate', handleNavigate)
      fk.off('auto-sort-moved', handleAutoSortMoved)
    }
  }, [refreshZones]) // Fix #10: refreshZones added to deps so closure is never stale

  const refreshZones = useCallback(async () => {
    const fk = window.filekeeper
    if (!fk) return
    const z = await fk.getZones()
    setZones(z)
    const files = await fk.getInbox(z)
    setInboxCount(files.filter(f => f.ageDays <= 30).length)
  }, [])

  const handleSetupComplete = useCallback(async () => {
    const fk = window.filekeeper
    if (fk) await fk.completeSetup()
    setShowSetup(false)
    // Reload zones with newly configured paths
    await refreshZones()
  }, [refreshZones])

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <Dashboard zones={zones} onNavigate={setPage} />
      case 'inbox':      return <Inbox zones={zones} onClear={() => setInboxCount(0)} />
      case 'workflows':  return <Workflows />
      case 'clutter':    return <ClutterFinder zones={zones} />
      case 'folders':    return <MyFolders zones={zones} />
      case 'settings':   return <Settings zones={zones} onSave={refreshZones} onOpenSetup={() => setShowSetup(true)} />
      default:           return <Dashboard zones={zones} onNavigate={setPage} />
    }
  }

  if (!setupChecked) {
    return (
      <div className="app-shell">
        <TitleBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f13' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* TitleBar always on top — z-index above wizard overlay (1000) */}
      <div style={{ position: 'relative', zIndex: 1001, flexShrink: 0 }}>
        <TitleBar onOpenPalette={() => setPaletteOpen(true)} />
      </div>
      <div className="app-body">
        <Sidebar
          page={page}
          onNavigate={setPage}
          inboxCount={inboxCount}
        />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
      {/* Fix #7: Undo last auto-sort banner */}
      {lastAutoSort && (
        <div style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 2000,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', fontSize: 13,
        }}>
          <span>📥 Auto-sorted: <strong>{lastAutoSort.file}</strong></span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              const log = await window.filekeeper.getActionLog()
              const action = log.find(a => a.type === 'auto-sort')
              if (action) {
                const res = await window.filekeeper.undoAction(action.id)
                if (res.success) {
                  toast.success('↩ Undone — file moved back')
                } else {
                  toast.error('Could not undo: ' + res.error)
                }
              }
              setLastAutoSort(null)
              refreshZones()
            }}
          >↩ Undo</button>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
            onClick={() => setLastAutoSort(null)}
          >×</button>
        </div>
      )}
      {/* Command Palette */}
      {paletteOpen && (
        <CommandPalette
          zones={zones}
          onNavigate={(dest) => { setPage(dest); setPaletteOpen(false) }}
          onRunAction={handlePaletteAction}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      {showSetup && <SetupWizard onComplete={handleSetupComplete} />}
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
