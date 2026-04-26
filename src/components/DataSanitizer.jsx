import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eraser, Copy, Check, AlertTriangle } from 'lucide-react'

// ─── PII Regex Patterns ────────────────────────────────────────────────────────
const PATTERNS = [
  {
    id: 'email',
    label: 'Email Addresses',
    color: '#ef4444',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  },
  {
    id: 'phone',
    label: 'Phone Numbers',
    color: '#f97316',
    regex: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  },
  {
    id: 'ssn',
    label: 'Social Security Numbers',
    color: '#a855f7',
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  },
  {
    id: 'credit',
    label: 'Credit Card Numbers',
    color: '#06b6d4',
    regex: /\b(?:\d[ -]?){13,16}\b/g,
  },
  {
    id: 'ipv4',
    label: 'IP Addresses',
    color: '#eab308',
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
]

function sanitizeText(input) {
  if (!input) return { output: '', counts: {} }
  let output = input
  const counts = {}
  for (const pattern of PATTERNS) {
    const matches = output.match(new RegExp(pattern.regex.source, 'g')) || []
    counts[pattern.id] = matches.length
    output = output.replace(new RegExp(pattern.regex.source, 'g'), `[REDACTED:${pattern.id.toUpperCase()}]`)
  }
  return { output, counts }
}

export default function DataSanitizer({ locked }) {
  const [input,   setInput]   = useState('')
  const [copied,  setCopied]  = useState(false)

  const { output, counts } = useMemo(() => sanitizeText(input), [input])

  const totalRedacted = Object.values(counts).reduce((s, c) => s + c, 0)

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sampleText = `Contact John at john.doe@example.com or call (555) 867-5309.
His SSN is 123-45-6789 and CC number 4532 1234 5678 9012.
Office IP: 192.168.1.100. Alternate: jane.smith@corp.io`

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
          <p className="font-display font-bold text-sm text-pg-violet tracking-widest">FEATURE LOCKED</p>
          <p className="font-body text-xs text-pg-sub text-center max-w-xs px-4 leading-relaxed">
            Data Sanitizer is available for registered users only.
          </p>
          <div className="font-mono text-[10px] text-pg-muted border border-pg-border rounded px-3 py-1.5">
            Login to unlock full access
          </div>
        </motion.div>
      )}

      <div className={`pg-card p-5 ${locked ? 'pointer-events-none select-none min-h-[400px]' : ''}`}
           style={locked ? { filter: 'blur(3px)' } : {}}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-pg-cyan" />
            <span className="pg-label">Data Sanitizer</span>
          </div>
          <Eraser className="w-4 h-4 text-pg-muted" />
        </div>

        {/* Pattern legend */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PATTERNS.map(p => (
            <span
              key={p.id}
              className="flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded border"
              style={{ color: p.color, borderColor: p.color + '40', background: p.color + '10' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
              {p.id.toUpperCase()}
              {counts[p.id] > 0 && <span className="font-bold">×{counts[p.id]}</span>}
            </span>
          ))}
        </div>

        {/* Input pane */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-pg-muted uppercase tracking-widest">INPUT</span>
            <button
              onClick={() => setInput(sampleText)}
              className="font-mono text-[10px] text-pg-violet/70 hover:text-pg-violet transition-colors"
            >
              Load sample
            </button>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste text containing PII (emails, phones, SSNs, credit cards...)&#10;&#10;Redaction happens in real-time."
            rows={6}
            className="pg-input w-full resize-none text-xs"
          />
        </div>

        {/* Stats bar */}
        {totalRedacted > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-pg-safe/10 border border-pg-safe/20"
          >
            <Check className="w-3.5 h-3.5 text-pg-safe flex-shrink-0" />
            <span className="font-mono text-xs text-pg-safe">
              {totalRedacted} PII item{totalRedacted > 1 ? 's' : ''} detected & redacted
            </span>
          </motion.div>
        )}

        {/* Output pane */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-pg-muted uppercase tracking-widest">SANITIZED OUTPUT</span>
            {output && (
              <motion.button
                onClick={handleCopy}
                className="flex items-center gap-1 font-mono text-[10px] text-pg-cyan hover:text-pg-text transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
            )}
          </div>
          <div
            className="w-full min-h-[100px] p-3 rounded-lg bg-pg-surface border border-pg-border font-mono text-xs text-pg-sub leading-relaxed"
            style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
          >
            {output
              ? output.split(/(\[REDACTED:[A-Z]+\])/g).map((part, i) =>
                  part.startsWith('[REDACTED:') ? (
                    <span key={i} className="inline-flex items-center gap-0.5 font-bold rounded px-1"
                          style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )
              : <span className="text-pg-muted/50 italic">Sanitized output will appear here...</span>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
