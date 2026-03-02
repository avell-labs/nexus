import ToggleTheme from "@/components/toggle-theme";
import { useTranslation } from "react-i18next";
import LangToggle from "@/components/lang-toggle";
import { createFileRoute } from "@tanstack/react-router";
import NavigationMenu from "@/components/navigation-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Bug, LoaderCircle, RefreshCw } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { openExternalLink } from "@/actions/shell";
import * as React from "react";
import { checkForUpdates, getAppVersion, getUpdateStatus } from "@/actions/app";
import type { UpdateStatus, UpdateStatusStage } from "@/ipc/app/update-state";

function HomePage() {
  const { t } = useTranslation();
  const [, setUpdateStage] = React.useState<UpdateStatusStage>("idle");
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [version, setVersion] = React.useState<string>("-");
  const [updateButtonLabel, setUpdateButtonLabel] = React.useState<string>(
    t("checkUpdates"),
  );

  React.useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const status = await getUpdateStatus();
        if (!active) return;
        setUpdateStage(status.stage);
        syncUpdateToast(status);
      } catch {
        // Ignore status read failures in renderer.
      }
    };

    const loadVersion = async () => {
      try {
        const appVersion = await getAppVersion();
        if (!active) return;
        setVersion(appVersion);
      } catch {
        if (!active) return;
        setVersion("-");
      }
    };

    const syncUpdateToast = (status: UpdateStatus) => {
      if (status.stage === "idle") {
        setUpdateButtonLabel(t("checkUpdates"));
        return;
      }

      if (status.stage === "checking") {
        setUpdateButtonLabel(t("updateChecking"));
        return;
      }

      if (status.stage === "available") {
        setUpdateButtonLabel(status.message ?? t("updateAvailable"));
        return;
      }

      if (status.stage === "not-available") {
        setUpdateButtonLabel(status.message ?? t("updateNotAvailable"));
        return;
      }

      if (status.stage === "downloaded") {
        setUpdateButtonLabel(status.message ?? t("updateDownloaded"));
        return;
      }

      setUpdateButtonLabel(
        status.message ??
          `${t("updateCheckError")}: ${t("updateUnknownError")}`,
      );
    };

    void refresh();
    void loadVersion();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [t]);

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
      setUpdateButtonLabel(t("updateChecking"));

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
          break;
        }
      }
    } catch {
      setUpdateStage("error");
      setUpdateButtonLabel(t("updateCheckError"));
    } finally {
      setIsCheckingUpdate(false);
    }
  }

  return (
    <>
      <NavigationMenu />
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4">
        <Card className="w-full max-w-2xl" data-testid="home-card">
          <CardHeader className="gap-3">
            <span className="flex items-end gap-2"></span>
            <CardTitle className="text-2xl" data-testid="home-title">
              {t("welcomeTitle")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                className="hover:border-primary/40 hover:bg-primary/10 hover:text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:scale-110"
                onClick={() => openExternalLink("https://github.com/mmaachado")}
              >
                <SiGithub />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hover:border-primary/40 hover:bg-primary/10 hover:text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:rotate-[-8deg]"
                onClick={() =>
                  openExternalLink("https://github.com/avell-labs/nexus/issues")
                }
              >
                <Bug />
                {t("reportBug")}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="hover:bg-secondary/70 hover:text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5"
                onClick={() => openExternalLink("https://github.com/mmaachado")}
              >
                <BookOpen />
                {t("documentation")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                data-testid="check-updates-button"
                disabled={isCheckingUpdate}
                className="hover:border-primary/40 hover:bg-primary/10 hover:text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] [&_svg]:transition-transform [&_svg]:duration-200"
                onClick={() => void handleCheckUpdates()}
              >
                {isCheckingUpdate ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <RefreshCw />
                )}
                {updateButtonLabel}
              </Button>
            </div>

            <div className="border-border/70 flex items-center justify-between border-t pt-3">
              <p className="text-muted-foreground text-xs">
                {t("currentVersion")}: <span data-testid="app-version">{version}</span>
              </p>
              <div className="flex items-center gap-2">
                <LangToggle />
                <ToggleTheme />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
