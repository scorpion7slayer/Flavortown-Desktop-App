import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useI18n } from "../lib/i18n";
import { invalidateUser } from "../lib/api";
import {
  faCookie,
  faBolt,
  faPen,
  faHeart,
  faMedal,
  faChartLine,
  faCalendarDays,
  faSpinner,
  faTriangleExclamation,
  faFolderOpen,
  faArrowsRotate,
} from "../lib/icons";
import {
  absoluteFlavortownUrl,
  getAllUserDevlogs,
  getMyProjects,
  buildCumulativeChart,
  buildHeatmap,
  fmtDuration,
  type UserDetail,
  type Devlog,
  type Project,
} from "../lib/api";

/* EN: Small section label with an icon. | FR: Petit libellé de section avec une icône. */
function Label({ icon, children }: { icon: IconDefinition; children: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <FontAwesomeIcon
        icon={icon}
        className="text-ink-40"
        style={{ fontSize: 10 }}
      />
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-40">
        {children}
      </span>
    </div>
  );
}

/* EN: Reusable stat card. | FR: Carte de statistique réutilisable. */
function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-ink-16 p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-40 mb-2">
        {label}
      </p>
      <p className="font-mono text-2xl font-semibold text-ink leading-none">
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] text-ink-40 mt-1.5">{sub}</p>}
    </div>
  );
}

/* EN: Simple line chart for cumulative minutes. | FR: Graphique en ligne simple pour les minutes cumulatives. */
function LineChart({ data }: { data: { date: string; minutes: number }[] }) {
  if (data.length < 2) {
    return (
      <div className="h-28 flex items-center justify-center">
        <p className="font-mono text-[10px] text-ink-40">
          Pas assez de données
        </p>
      </div>
    );
  }

  const W = 600,
    H = 120;
  const pad = { top: 10, right: 8, bottom: 24, left: 36 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const maxV = Math.max(...data.map((d) => d.minutes));

  const xp = (i: number) => pad.left + (i / (data.length - 1)) * iW;
  const yp = (v: number) => pad.top + iH - (v / maxV) * iH;

  const path = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"}${xp(i).toFixed(1)},${yp(d.minutes).toFixed(1)}`,
    )
    .join(" ");

  const area = `${path} L${xp(data.length - 1)},${H - pad.bottom} L${xp(0)},${H - pad.bottom} Z`;

  const gridVals = [0, Math.round(maxV / 2), maxV];
  const step = Math.max(1, Math.floor((data.length - 1) / 3));
  const labelIdxs = Array.from({ length: 4 }, (_, i) =>
    Math.min(i * step, data.length - 1),
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridVals.map((v) => (
        <g key={v}>
          <line
            x1={pad.left}
            y1={yp(v)}
            x2={W - pad.right}
            y2={yp(v)}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
          <text
            x={pad.left - 4}
            y={yp(v) + 4}
            textAnchor="end"
            fill="currentColor"
            fillOpacity="0.35"
            fontSize="9"
            fontFamily="'Iosevka Charon Mono', monospace"
          >
            {v}m
          </text>
        </g>
      ))}

      <path d={area} fill="url(#areaG)" />
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((d, i) => (
        <circle
          key={i}
          cx={xp(i)}
          cy={yp(d.minutes)}
          r="2.5"
          fill="currentColor"
        />
      ))}

      {data.map((d, i) =>
        labelIdxs.includes(i) ? (
          <text
            key={i}
            x={xp(i)}
            y={H - 8}
            textAnchor="middle"
            fill="currentColor"
            fillOpacity="0.35"
            fontSize="9"
            fontFamily="'Iosevka Charon Mono', monospace"
          >
            {d.date}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/* EN: Activity heatmap helpers and component. | FR: Utilitaires et composant de heatmap d'activité. */
const CELL_OPACITY = [0.04, 0.2, 0.45, 0.7, 1.0];
const MONTH_FR: Record<string, string> = {
  "01": "Jan",
  "02": "Fév",
  "03": "Mar",
  "04": "Avr",
  "05": "Mai",
  "06": "Jun",
  "07": "Jul",
  "08": "Aoû",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Déc",
};

function ActivityHeatmap({
  cells,
}: {
  cells: { date: string; count: number }[];
}) {
  const { t } = useI18n();
  if (cells.length === 0) return null;

  const cell = 11,
    gap = 2.5;
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // EN: Compute the week index where each month label starts. | FR: Calcule l'index de semaine où commence chaque libellé de mois.
  const monthLabels: { label: string; weekIdx: number }[] = [];
  let lastMonth = "";
  weeks.forEach((week, wi) => {
    const month = week[0]?.date.slice(5, 7) ?? "";
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTH_FR[month] ?? month, weekIdx: wi });
      lastMonth = month;
    }
  });

  return (
    <div>
      {/* EN: Render month labels. | FR: Affiche les libellés des mois. */}
      <div className="flex mb-1" style={{ gap, paddingLeft: 24 }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find((m) => m.weekIdx === wi);
          return (
            <div key={wi} style={{ width: cell, flexShrink: 0 }}>
              {ml && (
                <span className="font-mono text-[8px] text-ink-40 whitespace-nowrap">
                  {ml.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-start" style={{ gap }}>
        {/* EN: Render day labels. | FR: Affiche les libellés des jours. */}
        <div className="flex flex-col shrink-0 mr-0.5" style={{ gap }}>
          {["L", "", "M", "", "V", "", ""].map((d, i) => (
            <div
              key={i}
              style={{ height: cell, lineHeight: `${cell}px` }}
              className="font-mono text-[7px] text-ink-40 w-4 text-right"
            >
              {d}
            </div>
          ))}
        </div>

        {/* EN: Render heatmap cells. | FR: Affiche les cellules de la heatmap. */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap }}>
            {week.map((c, di) => {
              const lvl = Math.min(c.count, 4);
              return (
                <div
                  key={di}
                  title={`${c.date}: ${c.count} devlog(s)`}
                  style={{
                    width: cell,
                    height: cell,
                    borderRadius: 1.5,
                    backgroundColor: "var(--color-ink)",
                    opacity: CELL_OPACITY[lvl],
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-2 font-mono text-[8px] text-ink-40">
        <span>{t.kitchen.less}</span>
        {CELL_OPACITY.map((o, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 1,
              backgroundColor: "var(--color-ink)",
              opacity: o,
            }}
          />
        ))}
        <span>{t.kitchen.more}</span>
      </div>
    </div>
  );
}

/* EN: Single project row in the project list. | FR: Ligne de projet dans la liste des projets. */
function ProjectRow({ project }: { project: Project }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-08 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[12px] font-semibold text-ink truncate">
          {project.title}
        </p>
        {project.description && (
          <p className="font-sans text-[11px] text-ink-40 truncate mt-0.5">
            {project.description}
          </p>
        )}
      </div>
      <div className="shrink-0 ml-4 flex items-center gap-1.5 font-mono text-[10px] text-ink-40">
        <FontAwesomeIcon icon={faPen} style={{ fontSize: 9 }} />
        {project.devlog_ids.length}
      </div>
    </div>
  );
}

/* EN: Main Kitchen page component. | FR: Composant principal de la page Kitchen. */
interface KitchenData {
  user: UserDetail;
  devlogs: Devlog[];
  projects: Project[];
}

function translateError(
  msg: string,
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (msg === "429" || msg.includes("429")) return t.errors.rateLimited;
  if (msg === "401" || msg.includes("401")) return t.errors.invalidKey;
  if (
    msg.toLowerCase().includes("load failed") ||
    msg.toLowerCase().includes("network")
  )
    return t.errors.network;
  return t.errors.generic(msg);
}

export default function Kitchen({
  apiKey,
  user: initialUser,
}: {
  apiKey: string;
  user: UserDetail;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<KitchenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (opts?: { invalidate?: boolean }) => {
      if (opts?.invalidate) {
        invalidateUser(apiKey);
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      try {
        const [devlogs, projects] = await Promise.all([
          getAllUserDevlogs(apiKey, initialUser.project_ids),
          getMyProjects(apiKey),
        ]);
        setData({ user: initialUser, devlogs, projects });
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiKey, initialUser],
  );

  useEffect(() => {
    load();
  }, [load]);

  /* EN: Render the loading state. | FR: Affiche l'état de chargement. */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2.5">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-ink-40"
          style={{ fontSize: 14 }}
        />
        <span className="font-mono text-xs text-ink-40">
          {t.kitchen.loading}
        </span>
      </div>
    );
  }

  /* EN: Render the error state. | FR: Affiche l'état d'erreur. */
  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="text-ink-40"
          style={{ fontSize: 20 }}
        />
        <p className="font-mono text-xs text-ink-80">
          {error ? translateError(error, t) : t.kitchen.errorFallback}
        </p>
        <button
          onClick={() => load({ invalidate: true })}
          disabled={refreshing}
          className="flex items-center gap-2 font-mono text-[11px] text-ink-40
                     hover:text-ink transition-colors disabled:opacity-40"
        >
          <FontAwesomeIcon
            icon={faArrowsRotate}
            spin={refreshing}
            style={{ fontSize: 11 }}
          />
          {t.kitchen.loading}
        </button>
      </div>
    );
  }

  const { user, devlogs, projects } = data;
  const chartData = buildCumulativeChart(devlogs);
  const heatmap = buildHeatmap(devlogs);

  const totalDevlogs = devlogs.length;
  const projectCount = Math.max(projects.length, user.project_ids.length);
  const avgSeconds =
    totalDevlogs > 0 ? Math.round(user.devlog_seconds_total / totalDevlogs) : 0;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-paper">
      {/* EN: Page header. | FR: En-tête de page. */}
      <div className="flex items-end justify-between px-7 pt-7 pb-5 border-b border-ink-16">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-40 mb-1">
            {t.kitchen.dashboard}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-bold text-ink leading-none tracking-tight">
              Kitchen
            </h1>
            <button
              onClick={() => load({ invalidate: true })}
              disabled={refreshing}
              title="Refresh"
              className="text-ink-40 hover:text-ink transition-colors disabled:opacity-40 pb-0.5"
            >
              <FontAwesomeIcon
                icon={faArrowsRotate}
                spin={refreshing}
                style={{ fontSize: 12 }}
              />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          {user.avatar && (
            <img
              src={absoluteFlavortownUrl(user.avatar) ?? ""}
              alt=""
              className="w-7 h-7 rounded-full object-cover border border-ink-16"
            />
          )}
          <div className="text-right">
            <p className="font-sans text-[12px] font-semibold text-ink">
              {user.display_name}
            </p>
            <p className="font-mono text-[10px] text-ink-40">
              {user.cookies ?? 0} cookies
            </p>
          </div>
        </div>
      </div>

      <div className="px-7 py-6 space-y-7">
        {/* EN: Stats section. | FR: Section des statistiques. */}
        <section>
          <Label icon={faCookie}>{t.kitchen.statsTitle}</Label>
          <div className="grid grid-cols-3 gap-px bg-ink-16">
            <StatCard
              label={t.kitchen.cookies}
              value={String(user.cookies ?? 0)}
            />
            <StatCard
              label={t.kitchen.totalTime}
              value={fmtDuration(user.devlog_seconds_total)}
            />
            <StatCard
              label={t.kitchen.today}
              value={fmtDuration(user.devlog_seconds_today)}
            />
            <StatCard label={t.kitchen.devlogs} value={String(totalDevlogs)} />
            <StatCard
              label={t.kitchen.votesGiven}
              value={String(user.vote_count)}
            />
            <StatCard
              label={t.kitchen.avgPerDevlog}
              value={fmtDuration(avgSeconds)}
              sub={t.kitchen.devlogsTotal(totalDevlogs)}
            />
          </div>
        </section>

        {/* EN: Chart section. | FR: Section du graphique. */}
        <section>
          <Label icon={faChartLine}>{t.kitchen.chartTitle}</Label>
          <div className="border border-ink-16 p-4">
            <LineChart data={chartData} />
          </div>
        </section>

        {/* EN: Heatmap section. | FR: Section de la heatmap. */}
        <section>
          <Label icon={faCalendarDays}>{t.kitchen.activityTitle}</Label>
          <div className="border border-ink-16 p-5">
            {/* EN: Mini stats row. | FR: Ligne de mini-statistiques. */}
            <div className="grid grid-cols-4 gap-px bg-ink-16 mb-5">
              {[
                {
                  label: t.kitchen.likesReceived,
                  value: String(user.like_count),
                  icon: faHeart,
                },
                {
                  label: t.kitchen.ranking,
                  value: "–",
                  icon: faMedal,
                },
                {
                  label: t.kitchen.streak,
                  value: "–",
                  icon: faBolt,
                },
                {
                  label: t.kitchen.projects,
                  value: String(projectCount),
                  icon: faFolderOpen,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-paper px-4 py-3 flex items-start gap-2.5"
                >
                  <FontAwesomeIcon
                    icon={s.icon}
                    className="text-ink-40 mt-0.5"
                    style={{ fontSize: 11 }}
                  />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-40 mb-1">
                      {s.label}
                    </p>
                    <p className="font-mono text-[18px] font-semibold text-ink leading-none">
                      {s.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <ActivityHeatmap cells={heatmap} />
          </div>
        </section>

        {/* EN: Projects section. | FR: Section des projets. */}
        {projects.length > 0 && (
          <section>
            <Label icon={faFolderOpen}>{t.kitchen.projects}</Label>
            <div className="border border-ink-16 px-4">
              {projects.map((p) => (
                <ProjectRow key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
