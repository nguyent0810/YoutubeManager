import React, { useState, useEffect, useRef } from 'react'
import { Menu, Search, X } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { searchService } from '../services/search-service'
import SearchResults from './SearchResults'
import NotificationDropdown from './NotificationDropdown'

const Header = ({ onToggleSidebar }) => {
  const { activeAccount } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }

      setIsSearching(true)
      try {
        const results = await searchService.search(searchQuery)
        setSearchResults(results.results || [])
        setShowSearchResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchClear = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          
          <div className="relative" ref={searchRef}>
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos, comments, analytics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              className="pl-10 pr-10 py-2 w-96 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-youtube-red focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={handleSearchClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <SearchResults
                results={searchResults}
                query={searchQuery}
                onClose={() => setShowSearchResults(false)}
              />
            )}

            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-youtube-red"></div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Active Account Info */}
          {activeAccount && (
            <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
              <img
                src={activeAccount.picture || activeAccount.channelThumbnail}
                alt={activeAccount.channelName}
                className="w-8 h-8 rounded-full"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{activeAccount.channelName}</p>
                <p className="text-gray-500">{activeAccount.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
