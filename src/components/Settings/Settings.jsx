import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext.jsx'

const ICONS = ['📥', '🖥️', '🖼️', '🎬', '📄', '🎵', '💻', '📦', '🗃️', '🎨']
const COLORS = [
  { label: 'Purple',   value: '#6c63ff' },
  { label: 'Amber',    value: '#f59e0b' },
  { label: 'Green',    value: '#10b981' },
  { label: 'Red',      value: '#ef4444' },
  { label: 'Blue',     value: '#3b82f6' },
  { label: 'Pink',     value: '#ec4899' },
  { label: 'Cyan',     value: '#06b6d4' },
  { label: 'Orange',   value: '#f97316' },
]

function ZoneSettingsCard({ zone, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(zone.name)
  const [path, setPath] = useState(zone.path)
  const [icon, setIcon] = useState(zone.icon)
  const [color, setColor] = useState(zone.color)
  const [maxFiles, setMaxFiles] = useState(zone.rules.maxFiles)
  const [maxAgeDays, setMaxAgeDays] = useState(zone.rules.maxAgeDays)
  const cardRef = React.useRef(null)
  const fk = window.filekeeper

  const browse = async () => {
    const dir = await fk.browseFolder()
    if (dir) setPath(dir)
  }

  const save = () => {
    onUpdate({
      ...zone,
      name,
      path,
      icon,
      color,
      rules: { ...zone.rules, maxFiles: +maxFiles, maxAgeDays: +maxAgeDays }
    })
    setEditing(false)
  }

  // Fix #18: Escape closes editing panel
  React.useEffect(() => {
    if (!editing) return
    const handler = (e) => { if (e.key === 'Escape') setEditing(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editing])

  return (
    <div ref={cardRef} className="zone-settings-card" style={{ position: 'relative' }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {path}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
          Alert after {maxFiles} files or {maxAgeDays}d without cleanup
        </div>
      </div>
      <div className="flex gap-xs">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setEditing(!editing)}
        >✏️ Edit</button>
        {!['downloads','desktop','pictures','videos','documents'].includes(zone.id) && (
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => onRemove(zone.id)}>✕</button>
        )}
      </div>

      {/* Fix #19: use position:fixed so the panel is never clipped by a parent overflow */}
      {editing && (
        <div style={{
          position: 'fixed',
          // Anchor near the card but guarantee it stays within the viewport
          top: (() => {
            if (!cardRef.current) return '20%'
            const rect = cardRef.current.getBoundingClientRect()
            const panelH = 360
            return rect.bottom + panelH > window.innerHeight
              ? Math.max(10, rect.top - panelH) + 'px'
              : rect.bottom + 4 + 'px'
          })(),
          left: (() => {
            if (!cardRef.current) return 200
            const rect = cardRef.current.getBoundingClientRect()
            return Math.min(rect.left, window.innerWidth - 480) + 'px'
          })(),
          width: 460,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          zIndex: 900,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Icon picker */}
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Icon</div>
            <div className="flex gap-xs">
              {ICONS.map(e => (
                <button
                  key={e}
                  className={`btn btn-sm ${icon === e ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: 32, fontSize: 15, padding: 2 }}
                  onClick={() => setIcon(e)}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Color</div>
            <div className="flex gap-xs">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: c.value, border: color === c.value ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="grid-2" style={{ gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Name</div>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Alert after (files)</div>
              <input className="input" type="number" value={maxFiles} onChange={e => setMaxFiles(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Path</div>
            <div className="flex gap-sm">
              <input className="input" value={path} onChange={e => setPath(e.target.value)} />
              <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={browse}>Browse</button>
            </div>
          </div>

          <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel (Esc)</button>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Settings({ zones, onSave, onOpenSetup }) {
  const [editedZones, setEditedZones] = useState(zones)
  const [showAddZone, setShowAddZone] = useState(false)
  const [newZoneName, setNewZoneName] = useState('')
  const [newZonePath, setNewZonePath] = useState('')
  const [newZoneIcon, setNewZoneIcon] = useState('📁')
  const [saving, setSaving] = useState(false)
  const [healthResult, setHealthResult] = useState(null)
  const [healthRunning, setHealthRunning] = useState(false)
  const toast = useToast()
  const fk = window.filekeeper

  useEffect(() => { setEditedZones(zones) }, [zones])

  const runHealthCheck = async () => {
    setHealthRunning(true)
    setHealthResult(null)
    try {
      const result = await fk.runWeeklyCheck({ notify: true })
      setHealthResult(result)
      if (result.urgentCount === 0) {
        toast.success('✅ Everything looks clean!')
      } else {
        toast.info(`🔔 ${result.urgentCount} item${result.urgentCount > 1 ? 's' : ''} need your attention`)
      }
    } catch (e) {
      toast.error('Health check failed: ' + e.message)
    }
    setHealthRunning(false)
  }

  const updateZone = (updated) => {
    setEditedZones(prev => prev.map(z => z.id === updated.id ? updated : z))
  }

  const removeZone = (id) => {
    setEditedZones(prev => prev.filter(z => z.id !== id))
  }

  const browse = async () => {
    const dir = await fk.browseFolder()
    if (dir) setNewZonePath(dir)
  }

  const addZone = () => {
    if (!newZoneName || !newZonePath) return
    const newZone = {
      id: `custom_${Date.now()}`,
      name: newZoneName,
      path: newZonePath,
      icon: newZoneIcon,
      color: '#6c63ff',
      rules: { maxFiles: 100, maxAgeDays: 60, maxSizeGB: 5 }
    }
    setEditedZones(prev => [...prev, newZone])
    setNewZoneName('')
    setNewZonePath('')
    setShowAddZone(false)
  }

  const save = async () => {
    setSaving(true)
    await fk.saveZones(editedZones)
    await onSave()
    setSaving(false)
    toast.success('✅ Settings saved!')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-subtitle">Configure your zones, alerts, and app preferences</p>
      </div>

      <div className="settings-section">
        <div className="settings-label">Monitored Zones</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 'var(--space-md)' }}>
          Zones are the folders FileKeeper watches and scores. Set rules to determine when a zone needs attention.
        </div>

        <div style={{ position: 'relative' }}>
          {editedZones.map(zone => (
            <div key={zone.id} style={{ position: 'relative' }}>
              <ZoneSettingsCard
                zone={zone}
                onUpdate={updateZone}
                onRemove={removeZone}
              />
            </div>
          ))}
        </div>

        {showAddZone ? (
          <div className="card animate-in" style={{ marginTop: 'var(--space-sm)', borderColor: 'var(--border-accent)' }}>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-md)' }}>Add New Zone</div>
            <div className="flex gap-xs" style={{ marginBottom: 'var(--space-sm)' }}>
              {ICONS.map(e => (
                <button key={e} className={`btn btn-sm ${newZoneIcon === e ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: 32, fontSize: 15, padding: 2 }} onClick={() => setNewZoneIcon(e)}>{e}</button>
              ))}
            </div>
            <div className="grid-2" style={{ gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Zone Name</div>
                <input className="input" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="Video Projects" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Path</div>
                <div className="flex gap-sm">
                  <input className="input" value={newZonePath} onChange={e => setNewZonePath(e.target.value)} placeholder="E:\..." />
                  <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={browse}>Browse</button>
                </div>
              </div>
            </div>
            <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddZone(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={addZone} disabled={!newZoneName || !newZonePath}>Add Zone</button>
            </div>
          </div>
        ) : (
          <button
            id="btn-add-zone"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 'var(--space-sm)', width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}
            onClick={() => setShowAddZone(true)}
          >
            + Add Zone
          </button>
        )}
      </div>

      {/* Weekly Health Check */}
      <div className="settings-section">
        <div className="settings-label">Weekly Health Check</div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: 36 }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>PC Health Check</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                Scans your Downloads, gccsatx, and illbehonest workflows and sends a Windows notification with anything that needs attention.
                This runs automatically every Sunday at 9 AM.
              </div>

              {healthResult && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: healthResult.urgentCount === 0 ? 'rgba(16,216,138,0.06)' : 'rgba(245,158,11,0.06)',
                  border: `1px solid ${healthResult.urgentCount === 0 ? 'rgba(16,216,138,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  marginBottom: 12,
                }}>
                  {healthResult.urgentCount === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                      ✅ Everything looks clean!
                      {healthResult.reclaimedThisWeek > 0 && (
                        <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
                          You reclaimed {healthResult.reclaimedThisWeekFormatted} since last check.
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', marginBottom: 8 }}>
                        {healthResult.urgentCount} item{healthResult.urgentCount > 1 ? 's' : ''} need attention:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        {healthResult.lines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              id="btn-run-health-check"
              className="btn btn-primary"
              onClick={runHealthCheck}
              disabled={healthRunning}
              style={{ flexShrink: 0 }}
            >
              {healthRunning ? '⏳ Checking…' : '🔍 Run Check Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Setup Wizard shortcut */}
      <div className="settings-section">
        <div className="settings-label">Setup</div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span style={{ fontSize: 36 }}>🪄</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Setup Wizard</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Set up a new computer — creates all your gccsatx, illbehonest, Audiobooks, Reels, and Downloads folders in one click.
            </div>
          </div>
          <button
            id="btn-open-setup-wizard"
            className="btn btn-primary"
            onClick={onOpenSetup}
          >
            Run Wizard →
          </button>
        </div>
      </div>

      {/* About section */}
      <div className="settings-section">
        <div className="settings-label">About</div>
        <div className="card">
          <div className="flex gap-md" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 36 }}>🗂️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>FileKeeper v1.0</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Your personal PC organizer</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                Files are moved to Recycle Bin (never permanently deleted without emptying it). Your data stays on your machine.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex" style={{ justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
        <button
          id="btn-save-settings"
          className="btn btn-primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving…' : '✅ Save Settings'}
        </button>
      </div>
    </div>
  )
}
