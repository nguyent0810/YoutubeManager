/**
 * Master Password Service
 * Handles master password authentication to protect existing channel data
 */

export class MasterPasswordService {
  constructor() {
    this.isAuthenticated = false
    this.masterPasswordHash = null
    this.loadMasterPassword()
  }

  /**
   * Load master password hash from storage
   */
  async loadMasterPassword() {
    try {
      if (window.electronAPI && window.electronAPI.secureStore) {
        this.masterPasswordHash = await window.electronAPI.secureStore.get('master_password_hash')
      } else {
        this.masterPasswordHash = localStorage.getItem('ytm_master_password_hash')
      }
    } catch (error) {
      console.error('Failed to load master password:', error)
    }
  }

  /**
   * Check if master password is set
   */
  hasMasterPassword() {
    return !!this.masterPasswordHash
  }

  /**
   * Set master password (first time setup)
   */
  async setMasterPassword(password) {
    if (!password || password.length < 6) {
      throw new Error('Master password must be at least 6 characters long')
    }

    const hash = await this.hashPassword(password)
    
    try {
      if (window.electronAPI && window.electronAPI.secureStore) {
        await window.electronAPI.secureStore.set('master_password_hash', hash)
      } else {
        localStorage.setItem('ytm_master_password_hash', hash)
      }
      
      this.masterPasswordHash = hash
      this.isAuthenticated = true
      return true
    } catch (error) {
      console.error('Failed to set master password:', error)
      throw new Error('Failed to save master password')
    }
  }

  /**
   * Verify master password
   */
  async verifyMasterPassword(password) {
    if (!this.masterPasswordHash) {
      return false
    }

    const hash = await this.hashPassword(password)
    const isValid = hash === this.masterPasswordHash
    
    if (isValid) {
      this.isAuthenticated = true
    }
    
    return isValid
  }

  /**
   * Hash password using Web Crypto API
   */
  async hashPassword(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'ytm_salt_2024') // Add salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated() {
    return this.isAuthenticated
  }

  /**
   * Logout (clear authentication)
   */
  logout() {
    this.isAuthenticated = false
  }

  /**
   * Change master password
   */
  async changeMasterPassword(oldPassword, newPassword) {
    if (!await this.verifyMasterPassword(oldPassword)) {
      throw new Error('Current password is incorrect')
    }

    await this.setMasterPassword(newPassword)
    return true
  }

  /**
   * Remove master password (dangerous operation)
   */
  async removeMasterPassword(password) {
    if (!await this.verifyMasterPassword(password)) {
      throw new Error('Password is incorrect')
    }

    try {
      if (window.electronAPI && window.electronAPI.secureStore) {
        await window.electronAPI.secureStore.delete('master_password_hash')
      } else {
        localStorage.removeItem('ytm_master_password_hash')
      }
      
      this.masterPasswordHash = null
      this.isAuthenticated = false
      return true
    } catch (error) {
      console.error('Failed to remove master password:', error)
      throw new Error('Failed to remove master password')
    }
  }

  /**
   * Get password strength
   */
  getPasswordStrength(password) {
    let strength = 0
    let feedback = []

    if (password.length >= 8) strength += 1
    else feedback.push('Use at least 8 characters')

    if (/[a-z]/.test(password)) strength += 1
    else feedback.push('Include lowercase letters')

    if (/[A-Z]/.test(password)) strength += 1
    else feedback.push('Include uppercase letters')

    if (/[0-9]/.test(password)) strength += 1
    else feedback.push('Include numbers')

    if (/[^a-zA-Z0-9]/.test(password)) strength += 1
    else feedback.push('Include special characters')

    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    return {
      score: strength,
      level: levels[Math.min(strength, 4)],
      feedback
    }
  }
}

// Create singleton instance
export const masterPasswordService = new MasterPasswordService()
