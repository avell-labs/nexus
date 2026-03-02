import { Link } from "@tanstack/react-router";
import {
  NavigationMenu as NavigationMenuBase,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useTranslation } from "react-i18next";

export default function NavigationMenu() {
  const { t } = useTranslation();

  return (
    <NavigationMenuBase className="text-muted-foreground px-2">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link to="/" data-testid="nav-home">
              {t("titleHomePage")}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link to="/search_assistance" data-testid="nav-search-assistance">
              {t("searchPage")}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link to="/trackingPage" data-testid="nav-tracking">
              {t("trackingPage")}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenuBase>
  );
}
