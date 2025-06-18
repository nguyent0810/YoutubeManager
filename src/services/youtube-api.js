// YouTube API service with multi-account support
class YouTubeAPI {
  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id'
    this.clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || 'your-client-secret'
    this.redirectUri = 'urn:ietf:wg:oauth:2.0:oob'
    this.scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/user.emails.read'
    ]
  }

  // Load all saved accounts from secure storage
  async loadAccounts() {
    try {
      console.log('Loading accounts...')

      // Check both storage methods and use the one with more accounts
      let secureAccounts = []
      let localAccounts = []

      // Try secure store first
      if (window.electronAPI && window.electronAPI.secureStore) {
        try {
          const secureData = await window.electronAPI.secureStore.get('youtube_accounts')
          secureAccounts = secureData ? JSON.parse(secureData) : []
          console.log('Secure store has:', secureAccounts.length, 'accounts')
        } catch (secureStoreError) {
          console.warn('⚠️ Secure store failed:', secureStoreError)
        }
      }

      // Always check localStorage too
      try {
        const localData = localStorage.getItem('youtube_accounts')
        localAccounts = localData ? JSON.parse(localData) : []
        console.log('localStorage has:', localAccounts.length, 'accounts')
      } catch (localError) {
        console.warn('⚠️ localStorage failed:', localError)
      }

      // Use the storage with more accounts (localStorage wins if equal)
      let accounts = []
      if (localAccounts.length >= secureAccounts.length) {
        accounts = localAccounts
        console.log('✅ Using localStorage with', accounts.length, 'accounts')
      } else {
        accounts = secureAccounts
        console.log('✅ Using secure store with', accounts.length, 'accounts')
      }

      // Debug: Show existing accounts
      console.log('=== EXISTING ACCOUNTS DEBUG ===')
      accounts.forEach((account, index) => {
        console.log(`Account ${index + 1}:`, {
          channelName: account.channelName,
          email: account.email,
          originalEmail: account.originalEmail,
          channelId: account.channelId
        })
      })
      console.log('=== END EXISTING ACCOUNTS DEBUG ===')

      return accounts
    } catch (error) {
      console.error('❌ Failed to load accounts:', error)
      return []
    }
  }

  // Save accounts to secure storage with robust fallback
  async saveAccounts(accounts) {
    try {
      console.log('Attempting to save accounts:', accounts.length, 'accounts')

      // Always save to localStorage first as primary storage
      localStorage.setItem('youtube_accounts', JSON.stringify(accounts))
      console.log('✅ Accounts saved to localStorage successfully')

      // Try secure store as secondary backup (don't fail if it doesn't work)
      if (window.electronAPI && window.electronAPI.secureStore) {
        try {
          const dataToSave = JSON.stringify(accounts)
          console.log('Attempting secure store backup, data size:', dataToSave.length, 'characters')

          const result = await window.electronAPI.secureStore.set('youtube_accounts', dataToSave)
          if (result === true) {
            console.log('✅ Accounts also backed up to secure store')
          } else {
            console.log('ℹ️ Secure store backup not available, using localStorage only')
          }
        } catch (secureStoreError) {
          console.log('ℹ️ Secure store backup failed:', secureStoreError.message, 'but localStorage succeeded')
        }
      }

      // Success if localStorage worked
      return true
    } catch (error) {
      console.error('❌ Failed to save accounts to localStorage:', error)
      throw new Error(`Failed to save accounts: ${error.message}`)
    }
  }

  // Fix brand account emails in existing accounts
  fixBrandAccountEmails(accounts) {
    if (!accounts || accounts.length === 0) return accounts

    // Fix any accounts with brand account emails by using channel-based identifiers
    // We don't want to mix up different people's accounts
    return accounts.map(account => {
      const isBrandAccountEmail = account.email && (
        account.email.length > 50 ||
        account.email.includes('pages.plusgoogle.com') ||
        account.email.includes('@pages.') ||
        // Also fix if it was incorrectly set to another account's email
        (account.email === 'lientrankim95@gmail.com' && account.channelName !== 'Main Channel Name')
      )

      if (isBrandAccountEmail) {
        // Use channel name as identifier instead of trying to guess the real email
        const channelBasedEmail = `${account.channelName.replace(/\s+/g, '').toLowerCase()}@youtube.channel`
        console.log(`Fixing brand account email for ${account.channelName}: ${account.email} -> ${channelBasedEmail}`)
        return {
          ...account,
          email: channelBasedEmail,
          originalEmail: account.originalEmail || account.email // Preserve original if available
        }
      }

      return account
    })
  }

  // Simple fix for the known email issues
  async fixKnownEmailIssues() {
    const accounts = await this.loadAccounts()
    console.log('=== FIXING KNOWN EMAIL ISSUES ===')

    const fixedAccounts = accounts.map(account => {
      // Fix Trần Kim Liên
      if (account.channelName === 'Trần Kim Liên' && account.channelId === 'UCQRsHSC8dBcLvCvrj7CLvKA') {
        console.log(`✅ Fixing Trần Kim Liên: ${account.email} -> lientrankim95@gmail.com`)
        return {
          ...account,
          email: 'lientrankim95@gmail.com',
          originalEmail: 'lientrankim95@gmail.com'
        }
      }

      // Fix Foxy News
      if (account.channelName === 'Foxy News' && account.channelId === 'UCWBvTKLn_EODkHLHmBcVzAQ') {
        console.log(`✅ Fixing Foxy News: ${account.email} -> siouxtest05@gmail.com`)
        return {
          ...account,
          email: 'siouxtest05@gmail.com',
          originalEmail: 'siouxtest05@gmail.com'
        }
      }

      // Keep other accounts as-is
      return account
    })

    console.log('=== SAVING FIXED ACCOUNTS ===')
    await this.saveAccounts(fixedAccounts)
    console.log('✅ Email issues fixed and saved!')

    return fixedAccounts
  }

  // Debug function to check storage
  async debugStorage() {
    console.log('=== STORAGE DEBUG ===')

    try {
      // Check secure store
      if (window.electronAPI && window.electronAPI.secureStore) {
        const secureData = await window.electronAPI.secureStore.get('youtube_accounts')
        console.log('Secure store raw data:', secureData)
        if (secureData) {
          const secureAccounts = JSON.parse(secureData)
          console.log('Secure store accounts:', secureAccounts.length, secureAccounts)
        }
      }

      // Check localStorage
      const localData = localStorage.getItem('youtube_accounts')
      console.log('localStorage raw data:', localData)
      if (localData) {
        const localAccounts = JSON.parse(localData)
        console.log('localStorage accounts:', localAccounts.length, localAccounts)
      }

    } catch (error) {
      console.error('Storage debug error:', error)
    }

    console.log('=== END STORAGE DEBUG ===')
  }

  // Generate OAuth URL
  generateAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  // Authenticate and add new account
  async authenticate() {
    try {
      const authUrl = this.generateAuthUrl()

      let result
      // Check if running in Electron
      if (window.electronAPI && window.electronAPI.oauthLogin) {
        result = await window.electronAPI.oauthLogin(authUrl)
      } else {
        // For browser testing, show a message
        alert('OAuth authentication requires the Electron app. Please run "npm run dev" to use the desktop app.')
        return { success: false, error: 'OAuth requires Electron app' }
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(result.code)
      
      // Get user info from multiple endpoints to find the real email
      const userInfo = await this.getUserInfo(tokens.access_token)

      // Try additional endpoints to get more complete user information
      const userInfoV1 = await this.getUserInfoV1(tokens.access_token)
      const peopleInfo = await this.getPeopleInfo(tokens.access_token)

      // Get channel info
      const channelInfo = await this.getChannelInfo(tokens.access_token)

      console.log('Debug - User Info (v2):', userInfo)
      console.log('Debug - User Info (v1):', userInfoV1)
      console.log('Debug - People Info:', peopleInfo)
      console.log('Debug - Channel Info:', channelInfo)

      // Extract the real Google account email from multiple API sources
      const accounts = await this.loadAccounts()
      let displayEmail = userInfo.email
      let originalEmail = userInfo.email

      // Check if this looks like a brand account email (long string or contains specific patterns)
      const isBrandAccountEmail = userInfo.email && (
        userInfo.email.length > 50 ||
        userInfo.email.includes('pages.plusgoogle.com') ||
        userInfo.email.includes('@pages.')
      )

      console.log('Is brand account email?', isBrandAccountEmail)

      // Try to find the real Google account email from various API responses
      let realEmail = null

      // 1. Check v1 userinfo API
      if (userInfoV1 && userInfoV1.email && userInfoV1.email !== userInfo.email) {
        if (userInfoV1.email.length < 50 &&
            userInfoV1.email.includes('@') &&
            !userInfoV1.email.includes('pages.plusgoogle.com')) {
          realEmail = userInfoV1.email
          console.log('Found real email from v1 API:', realEmail)
        }
      }

      // 2. Check People API for email addresses
      if (!realEmail && peopleInfo && peopleInfo.emailAddresses) {
        for (const emailObj of peopleInfo.emailAddresses) {
          if (emailObj.value &&
              emailObj.value !== userInfo.email &&
              emailObj.value.length < 50 &&
              emailObj.value.includes('@') &&
              !emailObj.value.includes('pages.plusgoogle.com')) {
            realEmail = emailObj.value
            console.log('Found real email from People API:', realEmail)
            break
          }
        }
      }

      // 3. Use the real email if found, otherwise use the original
      if (realEmail) {
        displayEmail = realEmail
        console.log('✅ Using real Google account email:', displayEmail)
      } else {
        // Use the original email from userInfo (this should be correct now)
        displayEmail = userInfo.email
        console.log('✅ Using original email:', displayEmail)
      }

      const account = {
        email: displayEmail, // This should now be the correct Google account email
        originalEmail: displayEmail, // Both should be the same correct email
        name: userInfo.name,
        picture: userInfo.picture,
        channelId: channelInfo.id,
        channelName: channelInfo.snippet.title,
        channelThumbnail: channelInfo.snippet.thumbnails.default.url,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        addedAt: Date.now()
      }

      console.log('✅ Final account object:', {
        channelName: account.channelName,
        email: account.email,
        originalEmail: account.originalEmail,
        channelId: account.channelId
      })

      // Save account
      accounts.push(account)
      console.log('About to save accounts. Total count:', accounts.length)
      console.log('Account being added:', {
        channelName: account.channelName,
        email: account.email,
        channelId: account.channelId
      })

      try {
        await this.saveAccounts(accounts)
        console.log('✅ Account successfully saved to storage')
      } catch (saveError) {
        console.error('❌ Failed to save account to storage:', saveError)
        // Remove the account from the array if save failed
        accounts.pop()
        throw new Error(`Failed to save account: ${saveError.message}`)
      }

      return { success: true, account }
    } catch (error) {
      console.error('Authentication failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    return await response.json()
  }

  // Get user info from Google (v2 API)
  async getUserInfo(accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return await response.json()
  }

  // Get user info from Google (v1 API) - sometimes has different/better info
  async getUserInfoV1(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        console.log('V1 userinfo failed:', response.status)
        return null
      }

      return await response.json()
    } catch (error) {
      console.log('V1 userinfo error:', error)
      return null
    }
  }

  // Get user info from People API - might have the real account email (through main process to avoid CSP issues)
  async getPeopleInfo(accessToken) {
    try {
      const url = 'https://people.googleapis.com/v1/people/me?personFields=emailAddresses,names'

      // Check if running in Electron
      if (window.electronAPI && window.electronAPI.youtube && window.electronAPI.youtube.peopleRequest) {
        const result = await window.electronAPI.youtube.peopleRequest({
          accessToken,
          url
        })

        if (!result.success) {
          console.log('People API failed:', result.error)
          return null
        }

        return result.data
      } else {
        // Fallback to direct request (for development/testing)
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          console.log('People API failed:', response.status)
          return null
        }

        return await response.json()
      }
    } catch (error) {
      console.log('People API error:', error)
      return null
    }
  }

  // Get channel info
  async getChannelInfo(accessToken) {
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get channel info')
    }

    const data = await response.json()
    return data.items[0]
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    return await response.json()
  }

  // Refresh account tokens
  async refreshAccount(channelId) {
    const accounts = await this.loadAccounts()
    const account = accounts.find(acc => acc.channelId === channelId)

    if (!account) {
      throw new Error('Account not found')
    }

    try {
      const tokens = await this.refreshAccessToken(account.refreshToken)

      account.accessToken = tokens.access_token
      account.expiresAt = Date.now() + (tokens.expires_in * 1000)

      if (tokens.refresh_token) {
        account.refreshToken = tokens.refresh_token
      }

      await this.saveAccounts(accounts)
      return account
    } catch (error) {
      console.error('Failed to refresh account:', error)
      throw error
    }
  }

  // Remove account
  async removeAccount(channelId) {
    const accounts = await this.loadAccounts()
    const filteredAccounts = accounts.filter(acc => acc.channelId !== channelId)
    await this.saveAccounts(filteredAccounts)
  }

  // Get valid access token for account (refresh if needed)
  async getValidAccessToken(account) {
    if (Date.now() < account.expiresAt - 60000) { // 1 minute buffer
      return account.accessToken
    }

    // Token expired, refresh it
    const refreshedAccount = await this.refreshAccount(account.channelId)
    return refreshedAccount.accessToken
  }

  // API methods that use the active account
  async makeAuthenticatedRequest(account, url, options = {}) {
    const accessToken = await this.getValidAccessToken(account)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return await response.json()
  }

  // Analytics API requests through main process (to avoid CSP issues)
  async makeAnalyticsRequest(account, url, options = {}) {
    const accessToken = await this.getValidAccessToken(account)

    // Check if running in Electron
    if (window.electronAPI && window.electronAPI.youtube && window.electronAPI.youtube.analyticsRequest) {
      const result = await window.electronAPI.youtube.analyticsRequest({
        accessToken,
        url,
        options
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    } else {
      // Fallback to direct request (for development/testing)
      return await this.makeAuthenticatedRequest(account, url, options)
    }
  }

  // Get videos for account
  async getVideos(account, params = {}) {
    // First get the channel's uploads playlist
    const channelData = await this.getChannelAnalytics(account)
    if (!channelData.items || channelData.items.length === 0) {
      return { items: [] }
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      return { items: [] }
    }

    // Get videos from uploads playlist - only use basic parameters for playlistItems
    const playlistParams = new URLSearchParams({
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(params.maxResults || 50, 50) // YouTube API max is 50
    })

    // Add pageToken if provided (for pagination)
    if (params.pageToken) {
      playlistParams.set('pageToken', params.pageToken)
    }

    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?${playlistParams}`
    const playlistData = await this.makeAuthenticatedRequest(account, playlistUrl)

    if (!playlistData.items || playlistData.items.length === 0) {
      return { items: [] }
    }

    // Get detailed video information including statistics and status
    const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',')

    // Determine which parts to request based on params
    let videoParts = ['snippet', 'statistics', 'status']
    if (params.part && params.part.includes('contentDetails')) {
      videoParts.push('contentDetails')
    }
    if (params.part && params.part.includes('liveStreamingDetails')) {
      videoParts.push('liveStreamingDetails')
    }

    const videoParams = new URLSearchParams({
      part: videoParts.join(','),
      id: videoIds
    })

    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?${videoParams}`
    const result = await this.makeAuthenticatedRequest(account, videoUrl)

    // Filter by status if specified (including scheduled detection)
    if (params.status && params.status !== 'all') {
      result.items = result.items.filter(video => {
        const actualStatus = this.getActualVideoStatus(video)
        return actualStatus === params.status
      })
    }

    // Limit results after filtering
    if (params.maxResults && result.items) {
      result.items = result.items.slice(0, params.maxResults)
    }

    // Add pagination info from playlist response
    if (playlistData.nextPageToken) {
      result.nextPageToken = playlistData.nextPageToken
    }
    if (playlistData.prevPageToken) {
      result.prevPageToken = playlistData.prevPageToken
    }

    return result
  }

  // Get channel analytics
  async getChannelAnalytics(account, params = {}) {
    const queryParams = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      mine: 'true',
      ...params
    })

    const url = `https://www.googleapis.com/youtube/v3/channels?${queryParams}`
    return await this.makeAuthenticatedRequest(account, url)
  }

  // Get channel info (direct API call for authentication - doesn't use account system)
  async getChannelInfo(accessToken) {
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get channel info: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      throw new Error('No channel found for this account')
    }

    return data.items[0]
  }

  // Convert relative dates to actual dates
  convertToActualDate(dateString) {
    if (dateString === 'today') {
      return new Date().toISOString().split('T')[0]
    }

    if (dateString.endsWith('daysAgo')) {
      const days = parseInt(dateString.replace('daysAgo', ''))
      const date = new Date()
      date.setDate(date.getDate() - days)
      return date.toISOString().split('T')[0]
    }

    // If it's already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }

    // Default fallback
    return new Date().toISOString().split('T')[0]
  }

  // YouTube Analytics API v2 Integration
  async getAnalyticsData(account, params = {}) {
    const {
      metrics = 'views,estimatedMinutesWatched,subscribersGained',
      dimensions = 'day',
      startDate = '30daysAgo',
      endDate = 'today',
      filters = '',
      sort = '-day',
      maxResults = 200
    } = params

    // Convert relative dates to actual dates
    const actualStartDate = this.convertToActualDate(startDate)
    const actualEndDate = this.convertToActualDate(endDate)

    const queryParams = new URLSearchParams({
      ids: 'channel==MINE',
      metrics,
      dimensions,
      startDate: actualStartDate,
      endDate: actualEndDate,
      sort,
      maxResults: maxResults.toString()
    })

    if (filters) {
      queryParams.set('filters', filters)
    }

    const url = `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams}`
    return await this.makeAnalyticsRequest(account, url)
  }

  // Get detailed video analytics
  async getVideoAnalytics(account, videoId, params = {}) {
    const {
      metrics = 'views,likes,dislikes,comments,shares,estimatedMinutesWatched,averageViewDuration',
      dimensions = 'day',
      startDate = '30daysAgo',
      endDate = 'today'
    } = params

    const queryParams = new URLSearchParams({
      ids: 'channel==MINE',
      metrics,
      dimensions,
      startDate: this.convertToActualDate(startDate),
      endDate: this.convertToActualDate(endDate),
      filters: `video==${videoId}`,
      sort: '-day'
    })

    const url = `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams}`
    return await this.makeAnalyticsRequest(account, url)
  }

  // Get audience retention data
  async getAudienceRetention(account, videoId) {
    const queryParams = new URLSearchParams({
      ids: 'channel==MINE',
      metrics: 'audienceWatchRatio,relativeRetentionPerformance',
      dimensions: 'elapsedVideoTimeRatio',
      filters: `video==${videoId}`,
      sort: 'elapsedVideoTimeRatio'
    })

    const url = `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams}`
    return await this.makeAnalyticsRequest(account, url)
  }

  // Get traffic source analytics
  async getTrafficSources(account, params = {}) {
    const {
      startDate = '30daysAgo',
      endDate = 'today',
      maxResults = 25
    } = params

    const queryParams = new URLSearchParams({
      ids: 'channel==MINE',
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'insightTrafficSourceType',
      startDate: this.convertToActualDate(startDate),
      endDate: this.convertToActualDate(endDate),
      sort: '-views',
      maxResults: maxResults.toString()
    })

    const url = `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams}`
    return await this.makeAnalyticsRequest(account, url)
  }

  // Get geographic analytics
  async getGeographicData(account, params = {}) {
    const {
      startDate = '30daysAgo',
      endDate = 'today',
      maxResults = 25
    } = params

    const queryParams = new URLSearchParams({
      ids: 'channel==MINE',
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'country',
      startDate: this.convertToActualDate(startDate),
      endDate: this.convertToActualDate(endDate),
      sort: '-views',
      maxResults: maxResults.toString()
    })

    const url = `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams}`
    return await this.makeAnalyticsRequest(account, url)
  }

  // Get device/platform analytics
  async getDeviceAnalytics(account, params = {}) {
    const {
      startDate = '30daysAgo',
      endDate = 'today'
    } = params

    const queryParams = new URLSearchParams({
      ids: 'channel==MINE',
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'deviceType',
      startDate: this.convertToActualDate(startDate),
      endDate: this.convertToActualDate(endDate),
      sort: '-views'
    })

    const url = `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams}`
    return await this.makeAnalyticsRequest(account, url)
  }

  // Get subscriber analytics
  async getSubscriberAnalytics(account, params = {}) {
    const {
      startDate = '30daysAgo',
      endDate = 'today'
    } = params

    const queryParams = new URLSearchParams({
      ids: 'channel==MINE',
      metrics: 'subscribersGained,subscribersLost',
      dimensions: 'day',
      startDate: this.convertToActualDate(startDate),
      endDate: this.convertToActualDate(endDate),
      sort: '-day'
    })

    const url = `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams}`
    return await this.makeAnalyticsRequest(account, url)
  }

  // Check if account has Analytics permissions
  async checkAnalyticsPermissions(account) {
    try {
      // Try a simple Analytics API call
      const queryParams = new URLSearchParams({
        ids: 'channel==MINE',
        metrics: 'views',
        startDate: '7daysAgo',
        endDate: 'today',
        maxResults: '1'
      })

      const url = `https://youtubeanalytics.googleapis.com/v2/reports?${queryParams}`
      await this.makeAnalyticsRequest(account, url)
      return { hasPermission: true }
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        return {
          hasPermission: false,
          reason: 'insufficient_permissions',
          message: 'Account needs to be re-authenticated with YouTube Analytics permissions'
        }
      }
      return {
        hasPermission: false,
        reason: 'api_error',
        message: error.message
      }
    }
  }

  // Force re-authentication for Analytics permissions
  async reAuthenticateForAnalytics(channelId) {
    try {
      // Remove the existing account
      await this.removeAccount(channelId)

      // Start new authentication with Analytics scope
      return await this.authenticate()
    } catch (error) {
      console.error('Re-authentication failed:', error)
      throw error
    }
  }

  // Check what scopes an account currently has
  async checkAccountScopes(account) {
    try {
      const accessToken = await this.getValidAccessToken(account)

      // Use Google's tokeninfo endpoint to check scopes
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`)

      if (!response.ok) {
        throw new Error('Failed to check token info')
      }

      const tokenInfo = await response.json()
      console.log('Current account scopes:', tokenInfo.scope)

      return {
        scopes: tokenInfo.scope ? tokenInfo.scope.split(' ') : [],
        hasAnalyticsScope: tokenInfo.scope ? tokenInfo.scope.includes('https://www.googleapis.com/auth/yt-analytics.readonly') : false
      }
    } catch (error) {
      console.error('Failed to check account scopes:', error)
      return { scopes: [], hasAnalyticsScope: false }
    }
  }

  // Get comments for a video with enhanced error handling
  async getVideoComments(account, videoId, params = {}) {
    console.log('Getting comments for video:', videoId, 'with account:', account.channelName)

    // First, let's check if the video exists and get its details
    try {
      const videoCheckParams = new URLSearchParams({
        part: 'snippet,statistics,status',
        id: videoId
      })

      const videoCheckUrl = `https://www.googleapis.com/youtube/v3/videos?${videoCheckParams}`
      const videoData = await this.makeAuthenticatedRequest(account, videoCheckUrl)

      console.log('Video data:', videoData)

      if (!videoData.items || videoData.items.length === 0) {
        throw new Error('Video not found or not accessible')
      }

      const video = videoData.items[0]
      const commentCount = video.statistics?.commentCount

      console.log('Video comment count:', commentCount)
      console.log('Video privacy status:', video.status?.privacyStatus)

      // Check if comments are likely disabled
      if (commentCount === '0' || commentCount === undefined) {
        console.warn('Video appears to have no comments or comments may be disabled')
      }

    } catch (videoCheckError) {
      console.error('Error checking video details:', videoCheckError)
      // Continue anyway, maybe the video check failed but comments might work
    }

    // Now try to get comments
    const queryParams = new URLSearchParams({
      part: 'snippet,replies',
      videoId: videoId,
      maxResults: params.maxResults || 20,
      ...params
    })

    const url = `https://www.googleapis.com/youtube/v3/commentThreads?${queryParams}`

    try {
      console.log('Attempting to fetch comments from:', url)
      const result = await this.makeAuthenticatedRequest(account, url)
      console.log('Comments API success:', result)
      return result
    } catch (error) {
      console.error('Comments API failed:', error)

      // Enhanced error reporting
      if (error.message.includes('403')) {
        // Try to determine the specific reason for 403
        const errorDetails = await this.diagnoseCommentPermissionError(account, videoId)
        throw new Error(`403 Forbidden: ${errorDetails}`)
      }

      throw error
    }
  }

  // Diagnose why comment access is forbidden
  async diagnoseCommentPermissionError(account, videoId) {
    const issues = []

    try {
      // Check if we can access the video at all
      const videoParams = new URLSearchParams({
        part: 'snippet,status',
        id: videoId
      })

      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?${videoParams}`
      const videoData = await this.makeAuthenticatedRequest(account, videoUrl)

      if (!videoData.items || videoData.items.length === 0) {
        issues.push('Video not found or not accessible')
      } else {
        const video = videoData.items[0]

        // Check privacy status
        if (video.status?.privacyStatus === 'private') {
          issues.push('Video is private')
        }

        // Check if it's the user's own video
        const isOwnVideo = video.snippet?.channelId === account.channelId
        if (!isOwnVideo) {
          issues.push('Not your own video - may need different permissions for other channels\' comments')
        }
      }

    } catch (diagError) {
      issues.push('Cannot access video details')
    }

    // Check account scopes
    try {
      const scopeInfo = await this.checkAccountScopes(account)
      if (!scopeInfo.hasAnalyticsScope) {
        issues.push('Missing analytics scope')
      }
    } catch (scopeError) {
      issues.push('Cannot verify account permissions')
    }

    if (issues.length === 0) {
      return 'Comments may be disabled for this video, or YouTube API has restrictions'
    }

    return issues.join(', ')
  }

  // Test if we can access any YouTube API endpoints to diagnose the issue
  async testYouTubeAPIAccess(account) {
    const tests = []

    try {
      // Test 1: Can we get channel info?
      const channelParams = new URLSearchParams({
        part: 'snippet',
        mine: 'true'
      })
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?${channelParams}`
      const channelResult = await this.makeAuthenticatedRequest(account, channelUrl)
      tests.push({ test: 'Channel Access', success: true, data: channelResult })
    } catch (error) {
      tests.push({ test: 'Channel Access', success: false, error: error.message })
    }

    try {
      // Test 2: Can we get videos?
      const videoParams = new URLSearchParams({
        part: 'snippet',
        mine: 'true',
        maxResults: 1
      })
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?${videoParams}`
      const videoResult = await this.makeAuthenticatedRequest(account, videoUrl)
      tests.push({ test: 'Video Access', success: true, data: videoResult })
    } catch (error) {
      tests.push({ test: 'Video Access', success: false, error: error.message })
    }

    try {
      // Test 3: Can we access any public video's comments (using a known public video)?
      const publicVideoId = 'dQw4w9WgXcQ' // Rick Roll - definitely has comments
      const commentParams = new URLSearchParams({
        part: 'snippet',
        videoId: publicVideoId,
        maxResults: 1
      })
      const commentUrl = `https://www.googleapis.com/youtube/v3/commentThreads?${commentParams}`
      const commentResult = await this.makeAuthenticatedRequest(account, commentUrl)
      tests.push({ test: 'Public Video Comments', success: true, data: commentResult })
    } catch (error) {
      tests.push({ test: 'Public Video Comments', success: false, error: error.message })
    }

    return tests
  }

  // Alternative method to get comments using a different approach
  async getVideoCommentsAlternative(account, videoId, params = {}) {
    console.log('Trying alternative comment fetching method for video:', videoId)

    // Method 1: Try without authentication (for public videos)
    try {
      const queryParams = new URLSearchParams({
        part: 'snippet,replies',
        videoId: videoId,
        maxResults: params.maxResults || 20,
        key: this.clientId // Try using client ID as API key
      })

      const url = `https://www.googleapis.com/youtube/v3/commentThreads?${queryParams}`

      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        console.log('Alternative method (public API) succeeded:', result)
        return result
      } else {
        console.log('Alternative method (public API) failed:', response.status)
      }
    } catch (error) {
      console.log('Alternative method (public API) error:', error)
    }

    // Method 2: Try with minimal authentication
    try {
      const accessToken = await this.getValidAccessToken(account)
      const queryParams = new URLSearchParams({
        part: 'snippet',  // Try with just snippet, no replies
        videoId: videoId,
        maxResults: 5,    // Fewer results
        order: 'time'
      })

      const url = `https://www.googleapis.com/youtube/v3/commentThreads?${queryParams}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Alternative method (minimal auth) succeeded:', result)
        return result
      } else {
        const errorText = await response.text()
        console.log('Alternative method (minimal auth) failed:', response.status, errorText)
      }
    } catch (error) {
      console.log('Alternative method (minimal auth) error:', error)
    }

    throw new Error('All comment fetching methods failed')
  }

  // Get user's playlists (using makeAuthenticatedRequest for consistency)
  async getPlaylists(account, params = {}) {
    try {
      const queryParams = new URLSearchParams({
        part: 'snippet,contentDetails',
        mine: 'true',
        maxResults: params.maxResults || 50,
        ...params
      })

      const url = `https://www.googleapis.com/youtube/v3/playlists?${queryParams}`
      console.log('Fetching playlists from URL:', url)

      const result = await this.makeAuthenticatedRequest(account, url)
      console.log('Playlists API response:', result)

      return result
    } catch (error) {
      console.error('Error in getPlaylists:', error)
      throw error
    }
  }

  // Helper function to get actual video status (including scheduled)
  getActualVideoStatus(video) {
    const privacyStatus = video.status.privacyStatus
    const publishAt = video.status.publishAt

    // Check if video is scheduled (has publishAt and is currently private)
    if (privacyStatus === 'private' && publishAt) {
      const publishTime = new Date(publishAt)
      const now = new Date()

      if (publishTime > now) {
        return 'scheduled'
      }
    }

    return privacyStatus
  }

  // Get video counts by status (fetch all videos in batches)
  async getVideoCountsByStatus(account) {
    const counts = {
      public: 0,
      private: 0,
      unlisted: 0,
      scheduled: 0,
      total: 0
    }

    try {
      // First get the channel's uploads playlist
      const channelData = await this.getChannelAnalytics(account)
      if (!channelData.items || channelData.items.length === 0) {
        return counts
      }

      const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads
      if (!uploadsPlaylistId) {
        return counts
      }

      let nextPageToken = null
      let totalFetched = 0
      const maxToFetch = 500 // Limit to prevent too many API calls

      do {
        // Get videos from uploads playlist
        const playlistParams = new URLSearchParams({
          part: 'snippet',
          playlistId: uploadsPlaylistId,
          maxResults: 50
        })

        if (nextPageToken) {
          playlistParams.set('pageToken', nextPageToken)
        }

        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?${playlistParams}`
        const playlistData = await this.makeAuthenticatedRequest(account, playlistUrl)

        if (!playlistData.items || playlistData.items.length === 0) {
          break
        }

        // Get detailed video information
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',')
        const videoParams = new URLSearchParams({
          part: 'snippet,statistics,status',
          id: videoIds
        })

        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?${videoParams}`
        const videosData = await this.makeAuthenticatedRequest(account, videoUrl)

        if (videosData.items) {
          videosData.items.forEach(video => {
            const actualStatus = this.getActualVideoStatus(video)
            counts[actualStatus] = (counts[actualStatus] || 0) + 1
            counts.total++
          })
          totalFetched += videosData.items.length
        }

        nextPageToken = playlistData.nextPageToken

      } while (nextPageToken && totalFetched < maxToFetch)

      console.log('Total videos counted:', counts.total, 'out of', totalFetched, 'fetched')
      return counts

    } catch (error) {
      console.error('Error counting videos:', error)
      return counts
    }
  }

  // Check if account has upload permissions
  async checkUploadPermissions(account) {
    try {
      const accessToken = await this.getValidAccessToken(account)

      // Check channel status and permissions
      const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=status&mine=true', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Permission check failed:', errorData)
        return { canUpload: false, error: `Failed to check permissions: ${response.statusText}` }
      }

      const data = await response.json()
      console.log('Channel status data:', data) // Debug log
      const channel = data.items?.[0]

      if (!channel) {
        return { canUpload: false, error: 'No channel found' }
      }

      // Check if channel is linked (has a public YouTube identity)
      const isLinked = channel.status?.isLinked === true

      // Check long uploads status - should not be 'disallowed'
      const longUploadsStatus = channel.status?.longUploadsStatus
      const longUploadsAllowed = longUploadsStatus !== 'disallowed'

      // For basic uploads, we mainly need the channel to be linked
      // Long uploads status is only relevant for videos over 15 minutes
      const canUpload = isLinked

      console.log('Permission check results:', {
        isLinked,
        longUploadsStatus,
        longUploadsAllowed,
        canUpload,
        channelStatus: channel.status
      })

      // Be more lenient with permission checking
      // Many channels might not have all status fields properly set
      if (isLinked === false) {
        return {
          canUpload: false,
          error: 'Channel is not linked to a YouTube account. Please complete your YouTube channel setup.'
        }
      }

      // If isLinked is undefined or null, we'll assume it's okay and let the upload attempt proceed
      // The actual upload will fail with a proper error if there are real permission issues
      return {
        canUpload: true,
        error: null,
        longUploadsAllowed, // Additional info for UI
        warning: isLinked === undefined ? 'Could not verify channel status, but upload will be attempted' : null
      }
    } catch (error) {
      console.error('Permission check error:', error)
      return { canUpload: false, error: error.message }
    }
  }



  // Update video
  async updateVideo(account, videoData) {
    try {
      const accessToken = await this.getValidAccessToken(account)

      const response = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to update video: ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating video:', error)
      throw error
    }
  }

  // Delete video
  async deleteVideo(account, videoId) {
    try {
      const accessToken = await this.getValidAccessToken(account)

      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to delete video: ${response.statusText} - ${errorData.error?.message || ''}`)
      }

      return true
    } catch (error) {
      console.error('Error deleting video:', error)
      throw error
    }
  }

  // Add video to playlist
  async addVideoToPlaylist(account, videoId, playlistId) {
    try {
      const accessToken = await this.getValidAccessToken(account)

      const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to add video to playlist: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error adding video to playlist:', error)
      throw error
    }
  }

  // Upload video
  async uploadVideo(account, videoData, file) {
    try {
      console.log('Upload video called with data:', {
        title: videoData.title,
        useSchedule: videoData.useSchedule,
        scheduledPublishTime: videoData.scheduledPublishTime,
        privacyStatus: videoData.privacyStatus
      })

      // Validate inputs
      if (!file) {
        throw new Error('No file provided')
      }

      if (!videoData.title?.trim()) {
        throw new Error('Video title is required')
      }

      if (file.size > 128 * 1024 * 1024 * 1024) { // 128GB limit
        throw new Error('File size exceeds YouTube\'s 128GB limit')
      }

      // Permission check is done in the UI, so we can proceed directly

      const accessToken = await this.getValidAccessToken(account)

      // Prepare metadata
      const metadata = {
        snippet: {
          title: videoData.title,
          description: videoData.description,
          tags: videoData.tags,
          categoryId: videoData.categoryId || '22'
        },
        status: {
          privacyStatus: videoData.privacyStatus || 'private'
        }
      }

      console.log('Before scheduling check:', {
        hasScheduledTime: !!videoData.scheduledPublishTime,
        useSchedule: videoData.useSchedule,
        useScheduleType: typeof videoData.useSchedule,
        willSchedule: !!(videoData.scheduledPublishTime && videoData.useSchedule === true)
      })

      // IMPORTANT: Only add scheduled publish time if user explicitly wants to schedule
      if (videoData.useSchedule === true && videoData.scheduledPublishTime) {
        try {
          // Parse the datetime-local input (YYYY-MM-DDTHH:MM) as local time
          const inputTime = videoData.scheduledPublishTime

          // For datetime-local inputs, we need to be very careful about timezone handling
          // YouTube expects UTC time, but datetime-local gives us local time

          // Method 1: Parse as local time and convert to UTC properly
          const parts = inputTime.split('T')
          const datePart = parts[0] // YYYY-MM-DD
          const timePart = parts[1] // HH:MM

          const [year, month, day] = datePart.split('-').map(Number)
          const [hours, minutes] = timePart.split(':').map(Number)

          // Create date in local timezone
          const scheduledDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
          const now = new Date()

          // Calculate time difference
          const timeDifferenceMinutes = (scheduledDate.getTime() - now.getTime()) / (1000 * 60)

          // YouTube scheduling requirements:
          // - At least 15 minutes in the future
          // - No more than 6 months in the future (YouTube's limit)
          const maxFutureHours = 24 * 180 // 6 months in hours
          const maxFutureMinutes = maxFutureHours * 60

          if (timeDifferenceMinutes < 15) {
            throw new Error(`Scheduled time must be at least 15 minutes in the future. Current difference: ${Math.round(timeDifferenceMinutes)} minutes.`)
          }

          if (timeDifferenceMinutes > maxFutureMinutes) {
            throw new Error(`Scheduled time cannot be more than 6 months in the future. Current difference: ${Math.round(timeDifferenceMinutes / 60 / 24)} days.`)
          }

          // Additional check: YouTube might not allow scheduling more than 7 days ahead for some accounts
          if (timeDifferenceMinutes > 7 * 24 * 60) { // 7 days
            const warningMessage = `Scheduling ${Math.round(timeDifferenceMinutes / 60 / 24)} days ahead. This might fail for some YouTube accounts.`

            if (videoData.skipScheduleWarnings) {
              // Non-blocking warning - just log it
              console.warn('⚠️ Schedule Warning:', warningMessage)
              // The BulkUpload component will handle showing non-blocking notifications
            } else {
              // Traditional blocking alert (for single video upload)
              alert(`Warning: ${warningMessage}`)
            }
          }

          // CRITICAL FIX: YouTube requires scheduled videos to be PRIVATE initially
          // They will automatically become the selected privacy status at publish time
          const originalPrivacy = metadata.status.privacyStatus
          metadata.status.privacyStatus = 'private'

          // Convert to UTC for YouTube API (RFC 3339 format)
          const utcTime = scheduledDate.toISOString()
          metadata.status.publishAt = utcTime

          console.log(`✅ Scheduling video for: ${scheduledDate.toLocaleString()} (${utcTime} UTC)`)
          console.log(`⚠️  Video will be PRIVATE until scheduled publish time, then become ${originalPrivacy}`)

        } catch (error) {
          alert(`Scheduling error: ${error.message}`)
          throw error
        }
      }

      // AGGRESSIVE SAFETY CHECK: Always remove publishAt unless explicitly scheduling
      if (videoData.useSchedule !== true) {
        console.log('AGGRESSIVE SAFETY: Removing any publishAt because useSchedule is not true')
        if (metadata.status.publishAt) {
          delete metadata.status.publishAt
        }
      }

      // FINAL SAFETY: Double check and remove publishAt if it somehow still exists
      if (metadata.status.publishAt && videoData.useSchedule !== true) {
        console.log('FINAL SAFETY: Force removing publishAt')
        delete metadata.status.publishAt
      }

      console.log('Final metadata being sent to YouTube:', JSON.stringify(metadata, null, 2))
      console.log('Has publishAt in final metadata:', !!metadata.status.publishAt)
      console.log('useSchedule value:', videoData.useSchedule, 'type:', typeof videoData.useSchedule)

      // Create proper multipart body for YouTube API
      const boundary = `----formdata-youtube-${Date.now()}`
      const CRLF = '\r\n'

      // Build multipart body parts
      const metadataPart = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify(metadata),
        ''
      ].join(CRLF)

      const mediaPart = [
        `--${boundary}`,
        `Content-Type: ${file.type || 'video/mp4'}`,
        'Content-Transfer-Encoding: binary',
        '',
        ''
      ].join(CRLF)

      const endBoundary = `${CRLF}--${boundary}--${CRLF}`

      // Convert file to array buffer
      let fileBuffer
      if (file.arrayBuffer) {
        // Browser File object
        fileBuffer = await file.arrayBuffer()
      } else if (file.path) {
        // Electron file object with path - read file from disk
        if (window.electronAPI && window.electronAPI.readFile) {
          const fileData = await window.electronAPI.readFile(file.path)
          fileBuffer = fileData
        } else {
          throw new Error('Cannot read file: Electron API not available')
        }
      } else {
        throw new Error('Invalid file object: no arrayBuffer method or path property')
      }

      // Calculate total size
      const metadataBytes = new TextEncoder().encode(metadataPart)
      const mediaHeaderBytes = new TextEncoder().encode(mediaPart)
      const endBytes = new TextEncoder().encode(endBoundary)

      const totalSize = metadataBytes.length + mediaHeaderBytes.length + fileBuffer.byteLength + endBytes.length

      // Create the complete body
      const bodyArray = new Uint8Array(totalSize)
      let offset = 0

      // Add metadata part
      bodyArray.set(metadataBytes, offset)
      offset += metadataBytes.length

      // Add media header
      bodyArray.set(mediaHeaderBytes, offset)
      offset += mediaHeaderBytes.length

      // Add file data
      bodyArray.set(new Uint8Array(fileBuffer), offset)
      offset += fileBuffer.byteLength

      // Add end boundary
      bodyArray.set(endBytes, offset)

      console.log('Uploading with corrected multipart format...')
      console.log('Total body size:', totalSize, 'bytes')

      const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': totalSize.toString()
        },
        body: bodyArray
      })

      if (!response.ok) {
        console.error('Upload failed with status:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response body:', errorText)

        let errorData = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          console.error('Could not parse error response as JSON')
        }

        const errorMessage = errorData.error?.message || errorText || `Upload failed: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const result = await response.json()

      // Add video to selected playlists
      if (videoData.playlistIds && videoData.playlistIds.length > 0) {
        const playlistPromises = videoData.playlistIds.map(playlistId =>
          this.addVideoToPlaylist(account, result.id, playlistId).catch(error => {
            console.error(`Failed to add video to playlist ${playlistId}:`, error)
            return null // Don't fail the entire upload if playlist addition fails
          })
        )

        await Promise.all(playlistPromises)
      }

      return {
        success: true,
        videoId: result.id,
        title: result.snippet.title,
        description: result.snippet.description,
        privacyStatus: result.status.privacyStatus,
        addedToPlaylists: videoData.playlistIds?.length || 0
      }
    } catch (error) {
      console.error('Video upload error:', error)
      return {
        success: false,
        error: error.message || 'Failed to upload video'
      }
    }
  }
}

export const youtubeAuth = new YouTubeAPI()
