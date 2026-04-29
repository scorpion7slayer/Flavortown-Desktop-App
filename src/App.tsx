import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useTheme } from "./lib/useTheme";
import { useI18n } from "./lib/i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Sidebar, { type Page } from "./components/Sidebar";
import ApiKeySetup from "./components/ApiKeySetup";
import Kitchen from "./pages/Kitchen";
import Settings from "./pages/Settings";
import {
  Explore,
  Projects,
  Achievements,
  Leaderboard,
  UnavailablePage,
} from "./pages/ApiPages";
import { getMe, API_KEY_STORAGE, type UserDetail } from "./lib/api";

export default function App() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const { t } = useI18n();
  const [apiKey, setApiKey] = useState<string>("");
  const [user, setUser] = useState<UserDetail | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activePage, setActivePage] = useState<Page>("kitchen");

  /* EN: Boot by checking the stored API key. | FR: Démarre en vérifiant la clé API stockée. */
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE) ?? "";
    if (!stored) {
      setBootstrapping(false);
      return;
    }
    getMe(stored)
      .then((u) => {
        setApiKey(stored);
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem(API_KEY_STORAGE);
      })
      .finally(() => setBootstrapping(false));
  }, []);

  function handleConnected(key: string) {
    setApiKey(key);
    getMe(key)
      .then(setUser)
      .catch(() => null);
  }

  function handleDisconnect() {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey("");
    setUser(null);
  }

  /* EN: Show the bootstrapping state. | FR: Affiche l'état d'initialisation. */
  if (bootstrapping) {
    return (
      <div className="h-screen bg-paper flex items-center justify-center">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-ink-40"
          style={{ fontSize: 16 }}
        />
      </div>
    );
  }

  /* EN: Show the API key setup when no key is available. | FR: Affiche la configuration de la clé API quand aucune clé n'est disponible. */
  if (!apiKey) {
    return <ApiKeySetup onConnected={handleConnected} />;
  }

  /* EN: Render the main application shell. | FR: Affiche la structure principale de l'application. */
  const PAGES: Record<Page, JSX.Element> = {
    kitchen: <Kitchen key={apiKey} apiKey={apiKey} user={user!} />,
    explore: <Explore apiKey={apiKey} />,
    projects: <Projects apiKey={apiKey} />,
    sidequests: (
      <UnavailablePage
        title={t.nav.sidequests}
        message={t.unavailable.sidequests}
        externalUrl="https://flavortown.hackclub.com/sidequests"
      />
    ),
    vote: (
      <UnavailablePage
        title={t.nav.vote}
        message={t.unavailable.vote}
        externalUrl="https://flavortown.hackclub.com/votes/new"
      />
    ),
    shop: (
      <UnavailablePage
        title={t.nav.shop}
        message={t.unavailable.shop}
        externalUrl="https://flavortown.hackclub.com/shop"
      />
    ),
    achievements: <Achievements apiKey={apiKey} initialUser={user!} />,
    leaderboard: <Leaderboard apiKey={apiKey} />,
    settings: <Settings />,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onDisconnect={handleDisconnect}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {PAGES[activePage]}
      </main>
    </div>
  );
}
