import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  resources: {
    en: {
      translation: {
        appName: "nexus",
        titleHomePage: "Home Page",
        welcomeTitle: "Welcome to Nexus",
        searchPage: "Search Assistance",
        trackingPage: "Track Order",
        trackingDialog: "Enter the order code (e.g.: FR260000AVN0B)",
        searchBtn: "Search...",
        searchPlaceholder: "Street + number or city + state",
        searchHint: "Type an address like 'Joinville, SC'.",
        searchLoading: "Searching nearest authorized assistance...",
        searchNoResults:
          "No authorized assistance was found for this location.",
        searchNoCityResults: "No authorized assistance was found in this city.",
        searchInvalid: "Please enter at least 3 valid characters.",
        searchError: "Unable to complete the search. Try again in a moment.",
        distanceLabel: "Distance",
        searchLocationLabel: "Resolved location",
        copyBtn: "Copy",
        copyDoneBtn: "Copied",
        assistanceAddress: "Address",
        assistanceContact: "Contact",
        assistanceData: "Data",
        documentation: "Documentation",
        reportBug: "Report a Bug",
        updateAvailable:
          "A new app update is available. Restart after download to apply.",
        updateChecking: "Checking for updates...",
        updateNotAvailable: "You're up to date.",
        updateCheckError: "Unable to check updates right now.",
        checkUpdates: "Check updates",
        updateDownloaded:
          "Update downloaded successfully. Restart the app to apply it.",
        currentVersion: "Current version",
        updateUnknownError: "Unknown update error",
        madeBy: "Made by Marquês",
      },
    },
    "pt-BR": {
      translation: {
        appName: "nexus",
        titleHomePage: "Página Inicial",
        welcomeTitle: "Bem-vindo(a) ao Nexus",
        searchPage: "Buscar Assistência",
        trackingPage: "Rastrear Pedido",
        trackingDialog: "Informe o número do pedido (ex.: FR260000AVN0B)",
        searchBtn: "Pesquisar...",
        searchPlaceholder: "Rua + número ou cidade + estado",
        searchHint: "Digite um endereço como 'Joinville, SC'.",
        searchLoading: "Buscando assistência autorizada mais próxima...",
        searchNoResults:
          "Nenhuma assistência autorizada foi encontrada para essa localização.",
        searchNoCityResults:
          "Nenhuma assistência autorizada foi encontrada nesta cidade.",
        searchInvalid: "Digite ao menos 3 caracteres válidos.",
        searchError:
          "Não foi possível concluir a busca no momento. Tente novamente.",
        distanceLabel: "Distância",
        searchLocationLabel: "Localização encontrada",
        copyBtn: "Copiar",
        copyDoneBtn: "Copiado",
        assistanceAddress: "Endereço",
        assistanceContact: "Contato",
        assistanceData: "Dados",
        documentation: "Documentação",
        reportBug: "Reportar Bug",
        updateAvailable:
          "Uma nova atualização está disponível. Reinicie após o download para aplicar.",
        updateChecking: "Buscando atualizações...",
        updateNotAvailable: "Você já está na versão mais recente.",
        updateCheckError: "Não foi possível verificar atualizações agora.",
        checkUpdates: "Buscar atualizações",
        updateDownloaded:
          "Atualização baixada com sucesso. Reinicie o app para aplicar.",
        currentVersion: "Versão atual",
        updateUnknownError: "Erro de atualização desconhecido",
        madeBy: "Feito por Marquês",
      },
    },
  },
});
