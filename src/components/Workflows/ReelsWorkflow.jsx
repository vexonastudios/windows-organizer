import React, { useState, useCallback, useEffect } from 'react'
import { formatAge, formatBytes } from '../../utils/fileUtils.js'
import { useToast } from '../../context/ToastContext.jsx'
import PathConfig from './PathConfig.jsx'

const STATUSES = [
  { id: 'draft',     label: 'Draft',     emoji: '📝', color: '#606078',              bg: 'rgba(96,96,120,0.12)' },
  { id: 'ready',     label: 'Ready',     emoji: '✅', color: 'var(--green)',           bg: 'rgba(16,216,138,0.1)' },
  { id: 'published', label: 'Published', emoji: '🚀', color: '#3b9eff',               bg: 'rgba(59,158,255,0.1)' },
]

const CHANNEL_COLORS = {
  scrollreader: '#f59e0b',
  bodeebooks:   '#10b981',
  illbehonest:  '#ef4444',
  hearhim:      '#8b5cf6',
  gccsatx:      '#3b82f6',
}

function StatusBadge({ status, onClick }) {
  const s = STATUSES.find(x => x.id === status) || STATUSES[0]
  return (
    <button
      onClick={onClick}
      title="Click to cycle status"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 'var(--radius-full)',
        background: s.bg, border: `1px solid ${s.color}55`,
        color: s.color, fontSize: 11, fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        transition: 'all 0.15s ease',
      }}
    >
      {s.emoji} {s.label}
    </button>
  )
}

function ReelRow({ file, status, channelColor, onStatusChange, onOpen, onReveal, onDelete }) {
  const nextStatus = (cur) => {
    const idx = STATUSES.findIndex(s => s.id === cur)
    return STATUSES[(idx + 1) % STATUSES.length].id
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.1s ease',
      borderLeft: `3px solid ${channelColor}`,
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>🎬</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          color: 'var(--text-primary)',
        }} title={file.name}>
          {file.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {file.sizeFormatted || formatBytes(file.size)} · {formatAge(file.ageDays)}
          {status === 'published' && status.publishedAt && (
            <span style={{ marginLeft: 8, color: '#3b9eff' }}>
              · Published {formatAge(Math.floor((Date.now() - status.publishedAt) / 86400000))}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={status?.status || 'draft'} onClick={() => onStatusChange(file.path, nextStatus(status?.status || 'draft'))} />
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm btn-icon" title="Play" onClick={() => onOpen(file.path)}>▶️</button>
        <button className="btn btn-ghost btn-sm btn-icon" title="Show in Explorer" onClick={() => onReveal(file.path)}>📂</button>
        <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => onDelete(file.path)}>🗑️</button>
      </div>
    </div>
  )
}

function ChannelSection({ channel, statusMap, filterStatus, onStatusChange, onOpen, onReveal, onDelete }) {
  const [collapsed, setCollapsed] = useState(false)
  const color = CHANNEL_COLORS[channel.name.toLowerCase()] || 'var(--accent)'

  const filteredFiles = filterStatus === 'all'
    ? channel.files
    : channel.files.filter(f => (statusMap[f.path]?.status || 'draft') === filterStatus)

  const counts = {
    draft:     channel.files.filter(f => (statusMap[f.path]?.status || 'draft') === 'draft').length,
    ready:     channel.files.filter(f => (statusMap[f.path]?.status || 'draft') === 'ready').length,
    published: channel.files.filter(f => (statusMap[f.path]?.status || 'draft') === 'published').length,
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-sm)' }}>
      {/* Channel header */}
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', cursor: 'pointer',
          borderLeft: `4px solid ${color}`,
          background: `${color}08`,
        }}
      >
        <span style={{ fontSize: 18 }}>📺</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color }}>{channel.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {channel.fileCount} reels · {channel.totalSizeFormatted}
          </div>
        </div>
        {/* Status pill summary */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {counts.draft > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(96,96,120,0.15)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              📝 {counts.draft}
            </span>
          )}
          {counts.ready > 0 && (
            <span style={{ fontSize: 11, color: 'var(--green)', background: 'rgba(16,216,138,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              ✅ {counts.ready}
            </span>
          )}
          {counts.published > 0 && (
            <span style={{ fontSize: 11, color: '#3b9eff', background: 'rgba(59,158,255,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              🚀 {counts.published}
            </span>
          )}
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={e => { e.stopPropagation(); window.filekeeper.openInExplorer(channel.path) }}
            title="Open in Explorer"
          >📂</button>
        </div>
        <span style={{ color: 'var(--text-dim)', fontSize: 12, marginLeft: 4 }}>{collapsed ? '▶' : '▼'}</span>
      </div>

      {/* File rows */}
      {!collapsed && filteredFiles.length > 0 && (
        <div>
          {filteredFiles.map(f => (
            <ReelRow
              key={f.path}
              file={f}
              channelColor={color}
              status={statusMap[f.path]}
              onStatusChange={onStatusChange}
              onOpen={onOpen}
              onReveal={onReveal}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
      {!collapsed && filteredFiles.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          No {filterStatus !== 'all' ? filterStatus : ''} reels in this channel
        </div>
      )}
    </div>
  )
}

export default function ReelsWorkflow({ workflow, onUpdate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusMap, setStatusMap] = useState({})     // { [filePath]: { status, publishedAt } }
  const [filterStatus, setFilterStatus] = useState('all')
  const toast = useToast()
  const fk = window.filekeeper

  const scan = useCallback(async () => {
    setLoading(true)
    const [result, saved] = await Promise.all([
      fk.scanReels(workflow.workingPath),
      fk.getReelsStatus(),
    ])
    setData(result)
    setStatusMap(saved || {})
    setLoading(false)
  }, [workflow.workingPath])

  const handleStatusChange = useCallback(async (filePath, newStatus) => {
    const prev = statusMap[filePath]
    const updated = {
      ...statusMap,
      [filePath]: {
        status: newStatus,
        publishedAt: newStatus === 'published' ? Date.now() : (prev?.publishedAt || null),
      },
    }
    setStatusMap(updated)
    await fk.saveReelsStatus(updated)
    const label = STATUSES.find(s => s.id === newStatus)?.label || newStatus
    toast.success(`${STATUSES.find(s => s.id === newStatus)?.emoji} Marked as ${label}`)
  }, [statusMap])

  const handleDelete = async (path) => {
    await fk.deleteFile(path)
    toast.success('🗑️ Moved to Recycle Bin')
    await scan()
  }

  const handleOpen   = (p) => fk.openFile(p)
  const handleReveal = (p) => fk.openInExplorer(p)

  // Aggregate stats
  const allFiles = data ? [
    ...data.channels.flatMap(c => c.files),
    ...data.rootFiles,
  ] : []

  const totalDraft     = allFiles.filter(f => (statusMap[f.path]?.status || 'draft') === 'draft').length
  const totalReady     = allFiles.filter(f => (statusMap[f.path]?.status || 'draft') === 'ready').length
  const totalPublished = allFiles.filter(f => (statusMap[f.path]?.status || 'draft') === 'published').length
  const totalSize      = allFiles.reduce((a, f) => a + (f.size || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div className="flex gap-md" style={{ alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 32 }}>{workflow.icon}</span>
          <div>
            <h1 className="page-title">{workflow.name}</h1>
            <p className="page-subtitle">{workflow.description}</p>
          </div>
        </div>
      </div>

      <PathConfig
        workflow={workflow}
        onUpdate={onUpdate}
        fields={[{ key: 'workingPath', label: 'Reels Folder', description: 'Contains subfolders: scrollreader, bodeebooks, illbehonest, hearhim, gccsatx' }]}
      />

      {/* Channel tip */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(59,158,255,0.05)', borderColor: 'rgba(59,158,255,0.2)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--blue)' }}>Publishing Board:</strong>{' '}
          Click any status badge to cycle it: <strong>📝 Draft</strong> → <strong>✅ Ready</strong> → <strong>🚀 Published</strong>.
          Status is saved automatically and persists across app restarts.
        </div>
      </div>

      {!data && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <div className="empty-state-title">Scan your reels</div>
          <div className="empty-state-text">View all reels grouped by channel with publish status tracking.</div>
          <button id="btn-scan-reels" className="btn btn-primary" onClick={scan}>🔍 Scan Reels</button>
        </div>
      )}

      {loading && <div className="loading-state"><div className="spinner" />Scanning reels…</div>}

      {data && !loading && (
        <>
          {/* Stats */}
          <div className="stat-tiles" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 'var(--space-lg)' }}>
            <div className="stat-tile">
              <div className="stat-tile-value">{allFiles.length}</div>
              <div className="stat-tile-label">Total Reels</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: 'var(--text-muted)' }}>{totalDraft}</div>
              <div className="stat-tile-label">📝 Draft</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: 'var(--green)' }}>{totalReady}</div>
              <div className="stat-tile-label">✅ Ready</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: '#3b9eff' }}>{totalPublished}</div>
              <div className="stat-tile-label">🚀 Published</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{formatBytes(totalSize)}</div>
              <div className="stat-tile-label">Total Size</div>
            </div>
          </div>

          {/* Filter bar + Rescan */}
          <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="flex gap-xs">
              {['all', 'draft', 'ready', 'published'].map(s => (
                <button
                  key={s}
                  className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 'var(--radius-full)', textTransform: 'capitalize' }}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? '🗂️ All' : s === 'draft' ? '📝 Draft' : s === 'ready' ? '✅ Ready' : '🚀 Published'}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
          </div>

          {/* Channels */}
          {data.channels.map(channel => (
            <ChannelSection
              key={channel.name}
              channel={channel}
              statusMap={statusMap}
              filterStatus={filterStatus}
              onStatusChange={handleStatusChange}
              onOpen={handleOpen}
              onReveal={handleReveal}
              onDelete={handleDelete}
            />
          ))}

          {/* Unorganized root files */}
          {data.rootFiles.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--space-md)', borderColor: 'rgba(245,166,35,0.3)', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--yellow)', borderBottom: '1px solid var(--border)' }}>
                ⚠️ {data.rootFiles.length} reels not in a channel folder
              </div>
              {data.rootFiles.map(f => (
                <ReelRow
                  key={f.path}
                  file={f}
                  channelColor="var(--yellow)"
                  status={statusMap[f.path]}
                  onStatusChange={handleStatusChange}
                  onOpen={handleOpen}
                  onReveal={handleReveal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
