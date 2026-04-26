import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Search, AlertTriangle, CheckCircle, AlertCircle,
  MapPin, Users, Globe, Fingerprint, Mic, Camera, CreditCard, Heart,
  LogOut, User, Zap, ChevronRight, ExternalLink, RefreshCw,
  Database, Wrench, Package
} from 'lucide-react'
import DataSanitizer from './DataSanitizer'
import EncryptedVault from './EncryptedVault'
import ChatBot from './ChatBot'

// ─── Config ────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`

const PROCESSING_STEPS = [
  { text: 'Initializing privacy scanner...', icon: '⚙' },
  { text: 'Scanning data exposure vectors...', icon: '🔍' },
  { text: 'Evaluating risk coefficients...', icon: '⚡' },
  { text: 'Generating intelligence report...', icon: '📊' },
]

const EXPOSURE_TYPES = [
  { id: 'Location',    Icon: MapPin,      color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  { id: 'Contacts',   Icon: Users,       color: '#f97316', glow: 'rgba(249,115,22,0.4)' },
  { id: 'Browsing',   Icon: Globe,       color: '#eab308', glow: 'rgba(234,179,8,0.4)' },
  { id: 'Identifiers',Icon: Fingerprint, color: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
  { id: 'Microphone', Icon: Mic,         color: '#ec4899', glow: 'rgba(236,72,153,0.4)' },
  { id: 'Camera',     Icon: Camera,      color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { id: 'Financial',  Icon: CreditCard,  color: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
  { id: 'Health',     Icon: Heart,       color: '#f87171', glow: 'rgba(248,113,113,0.4)' },
]

const RISK_CFG = {
  low:    { label: 'LOW RISK',    color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)',   glow: '0 0 20px rgba(34,197,94,0.4)',   emoji: '✅' },
  medium: { label: 'MEDIUM RISK', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', glow: '0 0 20px rgba(245,158,11,0.4)', emoji: '⚠️' },
  high:   { label: 'HIGH RISK',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  glow: '0 0 20px rgba(239,68,68,0.5)',  emoji: '🚨' },
}

// ─── Demo Hardcoded Data ────────────────────────────────────────────────────────
const DEMO_DATA = {
  appName: 'TikTok',
  riskLevel: 'high',
  summary: 'TikTok collects an alarming breadth of personal data including precise GPS location, keystroke patterns, clipboard contents, device identifiers, and biometric face/voice data. This data is shared with ByteDance servers in China, raising critical national security concerns flagged by multiple government bodies. The breadth of permissions requested far exceeds what is needed for a short-form video platform.',
  exposureMap: ['Location', 'Contacts', 'Browsing', 'Identifiers', 'Microphone', 'Camera'],
  fixes: [
    { title: 'Revoke Location Access', description: 'Settings → Privacy → Location Services → TikTok → Set to "Never". Eliminates precise GPS tracking.' },
    { title: 'Disable Microphone', description: 'Settings → Privacy & Security → Microphone → Toggle TikTok off. Prevents passive audio capture.' },
    { title: 'Reset Ad Identifier', description: 'Settings → Privacy → Tracking → Disable for TikTok. Then reset your Advertising ID in Settings → Privacy → Apple Advertising.' },
    { title: 'Restrict Background Activity', description: 'Settings → General → Background App Refresh → TikTok → Off. Stops data collection when the app is closed.' },
    { title: 'Audit Data Download', description: 'TikTok Settings → Privacy → Personalization & Data → Download your data to see exactly what they have collected on you.' },
  ],
  alternatives: [
    { name: 'YouTube Shorts', description: "Google's short-form video platform embedded in YouTube", reason: 'Transparent data policies, US-based infrastructure, robust privacy controls, and no cross-border data transfer concerns.' },
    { name: 'Instagram Reels', description: "Meta's short video feed integrated with Instagram", reason: 'US-based data storage with GDPR/CCPA compliance, clearer opt-out mechanisms for ad data.' },
    { name: 'Clapper', description: 'Privacy-first TikTok alternative launched 2020', reason: 'Minimal data collection, US-only servers, no tracking pixels, built for content creators who prioritize privacy.' },
  ],
}

// ─── Gemini API Calls ──────────────────────────────────────────────────────────
async function callGeminiScan(input) {
  const prompt = `You are a senior data privacy analyst. Analyze the following app, service URL, or privacy policy text for data privacy risks.

Return ONLY valid raw JSON — no markdown, no code fences, no explanation — with exactly this structure:
{
  "riskLevel": "low" | "medium" | "high",
  "summary": "2-3 sentence plain-English TL;DR of the privacy risks",
  "exposureMap": [],
  "fixes": [{"title": "string", "description": "string"}],
  "alternatives": [{"name": "string", "description": "string", "reason": "string"}]
}

Rules:
- "exposureMap" must only contain values from this exact list: Location, Contacts, Browsing, Identifiers, Microphone, Camera, Financial, Health
- "fixes" should have 3-5 actionable, specific items
- "alternatives" should have 2-3 items with privacy-first options
- Be honest and accurate

Input to analyze: ${input}`

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 120)}`)
  }
  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('Empty response from Gemini API')
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  return JSON.parse(cleaned)
}

export async function callGeminiChat(question, context) {
  const ctx = context
    ? `Current analysis context:\n• App: ${context.appName || 'Unknown'}\n• Risk: ${context.riskLevel || 'unknown'}\n• Summary: ${context.summary || 'N/A'}\n• Exposed data: ${context.exposureMap?.join(', ') || 'none identified'}`
    : 'No scan context yet — the user has not scanned any app.'

  const prompt = `You are PrivacyGuard AI, a concise, expert data privacy assistant. ${ctx}

User question: ${question}

Answer in 2-4 sentences. Be specific, practical, and skip filler phrases.`

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate response.'
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function saveToVault(result) {
  try {
    const raw = localStorage.getItem('pg_vault') || '[]'
    const vault = JSON.parse(raw)
    vault.unshift({ ...result, savedAt: Date.now() })
    localStorage.setItem('pg_vault', JSON.stringify(vault.slice(0, 20)))
  } catch { /* silent */ }
}

function computeAdjustedRisk(base, exposureMap, disabled) {
  const active = (exposureMap || []).filter(e => !disabled.has(e)).length
  if (active === 0) return 'low'
  if (active <= 2) return 'low'
  if (active <= 4) return 'medium'
  return base === 'low' ? 'low' : base === 'medium' ? 'medium' : 'high'
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function RiskBadge({ level }) {
  const cfg = RISK_CFG[level] || RISK_CFG.medium
  return (
    <motion.div
      key={level}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      className="inline-flex items-center gap-3 px-5 py-3 rounded-xl font-display font-bold text-sm tracking-widest uppercase"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        boxShadow: cfg.glow,
      }}
    >
      <span className="text-base">{cfg.emoji}</span>
      {cfg.label}
    </motion.div>
  )
}

function ExposureCard({ type, isActive, isDisabled, onToggle }) {
  const { Icon, color, glow } = type
  return (
    <motion.div
      layout
      className="relative rounded-xl p-4 cursor-pointer select-none"
      style={{
        background: isActive && !isDisabled
          ? `radial-gradient(circle at 30% 30%, ${color}18, ${color}06)`
          : 'rgba(24,24,27,0.8)',
        border: `1px solid ${isActive && !isDisabled ? color + '50' : '#27272a'}`,
        boxShadow: isActive && !isDisabled ? `0 0 16px ${glow}` : 'none',
        opacity: isActive && isDisabled ? 0.5 : 1,
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => isActive && onToggle(type.id)}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: isActive && !isDisabled ? `${color}20` : 'rgba(63,63,70,0.4)',
          }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: isActive && !isDisabled ? color : '#71717a' }}
            strokeWidth={1.8}
          />
        </div>
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5"
            onClick={e => { e.stopPropagation(); onToggle(type.id) }}
          >
            <span className="text-[10px] font-mono" style={{ color: isDisabled ? '#71717a' : color }}>
              {isDisabled ? 'OFF' : 'ON'}
            </span>
            <div className="relative w-8 h-4 rounded-full transition-colors duration-200"
                 style={{ background: isDisabled ? '#3f3f46' : color }}>
              <div className="absolute top-0.5 w-3 h-3 bg-pg-bg rounded-full shadow transition-transform duration-200"
                   style={{ transform: isDisabled ? 'translateX(2px)' : 'translateX(18px)' }} />
            </div>
          </motion.div>
        )}
      </div>
      <p className="font-mono text-xs font-semibold tracking-wide"
         style={{ color: isActive && !isDisabled ? color : '#71717a' }}>
        {type.id}
      </p>
      {isActive && !isDisabled && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-mono mt-0.5 block"
          style={{ color: color + 'aa' }}
        >
          EXPOSED
        </motion.span>
      )}
      {isActive && isDisabled && (
        <span className="text-[10px] font-mono mt-0.5 block text-pg-muted">BLOCKED</span>
      )}
      {!isActive && (
        <span className="text-[10px] font-mono mt-0.5 block text-pg-muted/50">CLEAN</span>
      )}
    </motion.div>
  )
}

function FixCard({ fix, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex gap-3 p-4 rounded-xl bg-pg-surface border border-pg-border
                 hover:border-pg-cyan/30 hover:bg-pg-cyan/5 transition-all duration-200 group"
    >
      <div className="w-6 h-6 rounded-lg bg-pg-cyan/10 border border-pg-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Wrench className="w-3 h-3 text-pg-cyan" />
      </div>
      <div>
        <p className="font-mono text-xs font-semibold text-pg-text mb-1 group-hover:text-pg-cyan transition-colors">
          {fix.title}
        </p>
        <p className="font-body text-xs text-pg-sub leading-relaxed">{fix.description}</p>
      </div>
    </motion.div>
  )
}

function AltCard({ alt, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-xl bg-pg-surface border border-pg-border
                 hover:border-pg-violet/30 hover:bg-pg-violet/5 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pg-violet/10 border border-pg-violet/20 flex items-center justify-center">
            <Package className="w-3 h-3 text-pg-violet" />
          </div>
          <p className="font-mono text-xs font-bold text-pg-text group-hover:text-pg-violet transition-colors">
            {alt.name}
          </p>
        </div>
        <ExternalLink className="w-3 h-3 text-pg-muted group-hover:text-pg-violet transition-colors" />
      </div>
      <p className="font-body text-xs text-pg-sub leading-relaxed mb-1">{alt.description}</p>
      <p className="font-mono text-[10px] text-pg-violet/70">✓ {alt.reason}</p>
    </motion.div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ user, onLogout }) {
  const [scanInput,    setScanInput]    = useState('')
  const [phase,        setPhase]        = useState('idle')   // idle | processing | done | error
  const [procStep,     setProcStep]     = useState(0)
  const [scanResult,   setScanResult]   = useState(null)
  const [disabled,     setDisabled]     = useState(new Set())
  const [errorMsg,     setErrorMsg]     = useState('')
  const [sideTab,      setSideTab]      = useState('sanitizer')
  const [vaultRefresh, setVaultRefresh] = useState(0)

  const isGuest     = user === 'guest'
  const adjustedRisk = scanResult
    ? computeAdjustedRisk(scanResult.riskLevel, scanResult.exposureMap, disabled)
    : null

  const toggleExposure = useCallback((id) => {
    setDisabled(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const runScan = async () => {
    const trimmed = scanInput.trim()
    if (!trimmed) return

    setPhase('processing')
    setProcStep(0)
    setDisabled(new Set())
    setErrorMsg('')

    // Step ticker
    let step = 0
    const ticker = setInterval(() => {
      step += 1
      if (step < PROCESSING_STEPS.length) setProcStep(step)
      else clearInterval(ticker)
    }, 500)

    // Demo shortcut
    if (trimmed === 'DEMO_CRASH') {
      await new Promise(r => setTimeout(r, 2100))
      clearInterval(ticker)
      const result = { ...DEMO_DATA, appName: 'TikTok' }
      setScanResult(result)
      setPhase('done')
      saveToVault(result)
      setVaultRefresh(v => v + 1)
      return
    }

    try {
      const [result] = await Promise.all([
        callGeminiScan(trimmed),
        new Promise(r => setTimeout(r, 2100)),
      ])
      clearInterval(ticker)
      const enriched = { ...result, appName: trimmed.slice(0, 40) }
      setScanResult(enriched)
      setPhase('done')
      saveToVault(enriched)
      setVaultRefresh(v => v + 1)
    } catch (err) {
      clearInterval(ticker)
      setErrorMsg(err.message)
      setPhase('error')
    }
  }

  const resetScan = () => {
    setPhase('idle')
    setScanResult(null)
    setScanInput('')
    setDisabled(new Set())
    setErrorMsg('')
  }

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } },
    item: {
      hidden: { opacity: 0, y: 20 },
      show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    },
  }

  return (
    <div className="min-h-screen bg-pg-bg grid-bg flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-pg-bg/90 backdrop-blur-md border-b border-pg-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-pg-cyan" strokeWidth={1.5} />
            <span className="font-display font-bold text-base tracking-widest text-pg-text glow-text-cyan">
              PRIVACYGUARD
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-pg-muted border border-pg-border rounded px-1.5 py-0.5">
              v3.1.4
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isGuest && (
              <span className="font-mono text-[10px] text-pg-warn border border-pg-warn/30 bg-pg-warn/10 rounded px-2 py-1">
                GUEST MODE
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pg-violet/20 border border-pg-violet/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-pg-violet" />
              </div>
              <span className="hidden sm:block font-mono text-xs text-pg-sub">
                {isGuest ? 'guest@anon' : user}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pg-border
                         text-pg-muted hover:text-pg-danger hover:border-pg-danger/40 transition-all duration-200 text-xs font-mono"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN (2/3) ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* ─ Input Hub ─ */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="pg-card p-6"
              style={{ boxShadow: '0 0 0 1px rgba(6,182,212,0.08), 0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 rounded-full bg-pg-cyan" />
                <span className="font-display font-semibold text-sm tracking-widest text-pg-text uppercase">
                  Universal Input Hub
                </span>
                <span className="ml-auto font-mono text-[10px] text-pg-muted border border-pg-border rounded px-1.5 py-0.5">
                  TIP: type <span className="text-pg-cyan">DEMO_CRASH</span> for instant demo
                </span>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runScan() }}
                  placeholder="Paste an app name (e.g. TikTok), URL (e.g. https://tiktok.com/privacy), or raw privacy policy text..."
                  rows={3}
                  className="pg-input flex-1 resize-none text-sm"
                  disabled={phase === 'processing'}
                />
                <div className="flex flex-col gap-2">
                  <motion.button
                    onClick={runScan}
                    disabled={phase === 'processing' || !scanInput.trim()}
                    className="pg-btn-primary flex items-center gap-2 whitespace-nowrap"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {phase === 'processing' ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.span>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    SCAN
                  </motion.button>
                  {phase === 'done' && (
                    <motion.button
                      onClick={resetScan}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pg-btn-secondary text-xs flex items-center gap-1 justify-center"
                      whileTap={{ scale: 0.95 }}
                    >
                      <RefreshCw className="w-3 h-3" /> Reset
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.section>

            {/* ─ Processing Animation ─ */}
            <AnimatePresence mode="wait">
              {phase === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="pg-card p-8 scan-line-container"
                  style={{ boxShadow: '0 0 0 1px rgba(6,182,212,0.2), 0 0 40px rgba(6,182,212,0.05)' }}
                >
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-pg-cyan/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        className="absolute inset-2 rounded-full border-2 border-t-pg-cyan border-r-transparent border-b-transparent border-l-transparent"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-pg-cyan" strokeWidth={1.5} />
                      </div>
                    </div>

                    <div className="space-y-3 w-full max-w-sm">
                      {PROCESSING_STEPS.map((step, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: i <= procStep ? 1 : 0.25, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <motion.div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: i < procStep ? '#22c55e' : i === procStep ? '#06b6d4' : '#3f3f46' }}
                            animate={i === procStep ? { scale: [1, 1.4, 1] } : {}}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          />
                          <span className="font-mono text-sm" style={{ color: i === procStep ? '#06b6d4' : i < procStep ? '#a1a1aa' : '#3f3f46' }}>
                            {step.text}
                          </span>
                          {i < procStep && (
                            <CheckCircle className="w-3.5 h-3.5 text-pg-safe ml-auto flex-shrink-0" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─ Error ─ */}
              {phase === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pg-card p-6 border-pg-danger/30 bg-pg-danger/5"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-pg-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display font-bold text-sm text-pg-danger mb-1 tracking-wide">SCAN ERROR</p>
                      <p className="font-mono text-xs text-pg-sub break-all">{errorMsg}</p>
                      <p className="font-mono text-xs text-pg-muted mt-2">
                        Check your VITE_GEMINI_API_KEY or try typing <span className="text-pg-cyan">DEMO_CRASH</span> to see a demo.
                      </p>
                    </div>
                  </div>
                  <button onClick={resetScan} className="pg-btn-secondary mt-4 text-xs">Try Again</button>
                </motion.div>
              )}

              {/* ─ Results ─ */}
              {phase === 'done' && scanResult && (
                <motion.div
                  key="results"
                  variants={stagger.container}
                  initial="hidden"
                  animate="show"
                  className="space-y-5"
                >
                  {/* Risk Score Banner */}
                  <motion.div variants={stagger.item} className="pg-card p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <p className="pg-label mb-2">Threat Assessment — {scanResult.appName}</p>
                        <RiskBadge level={adjustedRisk} />
                        {disabled.size > 0 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-mono text-[11px] text-pg-cyan mt-2"
                          >
                            ↑ Risk reduced: {disabled.size} data type{disabled.size > 1 ? 's' : ''} blocked by you
                          </motion.p>
                        )}
                      </div>
                      {/* Mini gauge bars */}
                      <div className="flex gap-1 items-end h-10">
                        {['low', 'medium', 'high'].map((lvl, i) => {
                          const heights = [30, 60, 100]
                          const active = ['low','medium','high'].indexOf(adjustedRisk) >= i
                          const colors = ['#22c55e', '#f59e0b', '#ef4444']
                          return (
                            <motion.div
                              key={lvl}
                              className="w-4 rounded-t"
                              style={{ height: `${heights[i]}%`, background: active ? colors[i] : '#27272a', boxShadow: active ? `0 0 8px ${colors[i]}60` : 'none' }}
                              initial={{ scaleY: 0, originY: 1 }}
                              animate={{ scaleY: 1 }}
                              transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* Summary */}
                  <motion.div variants={stagger.item} className="pg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-5 rounded-full bg-pg-violet" />
                      <span className="pg-label">Intelligence Summary</span>
                    </div>
                    <p className="font-body text-sm text-pg-sub leading-relaxed">{scanResult.summary}</p>
                  </motion.div>

                  {/* Exposure Map */}
                  <motion.div variants={stagger.item} className="pg-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-pg-danger" />
                        <span className="pg-label">Data Exposure Map</span>
                      </div>
                      <span className="font-mono text-xs text-pg-muted">Toggle active cards to reduce risk score</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {EXPOSURE_TYPES.map((type, i) => {
                        const isActive   = (scanResult.exposureMap || []).includes(type.id)
                        const isDisabled = disabled.has(type.id)
                        return (
                          <motion.div
                            key={type.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 22 }}
                          >
                            <ExposureCard
                              type={type}
                              isActive={isActive}
                              isDisabled={isDisabled}
                              onToggle={toggleExposure}
                            />
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Fixes */}
                  {scanResult.fixes?.length > 0 && (
                    <motion.div variants={stagger.item} className="pg-card p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-5 rounded-full bg-pg-cyan" />
                        <span className="pg-label">Actionable Fixes</span>
                        <span className="ml-auto font-mono text-[10px] text-pg-muted border border-pg-border rounded px-1.5 py-0.5">
                          {scanResult.fixes.length} ACTIONS
                        </span>
                      </div>
                      <div className="space-y-2">
                        {scanResult.fixes.map((fix, i) => (
                          <FixCard key={i} fix={fix} index={i} />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Alternatives */}
                  {scanResult.alternatives?.length > 0 && (
                    <motion.div variants={stagger.item} className="pg-card p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-5 rounded-full bg-pg-violet" />
                        <span className="pg-label">Privacy-First Alternatives</span>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {scanResult.alternatives.map((alt, i) => (
                          <AltCard key={i} alt={alt} index={i} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ─ Idle placeholder ─ */}
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pg-card p-12 flex flex-col items-center justify-center text-center"
                  style={{ minHeight: 300 }}
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Shield className="w-14 h-14 text-pg-muted mx-auto mb-4" strokeWidth={1} />
                  </motion.div>
                  <p className="font-display font-bold text-lg text-pg-muted tracking-widest mb-2">AWAITING INPUT</p>
                  <p className="font-body text-sm text-pg-muted/60 max-w-xs">
                    Enter an app name, URL, or paste a privacy policy above and hit Scan to begin analysis.
                  </p>
                  <div className="mt-6 flex gap-2 flex-wrap justify-center">
                    {['TikTok', 'WhatsApp', 'Google', 'Facebook', 'DEMO_CRASH'].map(example => (
                      <motion.button
                        key={example}
                        onClick={() => setScanInput(example)}
                        className="font-mono text-xs px-3 py-1.5 rounded-lg border border-pg-border
                                   text-pg-muted hover:text-pg-cyan hover:border-pg-cyan/40 transition-all duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={example === 'DEMO_CRASH' ? { borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' } : {}}
                      >
                        {example === 'DEMO_CRASH' ? '⚡ ' : ''}{example}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT COLUMN (1/3) ── */}
          <div className="xl:col-span-1 space-y-4">
            {/* Tab switcher */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
              className="flex gap-1 p-1 rounded-xl bg-pg-surface border border-pg-border"
            >
              {[
                { id: 'sanitizer', label: 'Sanitizer', icon: Database },
                { id: 'vault',     label: 'Vault',     icon: Shield },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSideTab(id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all duration-200"
                  style={{
                    background: sideTab === id ? 'rgba(6,182,212,0.12)' : 'transparent',
                    color:      sideTab === id ? '#06b6d4' : '#71717a',
                    border:     sideTab === id ? '1px solid rgba(6,182,212,0.25)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {sideTab === 'sanitizer' && (
                <motion.div
                  key="sanitizer"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DataSanitizer locked={isGuest} />
                </motion.div>
              )}
              {sideTab === 'vault' && (
                <motion.div
                  key="vault"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <EncryptedVault locked={isGuest} refresh={vaultRefresh} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── Floating Chatbot ── */}
      <ChatBot scanContext={scanResult} />
    </div>
  )
}
