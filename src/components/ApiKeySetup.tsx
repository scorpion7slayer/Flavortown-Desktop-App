import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faArrowRight, faSpinner } from "../lib/icons";
import { getMe, API_KEY_STORAGE } from "../lib/api";
import { useI18n } from "../lib/i18n";

interface ApiKeySetupProps {
  onConnected: (key: string) => void;
}

export default function ApiKeySetup({ onConnected }: ApiKeySetupProps) {
  const { t } = useI18n();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect(e: React.SyntheticEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      await getMe(trimmed);
      localStorage.setItem(API_KEY_STORAGE, trimmed);
      onConnected(trimmed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ApiKeySetup] connect error:", msg);
      if (msg === "401" || msg.includes("401")) {
        setError(t.auth.invalidKey);
      } else if (msg === "429" || msg.includes("429")) {
        setError(t.errors.rateLimited);
      } else if (
        msg.toLowerCase().includes("load failed") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("fetch")
      ) {
        setError(t.errors.network);
      } else {
        setError(t.auth.genericError(msg));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen bg-paper flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        {/* EN: Logo and title. | FR: Logo et titre. */}
        <div className="mb-10">
          <img
            src="/logo.avif"
            alt=""
            className="w-10 h-10 mb-6"
            style={{ imageRendering: "crisp-edges" }}
          />
          <h1 className="font-display text-3xl font-bold text-ink tracking-tight leading-none mb-2">
            Flavortown
          </h1>
          <p className="text-sm text-ink-40 font-sans">{t.auth.subtitle}</p>
        </div>

        {/* EN: API key form. | FR: Formulaire de clé API. */}
        <form onSubmit={handleConnect} className="space-y-3">
          <div className="relative">
            <FontAwesomeIcon
              icon={faKey}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-40"
              style={{ fontSize: 12 }}
            />
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="ft_sk_••••••••••••••••••••••"
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-transparent border border-ink-16 rounded-sm pl-9 pr-4 py-2.5
                         font-mono text-xs text-ink placeholder:text-ink-40
                         focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs font-mono text-ink-80 leading-snug">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full flex items-center justify-center gap-2.5
                       bg-ink text-paper font-mono text-xs font-medium
                       px-4 py-2.5 rounded-sm
                       hover:opacity-90 disabled:opacity-40
                       transition-opacity"
          >
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 11 }} />
            ) : (
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 11 }} />
            )}
            {loading ? t.auth.connecting : t.auth.connect}
          </button>
        </form>

        <p className="mt-6 text-xs text-ink-40 leading-relaxed">
          {t.auth.hintPrefix}{" "}
          <span className="font-mono">{t.auth.hintPath}</span>{" "}
          {t.auth.hintSuffix}
        </p>
      </div>
    </div>
  );
}
