import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import NavigationMenu from "@/components/navigation-menu";
import * as React from "react"

import {
  Map,
  MapCircle,
  MapPopup,
  MapTileLayer,
  MapFullscreenControl,
  MapZoomControl,
} from "@/components/ui/map";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { Search, Copy } from "lucide-react"


import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronsUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"

function SecondPage() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <NavigationMenu />
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-2">

            <InputGroup className="max-w-xs">
              <InputGroupInput placeholder={t("searchBtn")} />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>

            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="flex w-[350px] flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-4 px-4">
                <h4 className="text-sm font-semibold">Avell Joinville</h4><Badge>Centro de Reparo</Badge>
                <CollapsibleTrigger render={<Button variant="ghost" size="icon" className="size-8"><ChevronsUpDown /><span className="sr-only">Toggle details</span></Button>} />
              </div>
              <CollapsibleContent className="flex flex-col gap-2">
                <div className="rounded-md border px-4 py-2 text-sm">
                  <p className="font-medium">{t("assistanceAddress")}</p>
                  <p className="text-muted-foreground">Rua Itajubá, 768 - nº 28A - Bom Retiro, Joinville - SC</p>
                  <p className="font-medium">{t("assistanceContact")}</p>
                  <p className="text-muted-foreground">(47) 9 9990-0192 | suporte@avell.com.br</p>
                  <p className="font-medium">{t("assistanceData")}</p>
                  <p className="text-muted-foreground">CNPJ: 19.117.785/0001-05 | CRM: C0XXXXX</p>
                </div>
                  <Button variant="outline" size="sm">
                    <Copy />{t("copyBtn")}
                  </Button>
              </CollapsibleContent>

            </Collapsible>

            <Map className="mx-auto w-full" center={[-26.2534, -48.8401]}>
              <MapTileLayer />
              <MapZoomControl />
              <MapFullscreenControl />
              <MapCircle
                center={[-26.2534, -48.8401]}
                radius={100}
                className="fill-yellow-600 stroke-yellow-600 stroke-1"
            />
            </Map>
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/search_assistance")({
  component: SecondPage,
});
