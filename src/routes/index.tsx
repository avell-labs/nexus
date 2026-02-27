import ToggleTheme from "@/components/toggle-theme";
import { useTranslation } from "react-i18next";
import LangToggle from "@/components/lang-toggle";
import { createFileRoute } from "@tanstack/react-router";
import NavigationMenu from "@/components/navigation-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Bug } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { openExternalLink } from "@/actions/shell";

function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <NavigationMenu />
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="gap-3">
            <span className="flex items-end gap-2"></span>
            <CardTitle className="text-2xl">{t("welcomeTitle")}</CardTitle>
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
                  openExternalLink("https://github.com/mmaachado/nexus/issues")
                }
              >
                <Bug />
                {t("reportBug")}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="hover:bg-secondary/70 hover:text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5"
                onClick={() =>
                  openExternalLink("https://avell-nexus-docs.vercel.app/")
                }
              >
                <BookOpen />
                {t("documentation")}
              </Button>
            </div>

            <div className="border-border/70 flex items-center justify-between border-t pt-3">
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
