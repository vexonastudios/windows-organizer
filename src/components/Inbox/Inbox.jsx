import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getFileEmoji, formatAge } from '../../utils/fileUtils.js'
import { useToast } from '../../context/ToastContext.jsx'
import MoveModal from './MoveModal.jsx'

const TYPE_FILTERS = ['all', 'image', 'video', 'audio', 'document', 'archive', 'executable', 'code', 'other']

// ─── Bulk Send Modal (#3) ─────────────────────────────────────────────────────
// Shown when user clicks "⚡ Send to…" with files selected. Lets them pick
// a single workflow destination for all selected files.
function BulkSendModal({ count, workflows, onSend, onCancel }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onCancel() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onCancel])

  // Fix #18: Escape key closes modal
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
    }}>
      <div ref={ref} style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
        borderRadius: 14, minWidth: 340, maxWidth: 480,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
          ⚡ Send {count} file{count !== 1 ? 's' : ''} to…
        </div>
        <div style={{ padding: 8 }}>
          {workflows.filter(w => w.workingPath).map(w => (
            <button
              key={w.id}
              onClick={() => onSend(w.workingPath, w.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '12px 14px', borderRadius: 10,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-primary)', textAlign: 'left', fontSize: 13,
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{w.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                  {(w.workingPath || '').length > 40 ? '…' + w.workingPath.slice(-38) : w.workingPath}
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel (Esc)</button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirmation Bar (#5) ────────────────────────────────────────────────────
// Shown inline in the toolbar before executing a destructive bulk action.
function ConfirmBar({ count, onConfirm, onCancel }) {
  // Fix #18: Escape cancels, Enter confirms
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onConfirm, onCancel])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderRadius: 10,
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
      fontSize: 13,
    }}>
      <span>🗑️ Delete <strong>{count}</strong> file{count !== 1 ? 's' : ''}? (Recycle Bin)</span>
      <button className="btn btn-danger btn-sm" onClick={onConfirm}>Yes, Delete</button>
      <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
    </div>
  )
}

// Dropdown that shows workflow project folders to send a file to
function SendToProjectMenu({ file, workflows, onSend, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const targets = workflows.filter(w => w.workingPath).map(w => ({
    id: w.id,
    label: w.name,
    icon: w.icon,
    path: w.workingPath,
    color: w.color,
  }))

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        right: 0, top: '100%',
        zIndex: 200,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-bright)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: 240,
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      <div style={{ padding: '10px 14px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>
        Send "{file.name.length > 24 ? file.name.slice(0, 22) + '…' : file.name}" to…
      </div>
      {targets.map(t => (
        <button
          key={t.id}
          onClick={() => onSend(file.path, t.path, t.label)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 14px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-primary)', textAlign: 'left', fontSize: 13,
            transition: 'background 0.1s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{t.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{t.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 }}>
              {t.path.length > 32 ? '…' + t.path.slice(-30) : t.path}
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>→</span>
        </button>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', padding: '6px 14px 8px' }}>
        <button
          onClick={onClose}
          style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function FileRow({ file, selected, onSelect, onDelete, onMove, onOpen, onReveal, workflows, onSendToProject, isDownloads }) {
  const emoji = getFileEmoji(file.type, file.ext)
  const isOld = file.ageDays > 30
  const [showSendMenu, setShowSendMenu] = useState(false)

  return (
    <div
      className={`file-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(file.path)}
      style={{ position: 'relative' }}
    >
      <div className="checkbox" style={{ pointerEvents: 'none' }}>
        {selected && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
      </div>

      <div className="file-icon">{emoji}</div>

      <div className="file-info">
        <div className="file-name" title={file.name}>{file.name}</div>
        <div className="file-meta">
          <span className={`tag tag-${file.type}`}>{file.type}</span>
          <span className="file-meta-item">{file.sizeFormatted}</span>
          <span className="file-meta-item" style={{ color: isOld ? 'var(--yellow)' : 'var(--text-muted)' }}>
            {isOld && '⚠️ '}{formatAge(file.ageDays)}
          </span>
          <span className="file-meta-item" style={{ color: 'var(--text-dim)' }}>{file.zoneName}</span>
        </div>
      </div>

      <div className="file-actions" style={{ position: 'relative' }}>
        {/* Send to project — shown for all Downloads files */}
        {isDownloads && (
          <div style={{ position: 'relative' }}>
            <button
              id={`btn-sendto-${encodeURIComponent(file.name)}`}
              className="btn btn-primary btn-sm"
              title="Send to a project folder"
              onClick={e => { e.stopPropagation(); setShowSendMenu(v => !v) }}
              style={{ fontSize: 12, gap: 4 }}
            >
              ⚡ Send to Project
            </button>
            {showSendMenu && (
              <SendToProjectMenu
                file={file}
                workflows={workflows}
                onSend={(from, toDir, label) => {
                  setShowSendMenu(false)
                  onSendToProject(from, toDir, label)
                }}
                onClose={() => setShowSendMenu(false)}
              />
            )}
          </div>
        )}

        <button
          id={`btn-open-${encodeURIComponent(file.name)}`}
          className="btn btn-ghost btn-sm btn-icon"
          title="Open file (Enter)"
          onClick={e => { e.stopPropagation(); onOpen(file.path) }}
        >👁️</button>
        <button
          id={`btn-reveal-${encodeURIComponent(file.name)}`}
          className="btn btn-ghost btn-sm btn-icon"
          title="Show in Explorer"
          onClick={e => { e.stopPropagation(); onReveal(file.path) }}
        >📂</button>
        <button
          id={`btn-move-${encodeURIComponent(file.name)}`}
          className="btn btn-ghost btn-sm btn-icon"
          title="Move to folder (M)"
          onClick={e => { e.stopPropagation(); onMove([file.path]) }}
        >📁</button>
        <button
          id={`btn-delete-${encodeURIComponent(file.name)}`}
          className="btn btn-danger btn-sm btn-icon"
          title="Move to Recycle Bin (Delete)"
          onClick={e => { e.stopPropagation(); onDelete([file.path]) }}
        >🗑️</button>
      </div>
    </div>
  )
}

// ─── Downloads Triage Mode ───────────────────────────────────────────────────
function DownloadsTriage({ files: initialFiles, workflows, onSendToProject, onDelete, onReveal, onSkip, onDone }) {
  // Use LOCAL copy of the file list — immune to parent re-fetches mid-triage
  const [files, setFiles] = useState(initialFiles)
  const [idx, setIdx] = useState(0)
  const [processed, setProcessed] = useState(0)

  const file = files[idx] || null

  const next = () => {
    setIdx(i => i + 1)
    setProcessed(p => p + 1)
  }

  // Remove a file from the local list immediately (no async wait)
  const removeFile = (filePath) => {
    setFiles(prev => prev.filter(f => f.path !== filePath))
    // Don't advance idx — the next file slides into position automatically
  }

  const handleSend = (filePath, workingPath, label) => {
    removeFile(filePath)
    // Fire-and-forget — don't await, don't block the UI
    onSendToProject(filePath, workingPath, label)
  }

  const handleDel = (filePaths) => {
    filePaths.forEach(p => removeFile(p))
    onDelete(filePaths)
  }

  const handleSkipLocal = (filePath) => {
    removeFile(filePath)
    onSkip(filePath)
  }

  // Fix #18: keyboard shortcuts in triage mode
  useEffect(() => {
    if (!file) return
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'Delete' || e.key.toLowerCase() === 'd') { handleDel([file.path]) }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onReveal(file.path) }
      if (e.key.toLowerCase() === 's') { handleSkipLocal(file.path) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [file])

  const progress = Math.round(((files.length - (files.length - idx)) / Math.max(initialFiles.length, 1)) * 100)
  const emoji = file ? getFileEmoji(file.type, file.ext) : '✨'

  if (!file) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✨</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Downloads is triaged!</div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          You processed {processed} file{processed !== 1 ? 's' : ''}. Downloads is now safe to clean.
        </div>
        <button className="btn btn-primary" onClick={onDone}>Back to Inbox</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 0' }}>
      {/* Keyboard hint */}
      <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 8 }}>
        Keyboard: <kbd>D</kbd> Delete · <kbd>S</kbd> Skip · <kbd>Space</kbd> Open Location
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>⚡ Downloads Triage Mode</span>
          <span>{files.length} remaining</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-card)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${Math.max(5, 100 - Math.round((files.length / Math.max(initialFiles.length, 1)) * 100))}%`, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* File card */}
      <div className="card animate-in" style={{ textAlign: 'center', padding: 32, marginBottom: 24 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, wordBreak: 'break-all' }}>{file.name}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <span className={`tag tag-${file.type}`}>{file.type}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{file.sizeFormatted}</span>
          <span style={{ fontSize: 12, color: file.ageDays > 30 ? 'var(--yellow)' : 'var(--text-muted)' }}>
            {formatAge(file.ageDays)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{file.path}</div>
      </div>

      {/* Actions: Send to project */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Send to a project folder:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {workflows.filter(w => w.workingPath).map(w => (
            <button
              key={w.id}
              onClick={() => handleSend(file.path, w.workingPath, w.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg-card)', border: `1px solid ${w.color}44`,
                cursor: 'pointer', textAlign: 'left',
                color: 'var(--text-primary)', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${w.color}18`; e.currentTarget.style.borderColor = w.color }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = `${w.color}44` }}
            >
              <span style={{ fontSize: 20 }}>{w.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 }}>
                  {(w.workingPath || '').split('\\').slice(-2).join('\\')}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Other actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { onReveal(file.path) }}
          title="Space"
        >
          📂 Open Location
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => handleSkipLocal(file.path)}
          title="S — remembered until the file changes"
        >
          ⏭ Skip
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => handleDel([file.path])}
          title="D or Delete key"
        >
          🗑️ Delete
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onDone}>✕ Exit Triage</button>
      </div>
    </div>
  )
}


// ─── Main Inbox ───────────────────────────────────────────────────────────────
export default function Inbox({ zones, onClear }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [moveTarget, setMoveTarget] = useState(null)
  const [ageFilter, setAgeFilter] = useState('all')
  const [triageMode, setTriageMode] = useState(false)
  const [workflows, setWorkflows] = useState([])
  const [newDownload, setNewDownload] = useState(null)
  const [bulkSendOpen, setBulkSendOpen] = useState(false)    // Fix #3: bulk send modal
  const [confirmDelete, setConfirmDelete] = useState(null)   // Fix #5: confirmation state
  const [skippedPaths, setSkippedPaths] = useState(new Set()) // Fix #17: skip persistence
  const toast = useToast()
  const fk = window.filekeeper

  const downloadsZone = zones.find(z => z.id === 'downloads')

  const load = useCallback(async () => {
    if (!fk || !zones.length) return
    setLoading(true)
    const [inbox, wfs, skipped] = await Promise.all([
      fk.getInbox(zones),
      fk.getWorkflows(),
      fk.getSkippedFiles(),    // Fix #17: load persisted skips
    ])
    setFiles(inbox)
    setWorkflows(wfs || [])
    setSkippedPaths(new Set(skipped || []))
    setLoading(false)
  }, [zones])

  useEffect(() => { load() }, [load])

  // Listen for new downloads from the background watcher
  useEffect(() => {
    const handler = ({ fileName, filePath }) => {
      setNewDownload({ fileName, filePath })
      load()
      toast.info(`📥 New download: ${fileName} — route it below`)
    }
    fk.on('new-download', handler)
    return () => fk.off('new-download', handler)
  }, [load])

  // Fix #18: Global keyboard shortcuts for list view
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (triageMode) return // triage has its own handler
      // Ctrl+A = select all visible files
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setSelected(new Set(filtered.map(f => f.path)))
      }
      // Escape = deselect all / close modals
      if (e.key === 'Escape') {
        setSelected(new Set())
        setConfirmDelete(null)
        setBulkSendOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triageMode])

  const filtered = files.filter(f => {
    if (skippedPaths.has(f.path)) return false  // Fix #17: hide skipped files
    if (typeFilter !== 'all' && f.type !== typeFilter) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    if (ageFilter === 'today' && f.ageDays > 1) return false
    if (ageFilter === 'week' && f.ageDays > 7) return false
    if (ageFilter === 'month' && f.ageDays > 30) return false
    if (ageFilter === 'old' && f.ageDays <= 30) return false
    return true
  })

  // Downloads-only files for triage mode (also exclude skipped)
  const downloadsFiles = files.filter(f => f.zoneId === 'downloads' && !skippedPaths.has(f.path))

  const toggleSelect = (path) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(f => f.path)))
  }

  // Fix #2: per-file error handling with Promise.allSettled
  const handleDelete = async (paths) => {
    setConfirmDelete(null)
    const results = await Promise.allSettled(paths.map(p => fk.deleteFile(p)))
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value?.success).length
    const failed = results.length - succeeded
    if (succeeded > 0) toast.success(`🗑️ ${succeeded} file${succeeded > 1 ? 's' : ''} moved to Recycle Bin`)
    if (failed > 0) toast.error(`⚠️ ${failed} file${failed > 1 ? 's' : ''} couldn't be deleted (may be open or locked)`)
    setSelected(new Set())
    await load()
  }

  // Fix #5: wrap bulk delete to require confirmation first
  const handleDeleteWithConfirm = (paths) => {
    if (paths.length === 1) {
      // Single file — delete immediately (no confirmation needed)
      handleDelete(paths)
    } else {
      // Bulk delete — show confirm bar
      setConfirmDelete(paths)
    }
  }

  const handleMove = (paths) => setMoveTarget(paths)

  const handleMoveConfirm = async (destDir) => {
    setMoveTarget(null)
    for (const p of moveTarget) await fk.moveFile(p, destDir)
    toast.success(`📁 ${moveTarget.length} file${moveTarget.length > 1 ? 's' : ''} moved`)
    setSelected(new Set())
    await load()
  }

  const handleSendToProject = async (filePath, workingPath, projectName) => {
    const result = await fk.moveFile(filePath, workingPath)
    if (result.success) {
      toast.success(`⚡ Sent to ${projectName}`)
    } else {
      toast.error(`Failed: ${result.error}`)
    }
    await load()
  }

  // Fix #3: bulk send to workflow — called from BulkSendModal
  const handleBulkSend = async (workingPath, projectName) => {
    setBulkSendOpen(false)
    const paths = Array.from(selected)
    const results = await Promise.allSettled(paths.map(p => fk.moveFile(p, workingPath)))
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value?.success).length
    const failed = results.length - succeeded
    if (succeeded > 0) toast.success(`⚡ ${succeeded} file${succeeded > 1 ? 's' : ''} sent to ${projectName}`)
    if (failed > 0) toast.error(`⚠️ ${failed} file${failed > 1 ? 's' : ''} failed to move`)
    setSelected(new Set())
    await load()
  }

  // Fix #17: persist skip to store
  const handleSkip = async (filePath) => {
    const next = new Set(skippedPaths)
    next.add(filePath)
    setSkippedPaths(next)
    await fk.saveSkippedFiles(Array.from(next))
  }

  const handleOpen = (path) => fk.openFile(path)
  const handleReveal = (path) => fk.openInExplorer(path)
  const selectedPaths = Array.from(selected)

  // ─── Triage Mode ─────────────────────────────────────────────
  if (triageMode) {
    return (
      <div>
        <DownloadsTriage
          files={downloadsFiles}
          workflows={workflows}
          onSendToProject={handleSendToProject}
          onDelete={handleDelete}
          onReveal={handleReveal}
          onSkip={handleSkip}
          onDone={() => { setTriageMode(false); load() }}
        />
      </div>
    )
  }

  // ─── Normal Inbox ────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📥 Inbox</h1>
          <p className="page-subtitle">Triage your recent files — keep what matters, remove what doesn't</p>
        </div>
        {/* Downloads Triage Banner */}
        {downloadsFiles.length > 0 && (
          <button
            id="btn-downloads-triage"
            onClick={() => setTriageMode(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 18px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))',
              border: '1px solid rgba(139,92,246,0.4)',
              cursor: 'pointer', color: 'var(--text-primary)',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
          >
            <span style={{ fontSize: 18 }}>⚡</span>
            <div style={{ textAlign: 'left' }}>
              <div>Triage Downloads</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                {downloadsFiles.length} files — route each one to the right project
              </div>
            </div>
            <span style={{ marginLeft: 4, color: 'var(--text-muted)' }}>→</span>
          </button>
        )}
      </div>

      {/* ── New Download Banner ─────────────────────────────────────── */}
      {newDownload && (
        <div style={{
          margin: '0 0 var(--space-lg)',
          padding: '16px 20px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.06))',
          border: '1px solid rgba(245,158,11,0.35)',
          animation: 'pulse-border 1.5s ease-in-out 3',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>📥</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--yellow)' }}>
                New download just landed!
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 2 }}>
                {newDownload.fileName}
              </div>
            </div>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
              onClick={() => setNewDownload(null)}
              title="Dismiss"
            >×</button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Send it to:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {workflows.filter(w => w.workingPath).map(w => (
              <button
                key={w.id}
                onClick={async () => {
                  await handleSendToProject(newDownload.filePath, w.workingPath, w.name)
                  setNewDownload(null)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'var(--bg-card)', border: `1px solid ${w.color}55`,
                  cursor: 'pointer', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${w.color}18`; e.currentTarget.style.borderColor = w.color }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = `${w.color}55` }}
              >
                <span>{w.icon}</span> {w.name}
              </button>
            ))}
            <button
              onClick={() => setNewDownload(null)}
              style={{
                padding: '7px 14px', borderRadius: 8,
                background: 'transparent', border: '1px solid var(--border)',
                cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12,
              }}
            >
              Leave in Downloads
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <span>🔍</span>
          <input
            id="inbox-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files… (Ctrl+A = select all, Esc = deselect)"
          />
        </div>

        <div className="tabs" style={{ marginBottom: 0 }}>
          {[['all','All'],['today','Today'],['week','This Week'],['month','This Month'],['old','Old (30d+)']].map(([val, label]) => (
            <button
              key={val}
              className={`tab ${ageFilter === val ? 'active' : ''}`}
              onClick={() => setAgeFilter(val)}
            >{label}</button>
          ))}
        </div>

        <div className="toolbar-spacer" />

        {/* Fix #5: show confirmation bar instead of instant bulk delete */}
        {confirmDelete ? (
          <ConfirmBar
            count={confirmDelete.length}
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        ) : selected.size > 0 && (
          <>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.size} selected</span>
            {/* Fix #3: properly implemented bulk send button */}
            <button id="btn-bulk-send" className="btn btn-primary btn-sm" onClick={() => setBulkSendOpen(true)}>
              ⚡ Send to…
            </button>
            <button id="btn-bulk-move" className="btn btn-ghost btn-sm" onClick={() => handleMove(selectedPaths)}>
              📁 Move All
            </button>
            <button id="btn-bulk-delete" className="btn btn-danger btn-sm" onClick={() => handleDeleteWithConfirm(selectedPaths)}>
              🗑️ Delete All
            </button>
          </>
        )}

        <button id="btn-refresh-inbox" className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-xs" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        {TYPE_FILTERS.map(t => (
          <button
            key={t}
            className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', textTransform: 'capitalize' }}
            onClick={() => setTypeFilter(t)}
          >
            {t === 'all' ? '🗂️ All' : t}
          </button>
        ))}
      </div>

      {/* Select all row */}
      {!loading && filtered.length > 0 && (
        <div className="flex-between" style={{ marginBottom: 'var(--space-sm)', padding: '4px 0' }}>
          <button className="btn btn-ghost btn-sm" onClick={selectAll}>
            {selected.size === filtered.length ? '☑️ Deselect All' : '☐ Select All'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filtered.length} files
            {skippedPaths.size > 0 && (
              <button
                style={{ marginLeft: 12, fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={async () => {
                  setSkippedPaths(new Set())
                  await fk.saveSkippedFiles([])
                  load()
                }}
              >
                ↺ Show {skippedPaths.size} skipped
              </button>
            )}
          </span>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Scanning your zones…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <div className="empty-state-title">Inbox is clean!</div>
          <div className="empty-state-text">No files match your current filters. Your zones look organized.</div>
        </div>
      ) : (
        <div className="flex-col gap-xs">
          {filtered.map(file => (
            <FileRow
              key={file.path}
              file={file}
              selected={selected.has(file.path)}
              onSelect={toggleSelect}
              onDelete={handleDeleteWithConfirm}
              onMove={handleMove}
              onOpen={handleOpen}
              onReveal={handleReveal}
              workflows={workflows}
              onSendToProject={handleSendToProject}
              isDownloads={file.zoneId === 'downloads'}
            />
          ))}
        </div>
      )}

      {/* Move modal */}
      {moveTarget && (
        <MoveModal
          filePaths={moveTarget}
          zones={zones}
          onConfirm={handleMoveConfirm}
          onCancel={() => setMoveTarget(null)}
        />
      )}

      {/* Fix #3: Bulk Send Modal */}
      {bulkSendOpen && (
        <BulkSendModal
          count={selected.size}
          workflows={workflows}
          onSend={handleBulkSend}
          onCancel={() => setBulkSendOpen(false)}
        />
      )}
    </div>
  )
}
