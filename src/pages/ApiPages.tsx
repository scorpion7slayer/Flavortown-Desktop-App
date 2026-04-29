import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useI18n } from "../lib/i18n";
import { openExternal } from "../lib/openExternal";
import {
  faArrowUpRightFromSquare,
  faArrowsRotate,
  faBoxOpen,
  faCartShopping,
  faCircleInfo,
  faCodeBranch,
  faCookie,
  faFire,
  faFolderOpen,
  faLock,
  faMagnifyingGlass,
  faMedal,
  faPen,
  faSpinner,
  faTrophy,
  faUsers,
} from "../lib/icons";
import {
  absoluteFlavortownUrl,
  fmtDate,
  fmtDuration,
  getMe,
  getMyProjects,
  getProjectDevlogs,
  invalidateApiLists,
  listDevlogs,
  listStoreItems,
  listUsers,
  type Achievement,
  type Devlog,
  type DevlogList,
  type Project,
  type StoreItem,
  type User,
  type UserDetail,
  type UserList,
} from "../lib/api";

function translateError(
  msg: string,
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (msg === "429" || msg.includes("429")) return t.errors.rateLimited;
  if (msg === "401" || msg.includes("401")) return t.errors.invalidKey;
  if (
    msg.toLowerCase().includes("load failed") ||
    msg.toLowerCase().includes("network") ||
    msg.toLowerCase().includes("fetch")
  )
    return t.errors.network;
  return t.errors.generic(msg);
}

function PageShell({
  eyebrow,
  title,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-paper">
      <div className="flex flex-col gap-4 px-7 pt-7 pb-5 border-b border-ink-16 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-40 mb-1">
            {eyebrow}
          </p>
          <h1 className="font-display text-[28px] font-bold text-ink leading-none tracking-tight">
            {title}
          </h1>
        </div>
        {actions}
      </div>
      <div className="px-7 py-6 space-y-6">{children}</div>
    </div>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: IconDefinition;
  children: string;
}) {
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

function IconButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="inline-flex items-center gap-2 border border-ink-16 px-3 py-2
                 font-mono text-[11px] text-ink-80 hover:text-ink hover:border-ink-40
                 transition-colors disabled:opacity-40"
    >
      <FontAwesomeIcon
        icon={icon}
        spin={icon === faSpinner || (icon === faArrowsRotate && disabled)}
        style={{ fontSize: 10 }}
      />
      {label}
    </button>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="border border-ink-16 min-h-48 flex items-center justify-center gap-2.5">
      <FontAwesomeIcon
        icon={faSpinner}
        spin
        className="text-ink-40"
        style={{ fontSize: 14 }}
      />
      <span className="font-mono text-xs text-ink-40">{label}</span>
    </div>
  );
}

function ErrorPanel({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="border border-ink-16 min-h-48 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <FontAwesomeIcon
        icon={faCircleInfo}
        className="text-ink-40"
        style={{ fontSize: 18 }}
      />
      <p className="font-mono text-xs text-ink-80">
        {translateError(error, t)}
      </p>
      <IconButton icon={faArrowsRotate} label={t.common.retry} onClick={onRetry} />
    </div>
  );
}

function EmptyPanel({
  icon = faBoxOpen,
  title,
  body,
}: {
  icon?: IconDefinition;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-ink-16 min-h-44 flex flex-col items-center justify-center gap-2 px-6 text-center">
      <FontAwesomeIcon
        icon={icon}
        className="text-ink-40"
        style={{ fontSize: 18 }}
      />
      <p className="font-mono text-xs font-semibold text-ink">{title}</p>
      <p className="font-sans text-[12px] text-ink-40 max-w-md">{body}</p>
    </div>
  );
}

function SearchForm({
  value,
  placeholder,
  loading,
  onChange,
  onSubmit,
}: {
  value: string;
  placeholder: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm gap-2">
      <div className="relative flex-1">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-40"
          style={{ fontSize: 11 }}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full bg-transparent border border-ink-16 pl-8 pr-3 py-2
                     font-mono text-[11px] text-ink placeholder:text-ink-40
                     focus:outline-none focus:border-ink"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 bg-ink text-paper px-3 py-2
                   font-mono text-[11px] disabled:opacity-40"
      >
        <FontAwesomeIcon
          icon={loading ? faSpinner : faMagnifyingGlass}
          spin={loading}
          style={{ fontSize: 10 }}
        />
        {t.common.search}
      </button>
    </form>
  );
}

function ExternalAction({
  url,
  label,
  icon = faArrowUpRightFromSquare,
}: {
  url: string | null | undefined;
  label: string;
  icon?: IconDefinition;
}) {
  if (!url) return null;

  return (
    <button
      onClick={() => void openExternal(url)}
      className="inline-flex items-center gap-1.5 border border-ink-16 px-2.5 py-1.5
                 font-mono text-[10px] text-ink-40 hover:text-ink hover:border-ink-40
                 transition-colors"
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: 9 }} />
      {label}
    </button>
  );
}

function imageMedia(devlog: Devlog): Array<{ url: string; content_type?: string }> {
  return (devlog.media ?? [])
    .filter(
      (media) =>
        media.url &&
        (!media.content_type ||
          media.content_type.toLowerCase().startsWith("image/")),
    )
    .map((media) => ({
      ...media,
      url: absoluteFlavortownUrl(media.url) ?? media.url,
    }));
}

function ProjectCard({
  project,
  devlogs,
}: {
  project: Project;
  devlogs?: Devlog[];
}) {
  const { t } = useI18n();
  const devlogCount = Math.max(devlogs?.length ?? 0, project.devlog_ids.length);
  const totalSeconds = devlogs?.reduce(
    (sum, devlog) => sum + devlog.duration_seconds,
    0,
  );
  const fallbackImage = devlogs?.flatMap(imageMedia)[0]?.url;
  const heroImage = absoluteFlavortownUrl(project.banner_url) ?? fallbackImage;

  return (
    <article className="border border-ink-16 bg-paper min-w-0">
      {heroImage && (
        <img
          src={heroImage}
          alt=""
          className="w-full h-28 object-cover border-b border-ink-16"
          loading="lazy"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-sans text-[13px] font-semibold text-ink leading-snug">
              {project.title}
            </h2>
            <p className="font-mono text-[10px] text-ink-40 mt-1">
              {project.ship_status || t.common.unknownStatus}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 font-mono text-[10px] text-ink-40">
            <FontAwesomeIcon icon={faPen} style={{ fontSize: 9 }} />
            {devlogCount}
          </div>
        </div>

        {project.description && (
          <p className="font-sans text-[12px] text-ink-80 mt-3 line-clamp-3">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <ExternalAction
            url={project.demo_url}
            label={t.projectLinks.demo}
          />
          <ExternalAction
            url={project.repo_url}
            label={t.projectLinks.repo}
            icon={faCodeBranch}
          />
          <ExternalAction
            url={project.readme_url}
            label={t.projectLinks.readme}
          />
        </div>

        {totalSeconds !== undefined && (
          <p className="font-mono text-[10px] text-ink-80 mt-4">
            {t.projects.loggedTime(fmtDuration(totalSeconds))}
          </p>
        )}

        <p className="font-mono text-[9px] text-ink-40 mt-4">
          {t.common.updated} {fmtDate(project.updated_at)}
        </p>
      </div>
    </article>
  );
}

function DevlogCard({ devlog }: { devlog: Devlog }) {
  const { t } = useI18n();
  const body = devlog.body.trim();
  const images = imageMedia(devlog);

  return (
    <article className="border border-ink-16 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {devlog.author?.avatar ? (
            <img
              src={absoluteFlavortownUrl(devlog.author.avatar) ?? ""}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-ink-16 shrink-0"
              loading="lazy"
            />
          ) : null}
          <div className="min-w-0">
            {devlog.author?.display_name || devlog.project?.title ? (
              <p className="font-sans text-[12px] font-semibold text-ink truncate">
                {devlog.author?.display_name}
                {devlog.project?.title
                  ? ` ${t.explore.workedOn} ${devlog.project.title}`
                  : ""}
              </p>
            ) : null}
          <p className="font-mono text-[10px] text-ink-40">
            {fmtDate(devlog.created_at)}
          </p>
          <h2 className="font-sans text-[13px] font-semibold text-ink mt-1">
            {t.explore.devlogTitle(devlog.id)}
          </h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 border border-ink-16 px-2.5 py-1.5 font-mono text-[10px] text-ink-40">
            <FontAwesomeIcon icon={faFire} style={{ fontSize: 9 }} />
            {fmtDuration(devlog.duration_seconds)}
          </span>
          <span className="inline-flex items-center gap-1.5 border border-ink-16 px-2.5 py-1.5 font-mono text-[10px] text-ink-40">
            {devlog.likes_count} {t.explore.likes}
          </span>
          <span className="inline-flex items-center gap-1.5 border border-ink-16 px-2.5 py-1.5 font-mono text-[10px] text-ink-40">
            {devlog.comments_count} {t.explore.comments}
          </span>
        </div>
      </div>

      {body && (
        <p className="font-sans text-[12px] text-ink-80 mt-3 whitespace-pre-wrap line-clamp-5">
          {body}
        </p>
      )}

      {images.length > 0 && (
        <div className="grid gap-2 mt-4 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          {images.slice(0, 4).map((media) => (
            <img
              key={media.url}
              src={absoluteFlavortownUrl(media.url) ?? media.url}
              alt=""
              className="w-full h-40 object-cover border border-ink-16 bg-ink-04"
              loading="lazy"
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <ExternalAction
          url={devlog.scrapbook_url}
          label={t.explore.scrapbook}
        />
      </div>
    </article>
  );
}

function UserRow({ user, rank }: { user: User; rank: number }) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 border-b border-ink-08 last:border-0">
      <p className="font-mono text-[11px] text-ink-40">#{rank}</p>
      <div className="flex items-center gap-2.5 min-w-0">
        {user.avatar ? (
          <img
            src={absoluteFlavortownUrl(user.avatar) ?? ""}
            alt=""
            className="w-7 h-7 rounded-full object-cover border border-ink-16"
            loading="lazy"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-ink-08" />
        )}
        <div className="min-w-0">
          <p className="font-sans text-[12px] font-semibold text-ink truncate">
            {user.display_name}
          </p>
          <p className="font-mono text-[10px] text-ink-40 truncate">
            {t.leaderboard.projectsCount(user.project_ids.length)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink">
        <FontAwesomeIcon icon={faCookie} style={{ fontSize: 10 }} />
        {user.cookies ?? 0}
      </div>
    </div>
  );
}

function StoreCard({ item }: { item: StoreItem }) {
  const { t } = useI18n();
  const regions = Object.entries(item.enabled ?? {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => key.replace("enabled_", "").toUpperCase());
  const baseCost = item.ticket_cost?.base_cost ?? 0;

  return (
    <article className="border border-ink-16 bg-paper min-w-0">
      {item.image_url && (
        <div className="h-36 border-b border-ink-16 flex items-center justify-center bg-ink-04">
          <img
            src={absoluteFlavortownUrl(item.image_url) ?? ""}
            alt=""
            className="max-h-32 max-w-full object-contain p-3"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-sans text-[13px] font-semibold text-ink leading-snug">
              {item.name}
            </h2>
            <p className="font-mono text-[10px] text-ink-40 mt-1">
              {item.type || t.shop.item}
            </p>
          </div>
          <p className="shrink-0 font-mono text-[12px] font-semibold text-ink">
            {Math.round(baseCost)} cookies
          </p>
        </div>

        <p className="font-sans text-[12px] text-ink-80 mt-3 line-clamp-3">
          {item.description || item.long_description || t.shop.noDescription}
        </p>

        <div className="grid grid-cols-2 gap-px bg-ink-16 mt-4">
          <div className="bg-paper p-2.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-40">
              {t.shop.stock}
            </p>
            <p className="font-mono text-[13px] font-semibold text-ink">
              {item.stock}
            </p>
          </div>
          <div className="bg-paper p-2.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-40">
              {t.shop.maxQty}
            </p>
            <p className="font-mono text-[13px] font-semibold text-ink">
              {item.max_qty}
            </p>
          </div>
        </div>

        <p className="font-mono text-[9px] text-ink-40 mt-3">
          {regions.length > 0
            ? t.shop.regions(regions.join(", "))
            : t.shop.noRegions}
        </p>
      </div>
    </article>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <article className="border border-ink-16 p-4">
      <div className="flex items-start gap-3">
        <FontAwesomeIcon
          icon={faTrophy}
          className="text-ink-40 mt-0.5"
          style={{ fontSize: 13 }}
        />
        <div className="min-w-0">
          <h2 className="font-sans text-[13px] font-semibold text-ink">
            {achievement.name}
          </h2>
          <p className="font-sans text-[12px] text-ink-80 mt-1">
            {achievement.description}
          </p>
          <p className="font-mono text-[9px] text-ink-40 mt-3">
            {achievement.slug}
          </p>
        </div>
      </div>
    </article>
  );
}

export function Explore({ apiKey }: { apiKey: string }) {
  const { t } = useI18n();
  const [data, setData] = useState<DevlogList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await listDevlogs(apiKey, { limit: 20 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void load();
  }, [load]);

  function refresh() {
    invalidateApiLists(apiKey);
    void load();
  }

  return (
    <PageShell
      eyebrow={t.explore.eyebrow}
      title={t.nav.explore}
      actions={
        <IconButton
          icon={faArrowsRotate}
          label={t.common.refresh}
          onClick={refresh}
          disabled={loading}
        />
      }
    >
      <SectionLabel icon={faFire}>{t.explore.devlogs}</SectionLabel>
      {loading && !data ? (
        <LoadingPanel label={t.common.loading} />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refresh} />
      ) : data && data.devlogs.length > 0 ? (
        <>
          <p className="font-mono text-[10px] text-ink-40">
            {t.common.showing(data.devlogs.length, data.pagination.total_count)}
          </p>
          <div className="space-y-4">
            {data.devlogs.map((devlog) => (
              <DevlogCard key={devlog.id} devlog={devlog} />
            ))}
          </div>
        </>
      ) : (
        <EmptyPanel
          title={t.explore.emptyTitle}
          body={t.explore.emptyBody}
        />
      )}
    </PageShell>
  );
}

export function Projects({ apiKey }: { apiKey: string }) {
  const { t } = useI18n();
  const [projects, setProjects] = useState<
    Array<{ project: Project; devlogs: Devlog[] }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const myProjects = await getMyProjects(apiKey);
      const withDevlogs: Array<{ project: Project; devlogs: Devlog[] }> = [];
      for (const project of myProjects) {
        withDevlogs.push({
          project,
          devlogs: await getProjectDevlogs(project.id, apiKey),
        });
      }
      setProjects(withDevlogs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void load();
  }, [load]);

  function refresh() {
    invalidateApiLists(apiKey);
    void load();
  }

  return (
    <PageShell
      eyebrow={t.projects.eyebrow}
      title={t.nav.projects}
      actions={
        <IconButton
          icon={faArrowsRotate}
          label={t.common.refresh}
          onClick={refresh}
          disabled={loading}
        />
      }
    >
      <SectionLabel icon={faFolderOpen}>{t.projects.mine}</SectionLabel>
      {loading && projects.length === 0 ? (
        <LoadingPanel label={t.common.loading} />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refresh} />
      ) : projects.length > 0 ? (
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {projects.map(({ project, devlogs }) => (
            <ProjectCard
              key={project.id}
              project={project}
              devlogs={devlogs}
            />
          ))}
        </div>
      ) : (
        <EmptyPanel
          title={t.projects.emptyTitle}
          body={t.projects.emptyBody}
        />
      )}
    </PageShell>
  );
}

export function Shop({ apiKey }: { apiKey: string }) {
  const { t } = useI18n();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listStoreItems(apiKey);
      setItems(
        [...data].sort(
          (a, b) =>
            (a.ticket_cost?.base_cost ?? 0) - (b.ticket_cost?.base_cost ?? 0),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void load();
  }, [load]);

  function refresh() {
    invalidateApiLists(apiKey);
    void load();
  }

  return (
    <PageShell
      eyebrow={t.shop.eyebrow}
      title={t.nav.shop}
      actions={
        <IconButton
          icon={faArrowsRotate}
          label={t.common.refresh}
          onClick={refresh}
          disabled={loading}
        />
      }
    >
      <SectionLabel icon={faCartShopping}>{t.shop.catalog}</SectionLabel>
      {loading && items.length === 0 ? (
        <LoadingPanel label={t.common.loading} />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refresh} />
      ) : items.length > 0 ? (
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          {items.map((item) => (
            <StoreCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyPanel title={t.shop.emptyTitle} body={t.shop.emptyBody} />
      )}
    </PageShell>
  );
}

export function Achievements({
  apiKey,
  initialUser,
}: {
  apiKey: string;
  initialUser: UserDetail;
}) {
  const { t } = useI18n();
  const [user, setUser] = useState<UserDetail>(initialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const achievements = user.achievements ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUser(await getMe(apiKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  return (
    <PageShell
      eyebrow={t.achievements.eyebrow}
      title={t.nav.achievements}
      actions={
        <IconButton
          icon={faArrowsRotate}
          label={t.common.refresh}
          onClick={() => void load()}
          disabled={loading}
        />
      }
    >
      <SectionLabel icon={faTrophy}>{t.achievements.unlocked}</SectionLabel>
      {error ? (
        <ErrorPanel error={error} onRetry={() => void load()} />
      ) : achievements.length > 0 ? (
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.slug}
              achievement={achievement}
            />
          ))}
        </div>
      ) : (
        <EmptyPanel
          icon={faTrophy}
          title={t.achievements.emptyTitle}
          body={t.achievements.emptyBody}
        />
      )}
    </PageShell>
  );
}

export function Leaderboard({ apiKey }: { apiKey: string }) {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<UserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await listUsers(apiKey, { query, limit: 100 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoading(false);
    }
  }, [apiKey, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const users = useMemo(
    () =>
      [...(data?.users ?? [])].sort(
        (a, b) => (b.cookies ?? 0) - (a.cookies ?? 0),
      ),
    [data],
  );

  function refresh() {
    invalidateApiLists(apiKey);
    void load();
  }

  return (
    <PageShell
      eyebrow={t.leaderboard.eyebrow}
      title={t.nav.leaderboard}
      actions={
        <SearchForm
          value={input}
          placeholder={t.leaderboard.searchPlaceholder}
          loading={loading}
          onChange={setInput}
          onSubmit={() => setQuery(input.trim())}
        />
      }
    >
      <SectionLabel icon={faMedal}>{t.leaderboard.cookies}</SectionLabel>
      <p className="font-sans text-[12px] text-ink-40 max-w-2xl">
        {t.leaderboard.scopeNote}
      </p>
      {loading && !data ? (
        <LoadingPanel label={t.common.loading} />
      ) : error ? (
        <ErrorPanel error={error} onRetry={refresh} />
      ) : users.length > 0 ? (
        <div className="border border-ink-16">
          {users.map((user, index) => (
            <UserRow key={user.id} user={user} rank={index + 1} />
          ))}
        </div>
      ) : (
        <EmptyPanel
          icon={faUsers}
          title={t.leaderboard.emptyTitle}
          body={t.leaderboard.emptyBody}
        />
      )}
    </PageShell>
  );
}

export function UnavailablePage({
  title,
  message,
  externalUrl,
}: {
  title: string;
  message: string;
  externalUrl?: string;
}) {
  const { t } = useI18n();

  return (
    <PageShell eyebrow={t.unavailable.eyebrow} title={title}>
      <EmptyPanel icon={faLock} title={t.unavailable.title} body={message} />
      {externalUrl && (
        <ExternalAction
          url={externalUrl}
          label={t.unavailable.openRealSite}
        />
      )}
      <section>
        <SectionLabel icon={faFire}>{t.unavailable.whatWorks}</SectionLabel>
        <div className="grid gap-px bg-ink-16 border border-ink-16 max-w-2xl">
          {[
            t.nav.kitchen,
            t.nav.explore,
            t.nav.projects,
            t.nav.achievements,
            t.nav.leaderboard,
          ].map((item) => (
            <div key={item} className="bg-paper px-4 py-3 font-mono text-xs">
              {item}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
