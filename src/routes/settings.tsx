import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { setTheme } from "@/actions/theme";
import { setAppLanguage } from "@/actions/language";
import {
  checkForUpdates,
  getAppVersion,
  getUpdateStatus,
  getSystemInfo,
} from "@/actions/app";
import { openExternalLink } from "@/actions/shell";
import { useAppPreferences } from "@/components/app-preferences-provider";
import { LOCAL_STORAGE_KEYS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import langs from "@/localization/langs";
import type { ThemeMode } from "@/types/theme-mode";
import {
  BugIcon,
  DicesIcon,
  Github,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { FaMicrosoft, FaLinux, FaApple } from "react-icons/fa";
import type { UpdateStatusStage } from "@/ipc/app/update-state";
import DiceBox from "@3d-dice/dice-box";
import "@3d-dice/dice-box/dist/style.css";

type AccentName = "slate" | "ocean" | "rose" | "sunset";

const availableIcons = [
  { name: "avell", label: "Avell" },
  { name: "banana", label: "Banana" },
  { name: "dark", label: "Dark" },
  { name: "light", label: "Light" },
  { name: "ocean", label: "Ocean" },
  { name: "pastel", label: "Pastel" },
  { name: "rose", label: "Rose" },
] as const;

const getOsIcon = (platform: string) => {
  switch (platform) {
    case "win32":
      return <FaMicrosoft className="h-3 w-3" />;
    case "darwin":
      return <FaApple className="h-3 w-3" />;
    case "linux":
      return <FaLinux className="h-3 w-3" />;
    default:
      return <FaMicrosoft className="h-3 w-3" />;
  }
};

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { accent, setAccent, theme } = useAppPreferences();
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeMode>("system");
  const [version, setVersion] = React.useState("-");
  const [systemInfo, setSystemInfo] = React.useState<{
    osName: string;
    osVersion: string;
    osBuild: string;
    osEdition: string;
    platform: string;
    windowsVersion: string | null;
    windowsFeatureVersion: string | null;
    windowsBuildNumber: string | null;
  } | null>(null);
  const [, setUpdateStage] = React.useState<UpdateStatusStage>("idle");
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [updateButtonStatus, setUpdateButtonStatus] = React.useState<
    string | null
  >(null);
  const [isRollingD20, setIsRollingD20] = React.useState(false);
  const [showDiceOverlay, setShowDiceOverlay] = React.useState(false);
  const [d20Error, setD20Error] = React.useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = React.useState("avell");
  const diceBoxRef = React.useRef<DiceBox | null>(null);
  const diceBoxInitPromiseRef = React.useRef<Promise<DiceBox> | null>(null);
  const rollTimeoutRef = React.useRef<number | null>(null);
  const updateStatusTimeoutRef = React.useRef<number | null>(null);
  const diceAssetPath = React.useMemo(() => {
    return new URL("./assets/", window.location.href).toString();
  }, []);
  const diceCdnAssetPath =
    "https://unpkg.com/@3d-dice/dice-box@1.1.4/dist/assets/";
  const toggleItemClassName =
    "hover:bg-primary/15 hover:text-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border transition-colors";

  React.useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) {
        window.clearTimeout(rollTimeoutRef.current);
        rollTimeoutRef.current = null;
      }
      if (updateStatusTimeoutRef.current) {
        window.clearTimeout(updateStatusTimeoutRef.current);
        updateStatusTimeoutRef.current = null;
      }
      diceBoxInitPromiseRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    let active = true;

    const localTheme =
      (localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as ThemeMode | null) ??
      "system";
    setSelectedTheme(localTheme);

    const savedIcon =
      localStorage.getItem(LOCAL_STORAGE_KEYS.APP_ICON) ?? "avell";
    setSelectedIcon(savedIcon);

    void getAppVersion()
      .then((nextVersion) => {
        if (!active) return;
        setVersion(nextVersion);
      })
      .catch(() => {
        if (!active) return;
        setVersion("-");
      });

    void getSystemInfo()
      .then((info) => {
        if (!active) return;
        setSystemInfo(info);
      })
      .catch(() => {
        if (!active) return;
        setSystemInfo(null);
      });

    return () => {
      active = false;
    };
  }, [t]);

  async function handleThemeChange(nextTheme: ThemeMode) {
    if (!nextTheme) return;
    setSelectedTheme(nextTheme);
    await setTheme(nextTheme);
  }

  function handleAccentChange(nextAccent: AccentName) {
    if (!nextAccent) return;
    setAccent(nextAccent);
  }

  async function handleIconChange(nextIcon: string) {
    if (!nextIcon) return;
    setSelectedIcon(nextIcon);
    localStorage.setItem(LOCAL_STORAGE_KEYS.APP_ICON, nextIcon);
    await setAppIcon(nextIcon);
  }

  function handleLanguageChange(nextLanguage: string) {
    if (!nextLanguage) return;
    setAppLanguage(nextLanguage, i18n);
  }

  const withTimeout = React.useCallback(
    async <T,>(promise: Promise<T>, timeoutMs: number) => {
      return await Promise.race<T>([
        promise,
        new Promise<T>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error("DICE_TIMEOUT"));
          }, timeoutMs);
        }),
      ]);
    },
    [],
  );

  const initDiceBoxWithAssetPath = React.useCallback(
    async (assetPath: string) => {
      const box = new DiceBox({
        container: "#nexus-d20-overlay",
        origin: "",
        assetPath,
        scale: 4,
        theme: "default",
        offscreen: true,
      });

      await withTimeout(box.init(), 25000);
      const canvas = document.querySelector("#nexus-d20-overlay canvas");
      if (!canvas) {
        throw new Error("DICE_CANVAS_MISSING");
      }

      return box;
    },
    [withTimeout],
  );

  const ensureDiceBox = React.useCallback(async () => {
    if (diceBoxRef.current) {
      return diceBoxRef.current;
    }

    if (diceBoxInitPromiseRef.current) {
      return diceBoxInitPromiseRef.current;
    }

    diceBoxInitPromiseRef.current = (async () => {
      let localErrorMessage = "";
      try {
        const localBox = await initDiceBoxWithAssetPath(diceAssetPath);
        diceBoxRef.current = localBox;
        return localBox;
      } catch (localError) {
        console.warn("Dice init with local assets failed:", localError);
        localErrorMessage =
          localError instanceof Error ? localError.message : String(localError);
      }

      try {
        const cdnBox = await initDiceBoxWithAssetPath(diceCdnAssetPath);
        diceBoxRef.current = cdnBox;
        return cdnBox;
      } catch (cdnError) {
        const cdnErrorMessage =
          cdnError instanceof Error ? cdnError.message : String(cdnError);
        throw new Error(
          `Dice init failed. local=${localErrorMessage || "unknown"} cdn=${cdnErrorMessage}`,
        );
      }
    })();

    try {
      return await diceBoxInitPromiseRef.current;
    } catch (error) {
      diceBoxInitPromiseRef.current = null;
      throw error;
    }
  }, [diceAssetPath, initDiceBoxWithAssetPath]);

  React.useEffect(() => {
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const warmup = () => {
      void ensureDiceBox().catch((error) => {
        console.warn("Dice warmup failed:", error);
      });
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(warmup, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(warmup, 250);
    }

    return () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [ensureDiceBox]);

  async function handleRollD20() {
    if (isRollingD20) {
      return;
    }

    let timedOut = false;
    setD20Error(null);
    setIsRollingD20(true);
    setShowDiceOverlay(true);

    const operationTimeoutId = window.setTimeout(() => {
      timedOut = true;
      setShowDiceOverlay(false);
      setIsRollingD20(false);
      setD20Error(t("settingsD20Timeout"));
    }, 30000);

    try {
      const diceBox = await ensureDiceBox();
      if (timedOut) {
        return;
      }

      if (rollTimeoutRef.current) {
        window.clearTimeout(rollTimeoutRef.current);
      }
      rollTimeoutRef.current = window.setTimeout(() => {
        setShowDiceOverlay(false);
        setIsRollingD20(false);
        rollTimeoutRef.current = null;
      }, 9000);

      diceBox.onRollComplete = () => {
        if (rollTimeoutRef.current) {
          window.clearTimeout(rollTimeoutRef.current);
          rollTimeoutRef.current = null;
        }
        window.setTimeout(() => {
          setShowDiceOverlay(false);
          setIsRollingD20(false);
        }, 500);
      };

      await withTimeout(
        diceBox.roll("1d20", {
          theme: "default",
          themeColor: theme === "dark" ? "#ffffff" : "dark",
          newStartPoint: true,
        }),
        9000,
      );
      if (timedOut) {
        return;
      }
    } catch (error) {
      console.error("D20 roll failed:", error);
      if (error instanceof Error) {
        if (error.message === "DICE_TIMEOUT") {
          setD20Error(t("settingsD20Timeout"));
        } else if (error.message === "DICE_CANVAS_MISSING") {
          setD20Error(t("settingsD20CanvasError"));
        } else {
          setD20Error(t("settingsD20Error"));
        }
      } else {
        setD20Error(t("settingsD20Error"));
      }
      if (rollTimeoutRef.current) {
        window.clearTimeout(rollTimeoutRef.current);
        rollTimeoutRef.current = null;
      }
      setShowDiceOverlay(false);
      setIsRollingD20(false);
    } finally {
      window.clearTimeout(operationTimeoutId);
    }
  }

  async function handleCheckUpdates() {
    const terminalStages: UpdateStatusStage[] = [
      "available",
      "not-available",
      "downloaded",
      "error",
    ];

    try {
      setIsCheckingUpdate(true);
      setUpdateStage("checking");
      setUpdateButtonStatus(t("updateChecking"));

      await checkForUpdates();

      const start = Date.now();
      while (Date.now() - start < 30_000) {
        const status = await getUpdateStatus();
        setUpdateStage(status.stage);

        if (status.stage === "checking") {
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
          continue;
        }

        if (terminalStages.includes(status.stage)) {
          const terminalMessage =
            status.message ??
            (status.stage === "available"
              ? t("updateAvailable")
              : status.stage === "not-available"
                ? t("updateNotAvailable")
                : status.stage === "downloaded"
                  ? t("updateDownloaded")
                  : t("updateCheckError"));
          setUpdateButtonStatus(terminalMessage);
          break;
        }
      }
    } catch {
      setUpdateStage("error");
      setUpdateButtonStatus(t("updateCheckError"));
    } finally {
      setIsCheckingUpdate(false);
      if (updateStatusTimeoutRef.current) {
        window.clearTimeout(updateStatusTimeoutRef.current);
      }
      updateStatusTimeoutRef.current = window.setTimeout(() => {
        setUpdateButtonStatus(null);
        updateStatusTimeoutRef.current = null;
      }, 3000);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("settingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <Label>{t("settingsTheme")}</Label>
            <ToggleGroup
              type="single"
              value={selectedTheme}
              onValueChange={(value) =>
                void handleThemeChange(value as ThemeMode)
              }
            >
              <ToggleGroupItem className={toggleItemClassName} value="light">
                {t("themeLight")}
              </ToggleGroupItem>
              <ToggleGroupItem className={toggleItemClassName} value="dark">
                {t("themeDark")}
              </ToggleGroupItem>
            </ToggleGroup>
          </section>

          <section className="space-y-3">
            <Label>{t("settingsAccent")}</Label>
            <ToggleGroup
              type="single"
              value={accent}
              onValueChange={(value) =>
                handleAccentChange((value as AccentName) || "slate")
              }
            >
              <ToggleGroupItem className={toggleItemClassName} value="slate">
                {t("accentSlate")}
              </ToggleGroupItem>
              <ToggleGroupItem className={toggleItemClassName} value="ocean">
                {t("accentOcean")}
              </ToggleGroupItem>
              <ToggleGroupItem className={toggleItemClassName} value="rose">
                {t("accentRose")}
              </ToggleGroupItem>
              <ToggleGroupItem className={toggleItemClassName} value="sunset">
                {t("accentSunset")}
              </ToggleGroupItem>
              <ToggleGroupItem className={toggleItemClassName} value="pastel">
                {t("accentPastel")}
              </ToggleGroupItem>
              <ToggleGroupItem className={toggleItemClassName} value="banana">
                {t("accentBanana")}
              </ToggleGroupItem>
            </ToggleGroup>
          </section>

          {/* <section className="space-y-3">
            <Label>{t("settingsAppIcon")}</Label>
            <ToggleGroup
              type="single"
              value={selectedIcon}
              onValueChange={(value) => void handleIconChange(value || "avell")}
            >
              {availableIcons.map((icon) => (
                <ToggleGroupItem
                  key={icon.name}
                  className={toggleItemClassName}
                  value={icon.name}
                >
                  {icon.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section> */}

          <section className="space-y-3">
            <Label>{t("settingsLanguage")}</Label>
            <ToggleGroup
              type="single"
              value={i18n.language}
              onValueChange={handleLanguageChange}
            >
              {langs.map((lang) => (
                <ToggleGroupItem
                  key={lang.key}
                  className={toggleItemClassName}
                  value={lang.key}
                >
                  {lang.prefix}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>

          <Separator />

          <section className="space-y-3">
            <Label>{t("settingsUpdates")}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() =>
                  openExternalLink("https://github.com/avell-labs/nexus")
                }
              >
                <Github />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() =>
                  openExternalLink("https://github.com/avell-labs/nexus/issues")
                }
              >
                <BugIcon />
              </Button>
              <Button
                variant="outline"
                size={updateButtonStatus ? "default" : "icon"}
                disabled={isCheckingUpdate}
                className="hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => void handleCheckUpdates()}
              >
                {isCheckingUpdate ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <RefreshCw />
                )}
                {updateButtonStatus ? updateButtonStatus : null}
              </Button>
            </div>
          </section>
          <Separator />
          <section className="space-y-3">
            <Label>{t("osInfo")}</Label>
            <div className="flex flex-wrap items-center gap-2"></div>
            {systemInfo ? (
              <div className="text-muted-foreground space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  {getOsIcon(systemInfo.platform)}
                  {t("osEdition")}: {systemInfo.osEdition}
                </p>
                {systemInfo.platform === "win32" ? (
                  <>
                    <p>
                      {t("osVersion")}:{" "}
                      {systemInfo.windowsFeatureVersion ?? systemInfo.osVersion}
                    </p>
                    {systemInfo.windowsBuildNumber ? (
                      <p>
                        {t("osCompilation")}: {systemInfo.windowsBuildNumber}
                      </p>
                    ) : (
                      <p>
                        {t("osCompilation")}: {systemInfo.osBuild}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      {t("osVersion")}: {systemInfo.osVersion}
                    </p>
                    <p>
                      {t("osCompilation")}: {systemInfo.osBuild}
                    </p>
                  </>
                )}
                <p className="text-muted-foreground text-sm">
                  {t("currentVersion")}: {version}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("settingsSystemInfoUnavailable")}
              </p>
            )}
          </section>

          <Separator />

          <section>
            <Button
              variant="secondary"
              size="icon"
              className="hover:border-primary hover:bg-primary/10 hover:text-primary border border-transparent transition-colors"
              onClick={() => void handleRollD20()}
              disabled={isRollingD20}
            >
              {isRollingD20 ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <DicesIcon />
              )}
            </Button>
            {d20Error ? (
              <p className="text-destructive mt-2 text-xs">{d20Error}</p>
            ) : null}
          </section>
        </CardContent>
      </Card>
      <div
        id="nexus-d20-overlay"
        className={`pointer-events-none fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full ${
          showDiceOverlay ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
