import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faUtensils,
  faCompass,
  faFolder,
  faMap,
  faStar,
  faCartShopping,
  faTrophy,
  faMedal,
  faArrowRightFromBracket,
  faSun,
  faMoon,
  faGear,
} from "../lib/icons";
import { useI18n } from "../lib/i18n";
import type { User } from "../lib/api";

export type Page =
  | "kitchen"
  | "explore"
  | "projects"
  | "sidequests"
  | "vote"
  | "shop"
  | "achievements"
  | "leaderboard"
  | "settings";

interface NavItem {
  id: Page;
  icon: IconDefinition;
  labelKey: keyof ReturnType<typeof useI18n>["t"]["nav"];
}

const NAV_ITEMS: NavItem[] = [
  { id: "kitchen", icon: faUtensils, labelKey: "kitchen" },
  { id: "explore", icon: faCompass, labelKey: "explore" },
  { id: "projects", icon: faFolder, labelKey: "projects" },
  { id: "sidequests", icon: faMap, labelKey: "sidequests" },
  { id: "vote", icon: faStar, labelKey: "vote" },
  { id: "shop", icon: faCartShopping, labelKey: "shop" },
  { id: "achievements", icon: faTrophy, labelKey: "achievements" },
  { id: "leaderboard", icon: faMedal, labelKey: "leaderboard" },
];

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  user: User | null;
  onDisconnect: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Sidebar({
  activePage,
  onNavigate,
  user,
  onDisconnect,
  isDark,
  onToggleTheme,
}: SidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="w-50 shrink-0 h-screen flex flex-col bg-ink text-paper">
      {/* EN: Brand block. | FR: Bloc de marque. */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-paper-08">
        <img src="/logo.avif" alt="" className="w-6 h-6 shrink-0 rounded-sm" />
        <div>
          <p className="font-display text-[13px] font-bold leading-none tracking-wide">
            Flavortown
          </p>
          <p className="font-mono text-[9px] text-paper-16 mt-0.5 tracking-widest uppercase">
            Hack Club
          </p>
        </div>
      </div>

      {/* EN: Main navigation. | FR: Navigation principale. */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map(({ id, icon, labelKey }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={[
                "w-full flex items-center gap-3 px-5 py-2.25",
                "text-left font-sans text-[12px] font-medium",
                "transition-colors duration-100",
                active
                  ? "bg-paper text-ink"
                  : "text-paper-80 hover:bg-paper-08 hover:text-paper",
              ].join(" ")}
            >
              <FontAwesomeIcon
                icon={icon}
                className="w-3.5 shrink-0"
                style={{ fontSize: 12 }}
              />
              {t.nav[labelKey]}
            </button>
          );
        })}
      </nav>

      {/* EN: Theme toggle action. | FR: Action de changement de thème. */}
      <div className="px-4 pb-1">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-sm
                     text-paper-80 hover:bg-paper-08 hover:text-paper
                     transition-colors duration-100 font-sans text-[12px] font-medium"
          title={isDark ? t.theme.light : t.theme.dark}
        >
          <FontAwesomeIcon
            icon={isDark ? faSun : faMoon}
            className="w-3.5 shrink-0"
            style={{ fontSize: 12 }}
          />
          {isDark ? t.theme.light : t.theme.dark}
        </button>
      </div>

      {/* EN: Settings shortcut. | FR: Raccourci vers les paramètres. */}
      <div className="px-4 pb-2">
        <button
          onClick={() => onNavigate("settings")}
          className={[
            "w-full flex items-center gap-3 px-2 py-2 rounded-sm",
            "font-sans text-[12px] font-medium transition-colors duration-100",
            activePage === "settings"
              ? "bg-paper text-ink"
              : "text-paper-80 hover:bg-paper-08 hover:text-paper",
          ].join(" ")}
        >
          <FontAwesomeIcon
            icon={faGear}
            className="w-3.5 shrink-0"
            style={{ fontSize: 12 }}
          />
          {t.nav.settings}
        </button>
      </div>

      {/* EN: User summary and disconnect action. | FR: Résumé utilisateur et action de déconnexion. */}
      <div className="border-t border-paper-08 px-4 py-3">
        {user ? (
          <div className="flex items-center gap-2.5">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-7 h-7 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full bg-paper-16 shrink-0 flex items-center justify-center
                            font-mono text-[11px] text-paper font-bold"
              >
                {user.display_name[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[12px] font-semibold text-paper truncate leading-tight">
                {user.display_name}
              </p>
              <p className="font-mono text-[10px] text-paper-80 leading-tight mt-0.5">
                {user.cookies ?? 0} cookies
              </p>
            </div>
            <button
              onClick={onDisconnect}
              className="shrink-0 text-paper-16 hover:text-paper transition-colors ml-1"
              title="Se déconnecter"
            >
              <FontAwesomeIcon
                icon={faArrowRightFromBracket}
                style={{ fontSize: 11 }}
              />
            </button>
          </div>
        ) : (
          <div className="h-9 bg-paper-08 rounded-sm animate-pulse" />
        )}
      </div>
    </aside>
  );
}
