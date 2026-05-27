import React, { useState, useEffect } from 'react'

const DRIVE_LETTERS = ['C:', 'D:', 'E:', 'F:', 'G:', 'H:']

const FOLDER_GROUPS = [
  {
    id: 'sermons',
    label: 'Church Sermons',
    icon: '🎙️',
    color: '#8b5cf6',
    description: 'Working edits → final render → archive',
    folders: ['gccsatx root', 'gccsatx Working', 'gccsatx Archive'],
  },
  {
    id: 'ibh',
    label: "I'll Be Honest",
    icon: '📹',
    color: '#ef4444',
    description: 'Video editing → final → archive',
    folders: ['illbehonest root', 'illbehonest Working', 'illbehonest Archive'],
  },
  {
    id: 'audiobooks',
    label: 'Audiobooks',
    icon: '📚',
    color: '#f59e0b',
    description: 'Scroll Reader + Bodee Books projects',
    folders: ['Audiobooks root', 'Scroll Reader', 'Bodee Books'],
  },
  {
    id: 'reels',
    label: 'Reels',
    icon: '🎬',
    color: '#3b82f6',
    description: 'Scroll Reader, Bodee Books, IBH, Hear Him, GCC SATX',
    folders: ['Reels root', 'scrollreader', 'bodeebooks', 'illbehonest', 'hearhim', 'gccsatx'],
  },
  {
    id: 'apps',
    label: 'Dev Apps',
    icon: '💻',
    color: '#a855f7',
    description: 'AntiGravity app projects',
    folders: ['AntiGravity Apps'],
  },
  {
    id: 'downloads',
    label: 'Downloads Staging',
    icon: '📥',
    color: '#6c63ff',
    description: 'Auto-sort landing zone in your Downloads folder',
    folders: ['Downloads Staging root', 'Staging – Video', 'Staging – Photos', 'Staging – RAW Photos', 'Staging – Audio', 'Staging – PDFs'],
  },
  {
    id: 'photos',
    label: 'Family Photos',
    icon: '📷',
    color: '#06b6d4',
    description: 'Canon 5D RAW + JPG organized by date',
    folders: ['Family Photos'],
  },
]

function FolderRow({ result }) {
  if (result.status === 'pending') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        <span style={{ width: 18, textAlign: 'center' }}>⏳</span>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}>{result.path}</span>
      </div>
    )
  }
  if (result.status === 'creating') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
        <div className="spinner" style={{ width: 16, height: 16 }} />
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}>{result.path}</span>
      </div>
    )
  }
  if (result.status === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
        <span style={{ width: 18, textAlign: 'center', color: result.existed ? 'var(--text-muted)' : 'var(--green)' }}>
          {result.existed ? '✓' : '✅'}
        </span>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: result.existed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
          {result.path}
        </span>
        <span style={{ fontSize: 11, color: result.existed ? 'var(--text-muted)' : 'var(--green)', whiteSpace: 'nowrap' }}>
          {result.existed ? 'already exists' : 'created'}
        </span>
      </div>
    )
  }
  if (result.status === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
        <span style={{ width: 18, textAlign: 'center', color: 'var(--red)' }}>❌</span>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: 'var(--red)' }}>{result.path}</span>
        <span style={{ fontSize: 11, color: 'var(--red)' }}>{result.error}</span>
      </div>
    )
  }
  return null
}

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState('welcome') // welcome | configure | creating | done
  const [driveLetter, setDriveLetter] = useState('E:')
  const [rootFolder, setRootFolder] = useState('Projects')
  const [photosOnC, setPhotosOnC] = useState(true)
  const [applyIcons, setApplyIcons] = useState(true)
  const [folderResults, setFolderResults] = useState([])
  const [stats, setStats] = useState({ created: 0, existed: 0, errors: 0 })
  const [iconsDone, setIconsDone] = useState(false)

  const handleCreate = async () => {
    setStep('creating')
    const fk = window.filekeeper
    const photosPath = photosOnC ? null : `${driveLetter}\\Photos`

    const result = await fk.createFolderStructure({ driveLetter, photosPath, rootFolder })

    // Animate results in
    const mapped = result.results.map(r => ({
      path: r.path,
      label: r.label,
      group: r.group,
      color: r.color,
      status: r.success ? 'done' : 'error',
      existed: r.existed,
      error: r.error,
    }))

    let created = 0, existed = 0, errors = 0
    for (const r of mapped) {
      if (r.status === 'done' && !r.existed) created++
      else if (r.status === 'done' && r.existed) existed++
      else errors++
    }

    setFolderResults(mapped)
    setStats({ created, existed, errors })
    setStep('done')

    // Apply icons in the background
    if (applyIcons) {
      const iconTargets = mapped
        .filter(r => r.status === 'done' && r.color)
        .map(r => ({ path: r.path, color: r.color, group: r.group }))
      await fk.applyFolderIcons({ folders: iconTargets })
      setIconsDone(true)
    } else {
      setIconsDone(true)
    }
  }


  // ─── Step: Welcome ────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div style={{
        position: 'fixed', top: 'var(--titlebar-height)', left: 0, right: 0, bottom: 0, zIndex: 1000,
        background: 'linear-gradient(135deg, #0f0f13 0%, #1a1025 50%, #0f0f13 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 40,
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 580, width: '100%', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>📁</div>
          <h1 style={{
            fontSize: 36, fontWeight: 800, marginBottom: 12,
            background: 'linear-gradient(135deg, #c084fc, #818cf8, #38bdf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Welcome to FileKeeper
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            Let's set up your computer the right way — <strong style={{ color: 'var(--text-primary)' }}>in about 10 seconds.</strong><br />
            FileKeeper will create your entire folder structure so everything has a home from day one.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
            {['🎙️ gccsatx', '📹 illbehonest', '📚 Audiobooks', '🎬 Reels', '📷 Photos', '💻 Dev Apps', '📥 Downloads'].map(f => (
              <span key={f} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
              }}>{f}</span>
            ))}
          </div>

          <button
            id="setup-get-started"
            className="btn btn-primary"
            style={{ fontSize: 16, padding: '14px 40px', borderRadius: 12 }}
            onClick={() => setStep('configure')}
          >
            Get Started →
          </button>
          <div style={{ marginTop: 16 }}>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
              onClick={onComplete}
            >
              Skip — I'll set up manually
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step: Configure ──────────────────────────────────────────────────────
  if (step === 'configure') {
    return (
      <div style={{
        position: 'fixed', top: 'var(--titlebar-height)', left: 0, right: 0, bottom: 0, zIndex: 1000,
        background: '#0f0f13',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40, overflowY: 'auto',
      }}>
        <div style={{ maxWidth: 680, width: '100%' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 24 }} onClick={() => setStep('welcome')}>
            ← Back
          </button>

          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Choose your drive</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
            Your main work folders will be created on this drive. Downloads Staging goes in your Windows Downloads folder automatically.
          </p>

          {/* Drive picker */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Work Drive
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {DRIVE_LETTERS.map(d => (
                <button
                  key={d}
                  onClick={() => setDriveLetter(d)}
                  style={{
                    width: 64, height: 64, borderRadius: 12, border: '2px solid',
                    borderColor: driveLetter === d ? '#8b5cf6' : 'var(--border)',
                    background: driveLetter === d ? 'rgba(139,92,246,0.15)' : 'var(--bg-card)',
                    color: driveLetter === d ? '#c084fc' : 'var(--text-secondary)',
                    fontWeight: 800, fontSize: 18, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Root folder name */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Root Folder Name
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px 0 0 8px', padding: '10px 14px', whiteSpace: 'nowrap' }}>
                {driveLetter}\
              </div>
              <input
                id="input-root-folder"
                className="input"
                value={rootFolder}
                onChange={e => setRootFolder(e.target.value.replace(/[<>:"/\\|?*]/g, ''))}
                placeholder="Projects"
                style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none', flex: 1, fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              All your work folders will live inside{' '}
              <code style={{ color: 'var(--blue)' }}>{driveLetter}\{rootFolder || 'Projects'}\</code>
              {' '}— keeps your drive root tidy.
            </div>
          </div>

          {/* Photos location */}

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Family Photos Location
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { val: true, label: 'C:\\Users\\[You]\\Pictures', sub: 'Use Windows default Pictures folder (recommended)' },
                { val: false, label: `${driveLetter}\\Photos`, sub: `Store on your work drive at ${driveLetter}\\Photos` },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => setPhotosOnC(opt.val)}
                  style={{
                    padding: '14px 18px', borderRadius: 10, border: '2px solid',
                    borderColor: photosOnC === opt.val ? '#06b6d4' : 'var(--border)',
                    background: photosOnC === opt.val ? 'rgba(6,182,212,0.08)' : 'var(--bg-card)',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: photosOnC === opt.val ? '#38bdf8' : 'var(--text-primary)', fontWeight: 600, marginBottom: 3 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Apply icons toggle */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer' }}
            onClick={() => setApplyIcons(v => !v)}
          >
            <div style={{
              width: 42, height: 24, borderRadius: 12,
              background: applyIcons ? 'var(--blue)' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: applyIcons ? 20 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>🎨 Set custom folder icons</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Each folder gets a unique colored icon in Windows Explorer — purple for sermons, red for IBH, etc.
              </div>
            </div>
          </div>

          {/* Preview of what will be created */}

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              📋 Folders to be created · <code style={{ color: 'var(--blue)', textTransform: 'none', fontWeight: 400 }}>{driveLetter}\{rootFolder || 'Projects'}\</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FOLDER_GROUPS.map(group => (
                <div key={group.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{group.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{group.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{group.description}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', fontFamily: 'monospace' }}>
                    {group.folders.length} folder{group.folders.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              📌 Total: ~{FOLDER_GROUPS.reduce((a, g) => a + g.folders.length, 0)} folders · Your workflow paths will be auto-configured
            </div>
          </div>

          <button
            id="setup-create-folders"
            className="btn btn-primary"
            style={{ width: '100%', fontSize: 16, padding: '16px', borderRadius: 12 }}
            onClick={handleCreate}
          >
            ✅ Create All Folders Now
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Existing folders will not be modified or deleted — we only create what's missing.
          </div>
        </div>
      </div>
    )
  }

  // ─── Step: Creating ──────────────────────────────────────────────────────
  if (step === 'creating') {
    return (
      <div style={{
        position: 'fixed', top: 'var(--titlebar-height)', left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#0f0f13',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 20px' }} />
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Creating folders…</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>This only takes a second.</div>
        </div>
      </div>
    )
  }

  // ─── Step: Done ───────────────────────────────────────────────────────────
  if (step === 'done') {
    const grouped = {}
    for (const r of folderResults) {
      if (!grouped[r.group]) grouped[r.group] = []
      grouped[r.group].push(r)
    }

    return (
      <div style={{
        position: 'fixed', top: 'var(--titlebar-height)', left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#0f0f13',
        overflowY: 'auto', padding: '40px 20px',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h2 style={{
              fontSize: 32, fontWeight: 800, marginBottom: 10,
              background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Your PC is set up!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 20 }}>
              Your folder structure is ready. Workflow paths have been auto-configured.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>{stats.created}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Created</div>
              </div>
              <div style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-muted)' }}>{stats.existed}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Already existed</div>
              </div>
              {stats.errors > 0 && (
                <div style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{stats.errors}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Errors</div>
                </div>
              )}
            </div>
          </div>

          {applyIcons && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, marginBottom: 20, background: iconsDone ? 'rgba(16,217,138,0.06)' : 'rgba(108,99,255,0.06)', border: `1px solid ${iconsDone ? 'rgba(16,217,138,0.3)' : 'rgba(108,99,255,0.2)'}` }}>
              {iconsDone ? <span style={{ fontSize: 18 }}>✅</span> : <div className="spinner" style={{ width: 18, height: 18, flexShrink: 0 }} />}
              <div style={{ fontSize: 13, color: iconsDone ? 'var(--green)' : 'var(--text-secondary)' }}>
                {iconsDone ? 'Custom folder icons applied — open Explorer to see them!' : 'Applying colored folder icons…'}
              </div>
            </div>
          )}

          {/* Results by group */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            {Object.entries(grouped).map(([groupName, results]) => {
              const groupInfo = FOLDER_GROUPS.find(g => g.label === groupName) || {}
              const allGood = results.every(r => r.status === 'done')
              return (
                <div key={groupName} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{
                    padding: '12px 16px',
                    background: allGood ? 'rgba(74,222,128,0.05)' : 'rgba(239,68,68,0.05)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>{groupInfo.icon || '📁'}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{groupName}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: allGood ? 'var(--green)' : 'var(--red)' }}>
                      {allGood ? '✅ All good' : '⚠️ Some errors'}
                    </span>
                  </div>
                  <div style={{ padding: '8px 16px' }}>
                    {results.map((r, i) => <FolderRow key={i} result={r} />)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* What's next hint */}
          <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#c084fc' }}>⚡ What's next?</div>
            <ul style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.9, margin: 0, paddingLeft: 18 }}>
              <li>Go to <strong>My Workflows</strong> to see your configured paths</li>
              <li>Enable <strong>Auto-Sort</strong> in Settings to keep Downloads clean automatically</li>
              <li>Drag any existing project folders into <strong>gccsatx/Working</strong> or <strong>illbehonest/Working</strong></li>
              <li>FileKeeper will sit in the <strong>system tray</strong> and watch everything for you</li>
            </ul>
          </div>

          <button
            id="setup-finish"
            className="btn btn-primary"
            style={{ width: '100%', fontSize: 16, padding: '16px', borderRadius: 12 }}
            onClick={onComplete}
          >
            Let's Go → Open FileKeeper
          </button>
        </div>
      </div>
    )
  }

  return null
}
