'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('etsyAds', {
  getStatus: () => ipcRenderer.invoke('get-status'),
  preflight: () => ipcRenderer.invoke('preflight'),
  login: () => ipcRenderer.invoke('login'),
  reconnect: () => ipcRenderer.invoke('reconnect'),
  refreshSession: () => ipcRenderer.invoke('refresh-session'),
  openConfigFolder: () => ipcRenderer.invoke('open-config-folder'),
  stop: () => ipcRenderer.invoke('stop'),
  toggle: (productId, enable) => ipcRenderer.invoke('toggle', { productId, enable }),
  syncStart: (opts) => ipcRenderer.invoke('sync-start', opts),
  onEvent: (callback) => {
    const handler = (_e, payload) => callback(payload);
    ipcRenderer.on('etsy-ads-event', handler);
    return () => ipcRenderer.removeListener('etsy-ads-event', handler);
  },
});
