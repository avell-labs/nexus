import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  resources: {
    en: {
      translation: {
        appName: "nexus",
        titleHomePage: "Home Page",
        searchPage: "Search Assistance",
        trackingPage: "Track Order",
        searchBtn: "Search...",
        copyBtn: "Copy",
        assistanceAddress: "Address",
        assistanceContact: "Contact",
        assistanceData: "Data",
        documentation: "Documentation",
        madeBy: "Made by Marquês",
      },
    },
    "pt-BR": {
      translation: {
        appName: "nexus",
        titleHomePage: "Página Inicial",
        searchPage: "Buscar Assistência",
        trackingPage: "Rastrear Pedido",
        searchBtn: "Pesquisar...",
        copyBtn: "Copiar",
        assistanceAddress: "Endereço",
        assistanceContact: "Contato",
        assistanceData: "Dados",
        documentation: "Documentação",
        madeBy: "Feito por Marquês",
      },
    },
  },
});
