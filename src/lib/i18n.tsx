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
  common: {
    loading: "Loading…",
    refresh: "Refresh",
    retry: "Retry",
    search: "Search",
    updated: "Updated",
    unknownStatus: "Unknown status",
    showing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
  },
  projectLinks: {
    demo: "Demo",
    repo: "Repo",
    readme: "README",
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
  explore: {
    eyebrow: "Discovery",
    projects: "Projects",
    devlogs: "Recent devlogs",
    devlogTitle: (id: number) => `Devlog #${id}`,
    workedOn: "worked on",
    likes: "likes",
    comments: "comments",
    scrapbook: "Scrapbook",
    searchPlaceholder: "Search projects",
    emptyTitle: "No devlogs found",
    emptyBody: "Refresh the devlog feed or try again later.",
  },
  projects: {
    eyebrow: "Your work",
    mine: "My projects",
    loggedTime: (duration: string) => `${duration} logged`,
    emptyTitle: "No projects yet",
    emptyBody: "Projects you create on Flavortown will appear here.",
  },
  shop: {
    eyebrow: "Cookie store",
    catalog: "Catalog",
    item: "Item",
    stock: "Stock",
    maxQty: "Max qty",
    noDescription: "No description available.",
    regions: (regions: string) => `Available in ${regions}`,
    noRegions: "No region availability listed.",
    emptyTitle: "No store items",
    emptyBody: "The store endpoint returned an empty catalog.",
  },
  achievements: {
    eyebrow: "Progress",
    unlocked: "Unlocked achievements",
    emptyTitle: "No achievements unlocked yet",
    emptyBody: "When the API reports achievements for your account, they will show up here.",
  },
  leaderboard: {
    eyebrow: "Community",
    cookies: "Cookies",
    searchPlaceholder: "Search users",
    projectsCount: (n: number) => `${n} projects`,
    scopeNote:
      "This view ranks the current API page by cookies because the public API does not expose a dedicated leaderboard endpoint yet.",
    emptyTitle: "No users found",
    emptyBody: "Try another search or refresh the user list.",
  },
  unavailable: {
    eyebrow: "Flavortown web",
    title: "Open the website",
    shop:
      "Use the Flavortown website for the shop. It has the best checkout, goals, region, stock, and unlock flow.",
    sidequests:
      "Use the Flavortown website for sidequests. It has the full submissions, unlocks, and sidequest pages.",
    vote:
      "Use the Flavortown website for voting. It has the real voting flow and current vote availability.",
    openRealSite: "Open in browser",
    whatWorks: "API-backed screens",
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
  common: {
    loading: "Chargement…",
    refresh: "Rafraîchir",
    retry: "Réessayer",
    search: "Rechercher",
    updated: "Mis à jour",
    unknownStatus: "Statut inconnu",
    showing: (shown: number, total: number) => `${shown} sur ${total} affichés`,
  },
  projectLinks: {
    demo: "Démo",
    repo: "Repo",
    readme: "README",
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
  explore: {
    eyebrow: "Découverte",
    projects: "Projets",
    devlogs: "Devlogs récents",
    devlogTitle: (id: number) => `Devlog #${id}`,
    workedOn: "a travaillé sur",
    likes: "likes",
    comments: "commentaires",
    scrapbook: "Scrapbook",
    searchPlaceholder: "Rechercher des projets",
    emptyTitle: "Aucun devlog trouvé",
    emptyBody: "Rafraîchis le feed de devlogs ou réessaie plus tard.",
  },
  projects: {
    eyebrow: "Ton travail",
    mine: "Mes projets",
    loggedTime: (duration: string) => `${duration} enregistrés`,
    emptyTitle: "Aucun projet pour l'instant",
    emptyBody: "Les projets créés sur Flavortown apparaîtront ici.",
  },
  shop: {
    eyebrow: "Boutique cookies",
    catalog: "Catalogue",
    item: "Article",
    stock: "Stock",
    maxQty: "Qté max",
    noDescription: "Aucune description disponible.",
    regions: (regions: string) => `Disponible en ${regions}`,
    noRegions: "Aucune disponibilité régionale indiquée.",
    emptyTitle: "Aucun article",
    emptyBody: "L'endpoint boutique a renvoyé un catalogue vide.",
  },
  achievements: {
    eyebrow: "Progression",
    unlocked: "Achievements débloqués",
    emptyTitle: "Aucun achievement débloqué pour l'instant",
    emptyBody: "Quand l'API remontera des achievements pour ton compte, ils apparaîtront ici.",
  },
  leaderboard: {
    eyebrow: "Communauté",
    cookies: "Cookies",
    searchPlaceholder: "Rechercher des utilisateurs",
    projectsCount: (n: number) => `${n} projets`,
    scopeNote:
      "Cette vue classe la page API courante par cookies, car l'API publique n'expose pas encore d'endpoint leaderboard dédié.",
    emptyTitle: "Aucun utilisateur trouvé",
    emptyBody: "Essaie une autre recherche ou rafraîchis la liste.",
  },
  unavailable: {
    eyebrow: "Flavortown web",
    title: "Ouvrir le site",
    shop:
      "Pour le shop, passe par le site de Flavortown: c'est mieux pour les commandes, goals, régions, stocks et déblocages.",
    sidequests:
      "Pour les sidequests, passe par le site de Flavortown: c'est mieux pour voir les submissions, déblocages et pages complètes.",
    vote:
      "Pour le vote, passe par le site de Flavortown: c'est mieux pour utiliser le vrai flux et voir tes votes disponibles.",
    openRealSite: "Ouvrir dans le navigateur",
    whatWorks: "Écrans branchés à l'API",
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
