import React, { useState, useEffect, useCallback } from 'react'
import {
  Keyboard,
  Command,
  Info,
  X,
  Zap,
  Eye,
  Flag,
  Heart,
  Reply,
  Trash2,
  Star,
  Pin,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  X as EscapeIcon,
  Settings
} from 'lucide-react'

const KeyboardShortcuts = ({ 
  onShortcutAction, 
  selectedComments = new Set(), 
  focusedComment = null,
  isEnabled = true 
}) => {
  const [showHelp, setShowHelp] = useState(false)
  const [lastAction, setLastAction] = useState(null)

  // Define keyboard shortcuts
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: '↑', description: 'Move up in comment list', action: 'navigate-up' },
        { key: '↓', description: 'Move down in comment list', action: 'navigate-down' },
        { key: 'Enter', description: 'Open focused comment', action: 'open-comment' },
        { key: 'Esc', description: 'Close modals/deselect', action: 'escape' },
        { key: '/', description: 'Focus search box', action: 'focus-search' }
      ]
    },
    {
      category: 'Comment Actions',
      items: [
        { key: 'R', description: 'Reply to comment', action: 'reply' },
        { key: 'L', description: 'Like/unlike comment', action: 'like' },
        { key: 'F', description: 'Flag/unflag comment', action: 'flag' },
        { key: 'S', description: 'Star/unstar comment', action: 'star' },
        { key: 'P', description: 'Pin/unpin comment', action: 'pin' },
        { key: 'H', description: 'Hide/show comment', action: 'hide' },
        { key: 'Del', description: 'Delete comment', action: 'delete' }
      ]
    },
    {
      category: 'Bulk Actions',
      items: [
        { key: 'Ctrl+A', description: 'Select all comments', action: 'select-all' },
        { key: 'Ctrl+D', description: 'Deselect all', action: 'deselect-all' },
        { key: 'Space', description: 'Toggle comment selection', action: 'toggle-select' },
        { key: 'Ctrl+F', description: 'Flag selected comments', action: 'bulk-flag' },
        { key: 'Ctrl+H', description: 'Hide selected comments', action: 'bulk-hide' },
        { key: 'Ctrl+Del', description: 'Delete selected comments', action: 'bulk-delete' }
      ]
    },
    {
      category: 'Quick Actions',
      items: [
        { key: '1-9', description: 'Use template 1-9', action: 'template' },
        { key: 'Ctrl+R', description: 'Refresh comments', action: 'refresh' },
        { key: 'Ctrl+S', description: 'Save current state', action: 'save' },
        { key: '?', description: 'Show keyboard shortcuts', action: 'help' },
        { key: 'Ctrl+Z', description: 'Undo last action', action: 'undo' }
      ]
    }
  ]

  // Handle keyboard events
  const handleKeyDown = useCallback((event) => {
    if (!isEnabled) return

    const { key, ctrlKey, metaKey, altKey, shiftKey } = event
    const modifierKey = ctrlKey || metaKey
    
    // Don't trigger shortcuts when typing in inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      // Only allow specific shortcuts in input fields
      if (key === 'Escape') {
        event.target.blur()
        event.preventDefault()
      }
      return
    }

    let action = null
    let actionData = {}

    // Navigation shortcuts
    switch (key) {
      case 'ArrowUp':
        action = 'navigate-up'
        event.preventDefault()
        break
      case 'ArrowDown':
        action = 'navigate-down'
        event.preventDefault()
        break
      case 'Enter':
        action = 'open-comment'
        event.preventDefault()
        break
      case 'Escape':
        action = 'escape'
        event.preventDefault()
        break
      case '/':
        action = 'focus-search'
        event.preventDefault()
        break
    }

    // Comment action shortcuts
    if (!modifierKey) {
      switch (key.toLowerCase()) {
        case 'r':
          action = 'reply'
          event.preventDefault()
          break
        case 'l':
          action = 'like'
          event.preventDefault()
          break
        case 'f':
          action = 'flag'
          event.preventDefault()
          break
        case 's':
          action = 'star'
          event.preventDefault()
          break
        case 'p':
          action = 'pin'
          event.preventDefault()
          break
        case 'h':
          action = 'hide'
          event.preventDefault()
          break
        case 'delete':
        case 'backspace':
          action = 'delete'
          event.preventDefault()
          break
        case ' ':
          action = 'toggle-select'
          event.preventDefault()
          break
        case '?':
          setShowHelp(true)
          event.preventDefault()
          break
      }
    }

    // Bulk action shortcuts (with Ctrl/Cmd)
    if (modifierKey) {
      switch (key.toLowerCase()) {
        case 'a':
          action = 'select-all'
          event.preventDefault()
          break
        case 'd':
          action = 'deselect-all'
          event.preventDefault()
          break
        case 'f':
          action = 'bulk-flag'
          event.preventDefault()
          break
        case 'h':
          action = 'bulk-hide'
          event.preventDefault()
          break
        case 'delete':
        case 'backspace':
          action = 'bulk-delete'
          event.preventDefault()
          break
        case 'r':
          action = 'refresh'
          event.preventDefault()
          break
        case 's':
          action = 'save'
          event.preventDefault()
          break
        case 'z':
          action = 'undo'
          event.preventDefault()
          break
      }
    }

    // Template shortcuts (1-9)
    if (!modifierKey && /^[1-9]$/.test(key)) {
      action = 'template'
      actionData = { templateIndex: parseInt(key) - 1 }
      event.preventDefault()
    }

    // Execute action
    if (action && onShortcutAction) {
      setLastAction({ action, timestamp: Date.now() })
      onShortcutAction(action, actionData)
    }
  }, [isEnabled, onShortcutAction])

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isEnabled])

  const ShortcutItem = ({ shortcut }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{shortcut.description}</span>
      <div className="flex gap-1">
        {shortcut.key.split('+').map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-gray-400 mx-1">+</span>}
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* Keyboard Shortcuts Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 flex items-center justify-center"
        title="Keyboard Shortcuts (Press ?)"
      >
        <Keyboard size={20} />
      </button>

      {/* Last Action Indicator */}
      {lastAction && (
        <div className="fixed bottom-20 right-6 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm z-40 animate-fade-in-out">
          Action: {lastAction.action.replace('-', ' ')}
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Keyboard className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h3>
                    <p className="text-gray-600">Speed up your comment management</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {shortcuts.map((category) => (
                  <div key={category.category}>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      {category.category === 'Navigation' && <ArrowUp size={18} />}
                      {category.category === 'Comment Actions' && <MessageSquare size={18} />}
                      {category.category === 'Bulk Actions' && <CheckCircle size={18} />}
                      {category.category === 'Quick Actions' && <Zap size={18} />}
                      {category.category}
                    </h4>
                    <div className="space-y-1">
                      {category.items.map((shortcut, index) => (
                        <ShortcutItem key={index} shortcut={shortcut} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="text-blue-600 mt-0.5" size={20} />
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Pro Tips</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use arrow keys to navigate through comments quickly</li>
                      <li>• Hold Ctrl/Cmd for bulk actions on selected comments</li>
                      <li>• Press numbers 1-9 to use quick reply templates</li>
                      <li>• Press '/' to quickly jump to the search box</li>
                      <li>• Use Space to select/deselect comments for bulk operations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Shortcuts are {isEnabled ? 'enabled' : 'disabled'}
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {isEnabled && (
        <div className="fixed bottom-6 left-6 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm z-40 flex items-center gap-2">
          <Zap size={16} />
          Shortcuts Active
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        
        .animate-fade-in-out {
          animation: fade-in-out 2s ease-in-out;
        }
      `}</style>
    </>
  )
}

export default KeyboardShortcuts
