import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from '../../context/ToastContext.jsx'
import PathConfig from './PathConfig.jsx'

function fmt(b) {
  if (!b) return '0 B'
  if (b > 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  if (b > 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB'
  return (b / 1024).toFixed(1) + ' KB'
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#10d98a' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: `${color}18`, color, border: `1px solid ${color}40`,
      borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700,
    }}>
      {score >= 80 ? '★' : score >= 60 ? '◆' : '▼'} {score}
    </span>
  )
}

function ProgressBar({ value, total, color = 'var(--blue)' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: color,
        borderRadius: 99, transition: 'width 0.3s ease',
      }} />
    </div>
  )
}

// ── Tab 1: Date Sort (existing feature) ───────────────────────────────────────
function DateSortTab({ workflow, onUpdate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [organizing, setOrganizing] = useState(false)
  const [organizeResult, setOrganizeResult] = useState(null)
  const toast = useToast()
  const fk = window.filekeeper

  const scan = useCallback(async () => {
    setLoading(true)
    setOrganizeResult(null)
    const result = await fk.scanPhotos(workflow.workingPath)
    setData(result)
    setLoading(false)
  }, [workflow.workingPath])

  const organizeAll = async () => {
    if (!data?.unorganized?.length) return
    setOrganizing(true)
    const result = await fk.organizePhotosByDate({
      photosPath: workflow.workingPath,
      files: data.unorganized,
    })
    setOrganizeResult(result)
    setOrganizing(false)
    toast.success(`📷 ${result.moved} photos organized into date folders!`)
    await scan()
  }

  const totalOrganizedPhotos = data?.dateGroups?.reduce((a, g) => a + g.fileCount, 0) || 0
  const totalOrganizedSize = data?.dateGroups?.reduce((a, g) => a + g.totalSize, 0) || 0

  return (
    <div>
      <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.2)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--blue)' }}>How it works:</strong> FileKeeper finds all JPG and RAW files sitting loose in your Photos root,
          then moves them into <code style={{ color: 'var(--blue)' }}>YYYY / YYYY-MM Month</code> subfolders using the file's date.
          RAW (.CR2) and JPG pairs are detected and shown together.
        </div>
      </div>

      {!data && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📷</div>
          <div className="empty-state-title">Scan your photo library</div>
          <div className="empty-state-text">FileKeeper will find unorganized Canon 5D photos and sort them into date folders automatically.</div>
          <button id="btn-scan-photos" className="btn btn-primary" onClick={scan}>📷 Scan Photos</button>
        </div>
      )}

      {loading && <div className="loading-state"><div className="spinner" />Scanning photo library…</div>}

      {data && !loading && (
        <>
          <div className="stat-tiles" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-lg)' }}>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: data.unorganizedCount > 0 ? 'var(--yellow)' : 'var(--green)' }}>
                {data.unorganizedCount}
              </div>
              <div className="stat-tile-label">Unorganized</div>
              <div className="stat-tile-sub">Need sorting</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{data.pairs?.length || 0}</div>
              <div className="stat-tile-label">RAW+JPG Pairs</div>
              <div className="stat-tile-sub">Canon 5D shots</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{totalOrganizedPhotos.toLocaleString()}</div>
              <div className="stat-tile-label">Organized</div>
              <div className="stat-tile-sub">In date folders</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{data.dateGroups?.length || 0}</div>
              <div className="stat-tile-label">Date Folders</div>
              <div className="stat-tile-sub">{fmt(totalOrganizedSize)} total</div>
            </div>
          </div>

          {data.unorganizedCount > 0 && (
            <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(245,166,35,0.05)', borderColor: 'rgba(245,166,35,0.3)' }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>
                    ⚠️ {data.unorganizedCount} photos need organizing
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {data.pairs?.length} RAW+JPG pairs detected ·
                    Will sort into <code style={{ color: 'var(--blue)' }}>YYYY / YYYY-MM Month</code> subfolders
                  </div>
                </div>
                <button
                  id="btn-organize-photos"
                  className="btn btn-primary"
                  onClick={organizeAll}
                  disabled={organizing}
                >
                  {organizing ? '⏳ Organizing…' : `📂 Organize ${data.unorganizedCount} Photos`}
                </button>
              </div>
            </div>
          )}

          {organizeResult && (
            <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(16,216,138,0.05)', borderColor: 'rgba(16,216,138,0.3)' }}>
              <div style={{ fontWeight: 700, color: 'var(--green)' }}>
                ✅ {organizeResult.moved} photos organized!
              </div>
              {organizeResult.errors?.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>
                  {organizeResult.errors.length} files had errors.
                </div>
              )}
            </div>
          )}

          {data.pairs?.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ marginBottom: 'var(--space-md)' }}>📸 RAW + JPG Pairs (Canon 5D)</h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                These shots have both a RAW and JPG file. Both will be moved together when organized.
              </div>
              <div className="flex-col gap-xs">
                {data.pairs.slice(0, 10).map(pair => (
                  <div key={pair.name} className="file-card">
                    <div className="file-icon">📸</div>
                    <div className="file-info">
                      <div className="file-name">{pair.name}</div>
                      <div className="file-meta">
                        <span className="tag" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                          RAW {pair.raw.ext.toUpperCase()}
                        </span>
                        <span className="tag tag-image">JPG</span>
                        <span className="file-meta-item">{fmt(pair.raw.size + pair.jpg.size)} total</span>
                      </div>
                    </div>
                  </div>
                ))}
                {data.pairs.length > 10 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                    + {data.pairs.length - 10} more pairs
                  </div>
                )}
              </div>
            </div>
          )}

          {data.dateGroups?.length > 0 && (
            <div>
              <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
                <h2>📅 Date Folders</h2>
                <button className="btn btn-ghost btn-sm" onClick={scan}>🔄 Rescan</button>
              </div>
              <div className="flex-col gap-xs">
                {data.dateGroups.map(group => (
                  <div key={group.path} className="file-card" style={{ cursor: 'default' }}>
                    <div className="file-icon">📁</div>
                    <div className="file-info">
                      <div className="file-name">{group.name}</div>
                      <div className="file-meta">
                        <span className="file-meta-item">{group.fileCount} photos</span>
                        {group.rawCount > 0 && (
                          <span className="tag" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                            {group.rawCount} RAW
                          </span>
                        )}
                        {group.jpgCount > 0 && (
                          <span className="tag tag-image">{group.jpgCount} JPG</span>
                        )}
                        <span className="file-meta-item">{group.totalSizeFormatted}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Open in Explorer"
                      onClick={() => fk.openInExplorer(group.path)}
                    >📂</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Tab 2: AI Curation ────────────────────────────────────────────────────────
function AiCurationTab({ workflow }) {
  const [apiKey, setApiKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [folderPath, setFolderPath] = useState(workflow.workingPath)
  const [costEstimate, setCostEstimate] = useState(null)
  const [estimating, setEstimating] = useState(false)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ processed: 0, total: 0, current: '' })
  const [results, setResults] = useState([])
  const [bursts, setBursts] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [topics, setTopics] = useState([])
  const [movingRejects, setMovingRejects] = useState(false)
  const [moveResult, setMoveResult] = useState(null)
  const [expandedBursts, setExpandedBursts] = useState({})
  const progressRef = useRef(null)
  const toast = useToast()
  const fk = window.filekeeper

  // Load API key on mount
  useEffect(() => {
    fk.getGeminiKey().then(k => {
      if (k) { setApiKey(k); setHasKey(true) }
    })
  }, [])

  // Subscribe to streaming progress events
  useEffect(() => {
    const handler = (data) => {
      setProgress({ processed: data.processed, total: data.total, current: data.current })
      setResults(prev => {
        const existing = prev.findIndex(r => r.path === data.result.path)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = data.result
          return updated
        }
        return [...prev, data.result]
      })
    }
    fk.on('ai-photo-progress', handler)
    return () => fk.off('ai-photo-progress', handler)
  }, [])

  const estimateCost = async () => {
    setEstimating(true)
    const est = await fk.estimateAiCost({ folderPath })
    setCostEstimate(est)
    setEstimating(false)
  }

  const runAnalysis = async () => {
    if (!apiKey) { toast.error('Please add your Gemini API key in Settings first.'); return }
    setRunning(true)
    setResults([])
    setBursts([])
    setTopics([])
    setMoveResult(null)
    setProgress({ processed: 0, total: 0, current: '' })

    try {
      const analyzed = await fk.aiAnalyzeFolder({ folderPath, apiKey })
      setResults(analyzed)

      // Group into bursts
      const burstGroups = await fk.aiGroupBursts({ analyzedPhotos: analyzed })
      setBursts(burstGroups)

      // Extract topics
      const topicList = await fk.aiGetTopics({ analyzedPhotos: analyzed })
      setTopics(topicList)

      toast.success(`✅ AI analyzed ${analyzed.length} photos!`)
    } catch (e) {
      toast.error('AI analysis failed: ' + e.message)
    }
    setRunning(false)
  }

  const moveAllRejects = async () => {
    const allRejects = bursts.flatMap(b => b.rejects.map(r => r.path))
    if (!allRejects.length) { toast.info('No rejects to move.'); return }
    setMovingRejects(true)
    const res = await fk.aiMoveRejects({ rejectPaths: allRejects, baseFolder: folderPath })
    setMoveResult(res)
    setMovingRejects(false)
    toast.success(`📦 ${res.moved} rejected photos moved to _Rejects/`)
  }

  const moveBurstRejects = async (burst) => {
    const rejectPaths = burst.rejects.map(r => r.path)
    if (!rejectPaths.length) return
    const res = await fk.aiMoveRejects({ rejectPaths, baseFolder: folderPath })
    toast.success(`📦 ${res.moved} rejects moved from this burst`)
    // Update burst UI
    setBursts(prev => prev.map(b => b.id === burst.id ? { ...b, rejects: [] } : b))
  }

  const totalRejects = bursts.reduce((a, b) => a + b.rejects.length, 0)
  const totalKeepers = bursts.reduce((a, b) => a + b.keepers.length, 0)
  const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0

  const topicTagEmoji = (tag) => {
    const map = {
      Birthday: '🎂', Beach: '🏖️', Christmas: '🎄', Portrait: '👤', Family: '👨‍👩‍👧‍👦',
      Outdoors: '🌿', Travel: '✈️', Pet: '🐶', Sports: '⚽', Food: '🍕',
      Holiday: '🎉', Wedding: '💒', Graduation: '🎓', Baby: '👶', Nature: '🌲',
    }
    return map[tag] || '📷'
  }

  // Filtered results by topic
  const filteredResults = selectedTopic
    ? results.filter(r => r.analysis?.tags?.includes(selectedTopic))
    : results

  if (!hasKey && !apiKey) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🤖</div>
        <div className="empty-state-title">Gemini API Key Required</div>
        <div className="empty-state-text" style={{ maxWidth: 400 }}>
          Go to <strong>Settings → AI Features</strong> and paste your Gemini API key to enable AI photo curation.
          It's free to get at <span style={{ color: 'var(--blue)' }}>aistudio.google.com</span>.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Control bar */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}>
        <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--purple)' }}>🤖 AI Photo Curation</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Gemini Vision will look at every JPG, score quality (sharpness, exposure, composition), group burst shots,
          pick the best keeper from each burst, and tag photos by topic (Birthday, Beach, Family, etc.).
          <br />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>RAW files are automatically paired with their JPG counterparts.</span>
        </div>

        <div className="flex gap-sm" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            value={folderPath}
            onChange={e => { setFolderPath(e.target.value); setCostEstimate(null) }}
            placeholder="Folder to analyze…"
            style={{ flex: 1, minWidth: 240 }}
          />
          <button className="btn btn-ghost btn-sm" onClick={async () => {
            const dir = await fk.browseFolder()
            if (dir) { setFolderPath(dir); setCostEstimate(null) }
          }}>📂 Browse</button>
          <button
            id="btn-estimate-cost"
            className="btn btn-ghost btn-sm"
            onClick={estimateCost}
            disabled={estimating || running}
          >{estimating ? '⏳…' : '💰 Estimate Cost'}</button>
          <button
            id="btn-run-ai-scan"
            className="btn btn-primary"
            onClick={runAnalysis}
            disabled={running || !folderPath}
          >
            {running ? `⏳ Analyzing… ${pct}%` : '🤖 Run AI Scan'}
          </button>
        </div>

        {costEstimate && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
            fontSize: 13, color: 'var(--text-secondary)',
          }}>
            📊 <strong style={{ color: 'var(--text-primary)' }}>{costEstimate.count.toLocaleString()} photos</strong> found ·
            Estimated cost: <strong style={{ color: 'var(--green)' }}>{costEstimate.costFormatted}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>($0.000075/image)</span>
          </div>
        )}
      </div>

      {/* Progress bar while running */}
      {running && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              🔍 Analyzing: <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{progress.current}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {progress.processed} / {progress.total} · {pct}%
            </div>
          </div>
          <ProgressBar value={progress.processed} total={progress.total} color="var(--purple)" />
        </div>
      )}

      {/* Summary after analysis */}
      {results.length > 0 && !running && (
        <>
          <div className="stat-tiles" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-lg)' }}>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: 'var(--green)' }}>{totalKeepers}</div>
              <div className="stat-tile-label">Keepers</div>
              <div className="stat-tile-sub">Score ≥ 70</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value" style={{ color: 'var(--red)' }}>{totalRejects}</div>
              <div className="stat-tile-label">Rejects</div>
              <div className="stat-tile-sub">Low quality</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{bursts.length}</div>
              <div className="stat-tile-label">Burst Groups</div>
              <div className="stat-tile-sub">Scenes detected</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-value">{topics.length}</div>
              <div className="stat-tile-label">Topics</div>
              <div className="stat-tile-sub">Auto-tagged</div>
            </div>
          </div>

          {/* Reject mover */}
          {totalRejects > 0 && !moveResult && (
            <div className="card" style={{
              marginBottom: 'var(--space-lg)',
              background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.25)',
            }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>
                    🗑️ {totalRejects} low-quality photos ready to move
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Blurry, overexposed, or duplicate-angle shots. Will be moved to <code>_Rejects/</code> — easy to review or restore.
                    Paired RAW files move automatically too.
                  </div>
                </div>
                <button
                  id="btn-move-all-rejects"
                  className="btn btn-danger"
                  onClick={moveAllRejects}
                  disabled={movingRejects}
                >{movingRejects ? '⏳ Moving…' : `📦 Move ${totalRejects} Rejects`}</button>
              </div>
            </div>
          )}

          {moveResult && (
            <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'rgba(16,216,138,0.05)', borderColor: 'rgba(16,216,138,0.3)' }}>
              <div style={{ fontWeight: 700, color: 'var(--green)' }}>
                ✅ {moveResult.moved} files moved to <code>{moveResult.rejectsDir}</code>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Review them in Explorer any time. Just drag them back if you change your mind.
              </div>
            </div>
          )}

          {/* Topics sidebar + results grid */}
          <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
            {/* Topics column */}
            {topics.length > 0 && (
              <div style={{ width: 180, flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                  TOPICS
                </div>
                <div className="flex-col gap-xs">
                  <button
                    className={`btn btn-sm ${!selectedTopic ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ justifyContent: 'flex-start', width: '100%' }}
                    onClick={() => setSelectedTopic(null)}
                  >
                    📷 All Photos <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{results.length}</span>
                  </button>
                  {topics.map(t => (
                    <button
                      key={t.tag}
                      className={`btn btn-sm ${selectedTopic === t.tag ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ justifyContent: 'flex-start', width: '100%' }}
                      onClick={() => setSelectedTopic(t.tag)}
                    >
                      {topicTagEmoji(t.tag)} {t.tag}
                      <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{t.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Burst groups */}
            <div style={{ flex: 1 }}>
              {selectedTopic ? (
                // Topic view — flat list of matching photos
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                    {topicTagEmoji(selectedTopic)} {selectedTopic} — {filteredResults.length} photos
                  </div>
                  <div className="flex-col gap-xs">
                    {filteredResults.map(photo => (
                      <PhotoResultRow key={photo.path} photo={photo} />
                    ))}
                  </div>
                </div>
              ) : (
                // Burst groups view
                <div className="flex-col gap-md">
                  {bursts.map(burst => (
                    <BurstGroup
                      key={burst.id}
                      burst={burst}
                      expanded={!!expandedBursts[burst.id]}
                      onToggle={() => setExpandedBursts(prev => ({ ...prev, [burst.id]: !prev[burst.id] }))}
                      onMoveRejects={() => moveBurstRejects(burst)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!running && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <div className="empty-state-title">AI Curation ready</div>
          <div className="empty-state-text">
            Choose a folder and click "Run AI Scan" to start. Gemini will score every photo and help you find the keepers.
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoResultRow({ photo }) {
  const fk = window.filekeeper
  const a = photo.analysis || {}
  const isReject = (a.score || 50) < 60
  return (
    <div className="file-card" style={isReject ? { opacity: 0.6 } : {}}>
      <div className="file-icon">{a.isBest ? '⭐' : isReject ? '🚫' : '📷'}</div>
      <div className="file-info">
        <div className="file-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {photo.name}
          {a.isBest && <span style={{ fontSize: 10, background: 'rgba(16,216,138,0.15)', color: '#10d98a', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>BEST</span>}
        </div>
        <div className="file-meta">
          {a.score !== undefined && <ScoreBadge score={a.score} />}
          {a.exposure && a.exposure !== 'good' && (
            <span className="tag" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{a.exposure}</span>
          )}
          {a.faces > 0 && <span className="file-meta-item">👤 {a.faces}</span>}
          {(a.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className="tag" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>{tag}</span>
          ))}
          {a.rejectReason && (
            <span style={{ fontSize: 11, color: 'var(--red)', fontStyle: 'italic' }}>{a.rejectReason}</span>
          )}
        </div>
        {a.description && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.description}</div>
        )}
      </div>
      <button
        className="btn btn-ghost btn-sm btn-icon"
        title="Open in Explorer"
        onClick={() => fk.openInExplorer(photo.path)}
      >📂</button>
    </div>
  )
}

function BurstGroup({ burst, expanded, onToggle, onMoveRejects }) {
  const date = burst.photos[0]?.mtimeMs
    ? new Date(burst.photos[0].mtimeMs).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : ''
  const allTags = burst.tags.slice(0, 4)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Burst header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          cursor: 'pointer', borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
        onClick={onToggle}
      >
        <div style={{ fontSize: 20 }}>{burst.rejects.length === 0 ? '✅' : '📸'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {burst.photos.length} shots
            {date && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>{date}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--green)' }}>⭐ Best: {burst.best?.name}</span>
            {burst.keepers.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {burst.keepers.length} keeper{burst.keepers.length > 1 ? 's' : ''}</span>}
            {burst.rejects.length > 0 && <span style={{ fontSize: 11, color: 'var(--red)' }}>· {burst.rejects.length} reject{burst.rejects.length > 1 ? 's' : ''}</span>}
            {allTags.map(tag => (
              <span key={tag} style={{ fontSize: 10, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', borderRadius: 4, padding: '1px 5px' }}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {burst.rejects.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={e => { e.stopPropagation(); onMoveRejects() }}
            >📦 Move {burst.rejects.length} Rejects</button>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: 14, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </div>

      {/* Expanded burst photos */}
      {expanded && (
        <div style={{ padding: '8px 0' }}>
          {burst.photos.map(photo => (
            <div key={photo.path} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
              background: photo.path === burst.best?.path ? 'rgba(16,216,138,0.04)' : undefined,
              borderLeft: photo.path === burst.best?.path ? '3px solid #10d98a' : '3px solid transparent',
            }}>
              <div style={{ fontSize: 16 }}>{photo.path === burst.best?.path ? '⭐' : burst.rejects.find(r => r.path === photo.path) ? '🚫' : '📷'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {photo.name}
                  {photo.path === burst.best?.path && (
                    <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(16,216,138,0.15)', color: '#10d98a', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>BEST</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                  {photo.analysis?.score !== undefined && <ScoreBadge score={photo.analysis.score} />}
                  {photo.analysis?.rejectReason && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{photo.analysis.rejectReason}</span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{photo.sizeFormatted}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab 3: Topics (post-AI album view) ───────────────────────────────────────
function TopicsTab({ workflow }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🏷️</div>
      <div className="empty-state-title">Run AI Curation first</div>
      <div className="empty-state-text" style={{ maxWidth: 380 }}>
        Switch to the <strong>AI Curation</strong> tab and run a scan — after that, your topic albums
        (Birthday, Beach, Christmas, Family, etc.) will automatically appear in the sidebar there.
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PhotosWorkflow({ workflow, onUpdate }) {
  const [activeTab, setActiveTab] = useState('date')

  const tabs = [
    { id: 'date', label: '📅 Organize by Date' },
    { id: 'ai', label: '🤖 AI Curation' },
    { id: 'topics', label: '🏷️ Topics' },
  ]

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

      <PathConfig
        workflow={workflow}
        onUpdate={onUpdate}
        fields={[{ key: 'workingPath', label: 'Photos Root', description: 'Your main Photos folder (Canon 5D JPGs + RAWs)' }]}
      />

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 'var(--space-xl)',
        borderBottom: '1px solid var(--border)', paddingBottom: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`btn-photos-tab-${tab.id}`}
            className="btn btn-ghost btn-sm"
            onClick={() => setActiveTab(tab.id)}
            style={{
              borderRadius: '6px 6px 0 0',
              borderBottom: activeTab === tab.id ? '2px solid var(--blue)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 400,
              paddingBottom: 10,
            }}
          >{tab.label}</button>
        ))}
      </div>

      {activeTab === 'date' && <DateSortTab workflow={workflow} onUpdate={onUpdate} />}
      {activeTab === 'ai' && <AiCurationTab workflow={workflow} />}
      {activeTab === 'topics' && <TopicsTab workflow={workflow} />}
    </div>
  )
}
