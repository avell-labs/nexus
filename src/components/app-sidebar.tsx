import * as React from "react";
import { useTranslation } from "react-i18next";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  SearchIcon,
  TruckIcon,
  WrenchIcon,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  authUser: AuthUser | null;
}

export function AppSidebar({ authUser, ...props }: AppSidebarProps) {
  const { t } = useTranslation();
  const { resolveDisplayName } = useAppPreferences();

  const displayName = resolveDisplayName(authUser?.name);
  const email = authUser?.username ?? "user@avell.com.br";
  const avatar = authUser?.avatarUrl ?? null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={t("appName")}>
              <button type="button">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <WrenchIcon className="size-4" />
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
