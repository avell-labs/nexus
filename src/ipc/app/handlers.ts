import { os } from "@orpc/server";
import { app, autoUpdater } from "electron";
import { ipcContext } from "@/ipc/context";
import { getUpdateStatus } from "./update-state";
import * as osModule from "os";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export const currentPlatfom = os.handler(() => {
  return process.platform;
});

export const systemInfo = os.handler(() => {
  const platform = process.platform;
  let osName = "Unknown";
  let osVersion = "Unknown";
  let osBuild = "Unknown";
  let osEdition = "Unknown";
  let windowsVersion: string | null = null;
  let windowsFeatureVersion: string | null = null;
  let windowsBuildNumber: string | null = null;

  if (platform === "win32") {
    osName = "Windows";
    const release = osModule.release();
    // Windows release format: major.minor.build
    const parts = release.split(".");
    if (parts.length >= 3) {
      osVersion = `${parts[0]}.${parts[1]}`;
      osBuild = parts[2];
    }

    // Tentar obter edição e versão do Windows via PowerShell (mais confiável)
    try {
      const psCommand = [
        "$key = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion'",
        "$props = Get-ItemProperty -Path $key",
        "$caption = (Get-CimInstance -ClassName Win32_OperatingSystem).Caption",
        "$productName = $props.ProductName",
        "$displayVersion = $props.DisplayVersion",
        "$releaseId = $props.ReleaseId",
        "$currentBuild = $props.CurrentBuildNumber",
        "$ubr = $props.UBR",
        "$featureVersion = if ($displayVersion) { $displayVersion } else { $releaseId }",
        "$buildNumber = if ($currentBuild) { if ($ubr -ne $null) { $currentBuild + '.' + $ubr } else { $currentBuild } } else { '' }",
        "Write-Output ($caption + '|' + $productName + '|' + $featureVersion + '|' + $buildNumber)",
      ].join("; ");

      const output = execSync(`powershell -NoProfile -Command "${psCommand}"`, {
        encoding: "utf-8",
      }).trim();

      const [caption, productName, featureVersion, buildNumber] =
        output.split("|");

      const cleanedCaption = caption?.replace(/^Microsoft\s+/i, "").trim();
      if (cleanedCaption) {
        osEdition = cleanedCaption;
      }

      if (featureVersion && featureVersion !== "Unknown") {
        osVersion = featureVersion.trim();
        windowsFeatureVersion = featureVersion.trim();
      }

      if (buildNumber) {
        osBuild = buildNumber.trim();
        windowsBuildNumber = buildNumber.trim();
      }

      const versionSource = productName || cleanedCaption || "";
      if (versionSource.includes("Windows 11")) {
        windowsVersion = "Windows 11";
      } else if (versionSource.includes("Windows 10")) {
        windowsVersion = "Windows 10";
      }
    } catch {
      // Se falhar, tenta com edição padrão
      osEdition = osName;
    }
  } else if (platform === "darwin") {
    osName = "macOS";
    osVersion = osModule.release();
    osEdition = "macOS";
  } else if (platform === "linux") {
    osName = "Linux";
    osVersion = osModule.release();
    osEdition = "Linux";
  }

  return {
    osName,
    osVersion,
    osBuild,
    osEdition,
    platform,
    windowsVersion,
    windowsFeatureVersion,
    windowsBuildNumber,
  };
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

export const setAppIcon = os.handler((iconName: string) => {
  const mainWindow = ipcContext.getMainWindow();
  if (mainWindow) {
    const iconPath = `images/ico/${iconName}.ico`;
    mainWindow.setIcon(iconPath);
  }
});

export const getReleaseNotes = os.handler(() => {
  const version = app.getVersion();
  const releasePath = path.join(
    process.resourcesPath,
    `../releases/${version}.md`,
  );
  try {
    return fs.readFileSync(releasePath, "utf-8");
  } catch {
    // Fallback to dev path
    const devPath = path.join(__dirname, `../../../releases/${version}.md`);
    try {
      return fs.readFileSync(devPath, "utf-8");
    } catch {
      return "# Release Notes\n\nUnable to load release notes.";
    }
  }
});
