import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import NavigationMenu from "@/components/navigation-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Search } from "lucide-react"

function SecondPage() {
  const { t } = useTranslation();

    return (
      <>
      <NavigationMenu />
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center gap-2">
            <InputGroup className="max-w-xs">
              <InputGroupInput placeholder={t("searchBtn")} />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>

        </div>
      </div>

    </>
    );

}


export const Route = createFileRoute("/trackingPage")({
  component: SecondPage,
});
