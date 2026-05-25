import React, { useState, useEffect } from 'react'
import VideoProjectWorkflow from './VideoProjectWorkflow.jsx'
import AudiobookWorkflow from './AudiobookWorkflow.jsx'
import ReelsWorkflow from './ReelsWorkflow.jsx'
import PhotosWorkflow from './PhotosWorkflow.jsx'
import AppsWorkflow from './AppsWorkflow.jsx'

export default function Workflows() {
  const [workflows, setWorkflows] = useState([])
  const [activeId, setActiveId] = useState(null)
  const fk = window.filekeeper

  useEffect(() => {
    fk?.getWorkflows().then(wf => {
      setWorkflows(wf || [])
      if (wf?.length) setActiveId(wf[0].id)
    })
  }, [])

  const active = workflows.find(w => w.id === activeId)

  const saveWorkflows = async (updated) => {
    setWorkflows(updated)
    await fk.saveWorkflows(updated)
  }

  const updateWorkflow = (updatedWf) => {
    const updated = workflows.map(w => w.id === updatedWf.id ? updatedWf : w)
    saveWorkflows(updated)
  }

  const renderWorkflow = (wf) => {
    if (!wf) return null
    switch (wf.type) {
      case 'video_project': return <VideoProjectWorkflow key={wf.id} workflow={wf} onUpdate={updateWorkflow} />
      case 'audiobook':     return <AudiobookWorkflow    key={wf.id} workflow={wf} onUpdate={updateWorkflow} />
      case 'reels':         return <ReelsWorkflow        key={wf.id} workflow={wf} onUpdate={updateWorkflow} />
      case 'photos':        return <PhotosWorkflow       key={wf.id} workflow={wf} onUpdate={updateWorkflow} />
      case 'apps':          return <AppsWorkflow         key={wf.id} workflow={wf} onUpdate={updateWorkflow} />
      default:              return <div>Unknown workflow type</div>
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', margin: '-32px', overflow: 'hidden' }}>
      {/* Workflow sidebar */}
      <div style={{
        width: 200,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'var(--text-dim)',
          padding: '0 16px',
          marginBottom: 8,
        }}>My Workflows</div>

        {workflows.map(wf => (
          <button
            key={wf.id}
            id={`wf-tab-${wf.id}`}
            onClick={() => setActiveId(wf.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              border: 'none',
              background: activeId === wf.id ? 'var(--accent-soft)' : 'transparent',
              color: activeId === wf.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 500,
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            {activeId === wf.id && (
              <span style={{
                position: 'absolute',
                left: 0, top: 4, bottom: 4,
                width: 3,
                background: wf.color || 'var(--accent)',
                borderRadius: '0 3px 3px 0',
              }} />
            )}
            <span style={{ fontSize: 18 }}>{wf.icon}</span>
            <span style={{ lineHeight: 1.2 }}>{wf.name}</span>
          </button>
        ))}
      </div>

      {/* Workflow content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 32,
        background: 'var(--bg-base)',
      }}>
        {active ? renderWorkflow(active) : (
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <div className="empty-state-title">Select a workflow</div>
          </div>
        )}
      </div>
    </div>
  )
}
