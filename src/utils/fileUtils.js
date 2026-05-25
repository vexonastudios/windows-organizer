// Fix #12: formatBytes exported here so components don't duplicate it
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileEmoji(type, ext) {
  const extLower = (ext || '').toLowerCase()
  
  // Specific extensions first
  const extMap = {
    '.pdf': '📋',
    '.zip': '🗜️', '.rar': '🗜️', '.7z': '🗜️', '.tar': '🗜️', '.gz': '🗜️',
    '.exe': '⚙️', '.msi': '⚙️',
    '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵', '.aac': '🎵',
    '.mp4': '🎬', '.mov': '🎬', '.avi': '🎬', '.mkv': '🎬',
    '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🎞️', '.webp': '🖼️', '.heic': '🖼️',
    '.doc': '📝', '.docx': '📝',
    '.xls': '📊', '.xlsx': '📊',
    '.ppt': '📊', '.pptx': '📊',
    '.txt': '📄',
    '.js': '📜', '.ts': '📜', '.jsx': '📜', '.tsx': '📜',
    '.py': '🐍',
    '.html': '🌐', '.css': '🎨',
    '.json': '🔧', '.xml': '🔧', '.yml': '🔧', '.yaml': '🔧',
    '.sql': '🗃️',
    '.psd': '🎨', '.ai': '🎨', '.sketch': '🎨', '.fig': '🎨',
    '.prproj': '🎞️', '.drp': '🎞️', '.aep': '🎞️',
    '.dmg': '💿', '.iso': '💿',
  }
  
  if (extMap[extLower]) return extMap[extLower]
  
  const typeMap = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    document: '📄',
    code: '💻',
    archive: '🗜️',
    executable: '⚙️',
    other: '📦',
  }
  
  return typeMap[type] || '📦'
}

export function formatAge(days) {
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function getHealthColor(score) {
  if (score >= 70) return 'var(--green)'
  if (score >= 40) return 'var(--yellow)'
  return 'var(--red)'
}

export function getHealthLabel(score) {
  if (score >= 70) return 'Clean'
  if (score >= 40) return 'Getting Messy'
  return 'Needs Attention'
}

export function getHealthClass(score) {
  if (score >= 70) return 'health-good'
  if (score >= 40) return 'health-warn'
  return 'health-bad'
}
