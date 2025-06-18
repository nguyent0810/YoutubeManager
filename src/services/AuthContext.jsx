import React, { createContext, useContext, useState, useEffect } from 'react'
import { youtubeAuth } from './youtube-api'
import { masterPasswordService } from './master-password-service'
import MasterPasswordModal from '../components/MasterPasswordModal'

// Expose youtubeAuth to window for debugging
if (typeof window !== 'undefined') {
  window.youtubeAuth = youtubeAuth
}

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState([])
  const [activeAccount, setActiveAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMasterPassword, setShowMasterPassword] = useState(false)
  const [masterPasswordChecked, setMasterPasswordChecked] = useState(false)

  useEffect(() => {
    checkMasterPassword()
  }, [])

  const checkMasterPassword = async () => {
    try {
      await masterPasswordService.loadMasterPassword()
      const hasExistingData = await youtubeAuth.hasExistingData()

      if (hasExistingData && masterPasswordService.hasMasterPassword()) {
        // Has data and master password - require authentication
        setShowMasterPassword(true)
      } else if (hasExistingData && !masterPasswordService.hasMasterPassword()) {
        // Has data but no master password - offer to set one
        setShowMasterPassword(true)
      } else {
        // No existing data - proceed normally
        setMasterPasswordChecked(true)
        loadAccounts()
      }
    } catch (error) {
      console.error('Error checking master password:', error)
      setMasterPasswordChecked(true)
      loadAccounts()
    }
  }

  const handleMasterPasswordAuthenticated = () => {
    setShowMasterPassword(false)
    setMasterPasswordChecked(true)
    loadAccounts()
  }

  const handleMasterPasswordSkipped = () => {
    setShowMasterPassword(false)
    setMasterPasswordChecked(true)
    // Clear existing data and start fresh
    youtubeAuth.clearAllData()
    setAccounts([])
    setActiveAccount(null)
    setLoading(false)
  }

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const savedAccounts = await youtubeAuth.loadAccounts()
      setAccounts(savedAccounts)

      // Set the first account as active if available
      if (savedAccounts.length > 0) {
        setActiveAccount(savedAccounts[0])
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAccount = async () => {
    try {
      setLoading(true)
      const result = await youtubeAuth.authenticate()

      if (result.success) {
        const newAccount = result.account

        // Check if channel already exists (by channelId, not email)
        const existingAccount = accounts.find(acc => acc.channelId === newAccount.channelId)
        if (existingAccount) {
          throw new Error('This channel is already connected')
        }

        const updatedAccounts = [...accounts, newAccount]
        console.log('Adding new account. Before:', accounts.length, 'After:', updatedAccounts.length)
        console.log('New account details:', {
          channelName: newAccount.channelName,
          email: newAccount.email,
          channelId: newAccount.channelId
        })

        setAccounts(updatedAccounts)

        // Set as active account if it's the first one
        if (accounts.length === 0) {
          setActiveAccount(newAccount)
        }

        return { success: true, account: newAccount }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Add account failed:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const removeAccount = async (channelId) => {
    try {
      await youtubeAuth.removeAccount(channelId)
      const updatedAccounts = accounts.filter(acc => acc.channelId !== channelId)
      setAccounts(updatedAccounts)

      // If removed account was active, switch to another account
      if (activeAccount?.channelId === channelId) {
        setActiveAccount(updatedAccounts.length > 0 ? updatedAccounts[0] : null)
      }

      return { success: true }
    } catch (error) {
      console.error('Remove account failed:', error)
      return { success: false, error: error.message }
    }
  }

  const switchAccount = (account) => {
    setActiveAccount(account)
  }

  const refreshActiveAccount = async () => {
    if (!activeAccount) return

    try {
      const refreshedAccount = await youtubeAuth.refreshAccount(activeAccount.channelId)
      setActiveAccount(refreshedAccount)

      // Update in accounts list
      const updatedAccounts = accounts.map(acc =>
        acc.channelId === activeAccount.channelId ? refreshedAccount : acc
      )
      setAccounts(updatedAccounts)
    } catch (error) {
      console.error('Failed to refresh account:', error)
    }
  }

  const value = {
    accounts,
    activeAccount,
    loading,
    hasAccounts: accounts.length > 0,
    isAuthenticated: accounts.length > 0,
    addAccount,
    removeAccount,
    switchAccount,
    refreshActiveAccount,
    loadAccounts,
    showMasterPassword,
    masterPasswordChecked
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <MasterPasswordModal
        isOpen={showMasterPassword}
        onAuthenticated={handleMasterPasswordAuthenticated}
        onSkip={handleMasterPasswordSkipped}
      />
    </AuthContext.Provider>
  )
}
