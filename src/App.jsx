import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import VideoUpload from './components/VideoUpload'
import BulkUpload from './components/BulkUpload'
import VideoManager from './components/VideoManager'
import Analytics from './components/Analytics'
import Comments from './components/Comments'
import Settings from './components/Settings'
import Login from './components/Login'
import Debug from './components/Debug'
import ContentCalendar from './components/ContentCalendar'

// Services
import { AuthProvider, useAuth } from './services/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { themeService } from './services/theme-service'
import { settingsIntegration } from './services/settings-integration'

function AppContent() {
  const { isAuthenticated, loading, accounts, activeAccount } = useAuth()
  const themeContext = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Initialize settings integration
  useEffect(() => {
    if (isAuthenticated) {
      settingsIntegration.registerThemeContext(themeContext)
      settingsIntegration.init()
    }
  }, [isAuthenticated, themeContext])



  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-youtube-red"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<VideoUpload />} />
            <Route path="/bulk-upload" element={<BulkUpload />} />
            <Route path="/videos" element={<VideoManager />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/calendar" element={<ContentCalendar />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/debug" element={<Debug />} />
          </Routes>
        </main>
      </div>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#4aed88',
            },
          },
        }}
      />
    </div>
  )
}

function App() {
  // Initialize theme service
  useEffect(() => {
    themeService.init()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
