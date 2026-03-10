import {
  appVersion,
  checkForUpdates,
  currentPlatfom,
  getReleaseNotes,
  setAppIcon,
  systemInfo,
  updateStatus,
} from "./handlers";

export const app = {
  currentPlatfom,
  appVersion,
  updateStatus,
  checkForUpdates,
  setAppIcon,
  systemInfo,
  getReleaseNotes,
};
