import React, { useState } from 'react'
import { getFileEmoji, formatAge } from '../../utils/fileUtils.js'
import { useToast } from '../../context/ToastContext.jsx'

function DuplicatesTab({ zones }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(new Set())
  const [selected, setSelected] = useState(new Set())
  const toast = useToast()
  const fk = window.filekeeper

  const scan = async () => {
    setLoading(true)
    const result = await fk.findDuplicates(zones)
    setGroups(result)
    setLoading(false)
  }

  const toggleGroup = (hash) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(hash)) next.delete(hash)
      else next.add(hash)
      return next
    })
  }

  const toggleFile = (path) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  // Auto-select all but first in each group
  const autoSelect = () => {
    const paths = new Set()
    groups.forEach(g => {
      const sorted = [...g.files].sort((a, b) => a.ageDays - b.ageDays)
      sorted.slice(1).forEach(f => paths.add(f.path))
    })
    setSelected(paths)
  }

  const deleteSelected = async () => {
    const paths = Array.from(selected)
    for (const p of paths) await fk.deleteFile(p)
    toast.success(`🗑️ ${paths.length} duplicates removed`)
    setSelected(new Set())
    await scan()
  }

  const totalWasted = groups.reduce((a, g) => a + g.wastedSize, 0)
  function fmt(b) {
    if (b > 1024*1024*1024) return (b/(1024*1024*1024)).toFixed(1)+'GB'
    if (b > 1024*1024) return (b/(1024*1024)).toFixed(1)+'MB'
    if (b > 1024) return (b/1024).toFixed(1)+'KB'
    return b+'B'
  }

  return (
    <div>
      {!groups.length && !loading && (
        <div className="empty-state" style={{ paddingTop: 'var(--space-xl)' }}>
          <div className="empty-state-icon">🔄</div>
          <div className="empty-state-title">Find Duplicate Files</div>
          <div className="empty-state-text">Scan all your zones for files with identical content</div>
          <button id="btn-scan-duplicates" className="btn btn-primary" onClick={scan}>Start Scan</button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          Scanning for duplicates (comparing file hashes)…
        </div>
      )}

      {!loading && groups.length > 0 && (
        <>
          <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--yellow)' }}>{groups.length} duplicate groups</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>·</span>
              <span style={{ color: 'var(--red)', fontWeight: 600, marginLeft: 8 }}>{fmt(totalWasted)} wasted</span>
            </div>
            <div className="flex gap-sm">
              <button className="btn btn-ghost btn-sm" onClick={autoSelect}>Auto-select Extras</button>
              {selected.size > 0 && (
                <button id="btn-delete-dupes" className="btn btn-danger btn-sm" onClick={deleteSelected}>
                  🗑️ Delete {selected.size} selected
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
            </div>
          </div>

          {groups.map(group => (
            <div key={group.hash} className="clutter-group">
              <div className="clutter-group-header" onClick={() => toggleGroup(group.hash)}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>
                  {group.hash.slice(0, 8)}…
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>{group.files[0].name}</span>
                <span style={{ color: 'var(--yellow)', fontSize: 12 }}>
                  {group.files.length} copies · {fmt(group.wastedSize)} wasted
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {expanded.has(group.hash) ? '▲' : '▼'}
                </span>
              </div>

              {expanded.has(group.hash) && (
                <div className="clutter-group-files">
                  {group.files.map((f, i) => (
                    <div key={f.path} className="clutter-file-row">
                      <div
                        className={`checkbox ${selected.has(f.path) ? 'checked' : ''}`}
                        onClick={() => toggleFile(f.path)}
                      >
                        {selected.has(f.path) && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 20 }}>{getFileEmoji(f.type, f.ext)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">{f.path}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.sizeFormatted} · {formatAge(f.ageDays)}</div>
                      </div>
                      {i === 0 && (
                        <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, background: 'var(--green-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                          KEEP
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function LargeFilesTab({ zones }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const fk = window.filekeeper

  const scan = async () => {
    setLoading(true)
    const result = await fk.findLargeFiles(zones)
    setFiles(result)
    setLoading(false)
  }

  const deleteFile = async (path) => {
    await fk.deleteFile(path)
    toast.success('🗑️ File moved to Recycle Bin')
    setFiles(prev => prev.filter(f => f.path !== path))
  }

  const reveal = (path) => fk.openInExplorer(path)

  const totalSize = files.reduce((a, f) => a + f.size, 0)
  function fmt(b) {
    if (b > 1024*1024*1024) return (b/(1024*1024*1024)).toFixed(1)+' GB'
    return (b/(1024*1024)).toFixed(1)+' MB'
  }

  return (
    <div>
      {!files.length && !loading && (
        <div className="empty-state" style={{ paddingTop: 'var(--space-xl)' }}>
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">Find Large Files</div>
          <div className="empty-state-text">Find files over 50MB — installers, old renders, forgotten downloads</div>
          <button id="btn-scan-large" className="btn btn-primary" onClick={scan}>Start Scan</button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          Scanning for large files…
        </div>
      )}

      {!loading && files.length > 0 && (
        <>
          <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {files.length} large files · {fmt(totalSize)} total
            </span>
            <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
          </div>

          <div className="flex-col gap-xs">
            {files.map(f => (
              <div key={f.path} className="file-card">
                <div className="file-icon">{getFileEmoji(f.type, f.ext)}</div>
                <div className="file-info">
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">
                    <span className={`tag tag-${f.type}`}>{f.type}</span>
                    <span className="file-meta-item" style={{ color: 'var(--yellow)', fontWeight: 600 }}>{f.sizeFormatted}</span>
                    <span className="file-meta-item">{formatAge(f.ageDays)}</span>
                    <span className="file-meta-item" style={{ color: 'var(--text-dim)' }} title={f.path}>
                      {f.zoneName || f.directory}
                    </span>
                  </div>
                </div>

                {/* Size bar */}
                <div style={{ width: 80, flexShrink: 0 }}>
                  <div className="health-bar">
                    <div className="health-fill" style={{
                      width: `${Math.min(100, (f.size / (files[0]?.size || 1)) * 100)}%`,
                      background: 'var(--yellow)'
                    }} />
                  </div>
                </div>

                <div className="file-actions" style={{ opacity: 1 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Show in Explorer" onClick={() => reveal(f.path)}>📂</button>
                  <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => deleteFile(f.path)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function OldFilesTab({ zones }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const fk = window.filekeeper

  const scan = async () => {
    setLoading(true)
    const result = await fk.findOldFiles(zones)
    setFiles(result)
    setLoading(false)
  }

  const deleteFile = async (path) => {
    await fk.deleteFile(path)
    toast.success('🗑️ File moved to Recycle Bin')
    setFiles(prev => prev.filter(f => f.path !== path))
  }

  const reveal = (path) => fk.openInExplorer(path)

  return (
    <div>
      {!files.length && !loading && (
        <div className="empty-state" style={{ paddingTop: 'var(--space-xl)' }}>
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">Find Forgotten Files</div>
          <div className="empty-state-text">Files untouched for over 1 year — likely safe to archive or delete</div>
          <button id="btn-scan-old" className="btn btn-primary" onClick={scan}>Start Scan</button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          Looking for old untouched files…
        </div>
      )}

      {!loading && files.length > 0 && (
        <>
          <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {files.length} files untouched for 1+ year
            </span>
            <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
          </div>

          <div className="flex-col gap-xs">
            {files.map(f => (
              <div key={f.path} className="file-card">
                <div className="file-icon">{getFileEmoji(f.type, f.ext)}</div>
                <div className="file-info">
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">
                    <span className={`tag tag-${f.type}`}>{f.type}</span>
                    <span className="file-meta-item">{f.sizeFormatted}</span>
                    <span className="file-meta-item" style={{ color: 'var(--yellow)', fontWeight: 600 }}>
                      ⏳ {Math.floor(f.ageDays / 365)}y {Math.floor((f.ageDays % 365) / 30)}mo old
                    </span>
                    <span className="file-meta-item" style={{ color: 'var(--text-dim)' }}>{f.zoneName}</span>
                  </div>
                </div>
                <div className="file-actions" style={{ opacity: 1 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Show in Explorer" onClick={() => reveal(f.path)}>📂</button>
                  <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => deleteFile(f.path)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function ClutterFinder({ zones }) {
  const [tab, setTab] = useState('duplicates')

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔍 Clutter Finder</h1>
        <p className="page-subtitle">Scan your zones for duplicates, large files, and forgotten clutter</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'duplicates' ? 'active' : ''}`} onClick={() => setTab('duplicates')}>
          🔄 Duplicates
        </button>
        <button className={`tab ${tab === 'large' ? 'active' : ''}`} onClick={() => setTab('large')}>
          📦 Large Files
        </button>
        <button className={`tab ${tab === 'old' ? 'active' : ''}`} onClick={() => setTab('old')}>
          📅 Old Files
        </button>
      </div>

      {tab === 'duplicates' && <DuplicatesTab zones={zones} />}
      {tab === 'large' && <LargeFilesTab zones={zones} />}
      {tab === 'old' && <OldFilesTab zones={zones} />}
    </div>
  )
}
