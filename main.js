// Homebook desktop shell. All data is stored in Documents/Homebook on this computer.
const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const dataDir = () => path.join(app.getPath("documents"), "Homebook");
const dataFile = () => path.join(dataDir(), "Homebook.json");
const backupDir = () => path.join(dataDir(), "Backups");
const KEEP_BACKUPS = 30;

function ensureDirs() { fs.mkdirSync(backupDir(), { recursive: true }); }

// Write to a temp file first, then rename, so a crash mid-save can't corrupt the real file.
function atomicWrite(file, text) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

// One backup per day, keep the newest 30.
function dailyBackup() {
  if (!fs.existsSync(dataFile())) return;
  const stamp = new Date().toISOString().slice(0, 10);
  const target = path.join(backupDir(), `Homebook ${stamp}.json`);
  if (!fs.existsSync(target)) fs.copyFileSync(dataFile(), target);
  const files = fs.readdirSync(backupDir()).filter(f => f.endsWith(".json")).sort();
  while (files.length > KEEP_BACKUPS) fs.unlinkSync(path.join(backupDir(), files.shift()));
}

ipcMain.handle("hb:load", () => {
  ensureDirs();
  if (!fs.existsSync(dataFile())) return null;
  return fs.readFileSync(dataFile(), "utf8");
});
ipcMain.handle("hb:save", (_e, text) => {
  ensureDirs();
  JSON.parse(text); // refuse to write anything that isn't valid data
  dailyBackup();
  atomicWrite(dataFile(), text);
  return { ok: true, at: Date.now() };
});
ipcMain.handle("hb:where", () => dataDir());
ipcMain.handle("hb:openFolder", () => shell.openPath(dataDir()));
ipcMain.handle("hb:restore", async () => {
  const r = await dialog.showOpenDialog({ title: "Choose a Homebook file or backup", defaultPath: backupDir(),
    filters: [{ name: "Homebook file", extensions: ["json"] }], properties: ["openFile"] });
  if (r.canceled || !r.filePaths[0]) return null;
  return fs.readFileSync(r.filePaths[0], "utf8");
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1300, height: 860, minWidth: 900, minHeight: 600, title: "Homebook", backgroundColor: "#F5F7F4",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile(path.join(__dirname, "app", "index.html"));
  // Never open web pages or navigate away from the app.
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", e => e.preventDefault());
}

// No internet access for app content.
app.whenReady().then(() => {
  const { session } = require("electron");
  session.defaultSession.webRequest.onBeforeRequest((details, cb) => {
    const ok = details.url.startsWith("file://") || details.url.startsWith("devtools://") || details.url.startsWith("blob:") || details.url.startsWith("data:");
    cb({ cancel: !ok });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    { label: "File", submenu: [{ label: "Show my Homebook folder", click: () => shell.openPath(dataDir()) }, { type: "separator" }, { role: process.platform === "darwin" ? "close" : "quit" }] },
    { role: "editMenu" },
    { label: "View", submenu: [{ role: "zoomIn" }, { role: "zoomOut" }, { role: "resetZoom" }, { type: "separator" }, { role: "togglefullscreen" }] }
  ]));
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
