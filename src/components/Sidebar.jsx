import React from 'react'

const nav = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'inbox',     icon: '📥', label: 'Inbox',         badge: true },
  { id: 'workflows', icon: '⚡', label: 'My Workflows' },
  { id: 'clutter',   icon: '🔍', label: 'Clutter Finder' },
  { id: 'folders',   icon: '📁', label: 'My Folders' },
]

const bottom = [
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar({ page, onNavigate, inboxCount }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-section-label">Navigation</div>
      {nav.map(item => (
        <button
          key={item.id}
          id={`nav-${item.id}`}
          className={`sidebar-item ${page === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span>{item.label}</span>
          {item.badge && inboxCount > 0 && (
            <span className="sidebar-badge">{inboxCount > 99 ? '99+' : inboxCount}</span>
          )}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <div className="sidebar-section-label">System</div>
      {bottom.map(item => (
        <button
          key={item.id}
          id={`nav-${item.id}`}
          className={`sidebar-item ${page === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
