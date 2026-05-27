import React, { useState, useEffect } from 'react'
// Fix #8: import the icon through Vite's asset pipeline so the path is
// correctly resolved both in dev (public/) and in the packaged .exe (dist/)
import iconUrl from '/icon.png'

export default function TitleBar({ onOpenPalette }) {
  const fk = window.filekeeper
  const [updateState, setUpdateState] = useState(null) // null | 'downloading' | 'ready'
  const [updateVersion, setUpdateVersion] = useState(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const onAvailable = ({ version }) => {
      setUpdateVersion(version)
      setUpdateState('downloading')
    }
    const onReady = ({ version }) => {
      setUpdateVersion(version)
      setUpdateState('ready')
    }
    fk?.on('update-available', onAvailable)
    fk?.on('update-downloaded', onReady)
    return () => {
      fk?.off('update-available', onAvailable)
      fk?.off('update-downloaded', onReady)
    }
  }, [])

  const handleInstall = async () => {
    setInstalling(true)
    await fk?.installUpdate()
    // quitAndInstall will close the app — if it somehow doesn't, reset state
    setTimeout(() => setInstalling(false), 3000)
  }

  return (
    <>
      <div className="titlebar">
        <div className="titlebar-left">
          <img
            src={iconUrl}
            alt="FileKeeper"
            style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4, imageRendering: 'crisp-edges' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <span className="titlebar-logo">FileKeeper</span>
          <span className="titlebar-subtitle">PC Organizer</span>
        </div>

        {/* Ctrl+K discovery hint */}
        <button
          onClick={onOpenPalette}
          title="Search & navigate (Ctrl+K)"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
            color: 'var(--text-dim)', fontSize: 12,
            transition: 'all 0.15s ease',
            WebkitAppRegion: 'no-drag',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-dim)' }}
        >
          <span>🔍</span>
          <span>Search everything…</span>
          <kbd style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '1px 5px', fontSize: 10,
          }}>Ctrl K</kbd>
        </button>

        <div className="titlebar-controls">
          {/* Fix #16: use proper SVG-style Unicode window-chrome characters that
              render consistently on Windows 10 and 11 */}
          <button
            id="btn-minimize"
            className="titlebar-btn"
            onClick={() => fk?.minimize()}
            title="Minimize"
            aria-label="Minimize"
          >&#x2212;</button>
          <button
            id="btn-maximize"
            className="titlebar-btn"
            onClick={() => fk?.maximize()}
            title="Maximize / Restore"
            aria-label="Maximize"
          >&#x25A1;</button>
          <button
            id="btn-close"
            className="titlebar-btn close"
            onClick={() => fk?.close()}
            title="Close"
            aria-label="Close"
          >&#x2715;</button>
        </div>
      </div>

      {/* ── Update Banner ── shown below title bar when an update is available */}
      {updateState && (
        <div
          id="update-banner"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '6px 16px',
            background: updateState === 'ready'
              ? 'linear-gradient(90deg, rgba(16,217,138,0.15), rgba(16,217,138,0.08))'
              : 'linear-gradient(90deg, rgba(108,99,255,0.15), rgba(108,99,255,0.08))',
            borderBottom: updateState === 'ready'
              ? '1px solid rgba(16,217,138,0.25)'
              : '1px solid rgba(108,99,255,0.25)',
            fontSize: 12,
            WebkitAppRegion: 'no-drag',
            animation: 'slideDown 0.3s ease',
          }}
        >
          <span style={{ fontSize: 14 }}>{updateState === 'ready' ? '🎉' : '⬇️'}</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {updateState === 'ready'
              ? <>FileKeeper <strong style={{ color: 'var(--text-primary)' }}>v{updateVersion}</strong> is ready to install</>
              : <>Downloading FileKeeper <strong style={{ color: 'var(--text-primary)' }}>v{updateVersion}</strong>…</>
            }
          </span>
          {updateState === 'ready' && (
            <button
              id="btn-install-update"
              onClick={handleInstall}
              disabled={installing}
              style={{
                background: 'rgba(16,217,138,0.2)', border: '1px solid rgba(16,217,138,0.4)',
                color: '#10d98a', borderRadius: 6, padding: '3px 12px', fontSize: 11,
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,217,138,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,217,138,0.2)' }}
            >
              {installing ? '⏳ Restarting…' : '↺ Restart & Update'}
            </button>
          )}
          <button
            onClick={() => setUpdateState(null)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-dim)',
              cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1,
            }}
            title="Dismiss"
          >✕</button>
        </div>
      )}
    </>
  )
}
