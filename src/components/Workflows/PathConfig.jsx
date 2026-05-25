import React, { useState } from 'react'

/**
 * Reusable path configuration panel for any workflow.
 * Shows current path values with edit/browse capability.
 */
export default function PathConfig({ workflow, onUpdate, fields }) {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState(
    Object.fromEntries(fields.map(f => [f.key, workflow[f.key] || '']))
  )
  const fk = window.filekeeper

  const browse = async (key) => {
    const dir = await fk.browseFolder()
    if (dir) setValues(prev => ({ ...prev, [key]: dir }))
  }

  const save = () => {
    onUpdate({ ...workflow, ...values })
    setEditing(false)
  }

  return (
    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <div className="flex-between" style={{ marginBottom: editing ? 'var(--space-md)' : 0 }}>
        <div>
          {!editing && fields.map(f => (
            <div key={f.key} className="flex gap-sm" style={{ marginBottom: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: 120, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {f.label}
              </span>
              <span
                style={{
                  fontSize: 12, color: workflow[f.key] ? 'var(--text-secondary)' : 'var(--red)',
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {workflow[f.key] || '⚠️ Not configured'}
              </span>
            </div>
          ))}
        </div>
        <button
          id={`btn-config-${workflow.id}`}
          className="btn btn-ghost btn-sm"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : '✏️ Configure Paths'}
        </button>
      </div>

      {editing && (
        <div className="animate-in">
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {f.label}
                {f.description && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>— {f.description}</span>}
              </div>
              <div className="flex gap-sm">
                <input
                  id={`input-${workflow.id}-${f.key}`}
                  className="input"
                  value={values[f.key]}
                  onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={`e.g. E:\\${f.label.replace(' ', '')}\\...`}
                />
                <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => browse(f.key)}>
                  Browse
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={save}>Save Paths</button>
          </div>
        </div>
      )}
    </div>
  )
}
