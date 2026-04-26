import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Eye, EyeOff, Zap, Lock, Terminal } from 'lucide-react'

const BOOT_LINES = [
  '> Initializing PrivacyGuard OS v3.1.4...',
  '> Loading threat intelligence modules...',
  '> Establishing encrypted channel...',
  '> System ready.',
]

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus]     = useState('idle') // idle | loading | error
  const [bootDone, setBootDone] = useState(false)

  // Boot sequence finishes quickly
  useState(() => {
    const t = setTimeout(() => setBootDone(true), 800)
    return () => clearTimeout(t)
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setStatus('error')
      return
    }
    setStatus('loading')
    await new Promise(r => setTimeout(r, 900))
    onLogin('logged_in')
  }

  const handleGuest = () => onLogin('guest')

  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen bg-pg-bg grid-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pg-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-pg-violet/5 rounded-full blur-3xl pointer-events-none" />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 font-mono text-pg-muted text-xs opacity-50 select-none">
        <div>SYS:PRIVACYGUARD</div>
        <div>VER:3.1.4-STABLE</div>
        <div>STATUS:ONLINE</div>
      </div>
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-pg-safe animate-pulse" />
        <span className="font-mono text-xs text-pg-safe">SECURE</span>
      </div>

      {/* Boot terminal */}
      <AnimatePresence>
        {!bootDone && (
          <motion.div
            className="absolute inset-0 bg-pg-bg flex flex-col items-start justify-center p-12 z-20 font-mono"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {BOOT_LINES.map((line, i) => (
              <motion.p
                key={i}
                className="text-pg-cyan text-sm mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.18 }}
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate={bootDone ? 'show' : 'hidden'}
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 relative"
               style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(6,182,212,0.3)' }}>
            <Shield className="w-10 h-10 text-pg-cyan glow-text-cyan" strokeWidth={1.5} />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-pg-safe border-2 border-pg-bg animate-pulse" />
          </div>
          <h1 className="font-display text-4xl font-black tracking-wider text-pg-text mb-2 glow-text-cyan">
            PRIVACYGUARD
          </h1>
          <p className="font-body text-pg-sub text-sm tracking-wide">
            AI-Powered Data Privacy Intelligence Terminal
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="pg-card p-8"
          style={{ boxShadow: '0 0 0 1px rgba(6,182,212,0.1), 0 20px 60px rgba(0,0,0,0.6)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-4 h-4 text-pg-cyan" />
            <span className="font-mono text-xs text-pg-sub uppercase tracking-widest">Authentication Protocol</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="pg-label block mb-2">Access ID (Email)</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setStatus('idle') }}
                placeholder="agent@privacyguard.io"
                className="pg-input w-full"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="pg-label block mb-2">Security Key</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setStatus('idle') }}
                  placeholder="••••••••••••"
                  className="pg-input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pg-muted hover:text-pg-cyan transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {status === 'error' && (
                <motion.p
                  className="text-pg-danger font-mono text-xs flex items-center gap-2"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  <span className="text-pg-danger">✕</span> Authentication failed. Fill in all fields.
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="pg-btn-primary w-full flex items-center justify-center gap-2 mt-2"
              disabled={status === 'loading'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {status === 'loading' ? (
                <>
                  <motion.span
                    className="w-4 h-4 border-2 border-pg-bg border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  ACCESS SECURE TERMINAL
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pg-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-pg-card px-3 text-pg-muted text-xs font-mono">OR</span>
            </div>
          </div>

          <motion.button
            onClick={handleGuest}
            className="w-full mt-4 py-3 rounded-lg border border-pg-border text-pg-sub font-body text-sm
                       hover:border-pg-violet/50 hover:text-pg-text hover:bg-pg-violet/5
                       transition-all duration-200 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="w-4 h-4 text-pg-violet" />
            Skip Login — Guest Mode
          </motion.button>
        </motion.div>

        <motion.p variants={itemVariants} className="text-center font-mono text-xs text-pg-muted mt-6 opacity-60">
          Guest mode disables Data Sanitizer & Encrypted Vault
        </motion.p>
      </motion.div>
    </div>
  )
}
