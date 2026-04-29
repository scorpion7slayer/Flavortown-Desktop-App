## Workflow Orchestration

### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Flavortown Desktop App Context

- Product goal: turn `https://flavortown.hackclub.com/kitchen` into a real desktop app backed by the official API at `https://flavortown.hackclub.com/api/v1`.
- Current stack: Tauri v2, React 19, TypeScript, Vite, Tailwind CSS v4, Font Awesome, `@tauri-apps/plugin-http`, and `@tauri-apps/plugin-opener`.
- Platform target: keep the app viable for macOS, Windows, and Linux across x86_64, i686/32-bit where Tauri and OS tooling support it, and ARM/ARM64 targets. Avoid platform-specific frontend APIs unless guarded and documented.
- Tauri packaging notes from current docs: Windows i686 can be built with `--target i686-pc-windows-msvc`; macOS universal bundles use `--target universal-apple-darwin`; Linux ARM builds need architecture-specific WebKitGTK development packages and targets such as `armv7-unknown-linux-gnueabihf` or `aarch64-unknown-linux-gnu`.
- API authentication: all Flavortown API calls use `Authorization: Bearer <api key>`. The app should never log or expose the API key.
- API rate limits are tight on list endpoints, commonly 5 req/min, with some detail endpoints at 30 req/min and searched projects at 20 req/min. Prefer pagination, caching, and deliberate refresh over aggressive parallel fetching.
- Available public API surfaces discovered so far: projects, project devlogs, global devlogs, store items, users, user projects, and user details including achievements. Do not invent Vote or Sidequests behavior without an exposed endpoint.
- Existing UX direction: compact desktop dashboard, monochrome Flavortown visual system, local light/dark theme, English/French strings, and a persistent sidebar. Preserve this style unless a redesign is explicitly requested.
- Keep implementation portable: browser/Tauri-safe storage, no Node-only runtime assumptions in frontend code, no absolute local paths in shipped code, and no shell commands as runtime dependencies.
