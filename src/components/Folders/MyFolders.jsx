import React, { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext.jsx'

export default function MyFolders({ zones }) {
  const [organizedFolders, setOrganizedFolders] = useState([])
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderPath, setNewFolderPath] = useState('')
  const [newFolderIcon, setNewFolderIcon] = useState('📁')
  const [showAdd, setShowAdd] = useState(false)
  const [expandedFolder, setExpandedFolder] = useState(null)
  const [folderFiles, setFolderFiles] = useState({})
  const toast = useToast()
  const fk = window.filekeeper

  useEffect(() => {
    fk?.getOrganizedFolders().then(setOrganizedFolders)
  }, [])

  const browse = async () => {
    const dir = await fk.browseFolder()
    if (dir) setNewFolderPath(dir)
  }

  const addFolder = async () => {
    if (!newFolderName || !newFolderPath) return
    const updated = [
      ...organizedFolders,
      { id: Date.now().toString(), name: newFolderName, path: newFolderPath, icon: newFolderIcon }
    ]
    setOrganizedFolders(updated)
    await fk.saveOrganizedFolders(updated)
    setNewFolderName('')
    setNewFolderPath('')
    setNewFolderIcon('📁')
    setShowAdd(false)
    toast.success(`📁 "${newFolderName}" added to My Folders`)
  }

  const removeFolder = async (id) => {
    const updated = organizedFolders.filter(f => f.id !== id)
    setOrganizedFolders(updated)
    await fk.saveOrganizedFolders(updated)
    toast.info('Folder removed from list (files not deleted)')
  }

  const openFolder = (path) => fk.openInExplorer(path)

  const loadFiles = async (folder) => {
    if (expandedFolder === folder.id) {
      setExpandedFolder(null)
      return
    }
    setExpandedFolder(folder.id)
    if (!folderFiles[folder.id]) {
      const result = await fk.scanZone({ ...folder, rules: { maxFiles: 999, maxAgeDays: 365, maxSizeGB: 999 } })
      setFolderFiles(prev => ({ ...prev, [folder.id]: result }))
    }
  }

  const EMOJIS = ['📁', '🖼️', '🎬', '📄', '💻', '🎵', '📦', '🗃️', '🗂️', '⚙️', '🎨', '📊', '🏠', '📸']

  // Also show zones as quick-access folders
  const allZones = [...zones, ...organizedFolders]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📁 My Folders</h1>
        <p className="page-subtitle">Your organized folder structure — quick access and file browsing</p>
      </div>

      {/* Zone quick access */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-md)', fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
          Monitored Zones
        </h2>
        <div className="grid-5" style={{ gap: 'var(--space-sm)' }}>
          {zones.map(z => (
            <button
              key={z.id}
              className="card"
              style={{ textAlign: 'center', cursor: 'pointer', padding: 'var(--space-md)', border: '1px solid var(--border)' }}
              onClick={() => openFolder(z.path)}
              title={z.path}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{z.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{z.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Open in Explorer
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* My Custom Folders */}
      <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
        <h2 style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
          My Folders
        </h2>
        <button
          id="btn-add-folder"
          className="btn btn-primary btn-sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          + Add Folder
        </button>
      </div>

      {/* Add folder form */}
      {showAdd && (
        <div className="card animate-in" style={{ marginBottom: 'var(--space-lg)', borderColor: 'var(--border-accent)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 'var(--space-md)' }}>Add a folder to track</div>

          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Pick an icon</div>
            <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  className={`btn btn-sm ${newFolderIcon === e ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: 36, fontSize: 16, padding: 4 }}
                  onClick={() => setNewFolderIcon(e)}
                >{e}</button>
              ))}
            </div>
          </div>

          <div className="grid-2" style={{ gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Folder name</div>
              <input
                id="input-folder-name"
                className="input"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="e.g. Video Projects"
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Path</div>
              <div className="flex gap-sm">
                <input
                  id="input-folder-path"
                  className="input"
                  value={newFolderPath}
                  onChange={e => setNewFolderPath(e.target.value)}
                  placeholder="C:\Users\..."
                />
                <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={browse}>Browse</button>
              </div>
            </div>
          </div>

          <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            <button id="btn-save-folder" className="btn btn-primary btn-sm" onClick={addFolder} disabled={!newFolderName || !newFolderPath}>
              Add Folder
            </button>
          </div>
        </div>
      )}

      {/* Folder list */}
      {organizedFolders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-title">No custom folders yet</div>
          <div className="empty-state-text">
            Add your important folders — Projects, Editing, Client Work, etc. — so you always know where to put things.
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Your First Folder</button>
        </div>
      ) : (
        <div className="flex-col gap-sm">
          {organizedFolders.map(folder => (
            <div key={folder.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                className="clutter-group-header"
                style={{ cursor: 'pointer' }}
                onClick={() => loadFiles(folder)}
              >
                <span style={{ fontSize: 20 }}>{folder.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{folder.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{folder.path}</div>
                </div>
                {folderFiles[folder.id] && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {folderFiles[folder.id].fileCount} files · {folderFiles[folder.id].totalSizeFormatted}
                  </span>
                )}
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  title="Open in Explorer"
                  onClick={e => { e.stopPropagation(); openFolder(folder.path) }}
                >📂</button>
                <button
                  className="btn btn-danger btn-sm btn-icon"
                  title="Remove from list"
                  onClick={e => { e.stopPropagation(); removeFolder(folder.id) }}
                >✕</button>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{expandedFolder === folder.id ? '▲' : '▼'}</span>
              </div>

              {expandedFolder === folder.id && folderFiles[folder.id] && (
                <div style={{ borderTop: '1px solid var(--border)', padding: 'var(--space-md)' }}>
                  {folderFiles[folder.id].fileCount === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Folder is empty</div>
                  ) : (
                    <>
                      {/* File type breakdown */}
                      <div className="flex gap-sm" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                        {Object.entries(folderFiles[folder.id].byType || {}).map(([type, count]) => (
                          <span key={type} className={`tag tag-${type}`}>{count} {type}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Click "Open in Explorer" to browse contents
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
