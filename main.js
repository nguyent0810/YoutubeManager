const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const fetch = require('node-fetch');

// Initialize secure store
const secureStore = new Store({
  name: 'secure-credentials',
  encryptionKey: 'youtube-manager-secure-key'
});
const isDev = !app.isPackaged;

// Keep a global reference of the window object
let mainWindow;
let oauthWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/youtube-manager-icon.ico'),
    show: false,
    titleBarStyle: 'hiddenInset',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#000000',
      height: 40
    }
  });

  // Load the app from built files
  mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  // DevTools can be opened manually with F12 if needed

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize(); // Maximize by default
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// OAuth window for Google authentication
function createOAuthWindow(authUrl) {
  return new Promise((resolve, reject) => {
    oauthWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: true,
      modal: true,
      parent: mainWindow,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    oauthWindow.loadURL(authUrl);

    // Handle navigation to capture the authorization code
    oauthWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const url = new URL(navigationUrl);

      // For desktop app flow, look for the success page with the code
      if (url.hostname === 'accounts.google.com' && url.pathname.includes('approval')) {
        // The code will be displayed on the page, we need to extract it
        return;
      }

      if (url.searchParams.has('code')) {
        const code = url.searchParams.get('code');
        oauthWindow.close();
        resolve(code);
      } else if (url.searchParams.has('error')) {
        const error = url.searchParams.get('error');
        oauthWindow.close();
        reject(new Error(error));
      }
    });

    // Also listen for page title changes to catch the authorization code
    oauthWindow.webContents.on('page-title-updated', (event, title) => {
      if (title.startsWith('Success code=')) {
        const code = title.replace('Success code=', '');
        oauthWindow.close();
        resolve(code);
      } else if (title.includes('code')) {
        // Try to extract code from title
        const match = title.match(/code[=\s]+([a-zA-Z0-9\/\-_]+)/);
        if (match) {
          oauthWindow.close();
          resolve(match[1]);
        }
      }
    });

    oauthWindow.on('closed', () => {
      oauthWindow = null;
      reject(new Error('OAuth window was closed'));
    });
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('oauth-login', async (event, authUrl) => {
  try {
    const code = await createOAuthWindow(authUrl);
    return { success: true, code };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-file-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-notification', async (event, options) => {
  if (Notification.isSupported()) {
    const notification = new Notification(options);
    notification.show();
    return true;
  }
  return false;
});

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

// Secure storage handlers
ipcMain.handle('secure-store-get', async (event, key) => {
  try {
    return secureStore.get(key, null);
  } catch (error) {
    console.error('Failed to get from secure store:', error);
    return null;
  }
});

ipcMain.handle('secure-store-set', async (event, key, value) => {
  try {
    secureStore.set(key, value);
    return true;
  } catch (error) {
    console.error('Failed to set in secure store:', error);
    return false;
  }
});

// Folder selection for bulk upload
ipcMain.handle('select-folder', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Video Folder'
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const folderPath = result.filePaths[0];
    const files = [];

    // Read all files in the selected folder
    const dirContents = fs.readdirSync(folderPath);

    for (const item of dirContents) {
      const itemPath = path.join(folderPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isFile()) {
        files.push({
          name: item,
          path: itemPath,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }

    return {
      success: true,
      folderPath,
      files
    };
  } catch (error) {
    console.error('Failed to select folder:', error);
    return { success: false, error: error.message };
  }
});

// Read file for bulk upload
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer;
  } catch (error) {
    console.error('Failed to read file:', error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('secure-store-delete', async (event, key) => {
  try {
    secureStore.delete(key);
    return true;
  } catch (error) {
    console.error('Failed to delete from secure store:', error);
    return false;
  }
});

// Window control handlers
ipcMain.handle('minimize-window', async () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', async () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', async () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Settings import/export handlers
ipcMain.handle('export-settings', async (event, settingsData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Settings',
      defaultPath: `ytm-settings-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(result.filePath, JSON.stringify(settingsData, null, 2));
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Failed to export settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-settings', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Settings',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const settingsData = JSON.parse(fileContent);

    return { success: true, data: settingsData };
  } catch (error) {
    console.error('Failed to import settings:', error);
    return { success: false, error: error.message };
  }
});

// YouTube API handlers
ipcMain.handle('youtube-authenticate', async (event, credentials) => {
  // This would be handled by the renderer process
  return { success: false, error: 'Authentication should be handled in renderer process' };
});

ipcMain.handle('youtube-upload-video', async (event, videoData) => {
  try {
    // For now, return an error indicating the upload needs proper implementation
    return {
      success: false,
      error: 'Video upload functionality needs to be implemented with proper YouTube Data API integration'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('youtube-get-channel-info', async (event) => {
  // This would be handled by the renderer process
  return { success: false, error: 'Channel info should be handled in renderer process' };
});

ipcMain.handle('youtube-get-videos', async (event, params) => {
  // This would be handled by the renderer process
  return { success: false, error: 'Get videos should be handled in renderer process' };
});

ipcMain.handle('youtube-update-video', async (event, videoId, updates) => {
  // This would be handled by the renderer process
  return { success: false, error: 'Update video should be handled in renderer process' };
});

ipcMain.handle('youtube-delete-video', async (event, videoId) => {
  // This would be handled by the renderer process
  return { success: false, error: 'Delete video should be handled in renderer process' };
});

ipcMain.handle('youtube-get-comments', async (event, videoId) => {
  // This would be handled by the renderer process
  return { success: false, error: 'Get comments should be handled in renderer process' };
});

ipcMain.handle('youtube-reply-comment', async (event, commentId, text) => {
  // This would be handled by the renderer process
  return { success: false, error: 'Reply to comment should be handled in renderer process' };
});

// YouTube Analytics API handlers (main process to avoid CSP issues)
ipcMain.handle('youtube-analytics-request', async (event, { accessToken, url, options = {} }) => {
  try {
    console.log('Analytics API Request:', url);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analytics API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        errorBody: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('YouTube Analytics API error:', error);
    return { success: false, error: error.message };
  }
});

// People API handler (main process to avoid CSP issues)
ipcMain.handle('people-api-request', async (event, { accessToken, url, options = {} }) => {
  try {
    console.log('People API Request:', url);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('People API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        errorBody: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('People API error:', error);
    return { success: false, error: error.message };
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
