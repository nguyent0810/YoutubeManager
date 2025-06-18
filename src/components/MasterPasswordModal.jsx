import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { masterPasswordService } from '../services/master-password-service'
import toast from 'react-hot-toast'

const MasterPasswordModal = ({ isOpen, onAuthenticated, onSkip }) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login' or 'setup'
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(null)

  useEffect(() => {
    if (isOpen) {
      // Check if master password exists
      const hasPassword = masterPasswordService.hasMasterPassword()
      setMode(hasPassword ? 'login' : 'setup')
      setPassword('')
      setConfirmPassword('')
    }
  }, [isOpen])

  useEffect(() => {
    if (mode === 'setup' && password) {
      setPasswordStrength(masterPasswordService.getPasswordStrength(password))
    }
  }, [password, mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'setup') {
        // Setting up new master password
        if (password !== confirmPassword) {
          toast.error('Passwords do not match')
          setIsLoading(false)
          return
        }

        if (password.length < 6) {
          toast.error('Password must be at least 6 characters long')
          setIsLoading(false)
          return
        }

        await masterPasswordService.setMasterPassword(password)
        toast.success('Master password set successfully!')
        onAuthenticated()
      } else {
        // Verifying existing master password
        const isValid = await masterPasswordService.verifyMasterPassword(password)
        
        if (isValid) {
          toast.success('Welcome back!')
          onAuthenticated()
        } else {
          toast.error('Incorrect password')
          setPassword('')
        }
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    if (mode === 'setup') {
      onSkip()
    } else {
      // For existing users, skipping means starting fresh
      if (confirm('This will clear all existing data and start fresh. Are you sure?')) {
        onSkip()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'setup' ? 'Set Master Password' : 'Master Password Required'}
            </h2>
            <p className="text-gray-600 mt-2">
              {mode === 'setup' 
                ? 'Protect your YouTube channel data with a master password'
                : 'Enter your master password to access existing channel data'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'setup' ? 'Create Master Password' : 'Master Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                  placeholder="Enter password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Setup mode only) */}
            {mode === 'setup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}

            {/* Password Strength (Setup mode only) */}
            {mode === 'setup' && passwordStrength && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Password Strength:</span>
                  <span className={`text-sm font-medium ${
                    passwordStrength.score >= 4 ? 'text-green-600' :
                    passwordStrength.score >= 3 ? 'text-yellow-600' :
                    passwordStrength.score >= 2 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {passwordStrength.level}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength.score >= 4 ? 'bg-green-500' :
                      passwordStrength.score >= 3 ? 'bg-yellow-500' :
                      passwordStrength.score >= 2 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {mode === 'setup' ? 'Skip (No Protection)' : 'Start Fresh'}
              </button>
              <button
                type="submit"
                disabled={isLoading || (mode === 'setup' && password !== confirmPassword)}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    {mode === 'setup' ? 'Set Password' : 'Unlock'}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                {mode === 'setup' ? (
                  <>
                    <strong>Important:</strong> This password protects your YouTube channel data. 
                    If you forget it, you'll need to start fresh with new data.
                  </>
                ) : (
                  <>
                    <strong>Forgot your password?</strong> Click "Start Fresh" to clear all data 
                    and begin with a clean slate.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterPasswordModal
