import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Upload,
  FolderUp,
  Video,
  BarChart3,
  MessageSquare,
  Calendar,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import toast from 'react-hot-toast'

const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { accounts, activeAccount, addAccount, removeAccount, switchAccount } = useAuth()
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null)

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload Video' },
    { path: '/bulk-upload', icon: FolderUp, label: 'Bulk Upload' },
    { path: '/videos', icon: Video, label: 'Video Manager' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/comments', icon: MessageSquare, label: 'Comments' },
    { path: '/calendar', icon: Calendar, label: 'Content Calendar' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ]

  const handleAddAccount = async () => {
    const result = await addAccount()
    if (result.success) {
      toast.success(`Added channel: ${result.account.channelName}`)
      setShowAccountDropdown(false)
    } else {
      toast.error(result.error || 'Failed to add account')
    }
  }

  const handleRemoveAccount = async (channelId) => {
    const result = await removeAccount(channelId)
    if (result.success) {
      toast.success('Account removed successfully')
      setShowRemoveConfirm(null)
    } else {
      toast.error(result.error || 'Failed to remove account')
    }
  }

  const handleSwitchAccount = (account) => {
    switchAccount(account)
    setShowAccountDropdown(false)
    toast.success(`Switched to ${account.channelName}`)
  }

  if (collapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <div className="w-8 h-8 bg-youtube-red rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">YT</span>
          </div>
        </div>
        
        <nav className="flex-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full p-3 rounded-lg mb-1 flex items-center justify-center transition-colors ${
                  isActive 
                    ? 'bg-youtube-red text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={item.label}
              >
                <Icon size={20} />
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-youtube-red rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">YT</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">YouTube Manager</h1>
            <p className="text-sm text-gray-500">Multi-Account</p>
          </div>
        </div>
      </div>

      {/* Account Selector */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {activeAccount ? (
              <>
                <img
                  src={activeAccount.picture || activeAccount.channelThumbnail}
                  alt={activeAccount.channelName}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activeAccount.channelName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {activeAccount.email}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">No Account</p>
                  <p className="text-xs text-gray-500">Add an account</p>
                </div>
              </>
            )}
            {showAccountDropdown ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Account Dropdown */}
          {showAccountDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                {accounts.map((account) => (
                  <div key={account.channelId} className="relative group">
                    <button
                      onClick={() => handleSwitchAccount(account)}
                      className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                        activeAccount?.channelId === account.channelId
                          ? 'bg-youtube-red text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <img
                        src={account.picture || account.channelThumbnail}
                        alt={account.channelName}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate">
                          {account.channelName}
                        </p>
                        <p className="text-xs opacity-75 truncate">
                          {account.email}
                        </p>
                      </div>
                    </button>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowRemoveConfirm(account.channelId)
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-all"
                    >
                      <LogOut size={12} className="text-red-500" />
                    </button>
                  </div>
                ))}
                
                <hr className="my-2" />
                
                <button
                  onClick={handleAddAccount}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-youtube-red"
                >
                  <Plus size={16} />
                  <span className="text-sm font-medium">Add Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-youtube-red text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Remove Account Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Remove Account</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove this account? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveAccount(showRemoveConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
