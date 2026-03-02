import { ipc } from "@/ipc/manager";
import type { UpdateStatus } from "@/ipc/app/update-state";

export function getPlatform() {
  return ipc.client.app.currentPlatfom();
}

export function getAppVersion() {
  return ipc.client.app.appVersion();
}

export function getUpdateStatus(): Promise<UpdateStatus> {
  return ipc.client.app.updateStatus();
}

export function checkForUpdates() {
  return ipc.client.app.checkForUpdates();
}
