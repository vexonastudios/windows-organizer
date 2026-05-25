import React, { useState, useCallback } from 'react'
import { formatAge } from '../../utils/fileUtils.js'
import PathConfig from './PathConfig.jsx'

export default function AppsWorkflow({ workflow, onUpdate }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(false)
  const fk = window.filekeeper

  const scan = useCallback(async () => {
    setLoading(true)
    const result = await fk.scanApps(workflow.workingPath)
    setApps(result || [])
    setLoading(false)
  }, [workflow.workingPath])

  const openApp = (appPath) => fk.openInExplorer(appPath)

  const recentApps = apps.filter(a => a.ageDays <= 7)
  const activeApps = apps.filter(a => a.ageDays <= 30)

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
        fields={[{ key: 'workingPath', label: 'Apps Root', description: 'Drive root containing all your app-* folders (e.g. E:\\)' }]}
      />

      <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.2)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--purple)' }}>AntiGravity Dev Apps:</strong> FileKeeper finds all <code style={{ color: 'var(--purple)' }}>app-*</code> folders
          on your drive and shows them sorted by last modified. Quick-open any app directly in Explorer.
        </div>
      </div>

      {!apps.length && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">💻</div>
          <div className="empty-state-title">Scan your apps</div>
          <div className="empty-state-text">Find all app-* projects on your drive</div>
          <button id="btn-scan-apps" className="btn btn-primary" onClick={scan}>🔍 Scan Apps</button>
        </div>
      )}

      {loading && <div className="loading-state"><div className="spinner" />Scanning for app-* folders…</div>}

      {!loading && apps.length > 0 && (
        <>
          <div className="stat-tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-lg)' }}>
            <div className="stat-tile">
              <div className="stat-tile-value">{apps.length}</div>
              <div className="stat-tile-label">Total Apps</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: 'var(--green)' }}>{recentApps.length}</div>
              <div className="stat-tile-label">Active This Week</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{apps.filter(a => a.hasPkg).length}</div>
              <div className="stat-tile-label">With package.json</div>
            </div>
          </div>

          <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
            <h2>All Apps</h2>
            <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
          </div>

          <div className="flex-col gap-xs">
            {apps.map(app => (
              <div
                key={app.path}
                className="file-card"
                style={{ cursor: 'pointer' }}
                onClick={() => openApp(app.path)}
              >
                <div className="file-icon" style={{ background: app.ageDays <= 7 ? 'rgba(168,85,247,0.15)' : 'var(--bg-elevated)' }}>
                  {app.ageDays <= 7 ? '⚡' : '💻'}
                </div>
                <div className="file-info">
                  <div className="file-name">{app.name}</div>
                  <div className="file-meta">
                    {app.hasPkg && (
                      <span className="tag" style={{ background: 'rgba(16,216,138,0.1)', color: 'var(--green)' }}>
                        npm
                      </span>
                    )}
                    <span className="file-meta-item" style={{
                      color: app.ageDays <= 7 ? 'var(--purple)' : app.ageDays <= 30 ? 'var(--text-secondary)' : 'var(--text-dim)'
                    }}>
                      {formatAge(app.ageDays)}
                    </span>
                    <span className="file-meta-item" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                      {app.path}
                    </span>
                  </div>
                </div>
                <div className="file-actions" style={{ opacity: 1 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Open in Explorer" onClick={e => { e.stopPropagation(); openApp(app.path) }}>
                    📂
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
