import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useI18n, type Lang } from "../lib/i18n";

const LANGUAGES: { id: Lang; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "fr", label: "French",  native: "Français" },
];

export default function Settings() {
  const { t, lang, setLang } = useI18n();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-paper">

      {/* EN: Page header. | FR: En-tête de page. */}
      <div className="px-7 pt-7 pb-5 border-b border-ink-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-40 mb-1">
          {t.nav.settings}
        </p>
        <h1 className="font-display text-[28px] font-bold text-ink leading-none tracking-tight">
          {t.settings.title}
        </h1>
      </div>

      {/* EN: Settings content. | FR: Contenu des paramètres. */}
      <div className="px-7 py-6 space-y-6 max-w-sm">

        {/* EN: Language section. | FR: Section de langue. */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon
              icon={faGlobe}
              className="text-ink-40"
              style={{ fontSize: 10 }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-40">
              {t.settings.languageLabel}
            </span>
          </div>

          <div className="flex flex-col gap-px bg-ink-16 border border-ink-16">
            {LANGUAGES.map(({ id, native }) => {
              const active = lang === id;
              return (
                <button
                  key={id}
                  onClick={() => setLang(id)}
                  className={[
                    "flex items-center justify-between px-4 py-3",
                    "font-mono text-xs text-left transition-colors duration-100",
                    active
                      ? "bg-ink text-paper"
                      : "bg-paper text-ink hover:bg-ink-04",
                  ].join(" ")}
                >
                  <span>{native}</span>
                  {active && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      style={{ fontSize: 10 }}
                      className={active ? "text-paper-80" : "text-ink-40"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
