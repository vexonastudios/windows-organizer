import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getFileEmoji } from '../../utils/fileUtils.js'

// ─── Static navigation & action items ────────────────────────────────────────
const NAV_ITEMS = [
  { type: 'nav',    id: 'dashboard',  icon: '📊', label: 'Dashboard',       desc: 'PC health overview' },
  { type: 'nav',    id: 'inbox',      icon: '📥', label: 'Inbox',           desc: 'Triage recent files' },
  { type: 'nav',    id: 'workflows',  icon: '⚡', label: 'My Workflows',    desc: 'Sermons, IBH, Reels…' },
  { type: 'nav',    id: 'clutter',    icon: '🔍', label: 'Clutter Finder',  desc: 'Duplicates & large files' },
  { type: 'nav',    id: 'folders',    icon: '📁', label: 'My Folders',      desc: 'Browse organized structure' },
  { type: 'nav',    id: 'settings',   icon: '⚙️', label: 'Settings',        desc: 'Zones, health check, setup' },
]

const ACTION_ITEMS = [
  { type: 'action', id: 'health',     icon: '🔔', label: 'Run Health Check',    desc: 'Scan Downloads, projects & space' },
  { type: 'action', id: 'setup',      icon: '🪄', label: 'Open Setup Wizard',   desc: 'Create/reset folder structure' },
  { type: 'action', id: 'autosort',   icon: '🗂️', label: 'Auto-Sort Downloads', desc: 'Sort Downloads into Staging now' },
]

function ResultGroup({ title, children }) {
  return (
    <div>
      <div style={{
        padding: '6px 16px 4px',
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'var(--text-dim)',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ResultRow({ item, highlighted, onSelect, index, setHighlight }) {
  const ref = useRef(null)

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted])

  const icon = item.type === 'file'
    ? getFileEmoji(item.fileType, item.ext)
    : item.icon

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHighlight(index)}
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 16px', cursor: 'pointer',
        background: highlighted ? 'var(--accent-soft)' : 'transparent',
        borderLeft: highlighted ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'background 80ms ease',
      }}
    >
      <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: highlighted ? 'var(--text-primary)' : 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.label || item.name}
        </div>
        {(item.desc || item.source) && (
          <div style={{
            fontSize: 11, color: 'var(--text-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginTop: 1,
          }}>
            {item.type === 'file'
              ? `${item.sourceIcon} ${item.source}  ·  ${item.size}  ·  ${item.path}`
              : item.desc}
          </div>
        )}
      </div>
      {item.type === 'nav' && (
        <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>Page</span>
      )}
      {item.type === 'action' && (
        <span style={{ fontSize: 10, color: 'var(--accent)', flexShrink: 0 }}>Action</span>
      )}
    </div>
  )
}

export default function CommandPalette({ zones, onNavigate, onRunAction, onClose }) {
  const [query, setQuery] = useState('')
  const [fileResults, setFileResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)
  const inputRef = useRef(null)
  const fk = window.filekeeper

  // Auto-focus input when palette opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // Debounced file search
  useEffect(() => {
    if (query.length < 2) { setFileResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const workflows = await fk.getWorkflows()
        const results = await fk.globalSearch({ query, zones, workflows })
        setFileResults(results || [])
      } catch {}
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Reset highlight when results change
  useEffect(() => { setHighlightIdx(0) }, [query, fileResults.length])

  // Filter static items
  const q = query.toLowerCase()
  const filteredNav = q
    ? NAV_ITEMS.filter(i => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    : NAV_ITEMS
  const filteredActions = q
    ? ACTION_ITEMS.filter(i => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    : ACTION_ITEMS

  // Flatten all results into one list for keyboard nav
  const allItems = [
    ...filteredNav,
    ...filteredActions,
    ...fileResults.map(f => ({ ...f, type: 'file' })),
  ]

  const handleSelect = useCallback((item) => {
    if (!item) return
    if (item.type === 'nav') { onNavigate(item.id); onClose() }
    else if (item.type === 'action') { onRunAction(item.id); onClose() }
    else if (item.type === 'file') { fk.openInExplorer(item.path); onClose() }
  }, [onNavigate, onRunAction, onClose])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIdx(i => Math.min(i + 1, allItems.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIdx(i => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSelect(allItems[highlightIdx])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [allItems, highlightIdx, handleSelect, onClose])

  let itemIdx = 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 620, maxHeight: '70vh',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          borderRadius: 14,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(108,99,255,0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'palette-in 120ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>
            {searching ? '⏳' : '🔍'}
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files, navigate pages, run actions…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd style={{
            fontSize: 10, color: 'var(--text-dim)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '2px 6px',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {allItems.length === 0 && query.length >= 2 && !searching && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No results for "<strong style={{ color: 'var(--text-secondary)' }}>{query}</strong>"
            </div>
          )}

          {filteredNav.length > 0 && (
            <ResultGroup title="Navigate">
              {filteredNav.map(item => {
                const idx = itemIdx++
                return (
                  <ResultRow
                    key={item.id}
                    item={item}
                    index={idx}
                    highlighted={highlightIdx === idx}
                    setHighlight={setHighlightIdx}
                    onSelect={() => handleSelect(item)}
                  />
                )
              })}
            </ResultGroup>
          )}

          {filteredActions.length > 0 && (
            <ResultGroup title="Actions">
              {filteredActions.map(item => {
                const idx = itemIdx++
                return (
                  <ResultRow
                    key={item.id}
                    item={item}
                    index={idx}
                    highlighted={highlightIdx === idx}
                    setHighlight={setHighlightIdx}
                    onSelect={() => handleSelect(item)}
                  />
                )
              })}
            </ResultGroup>
          )}

          {fileResults.length > 0 && (
            <ResultGroup title={`Files (${fileResults.length} found)`}>
              {fileResults.map(item => {
                const idx = itemIdx++
                return (
                  <ResultRow
                    key={item.path}
                    item={item}
                    index={idx}
                    highlighted={highlightIdx === idx}
                    setHighlight={setHighlightIdx}
                    onSelect={() => handleSelect(item)}
                  />
                )
              })}
            </ResultGroup>
          )}

          {/* Footer hint */}
          <div style={{
            padding: '8px 16px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-dim)',
            flexShrink: 0,
          }}>
            <span><kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>↵</kbd> Select</span>
            <span><kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>Esc</kbd> Close</span>
            <span style={{ marginLeft: 'auto' }}>Files open in Explorer</span>
          </div>
        </div>
      </div>
    </div>
  )
}
