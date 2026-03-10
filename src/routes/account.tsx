import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAppPreferences } from "@/components/app-preferences-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getAuthStatus } from "@/actions/auth";
import type { AuthUser } from "@/types/auth";
import {
  getUserBadges,
  type UserBadge,
} from "@/services/contributors-service";

function AccountPage() {
  const { t } = useTranslation();
  const { preferredName, setPreferredName } = useAppPreferences();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [badges, setBadges] = React.useState<UserBadge[]>([]);

  React.useEffect(() => {
    async function loadAuthUser() {
      const status = await getAuthStatus();
      setAuthUser(status.user);
    }
    void loadAuthUser();
  }, []);

  React.useEffect(() => {
    if (!authUser) {
      setBadges([]);
      return;
    }

    let active = true;
    void getUserBadges({
      name: authUser.name,
      username: authUser.username,
    }).then((nextBadges) => {
      if (!active) return;
      setBadges(nextBadges);
    });

    return () => {
      active = false;
    };
  }, [authUser?.name, authUser?.username]);

  function getInitials(name: string): string {
    const chunks = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase());

    if (!chunks.length) {
      return "US";
    }

    return chunks.join("");
  }

  if (!authUser) {
    return <div>Loading...</div>;
  }

  const avatarSrc = authUser.avatarUrl ?? undefined;

  return (
    <div className="align-center flex flex-1 flex-col gap-4 p-4">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t("accountTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarSrc} alt={authUser.name || "User"} />
                  <AvatarFallback className="text-lg">
                    {getInitials(authUser.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">{authUser.name}</h3>
                    {badges.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {badges.map((badge) => (
                          <img
                            key={badge.key}
                            src={badge.imageUrl}
                            alt={badge.alt}
                            title={badge.label}
                            className="h-4 w-4"
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {authUser.username}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("accountDepartment")}</Label>
                  <p className="text-sm">
                    {authUser.department || t("accountNotAvailable")}
                  </p>
                </div>
                <div>
                  <Label>{t("accountPosition")}</Label>
                  <p className="text-sm">
                    {authUser.position || t("accountNotAvailable")}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label>{t("accountManager")}</Label>
                  <p className="text-sm">
                    {authUser.manager || t("accountNotAvailable")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="nickname-input">{t("settingsNickname")}</Label>
                <Input
                  id="nickname-input"
                  value={preferredName}
                  placeholder={t("settingsNicknamePlaceholder")}
                  onChange={(event) => setPreferredName(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/account")({
  component: AccountPage,
});
