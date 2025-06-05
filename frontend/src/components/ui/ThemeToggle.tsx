import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    // Fallback: OS preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  }
  return 'light'
}

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme())

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    window.localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <button
      className="w-12 h-12 rounded-full flex items-center justify-center transition border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow text-xl"
      title="Toggle dark mode"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark'
        ? <Sun className="text-yellow-300" />
        : <Moon className="text-gray-700" />
      }
    </button>
  )
}

export default ThemeToggle
