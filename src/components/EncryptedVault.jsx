import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Database, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react'

const RISK_COLOR = {
  low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)'  },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
}

function VaultEntry({ entry, index }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = RISK_COLOR[entry.riskLevel] || RISK_COLOR.medium
  const date = new Date(entry.savedAt || Date.now())
  const timeStr = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: cfg.border, background: cfg.bg }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-3 text-left hover:brightness-110 transition-all"
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-semibold truncate" style={{ color: cfg.color }}>
            {entry.appName || 'Unknown App'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="w-2.5 h-2.5 text-pg-muted" />
            <span className="font-mono text-[10px] text-pg-muted">{timeStr}</span>
          </div>
        </div>
        <span
          className="font-display font-bold text-[10px] tracking-widest px-2 py-0.5 rounded"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          {entry.riskLevel?.toUpperCase()}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3 text-pg-muted flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-pg-muted flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-pg-border/30 pt-2 space-y-2">
              <p className="font-body text-xs text-pg-sub leading-relaxed">{entry.summary}</p>
              {entry.exposureMap?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.exposureMap.map(e => (
                    <span key={e} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-pg-border/50 text-pg-muted">{e}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function EncryptedVault({ locked, refresh }) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pg_vault') || '[]'
      setEntries(JSON.parse(raw))
    } catch {
      setEntries([])
    }
  }, [refresh])

  const clearVault = () => {
    localStorage.removeItem('pg_vault')
    setEntries([])
  }

  return (
    <div className="relative">
      {/* Locked overlay */}
      {locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-overlay flex flex-col items-center justify-center gap-3 z-10 min-h-[400px]"
        >
          <div className="w-12 h-12 rounded-xl bg-pg-violet/20 border border-pg-violet/30 flex items-center justify-center"
               style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
            <Lock className="w-6 h-6 text-pg-violet" />
          </div>
          <p className="font-display font-bold text-sm text-pg-violet tracking-widest">VAULT SEALED</p>
          <p className="font-body text-xs text-pg-sub text-center max-w-xs px-4 leading-relaxed">
            The Encrypted Vault stores your scan history. Login to access it.
          </p>
          <div className="font-mono text-[10px] text-pg-muted border border-pg-border rounded px-3 py-1.5">
            Registration required
          </div>
        </motion.div>
      )}

      <div className={`pg-card p-5 ${locked ? 'pointer-events-none select-none min-h-[400px]' : ''}`}
           style={locked ? { filter: 'blur(3px)' } : {}}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-pg-violet" />
            <span className="pg-label">Encrypted Vault</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-pg-muted">
              {entries.length}/20 scans
            </span>
            {entries.length > 0 && !locked && (
              <button
                onClick={clearVault}
                className="text-pg-muted hover:text-pg-danger transition-colors"
                title="Clear all scans"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Storage bar */}
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-pg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${(entries.length / 20) * 100}%` }}
              transition={{ duration: 0.6, type: 'spring' }}
            />
          </div>
          <p className="font-mono text-[9px] text-pg-muted mt-1">localStorage usage</p>
        </div>

        {/* Entries */}
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          <AnimatePresence>
            {entries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <Database className="w-10 h-10 text-pg-muted/40 mb-3" strokeWidth={1} />
                <p className="font-mono text-xs text-pg-muted/60">No scans stored yet.</p>
                <p className="font-body text-xs text-pg-muted/40 mt-1">Run a scan to populate your vault.</p>
              </motion.div>
            ) : (
              entries.map((entry, i) => (
                <VaultEntry key={entry.savedAt || i} entry={entry} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
