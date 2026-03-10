import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, useRouterState } from "@tanstack/react-router";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useAppPreferences } from "@/components/app-preferences-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  SearchIcon,
  TruckIcon,
  SettingsIcon,
  HelpCircleIcon,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  authUser: AuthUser | null;
}

export function AppSidebar({ authUser, ...props }: AppSidebarProps) {
  const { t } = useTranslation();
  const { resolveDisplayName } = useAppPreferences();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const displayName = resolveDisplayName(authUser?.name);
  const email = authUser?.username ?? "user@avell.com.br";
  const avatar = authUser?.avatarUrl ?? null;

  const { accent, theme } = useAppPreferences();

  function resolveLogo() {
    if (accent === "slate") {
      return theme === "dark"
        ? "/images/logo/dark.png"
        : "/images/logo/light.png";
    }

    const map: Record<string, string> = {
      ocean: "/images/logo/ocean.png",
      rose: "/images/logo/rose.png",
      sunset: "/images/logo/sunset.png",
      banana: "/images/logo/banana.png",
      pastel: "/images/logo/pastel.png",
    };

    return map[accent];
  }

  const logo = resolveLogo();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={t("appName")}>
              <button type="button">
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img
                    src={logo}
                    alt="App Logo"
                    className="size-8 object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t("appName")}</span>
                  <span className="truncate text-xs">{t("appTagline")}</span>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          sectionLabel={t("navSectionMain")}
          items={[
            {
              label: t("navAuthorizedSearch"),
              to: "/search_assistance",
              icon: <SearchIcon />,
            },
            {
              label: t("navOrderLookup"),
              to: "/trackingPage",
              icon: <TruckIcon />,
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t("navSettings")}
                isActive={pathname === "/settings"}
              >
                <Link to="/settings">
                  <SettingsIcon />
                  <span>{t("navSettings")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t("navAbout")}
                isActive={pathname === "/about"}
              >
                <Link to="/about">
                  <HelpCircleIcon />
                  <span>{t("navAbout")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavUser
          user={{
            name: displayName,
            email,
            avatar,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
