import React, { useState, useCallback } from 'react'
import { useToast } from '../../context/ToastContext.jsx'
import PathConfig from './PathConfig.jsx'

const REQ_ICONS = {
  mp3:       '🎵',
  cover:     '🖼️',
  thumbnail: '🎞️',
  indesign:  '📐',
  pdf:       '📋',
  kindle:    '📱',
}

function BookRow({ book, workflow, onReveal }) {
  const [check, setCheck] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const fk = window.filekeeper

  const scan = async () => {
    setLoading(true)
    const result = await fk.checkAudiobook({
      projectPath: book.path,
      requiredFiles: workflow.requiredFiles,
    })
    setCheck(result)
    setLoading(false)
    setExpanded(true)
  }

  const completeness = check
    ? Math.round((check.foundCount / check.total) * 100)
    : null

  const statusColor = completeness === null ? 'var(--text-dim)'
    : completeness === 100 ? 'var(--green)'
    : completeness >= 50 ? 'var(--yellow)'
    : 'var(--red)'

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 8 }}>
      <div
        className="clutter-group-header"
        style={{ cursor: 'pointer' }}
        onClick={() => check ? setExpanded(!expanded) : scan()}
      >
        <span style={{ fontSize: 18 }}>📚</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{book.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {book.fileCount} files · {book.totalSizeFormatted}
          </div>
        </div>

        {/* Completeness badge */}
        {check ? (
          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
              {check.foundCount}/{check.total} files
            </div>
            <div style={{
              width: 60, height: 6,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3, overflow: 'hidden',
            }}>
              <div style={{
                width: `${completeness}%`, height: '100%',
                background: statusColor,
                transition: 'width 0.4s ease',
              }} />
            </div>
            {completeness === 100 && (
              <span style={{
                fontSize: 11, color: 'var(--green)', fontWeight: 700,
                background: 'var(--green-bg)', padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}>✅ Complete</span>
            )}
          </div>
        ) : (
          <button
            id={`btn-check-${book.name.replace(/\s/g,'-')}`}
            className="btn btn-ghost btn-sm"
            onClick={e => { e.stopPropagation(); scan() }}
            disabled={loading}
          >
            {loading ? '⏳' : '🔍 Check'}
          </button>
        )}

        <button
          className="btn btn-ghost btn-sm btn-icon"
          title="Open in Explorer"
          onClick={e => { e.stopPropagation(); onReveal(book.path) }}
        >📂</button>

        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && check && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 'var(--space-md)' }}>
          <div className="grid-3" style={{ gap: 'var(--space-sm)' }}>
            {workflow.requiredFiles.map(req => {
              const result = check.results[req.key]
              const found = result?.found
              return (
                <div key={req.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: found ? 'var(--green-bg)' : 'rgba(255,85,101,0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${found ? 'rgba(16,216,138,0.2)' : 'rgba(255,85,101,0.2)'}`,
                }}>
                  <span style={{ fontSize: 18 }}>{REQ_ICONS[req.key] || '📄'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: found ? 'var(--green)' : 'var(--red)' }}>
                      {found ? '✓' : '✗'} {req.label}
                    </div>
                    {found && result.file && (
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.file.name}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {completeness === 100 && (
            <div style={{
              marginTop: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'rgba(16,216,138,0.06)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid var(--green)',
              fontSize: 13, color: 'var(--text-secondary)',
            }}>
              🎉 <strong style={{ color: 'var(--green)' }}>This audiobook is complete!</strong> All 6 required files are present. Ready to publish on KDP.
            </div>
          )}

          {completeness < 100 && (
            <div style={{
              marginTop: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'rgba(245,166,35,0.06)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid var(--yellow)',
              fontSize: 13, color: 'var(--text-secondary)',
            }}>
              ⚠️ Missing: {workflow.requiredFiles
                .filter(r => !check.results[r.key]?.found)
                .map(r => r.label)
                .join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AudiobookWorkflow({ workflow, onUpdate }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanAll, setScanAll] = useState(false)
  const toast = useToast()
  const fk = window.filekeeper

  const scan = useCallback(async () => {
    setLoading(true)
    const result = await fk.scanProjects(workflow.workingPath)
    setBooks(result || [])
    setLoading(false)
  }, [workflow.workingPath])

  const checkAll = async () => {
    setScanAll(true)
    // Trigger scan on all books
    toast.info('Checking all books… expand each to see results')
    setScanAll(false)
  }

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
        fields={[
          { key: 'workingPath', label: 'Books Folder', description: 'Folder containing one subfolder per book' },
        ]}
      />

      {/* Required files legend */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Required files per book
        </div>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          {workflow.requiredFiles?.map(req => (
            <div key={req.key} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-full)',
              fontSize: 12, color: 'var(--text-secondary)',
            }}>
              <span>{REQ_ICONS[req.key]}</span>
              <span>{req.label}</span>
              <span style={{ color: 'var(--text-dim)' }}>({req.extensions.join(', ')})</span>
            </div>
          ))}
        </div>
      </div>

      {!books.length && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">Scan your audiobook projects</div>
          <div className="empty-state-text">Each subfolder in your books folder is treated as one book. FileKeeper checks if all 6 required files are present.</div>
          <button id={`btn-scan-${workflow.id}`} className="btn btn-primary" onClick={scan}>
            🔍 Scan Books
          </button>
        </div>
      )}

      {loading && <div className="loading-state"><div className="spinner" />Scanning book folders…</div>}

      {!loading && books.length > 0 && (
        <>
          <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{books.length} books found</span>
            <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
          </div>

          {books.map(book => (
            <BookRow
              key={book.path}
              book={book}
              workflow={workflow}
              onReveal={p => fk.openInExplorer(p)}
            />
          ))}
        </>
      )}
    </div>
  )
}
