import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Shield, Sparkles } from 'lucide-react'
import { callGeminiChat } from './Dashboard'

const QUICK_QUESTIONS = [
  'What is the biggest risk here?',
  'How do I revoke permissions?',
  'Is my data sold to third parties?',
  'What does GDPR say about this?',
]

const BOT_INTRO = "Hi! I'm PrivacyGuard AI. I can answer questions about data privacy or help you understand the current scan results. What would you like to know?"

export default function ChatBot({ scanContext }) {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', text: BOT_INTRO }])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const endRef  = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  const send = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const reply = await callGeminiChat(q, scanContext)
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `⚠ Error: ${err.message}. Check your VITE_GEMINI_API_KEY environment variable.`,
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
        style={{
          background: open
            ? 'rgba(239,68,68,0.15)'
            : 'linear-gradient(135deg, rgba(6,182,212,0.9), rgba(139,92,246,0.9))',
          border: open ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: open ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 24px rgba(6,182,212,0.4), 0 8px 24px rgba(0,0,0,0.5)',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={open ? {} : { y: [0, -4, 0] }}
        transition={open ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x"   initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-5 h-5 text-pg-danger" />
              </motion.span>
            : <motion.span key="msg" initial={{ rotate: 90, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageSquare className="w-5 h-5 text-white" />
              </motion.span>
          }
        </AnimatePresence>
        {/* Unread indicator */}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-pg-safe rounded-full border-2 border-pg-bg animate-pulse" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] flex flex-col rounded-2xl overflow-hidden"
            style={{
              height: '500px',
              background: 'rgba(17,17,19,0.97)',
              border: '1px solid rgba(6,182,212,0.2)',
              boxShadow: '0 0 0 1px rgba(6,182,212,0.08), 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(6,182,212,0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-pg-border/50 flex-shrink-0"
                 style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.06), rgba(139,92,246,0.06))' }}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pg-cyan/20 to-pg-violet/20 border border-pg-cyan/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-pg-cyan" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-xs tracking-widest text-pg-text">PRIVACYGUARD AI</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-pg-safe animate-pulse" />
                  <span className="font-mono text-[9px] text-pg-safe">ONLINE</span>
                  {scanContext && (
                    <span className="font-mono text-[9px] text-pg-cyan ml-2">
                      · Analyzing: {scanContext.appName}
                    </span>
                  )}
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-pg-violet/60" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-pg-cyan/10 border border-pg-cyan/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Shield className="w-3 h-3 text-pg-cyan" />
                    </div>
                  )}
                  <div
                    className="max-w-[78%] px-3 py-2 rounded-xl font-body text-xs leading-relaxed"
                    style={msg.role === 'user'
                      ? { background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: '#e4e4e7' }
                      : msg.isError
                      ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }
                      : { background: 'rgba(39,39,42,0.8)', border: '1px solid rgba(63,63,70,0.5)', color: '#a1a1aa' }
                    }
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="w-6 h-6 rounded-lg bg-pg-cyan/10 border border-pg-cyan/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Shield className="w-3 h-3 text-pg-cyan" />
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-pg-surface border border-pg-border flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-pg-cyan"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick questions (only show if no user messages yet) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-col gap-1">
                <p className="font-mono text-[9px] text-pg-muted uppercase tracking-widest mb-1">Quick questions</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="font-body text-[10px] px-2 py-1 rounded-lg border border-pg-border text-pg-muted
                                 hover:border-pg-cyan/40 hover:text-pg-cyan transition-all duration-150"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-pg-border/50 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about data privacy..."
                disabled={loading}
                className="flex-1 bg-pg-surface border border-pg-border rounded-xl px-3 py-2
                           text-pg-text placeholder-pg-muted font-body text-xs
                           focus:outline-none focus:border-pg-cyan/50 focus:ring-1 focus:ring-pg-cyan/20
                           disabled:opacity-50 transition-all duration-200"
              />
              <motion.button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)'
                    : 'rgba(39,39,42,0.8)',
                  boxShadow: input.trim() && !loading ? '0 0 12px rgba(6,182,212,0.4)' : 'none',
                }}
                whileHover={{ scale: input.trim() ? 1.08 : 1 }}
                whileTap={{ scale: 0.92 }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
