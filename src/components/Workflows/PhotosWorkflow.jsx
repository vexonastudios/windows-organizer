import React, { useState, useCallback } from 'react'
import { useToast } from '../../context/ToastContext.jsx'
import PathConfig from './PathConfig.jsx'

function fmt(b) {
  if (!b) return '0 B'
  if (b > 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  if (b > 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB'
  return (b / 1024).toFixed(1) + ' KB'
}

export default function PhotosWorkflow({ workflow, onUpdate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [organizing, setOrganizing] = useState(false)
  const [organizeResult, setOrganizeResult] = useState(null)
  const toast = useToast()
  const fk = window.filekeeper

  const scan = useCallback(async () => {
    setLoading(true)
    setOrganizeResult(null)
    const result = await fk.scanPhotos(workflow.workingPath)
    setData(result)
    setLoading(false)
  }, [workflow.workingPath])

  const organizeAll = async () => {
    if (!data?.unorganized?.length) return
    setOrganizing(true)
    const result = await fk.organizePhotosByDate({
      photosPath: workflow.workingPath,
      files: data.unorganized,
    })
    setOrganizeResult(result)
    setOrganizing(false)
    toast.success(`📷 ${result.moved} photos organized into date folders!`)
    await scan()
  }

  const totalOrganizedPhotos = data?.dateGroups?.reduce((a, g) => a + g.fileCount, 0) || 0
  const totalOrganizedSize = data?.dateGroups?.reduce((a, g) => a + g.totalSize, 0) || 0

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
        fields={[{ key: 'workingPath', label: 'Photos Root', description: 'Your main Photos folder (Canon 5D JPGs + RAWs)' }]}
      />

      {/* How it works */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.2)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--blue)' }}>How it works:</strong> FileKeeper finds all JPG and RAW files sitting loose in your Photos root,
          then moves them into <code style={{ color: 'var(--blue)' }}>YYYY / YYYY-MM Month</code> subfolders using the file's date.
          RAW (.CR2) and JPG pairs are detected and shown together.
        </div>
      </div>

      {!data && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📷</div>
          <div className="empty-state-title">Scan your photo library</div>
          <div className="empty-state-text">FileKeeper will find unorganized Canon 5D photos and sort them into date folders automatically.</div>
          <button id="btn-scan-photos" className="btn btn-primary" onClick={scan}>📷 Scan Photos</button>
        </div>
      )}

      {loading && <div className="loading-state"><div className="spinner" />Scanning photo library…</div>}

      {data && !loading && (
        <>
          {/* Summary tiles */}
          <div className="stat-tiles" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-lg)' }}>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: data.unorganizedCount > 0 ? 'var(--yellow)' : 'var(--green)' }}>
                {data.unorganizedCount}
              </div>
              <div className="stat-tile-label">Unorganized</div>
              <div className="stat-tile-sub">Need sorting</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{data.pairs?.length || 0}</div>
              <div className="stat-tile-label">RAW+JPG Pairs</div>
              <div className="stat-tile-sub">Canon 5D shots</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{totalOrganizedPhotos.toLocaleString()}</div>
              <div className="stat-tile-label">Organized</div>
              <div className="stat-tile-sub">In date folders</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{data.dateGroups?.length || 0}</div>
              <div className="stat-tile-label">Date Folders</div>
              <div className="stat-tile-sub">{fmt(totalOrganizedSize)} total</div>
            </div>
          </div>

          {/* Organize button */}
          {data.unorganizedCount > 0 && (
            <div className="card" style={{
              marginBottom: 'var(--space-lg)',
              background: 'rgba(245,166,35,0.05)',
              borderColor: 'rgba(245,166,35,0.3)',
            }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>
                    ⚠️ {data.unorganizedCount} photos need organizing
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {data.pairs?.length} RAW+JPG pairs detected ·
                    Will sort into <code style={{ color: 'var(--blue)' }}>YYYY / YYYY-MM Month</code> subfolders
                  </div>
                </div>
                <button
                  id="btn-organize-photos"
                  className="btn btn-primary"
                  onClick={organizeAll}
                  disabled={organizing}
                >
                  {organizing ? '⏳ Organizing…' : `📂 Organize ${data.unorganizedCount} Photos`}
                </button>
              </div>
            </div>
          )}

          {organizeResult && (
            <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(16,216,138,0.05)', borderColor: 'rgba(16,216,138,0.3)' }}>
              <div style={{ fontWeight: 700, color: 'var(--green)' }}>
                ✅ {organizeResult.moved} photos organized!
              </div>
              {organizeResult.errors?.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>
                  {organizeResult.errors.length} files had errors.
                </div>
              )}
            </div>
          )}

          {/* RAW+JPG Pairs section */}
          {data.pairs?.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ marginBottom: 'var(--space-md)' }}>📸 RAW + JPG Pairs (Canon 5D)</h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                These shots have both a RAW and JPG file. Both will be moved together when organized.
              </div>
              <div className="flex-col gap-xs">
                {data.pairs.slice(0, 10).map(pair => (
                  <div key={pair.name} className="file-card">
                    <div className="file-icon">📸</div>
                    <div className="file-info">
                      <div className="file-name">{pair.name}</div>
                      <div className="file-meta">
                        <span className="tag" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                          RAW {pair.raw.ext.toUpperCase()}
                        </span>
                        <span className="tag tag-image">JPG</span>
                        <span className="file-meta-item">{fmt(pair.raw.size + pair.jpg.size)} total</span>
                      </div>
                    </div>
                  </div>
                ))}
                {data.pairs.length > 10 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                    + {data.pairs.length - 10} more pairs
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organized date folders */}
          {data.dateGroups?.length > 0 && (
            <div>
              <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
                <h2>📅 Date Folders</h2>
                <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
              </div>
              <div className="flex-col gap-xs">
                {data.dateGroups.map(group => (
                  <div key={group.path} className="file-card" style={{ cursor: 'default' }}>
                    <div className="file-icon">📁</div>
                    <div className="file-info">
                      <div className="file-name">{group.name}</div>
                      <div className="file-meta">
                        <span className="file-meta-item">{group.fileCount} photos</span>
                        {group.rawCount > 0 && (
                          <span className="tag" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                            {group.rawCount} RAW
                          </span>
                        )}
                        {group.jpgCount > 0 && (
                          <span className="tag tag-image">{group.jpgCount} JPG</span>
                        )}
                        <span className="file-meta-item">{group.totalSizeFormatted}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Open in Explorer"
                      onClick={() => fk.openInExplorer(group.path)}
                    >📂</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
