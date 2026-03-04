import { Link, useRouterState } from "@tanstack/react-router";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface SidebarNavItem {
  label: string;
  to: "/" | "/search_assistance" | "/trackingPage" | "/settings";
  icon: React.ReactNode;
}

export function NavMain({
  items,
  sectionLabel = "Nexus",
}: {
  items: SidebarNavItem[];
  sectionLabel?: string;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{sectionLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              asChild
              tooltip={item.label}
              isActive={pathname === item.to}
            >
              <Link to={item.to}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
