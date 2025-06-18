const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // OAuth methods
  oauthLogin: (authUrl) => ipcRenderer.invoke('oauth-login', authUrl),
  
  // File system methods
  showFileDialog: (options) => ipcRenderer.invoke('show-file-dialog', options),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // Notification methods
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  
  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Settings import/export
  exportSettings: (settingsData) => ipcRenderer.invoke('export-settings', settingsData),
  importSettings: () => ipcRenderer.invoke('import-settings'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Storage methods (will be implemented with keytar)
  secureStore: {
    get: (key) => ipcRenderer.invoke('secure-store-get', key),
    set: (key, value) => ipcRenderer.invoke('secure-store-set', key, value),
    delete: (key) => ipcRenderer.invoke('secure-store-delete', key)
  },
  
  // YouTube API methods
  youtube: {
    authenticate: (credentials) => ipcRenderer.invoke('youtube-authenticate', credentials),
    uploadVideo: (videoData) => ipcRenderer.invoke('youtube-upload-video', videoData),
    getChannelInfo: () => ipcRenderer.invoke('youtube-get-channel-info'),
    getVideos: (params) => ipcRenderer.invoke('youtube-get-videos', params),
    updateVideo: (videoId, updates) => ipcRenderer.invoke('youtube-update-video', videoId, updates),
    deleteVideo: (videoId) => ipcRenderer.invoke('youtube-delete-video', videoId),
    getComments: (videoId) => ipcRenderer.invoke('youtube-get-comments', videoId),
    replyToComment: (commentId, text) => ipcRenderer.invoke('youtube-reply-comment', commentId, text),
    getAnalytics: (params) => ipcRenderer.invoke('youtube-get-analytics', params),
    analyticsRequest: (requestData) => ipcRenderer.invoke('youtube-analytics-request', requestData),
    peopleRequest: (requestData) => ipcRenderer.invoke('people-api-request', requestData)
  }
});
