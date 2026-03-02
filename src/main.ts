import { app, autoUpdater, BrowserWindow } from "electron";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { ipcMain } from "electron/main";
import { ipcContext } from "@/ipc/context";
import { IPC_CHANNELS } from "./constants";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import { setUpdateStatus } from "@/ipc/app/update-state";

const inDevelopment = process.env.NODE_ENV === "development";

function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload: preload,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
  });
  ipcContext.setMainWindow(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

function checkForUpdates() {
  if (inDevelopment) {
    return;
  }

  autoUpdater.on("checking-for-update", () => {
    setUpdateStatus("checking", null);
  });

  autoUpdater.on("update-available", () => {
    setUpdateStatus("available", "A new update is available.");
  });

  autoUpdater.on("update-not-available", () => {
    setUpdateStatus("not-available", null);
  });

  autoUpdater.on("update-downloaded", () => {
    setUpdateStatus("downloaded", "Update downloaded. Restart to apply.");
  });

  autoUpdater.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    setUpdateStatus("error", message);
  });

  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: "avell-labs/nexus",
    },
    logger: console,
    notifyUser: true,
  });
}

async function setupORPC() {
  const { rpcHandler } = await import("./ipc/handler");

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;

    serverPort.start();
    rpcHandler.upgrade(serverPort);
  });
}

app
  .whenReady()
  .then(createWindow)
  .then(installExtensions)
  .then(checkForUpdates)
  .then(setupORPC);

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
