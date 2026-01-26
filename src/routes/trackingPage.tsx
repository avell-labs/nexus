import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import NavigationMenu from "@/components/navigation-menu";
import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";

function SecondPage() {
  const { t } = useTranslation();
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const handleGenerateUrl = () => {
    if (trackingCode.trim()) {
      const baseUrl = "https://ondeestameupedido.com.br/";
      setTrackingUrl(`${baseUrl}${trackingCode}`);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleGenerateUrl();
    }
  };

  return (
    <>
      <NavigationMenu />
      <div className="flex h-screen flex-col">
        <div className="flex flex-1 flex-col gap-4 p-6">
          {/* Input Section */}
          <div className="flex items-center justify-center gap-2">
            <InputGroup className="max-w-xs">
              <InputGroupInput
                placeholder={t("searchBtn")}
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <InputGroupAddon>
                <button
                  onClick={handleGenerateUrl}
                  className="flex items-center justify-center rounded p-2 hover:bg-gray-100"
                >
                  <Search size={20} />
                </button>
              </InputGroupAddon>
            </InputGroup>
          </div>

          {trackingUrl && (
            <div className="flex-1 overflow-hidden rounded-lg border">
              <iframe
                src={trackingUrl}
                className="h-full w-full border-none"
                title="Order Tracking"
              />
            </div>
          )}

          {!trackingUrl && (
            <div className="flex items-center justify-center p-2 text-gray-400">
              <p>{t("trackingDialog")}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/trackingPage")({
  component: SecondPage,
});
