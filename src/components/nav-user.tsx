import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { signOutFromEntra } from "@/actions/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  Settings2Icon,
  UserRoundIcon,
} from "lucide-react";

const REDDIT_DEFAULT_AVATARS = [
  "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png",
  "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png",
  "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_3.png",
  "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_4.png",
] as const;

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar: string | null;
  };
}

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

export function NavUser({ user }: NavUserProps) {
  const { t } = useTranslation();
  const { isMobile } = useSidebar();
  const [logoutPending, setLogoutPending] = React.useState(false);
  const [randomAvatar] = React.useState(() => {
    const randomIndex = Math.floor(Math.random() * REDDIT_DEFAULT_AVATARS.length);
    return REDDIT_DEFAULT_AVATARS[randomIndex];
  });

  const avatarSrc = user.avatar ?? randomAvatar;

  async function handleLogout() {
    setLogoutPending(true);
    try {
      await signOutFromEntra();
      window.dispatchEvent(new CustomEvent("nexus:auth-changed"));
    } finally {
      setLogoutPending(false);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarSrc} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarSrc} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <UserRoundIcon />
                {t("navAccountInfo")}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings2Icon />
                  {t("navSettings")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void handleLogout()}
              disabled={logoutPending}
              className="text-destructive focus:text-destructive"
            >
              <LogOutIcon />
              {logoutPending ? t("navLoggingOut") : t("navLogout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
