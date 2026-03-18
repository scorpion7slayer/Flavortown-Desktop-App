import { createContext, useContext, useState, type ReactNode } from "react";

/* EN: Language-related types. | FR: Types liés à la langue. */

export type Lang = "en" | "fr";
const LANG_KEY = "ft_lang";

/* EN: Application translations. | FR: Traductions de l'application. */

const en = {
  nav: {
    kitchen: "Kitchen",
    explore: "Explorer",
    projects: "Projects",
    sidequests: "Sidequests",
    vote: "Vote",
    shop: "Shop",
    achievements: "Achievements",
    leaderboard: "Leaderboard",
    settings: "Settings",
  },
  theme: {
    light: "Light mode",
    dark: "Dark mode",
  },
  kitchen: {
    dashboard: "Dashboard",
    statsTitle: "Cookie stats",
    cookies: "Cookies",
    totalTime: "Total time",
    today: "Today",
    devlogs: "Devlogs",
    votesGiven: "Votes given",
    avgPerDevlog: "Avg per devlog",
    devlogsTotal: (n: number) => `${n} devlogs total`,
    chartTitle: "Cumulative coding time",
    notEnoughData: "Not enough data",
    activityTitle: "Activity",
    likesReceived: "Likes received",
    ranking: "Ranking",
    streak: "Streak",
    projects: "Projects",
    less: "Less",
    more: "More",
    loading: "Loading…",
    errorFallback: "Unable to load data.",
  },
  auth: {
    subtitle: "Enter your API key to access your dashboard.",
    connect: "Connect",
    connecting: "Connecting…",
    invalidKey:
      "Invalid API key. Check in Settings → API Key on flavortown.hackclub.com.",
    networkError: (msg: string) =>
      `Network error — unable to reach the API. (${msg})`,
    genericError: (msg: string) => `Error: ${msg}`,
    hintPrefix: "Find your key in",
    hintPath: "Settings → API Key",
    hintSuffix: "on flavortown.hackclub.com",
  },
  settings: {
    title: "Settings",
    languageLabel: "Language",
  },
  placeholder: {
    comingSoon: "coming soon",
  },
  errors: {
    rateLimited: "Too many requests — please wait a few seconds and try again.",
    invalidKey: "Invalid API key.",
    network: "Network error — unable to reach the API.",
    generic: (msg: string) => `Error: ${msg}`,
  },
};

const fr: typeof en = {
  nav: {
    kitchen: "Kitchen",
    explore: "Explorer",
    projects: "Projets",
    sidequests: "Sidequests",
    vote: "Vote",
    shop: "Shop",
    achievements: "Achievements",
    leaderboard: "Leaderboard",
    settings: "Paramètres",
  },
  theme: {
    light: "Mode clair",
    dark: "Mode sombre",
  },
  kitchen: {
    dashboard: "Tableau de bord",
    statsTitle: "Stats cookies",
    cookies: "Cookies",
    totalTime: "Temps total",
    today: "Aujourd'hui",
    devlogs: "Devlogs",
    votesGiven: "Votes donnés",
    avgPerDevlog: "Moy. par devlog",
    devlogsTotal: (n: number) => `${n} devlogs au total`,
    chartTitle: "Temps de code cumulé",
    notEnoughData: "Pas assez de données",
    activityTitle: "Activité",
    likesReceived: "Likes reçus",
    ranking: "Classement",
    streak: "Streak",
    projects: "Projets",
    less: "Moins",
    more: "Plus",
    loading: "Chargement…",
    errorFallback: "Impossible de charger les données.",
  },
  auth: {
    subtitle: "Entre ta clé API pour accéder à ton tableau de bord.",
    connect: "Se connecter",
    connecting: "Connexion…",
    invalidKey:
      "Clé API invalide. Vérifie dans Paramètres → API Key sur flavortown.hackclub.com.",
    networkError: (msg: string) =>
      `Erreur réseau — impossible de joindre l'API. (${msg})`,
    genericError: (msg: string) => `Erreur : ${msg}`,
    hintPrefix: "Retrouve ta clé dans",
    hintPath: "Paramètres → API Key",
    hintSuffix: "sur flavortown.hackclub.com",
  },
  settings: {
    title: "Paramètres",
    languageLabel: "Langue",
  },
  placeholder: {
    comingSoon: "bientôt disponible",
  },
  errors: {
    rateLimited:
      "Trop de requêtes — attends quelques secondes avant de réessayer.",
    invalidKey: "Clé API invalide.",
    network: "Erreur réseau — impossible de joindre l'API.",
    generic: (msg: string) => `Erreur : ${msg}`,
  },
};

export type Translations = typeof en;
const TRANSLATIONS: Record<Lang, Translations> = { en, fr };

/* EN: Internationalization context. | FR: Contexte d'internationalisation. */

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => {},
  t: en,
});

/* EN: Provider that stores and exposes the active language. | FR: Fournisseur qui stocke et expose la langue active. */

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === "fr" ? "fr" : "en";
  });

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

/* EN: Hook for consuming the i18n context. | FR: Hook pour consommer le contexte i18n. */

export function useI18n() {
  return useContext(I18nContext);
}
