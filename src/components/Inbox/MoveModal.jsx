import React, { useState } from 'react'

export default function MoveModal({ filePaths, zones, onConfirm, onCancel }) {
  const [customPath, setCustomPath] = useState('')
  const [selected, setSelected] = useState('')
  const fk = window.filekeeper

  const browse = async () => {
    const dir = await fk.browseFolder()
    if (dir) { setCustomPath(dir); setSelected('custom') }
  }

  const handleConfirm = () => {
    const dest = selected === 'custom' ? customPath : selected
    if (!dest) return
    onConfirm(dest)
  }

  // Suggested quick destinations
  const suggestions = [
    { label: '🖼️ Pictures', path: zones.find(z => z.id === 'pictures')?.path },
    { label: '📄 Documents', path: zones.find(z => z.id === 'documents')?.path },
    { label: '🎬 Videos', path: zones.find(z => z.id === 'videos')?.path },
    { label: '🖥️ Desktop', path: zones.find(z => z.id === 'desktop')?.path },
  ].filter(s => s.path)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">📁 Move {filePaths.length} file{filePaths.length > 1 ? 's' : ''} to…</div>

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Quick destinations</div>
          <div className="grid-2" style={{ gap: 'var(--space-sm)' }}>
            {suggestions.map(s => (
              <button
                key={s.path}
                className={`btn btn-ghost ${selected === s.path ? 'btn-primary' : ''}`}
                style={{ justifyContent: 'flex-start', fontSize: 13 }}
                onClick={() => setSelected(s.path)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Or choose a folder</div>
          <div className="flex gap-sm">
            <input
              className="input"
              value={customPath}
              onChange={e => { setCustomPath(e.target.value); setSelected('custom') }}
              placeholder="C:\Users\James\..."
            />
            <button className="btn btn-ghost" onClick={browse}>Browse</button>
          </div>
        </div>

        <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            id="btn-confirm-move"
            className="btn btn-primary"
            disabled={!selected && !customPath}
            onClick={handleConfirm}
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  )
}
