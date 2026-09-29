const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("homebookDesktop", {
  load: () => ipcRenderer.invoke("hb:load"),
  save: text => ipcRenderer.invoke("hb:save", text),
  where: () => ipcRenderer.invoke("hb:where"),
  openFolder: () => ipcRenderer.invoke("hb:openFolder"),
  restore: () => ipcRenderer.invoke("hb:restore"),
  refocus: () => ipcRenderer.invoke("hb:refocus"),
  version: () => ipcRenderer.invoke("hb:version")
});
