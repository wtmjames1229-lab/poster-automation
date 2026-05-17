'use strict';

const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, Menu } = require('electron');

let mainWindow = null;
let bridge = null;

function bootstrapPaths() {
  const userData = app.getPath('userData');
  process.env.APP_USER_DATA = userData;
  process.env.APP_RESOURCE_ROOT = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
  process.env.ELECTRON_IS_PACKAGED = app.isPackaged ? '1' : '0';
  fs.mkdirSync(userData, { recursive: true });
  fs.mkdirSync(path.join(userData, 'data'), { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 640,
    title: 'Etsy Offsite Ads',
    backgroundColor: '#0c0e12',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (bridge) {
      mainWindow.webContents.send('etsy-ads-event', {
        type: 'hello',
        state: bridge.runState.snapshot(),
        ts: Date.now(),
      });
    }
  });
}

function registerIpc() {
  bridge.runState.bus.on('event', (payload) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('etsy-ads-event', payload);
    }
  });

  ipcMain.handle('get-status', () => bridge.getStatus());
  ipcMain.handle('preflight', () => bridge.preflight());
  ipcMain.handle('login', () => bridge.login());
  ipcMain.handle('reconnect', () => bridge.reconnect());
  ipcMain.handle('refresh-session', () => bridge.refreshSession());
  ipcMain.handle('stop', () => bridge.stop());
  ipcMain.handle('toggle', (_e, { productId, enable }) => bridge.toggle(productId, enable));
  ipcMain.handle('sync-start', (_e, opts) => bridge.syncStart(opts || {}));
  ipcMain.handle('open-config-folder', () => bridge.openConfigFolder());
}

app.whenReady().then(() => {
  bootstrapPaths();
  bridge = require('./bridge');
  registerIpc();
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
