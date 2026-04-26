import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pg_user')
    if (stored) setUser(stored)
    setLoading(false)
  }, [])

  const handleLogin = (userType) => {
    localStorage.setItem('pg_user', userType)
    setUser(userType)
  }

  const handleLogout = () => {
    localStorage.removeItem('pg_user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pg-bg flex items-center justify-center">
        <motion.div
          className="w-3 h-3 rounded-full bg-pg-cyan"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>
    )
  }

  return (
    <div className="noise-bg">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Dashboard user={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
