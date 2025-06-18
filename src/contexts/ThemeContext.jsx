import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [systemPreference, setSystemPreference] = useState('light')

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light')

    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference')
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = theme === 'system' ? systemPreference : theme
    
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme, systemPreference])

  const changeTheme = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('theme-preference', newTheme)
  }

  const getEffectiveTheme = () => {
    return theme === 'system' ? systemPreference : theme
  }

  const value = {
    theme,
    effectiveTheme: getEffectiveTheme(),
    systemPreference,
    changeTheme,
    themes: [
      { id: 'light', label: 'Light', icon: '☀️' },
      { id: 'dark', label: 'Dark', icon: '🌙' },
      { id: 'system', label: 'System', icon: '💻' }
    ]
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
