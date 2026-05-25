import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext.jsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildExpectedPattern(workflow) {
  // Returns a regex and example for the given workflow
  const channel = workflow.id === 'sermons' ? 'gccsatx' : 'illbehonest'
  const today = new Date()
  const yy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const exts = (workflow.keepExtensions || ['.mp4', '.mov']).join('/')

  return {
    example: `${channel}-${yy}-${mm}-${dd}-sermon-title-final.mp4`,
    // Must contain: channel prefix, date-like segment, and a "final/render/export" keyword
    check: (name) => {
      const n = name.toLowerCase()
      const hasKeyword  = ['final', 'render', 'export'].some(k => n.includes(k))
      const hasChannel  = n.startsWith(channel)
      const hasDate     = /\d{4}-\d{2}-\d{2}/.test(n)
      const hasVideoExt = (workflow.keepExtensions || ['.mp4', '.mov']).some(e => n.endsWith(e))
      return { hasKeyword, hasChannel, hasDate, hasVideoExt, ok: hasKeyword && hasChannel && hasDate }
    },
  }
}

function RuleChip({ ok, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 'var(--radius-full)',
      background: ok ? 'rgba(16,216,138,0.1)' : 'rgba(239,68,68,0.1)',
      color: ok ? 'var(--green)' : 'var(--red)',
      border: `1px solid ${ok ? 'rgba(16,216,138,0.2)' : 'rgba(239,68,68,0.2)'}`,
    }}>
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

function FileRenameRow({ file, convention, onRename }) {
  const result = convention.check(file.name)
  const ext = file.ext || '.' + file.name.split('.').pop()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(false)
  const [renaming, setRenaming] = useState(false)

  if (result.ok) return null // Only show non-conforming files

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(239,68,68,0.03)',
      borderLeft: '3px solid var(--red)',
    }}>
      {/* File name + rule chips */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🎬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
            wordBreak: 'break-all', marginBottom: 6,
          }}>
            {file.name}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <RuleChip ok={result.hasChannel}  label="channel prefix" />
            <RuleChip ok={result.hasDate}     label="date (YYYY-MM-DD)" />
            <RuleChip ok={result.hasKeyword}  label="final/render/export" />
            <RuleChip ok={result.hasVideoExt} label="video extension" />
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setEditing(v => !v)
            if (!newName) setNewName(file.name)
          }}
          style={{ flexShrink: 0 }}
        >
          {editing ? '✕ Cancel' : '✏️ Rename'}
        </button>
      </div>

      {editing && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
          <div style={{
            flex: 1, fontSize: 11, color: 'var(--text-muted)', marginBottom: 4,
            fontFamily: 'monospace', background: 'var(--bg-card)', padding: '4px 8px',
            borderRadius: 6, border: '1px solid var(--border)',
          }}>
            💡 Pattern: <code style={{ color: 'var(--accent)' }}>{convention.example}</code>
          </div>
        </div>
      )}

      {editing && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={convention.example}
            style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') doRename()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            disabled={!newName || newName === file.name || renaming}
            onClick={async () => {
              setRenaming(true)
              const ok = await onRename(file.path, newName)
              if (ok) setEditing(false)
              setRenaming(false)
            }}
          >
            {renaming ? '⏳' : '✓ Apply'}
          </button>
        </div>
      )}
    </div>
  )

  async function doRename() {
    if (!newName || newName === file.name) return
    setRenaming(true)
    const ok = await onRename(file.path, newName)
    if (ok) setEditing(false)
    setRenaming(false)
  }
}

// ─── Main Enforcer Component ──────────────────────────────────────────────────
export default function NamingEnforcer({ workflow, projects }) {
  const toast = useToast()
  const fk = window.filekeeper
  const [violations, setViolations] = useState([])
  const [convention, setConvention] = useState(null)
  const [customPattern, setCustomPattern] = useState('')
  const [editingPattern, setEditingPattern] = useState(false)
  const [localProjects, setLocalProjects] = useState(projects)

  useEffect(() => { setLocalProjects(projects) }, [projects])

  useEffect(() => {
    const built = buildExpectedPattern(workflow)
    setConvention(built)
  }, [workflow])

  useEffect(() => {
    if (!convention || !localProjects) return
    const allFiles = localProjects.flatMap(p => p.files || [])
    const found = allFiles.filter(f => {
      const n = f.name.toLowerCase()
      const isVideo = (workflow.keepExtensions || ['.mp4', '.mov']).some(e => n.endsWith(e))
      if (!isVideo) return false
      return !convention.check(f.name).ok
    })
    setViolations(found)
  }, [convention, localProjects, workflow])

  const handleRename = useCallback(async (oldPath, newName) => {
    const result = await fk.renameFile({ oldPath, newName })
    if (result.success) {
      toast.success(`✏️ Renamed to "${newName}"`)
      // Update local state
      setLocalProjects(prev => prev.map(p => ({
        ...p,
        files: p.files.map(f => f.path === oldPath ? { ...f, name: newName, path: result.newPath } : f),
      })))
      return true
    } else {
      toast.error(`Rename failed: ${result.error}`)
      return false
    }
  }, [])

  if (!convention) return null
  if (violations.length === 0) {
    return (
      <div style={{
        padding: '14px 18px', borderRadius: 'var(--radius-md)',
        background: 'rgba(16,216,138,0.06)', border: '1px solid rgba(16,216,138,0.2)',
        display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
      }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div>
          <strong style={{ color: 'var(--green)' }}>All video files follow the naming convention.</strong>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Expected pattern: <code style={{ color: 'var(--accent)' }}>{convention.example}</code>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderColor: 'rgba(239,68,68,0.25)' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(239,68,68,0.04)',
      }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--red)' }}>
            {violations.length} file{violations.length > 1 ? 's' : ''} don't match the naming convention
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Expected: <code style={{ color: 'var(--accent)' }}>{convention.example}</code>
          </div>
        </div>
      </div>

      {/* Violation rows */}
      {violations.map(file => (
        <FileRenameRow
          key={file.path}
          file={file}
          convention={convention}
          onRename={handleRename}
        />
      ))}
    </div>
  )
}
