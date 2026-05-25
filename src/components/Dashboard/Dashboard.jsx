import React, { useState, useEffect, useMemo } from 'react'
import { getHealthColor, getHealthLabel, getHealthClass, formatBytes } from '../../utils/fileUtils.js'

function ZoneCard({ zone, data, loading, onClick }) {
  const score = data?.health ?? 100
  const color = zone.color || getHealthColor(score)
  const label = getHealthLabel(score)
  const healthClass = getHealthClass(score)

  return (
    <div
      className="zone-card animate-in"
      style={{ '--zone-color': color, cursor: 'pointer' }}
      onClick={onClick}
    >
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
        borderRadius: '16px 16px 0 0'
      }} />

      <div className="zone-card-header">
        <div>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{zone.icon}</div>
          <div className="zone-card-name">{zone.name}</div>
          <div className="zone-card-path">{zone.path}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {loading ? (
            <div className="spinner" style={{ marginLeft: 'auto' }} />
          ) : (
            <>
              <div className="zone-card-score" style={{ color }}>{score}</div>
              <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>{label}</div>
            </>
          )}
        </div>
      </div>

      <div className="health-bar" style={{ marginBottom: 12 }}>
        <div
          className="health-fill"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`
          }}
        />
      </div>

      {!loading && data && (
        <div className="zone-card-stats">
          <div className="zone-stat">
            <div className="zone-stat-value">{data.fileCount}</div>
            <div className="zone-stat-label">Files</div>
          </div>
          <div className="zone-stat">
            <div className="zone-stat-value">{data.totalSizeFormatted}</div>
            <div className="zone-stat-label">Size</div>
          </div>
          <div className="zone-stat">
            <div className="zone-stat-value" style={{ color: data.oldFileCount > 0 ? 'var(--yellow)' : 'var(--text-primary)' }}>
              {data.oldFileCount}
            </div>
            <div className="zone-stat-label">Old Files</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ zones, onNavigate }) {
  const [scanResults, setScanResults] = useState({})
  const [loading, setLoading] = useState({})
  const [stats, setStats] = useState({ deletedCount: 0, movedCount: 0 })
  const fk = window.filekeeper

  // Fix #15: Stabilize zone dependency — only re-scan when zone IDs/paths actually change,
  // not on every parent re-render that creates a new array reference.
  const zoneKey = useMemo(
    () => zones.map(z => z.id + z.path).join('|'),
    [zones]
  )

  useEffect(() => {
    if (!fk || !zones.length) return
    fk.getStats().then(setStats)
    zones.forEach(z => {
      setLoading(prev => ({ ...prev, [z.id]: true }))
      fk.scanZone(z).then(result => {
        setScanResults(prev => ({ ...prev, [z.id]: result }))
        setLoading(prev => ({ ...prev, [z.id]: false }))
      })
    })
  }, [zoneKey]) // ← only re-scans when zone IDs or paths change

  const totalFiles = Object.values(scanResults).reduce((a, r) => a + (r?.fileCount || 0), 0)
  const totalSize = Object.values(scanResults).reduce((a, r) => a + (r?.totalSize || 0), 0)
  const totalOld = Object.values(scanResults).reduce((a, r) => a + (r?.oldFileCount || 0), 0)
  const avgHealth = zones.length
    ? Math.round(Object.values(scanResults).reduce((a, r) => a + (r?.health ?? 100), 0) / zones.length)
    : 100


  const worstZone = zones.reduce((worst, z) => {
    const score = scanResults[z.id]?.health ?? 100
    if (!worst || score < (scanResults[worst.id]?.health ?? 100)) return z
    return worst
  }, null)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your PC health at a glance — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Summary tiles */}
      <div className="stat-tiles">
        <div className="stat-tile animate-in">
          <div className="stat-tile-value" style={{ color: getHealthColor(avgHealth) }}>{avgHealth}</div>
          <div className="stat-tile-label">Overall Health Score</div>
          <div className="stat-tile-sub">{getHealthLabel(avgHealth)}</div>
        </div>
        <div className="stat-tile animate-in" style={{ animationDelay: '60ms' }}>
          <div className="stat-tile-value">{totalFiles.toLocaleString()}</div>
          <div className="stat-tile-label">Total Files Tracked</div>
          <div className="stat-tile-sub">Across {zones.length} zones · {formatBytes(totalSize)}</div>
        </div>
        <div className="stat-tile animate-in" style={{ animationDelay: '120ms' }}>
          <div className="stat-tile-value" style={{ color: totalOld > 0 ? 'var(--yellow)' : 'inherit' }}>{totalOld}</div>
          <div className="stat-tile-label">Old Files</div>
          <div className="stat-tile-sub">Untouched 1+ year</div>
        </div>
        <div className="stat-tile animate-in" style={{ animationDelay: '180ms' }}>
          <div className="stat-tile-value" style={{ color: 'var(--green)' }}>{stats.deletedCount + stats.movedCount}</div>
          <div className="stat-tile-label">Files Organized</div>
          <div className="stat-tile-sub">{stats.deletedCount} deleted · {stats.movedCount} moved</div>
        </div>
      </div>

      {/* Zone cards */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
          <h2>Zone Health</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('inbox')}>
            📥 Go to Inbox →
          </button>
        </div>

        <div className="grid-3" style={{ gap: 'var(--space-md)' }}>
          {zones.map(zone => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              data={scanResults[zone.id]}
              loading={loading[zone.id]}
              onClick={() => onNavigate('inbox')}
            />
          ))}
        </div>
      </div>

      {/* Alert panel if any zone is red */}
      {worstZone && scanResults[worstZone.id]?.health < 40 && (
        <div className="card animate-in" style={{ borderColor: 'rgba(255,85,101,0.3)', background: 'rgba(255,85,101,0.05)', marginTop: 'var(--space-lg)' }}>
          <div className="flex" style={{ gap: 'var(--space-md)', alignItems: 'center' }}>
            <span style={{ fontSize: 32 }}>🚨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>
                {worstZone.icon} {worstZone.name} needs attention
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Health score is {scanResults[worstZone.id]?.health} — {scanResults[worstZone.id]?.fileCount} files,&nbsp;
                {scanResults[worstZone.id]?.oldFileCount} old. Use the Inbox to triage quickly.
              </div>
            </div>
            <button className="btn btn-danger" onClick={() => onNavigate('inbox')}>
              Clean it up →
            </button>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid-3" style={{ marginTop: 'var(--space-lg)' }}>
        <button className="card" style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={() => onNavigate('inbox')}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📥</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Triage Inbox</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Review recent Downloads & Desktop files</div>
        </button>
        <button className="card" style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={() => onNavigate('clutter')}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Find Clutter</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Duplicates, large files & forgotten files</div>
        </button>
        <button className="card" style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={() => onNavigate('folders')}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>My Folders</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Browse and manage your organized structure</div>
        </button>
      </div>
    </div>
  )
}
