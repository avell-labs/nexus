import { os } from "@orpc/server";
import { app, autoUpdater } from "electron";
import { getUpdateStatus } from "./update-state";

export const currentPlatfom = os.handler(() => {
  return process.platform;
});

export const appVersion = os.handler(() => {
  return app.getVersion();
});

export const updateStatus = os.handler(() => {
  return getUpdateStatus();
});

export const checkForUpdates = os.handler(async () => {
  if (process.env.NODE_ENV === "development") {
    return false;
  }

  autoUpdater.checkForUpdates();
  return true;
});
