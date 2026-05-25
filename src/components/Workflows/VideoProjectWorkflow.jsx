import React, { useState, useCallback } from 'react'
import { formatAge } from '../../utils/fileUtils.js'
import { useToast } from '../../context/ToastContext.jsx'
import PathConfig from './PathConfig.jsx'
import NamingEnforcer from './NamingEnforcer.jsx'

function ProjectCard({ project, workflow, onArchive, onReveal }) {
  const [expanded, setExpanded] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [result, setResult] = useState(null)

  // Detect if project has a "final" file
  const hasFinal = project.files.some(f => {
    const extOk = workflow.keepExtensions?.some(e => f.ext.toLowerCase() === e.toLowerCase())
    const nameOk = workflow.keepPatterns?.some(p => f.name.toLowerCase().includes(p.toLowerCase()))
    return extOk && nameOk
  })

  const finalFiles = project.files.filter(f => {
    const extOk = workflow.keepExtensions?.some(e => f.ext.toLowerCase() === e.toLowerCase())
    const nameOk = workflow.keepPatterns?.some(p => f.name.toLowerCase().includes(p.toLowerCase()))
    return extOk && nameOk
  })

  const workingFilesCount = project.files.length - finalFiles.length

  const handleArchive = async () => {
    setArchiving(true)
    const res = await onArchive(project)
    setResult(res)
    setArchiving(false)
  }

  if (result) {
    return (
      <div className="card animate-in" style={{ borderColor: 'rgba(16,216,138,0.3)', background: 'rgba(16,216,138,0.05)' }}>
        <div className="flex gap-md" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--green)' }}>{project.name} — Archived!</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              📁 {result.kept.length} final file{result.kept.length !== 1 ? 's' : ''} copied to archive
              · 🗑️ {result.trashed.length} working file{result.trashed.length !== 1 ? 's' : ''} sent to Recycle Bin
            </div>
            {result.kept.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Kept: {result.kept.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`card ${hasFinal ? '' : ''}`}
      style={{
        borderColor: hasFinal ? 'rgba(108,99,255,0.3)' : 'var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
        background: hasFinal ? 'var(--accent)' : 'var(--border)',
      }} />

      <div style={{ paddingLeft: 8 }}>
        <div className="flex-between" style={{ marginBottom: 8 }}>
          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{project.name}</span>
            {hasFinal ? (
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                background: 'var(--accent-soft)', padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>✓ Final ready</span>
            ) : (
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.05)', padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>In progress</span>
            )}
          </div>

          <div className="flex gap-xs">
            <button
              className="btn btn-ghost btn-sm btn-icon"
              title="Reveal in Explorer"
              onClick={() => window.filekeeper.openInExplorer(project.path)}
            >📂</button>
            {hasFinal && (
              <button
                id={`btn-archive-${project.name.replace(/\s/g,'-')}`}
                className="btn btn-primary btn-sm"
                onClick={handleArchive}
                disabled={archiving}
              >
                {archiving ? '⏳ Archiving…' : '🗂️ Archive & Clean'}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-lg" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span>📁 {project.fileCount} files</span>
          <span>💾 {project.totalSizeFormatted}</span>
          <span>🕐 {formatAge(project.ageDays)}</span>
          {hasFinal && <span style={{ color: 'var(--green)' }}>🎯 {finalFiles.length} final · {workingFilesCount} to clean</span>}
        </div>

        {!hasFinal && (
          <div style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <span>
              To archive: Export a video (<code>.mp4</code> or <code>.mov</code>) with <strong>final</strong>, <strong>render</strong>, or <strong>export</strong> in the filename.
            </span>
          </div>
        )}

        {/* Expand for file list */}
        {project.files.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8, fontSize: 11 }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ Hide files' : `▼ Show ${project.files.length} files`}
          </button>
        )}

        {expanded && (
          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            {project.files.slice(0, 20).map(f => {
              const isFinal = workflow.keepExtensions?.some(e => f.ext.toLowerCase() === e.toLowerCase())
                && workflow.keepPatterns?.some(p => f.name.toLowerCase().includes(p.toLowerCase()))
              return (
                <div key={f.path} className="flex gap-sm" style={{
                  padding: '4px 0',
                  fontSize: 12,
                  color: isFinal ? 'var(--green)' : 'var(--text-muted)',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <span>{isFinal ? '✅' : '📄'}</span>
                  <span style={{ flex: 1 }}>{f.name}</span>
                  <span>{f.sizeFormatted}</span>
                </div>
              )
            })}
            {project.files.length > 20 && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                +{project.files.length - 20} more files
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function VideoProjectWorkflow({ workflow, onUpdate }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [pathMissing, setPathMissing] = useState(false)   // Fix #6: path doesn't exist
  const [pathEmpty, setPathEmpty] = useState(false)       // Fix #6: path exists but no projects
  const toast = useToast()
  const fk = window.filekeeper

  const scan = useCallback(async () => {
    setLoading(true)
    setPathMissing(false)
    setPathEmpty(false)
    const result = await fk.scanProjects(workflow.workingPath)
    // Fix #6: result is now { exists: bool, projects: [] }
    if (!result.exists) {
      setPathMissing(true)
      setProjects([])
    } else {
      setProjects(result.projects || [])
      if ((result.projects || []).length === 0) setPathEmpty(true)
    }
    setLoading(false)
  }, [workflow.workingPath])

  const handleArchive = async (project) => {
    const result = await fk.archiveProject({
      projectPath: project.path,
      archivePath: workflow.archivePath,
      keepExtensions: workflow.keepExtensions,
      keepPatterns: workflow.keepPatterns,
    })
    if (result.kept.length > 0) {
      toast.success(`✅ "${project.name}" archived! ${result.kept.length} final files saved, ${result.trashed.length} cleaned up.`)
    } else {
      toast.error(`No final files found in "${project.name}" — check your "final" filename convention`)
    }
    return result
  }

  const readyProjects = projects.filter(p =>
    p.files.some(f => {
      const extOk = workflow.keepExtensions?.some(e => f.ext.toLowerCase() === e.toLowerCase())
      const nameOk = workflow.keepPatterns?.some(p2 => f.name.toLowerCase().includes(p2.toLowerCase()))
      return extOk && nameOk
    })
  )

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

      {/* Path config */}
      <PathConfig
        workflow={workflow}
        onUpdate={onUpdate}
        fields={[
          { key: 'workingPath', label: 'Working Folder', description: 'Where you edit and export from' },
          { key: 'archivePath', label: 'Archive Folder', description: 'Where final renders get backed up' },
        ]}
      />

      {/* How it works */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(108,99,255,0.05)', borderColor: 'var(--border-accent)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-primary)' }}>How this works:</strong> FileKeeper scans for subfolders (projects) in your working folder.
          When a project has a file matching <code style={{ color: 'var(--accent)' }}>{workflow.keepPatterns?.join(' / ')}</code> in the filename with
          a <code style={{ color: 'var(--accent)' }}>{workflow.keepExtensions?.join(' / ')}</code> extension,
          it marks it as <strong style={{ color: 'var(--green)' }}>✓ Final Ready</strong>.
          Clicking <strong>"Archive & Clean"</strong> copies the final to your archive folder and sends working files to the Recycle Bin.
        </div>
      </div>

      {/* Scan button */}
      {!projects.length && !loading && (
        <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
          <button id={`btn-scan-${workflow.id}`} className="btn btn-primary" onClick={scan}>
            🔍 Scan Projects
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-state"><div className="spinner" />Scanning projects…</div>
      )}

      {!loading && projects.length > 0 && (
        <>
          <div className="stat-tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-lg)' }}>
            <div className="stat-tile">
              <div className="stat-tile-value">{projects.length}</div>
              <div className="stat-tile-label">Projects</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: 'var(--green)' }}>{readyProjects.length}</div>
              <div className="stat-tile-label">Ready to Archive</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{projects.length - readyProjects.length}</div>
              <div className="stat-tile-label">In Progress</div>
            </div>
          </div>

          <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
            <h2>{readyProjects.length > 0 ? `${readyProjects.length} project${readyProjects.length > 1 ? 's' : ''} ready to archive` : 'Projects'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
          </div>

          <div className="flex-col gap-sm">
            {projects.map(p => (
              <ProjectCard
                key={p.path}
                project={p}
                workflow={workflow}
                onArchive={handleArchive}
              />
            ))}
          </div>

          {/* Naming Convention Enforcer */}
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--space-sm)' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700 }}>⚠️ Naming Convention Check</h2>
            </div>
            <NamingEnforcer workflow={workflow} projects={projects} />
          </div>
        </>
      )}

      {/* Fix #6: separate messages for missing path vs. empty (but valid) folder */}
      {pathMissing && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">🚫</div>
          <div className="empty-state-title">Folder not found</div>
          <div className="empty-state-text">
            <code>{workflow.workingPath}</code> doesn't exist. Update the working path above, or run the Setup Wizard to create your folder structure.
          </div>
        </div>
      )}
      {pathEmpty && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">No projects yet</div>
          <div className="empty-state-text">
            Your working folder exists but has no project subfolders yet. Create a project folder inside <code>{workflow.workingPath}</code> to get started.
          </div>
        </div>
      )}
    </div>
  )
}
