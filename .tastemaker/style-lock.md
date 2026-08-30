# Style lock — vespo-portal (VespoUAV)

Direction: internal team dashboard, not a marketing site — no hero/sales sections on data-listing pages, widgets start immediately under the nav. Structural minimalism (soft shadows, hairline dividers, rounded-full buttons, no gradients/glow) is still Apple-inspired, but the palette is now VespoUAV's own brand, not Apple's.
Mode: light only (no dark-mode toggle planned).

## Color contract (brand: gold / brown / near-black)
- text (ink): #02010a — bg #ffffff: 20.77 text-safe
- text-secondary (ink-secondary): #57524c — bg #ffffff: 7.73 text-safe
- text-tertiary (ink-tertiary): #8a8478 — 3.72, **decorative/icon-only, never body text**
- surface: #ffffff (surface), #f6f4ef warm off-white (surface-soft, card/section fill)
- link/accent text (brown-600 `#5a3a0c` / brown-500 `#6c450e`): 8.4–10.3:1 on white — **use brown for any accent text/link/icon on a light background**, never gold
- brand gold (`brand-500 #ffd700`): **1.40:1 on white — decorative/fill only, illegal as text or a stroke on a light background.** Legal uses: button fill with ink text (14.80:1), badge fill (`brand-100`) with brown-600 text (9.23:1), icon/text on a near-black surface (14.80:1).
- badge pairing: brown-600 text on brand-100 (`#fff3c4`) bg: 9.23 text-safe
- border: #e2ddd3 (line), #eeeae1 (line-soft) — hairlines only, decorative contrast, never state-carrying alone

Full scales (`brand`, `brown`, `ink`, `surface`, `line`) live in `tailwind.config.js`.

## Type
System font stack only (`-apple-system, BlinkMacSystemFont, "SF Pro Display", ...`).

## Shape & elevation
- Buttons: fully rounded pill (`rounded-full`), filled `brand-500` (gold) with `text-ink` label (never white-on-gold — fails contrast), hover `brand-600`.
- Cards/panels: `rounded-card` (20px), fill `surface-soft`, depth via `shadow-soft-*` only.
- Links/back-links/nav-active state/focus ring/selection color: `brown-600` (`#5a3a0c`) — gold is never used for these.

## Motion
Unchanged from the original lock: `ease-emil` = `cubic-bezier(0.32,0.72,0,1)` for interactive state changes, `ease-expo` = `cubic-bezier(0.16,1,0.3,1)` for scroll-reveal entrances (`Reveal` component). `prefers-reduced-motion` handled globally in `src/index.css`. Never `transition-all`.

## Icons
`lucide-react`. No emoji-as-icons. Brand accents (sidebar `Drone` icon, nav-active state) are `text-brown-600`/`bg-brand-100`, not raw gold (gold fails visibility/contrast on white).

## Layout: left sidebar, not a top navbar
The top navbar was replaced with a persistent left sidebar (`src/components/Sidebar.jsx`, `w-72`, `border-r`), collapsible on mobile via a hamburger button in a slim `lg:hidden` top bar (`App.jsx`). Do not reintroduce a horizontal top nav — this is the app's permanent shell now.
- Brand mark: the real `src/assets/logo.png` (a circular gold/black wasp mark) at 32px next to the "VespoUAV" wordmark, top of the sidebar. This is the actual brand logo, not a placeholder — don't swap it for a lucide icon.
- Sidebar nav is grouped into three **collapsible** sections (`SidebarGroup.jsx`, using the `.collapse-grid` CSS trick in `index.css`, default open), each holding `SidebarLink` items (active state = `bg-brand-100 text-brown-600`, via React Router `NavLink`):
  - **Community**: Members (`/members`), Areas (`/areas`), Sessions (`/sessions`)
  - **Work**: Tasks (`/tasks`), Calendar (`/calendar`), Tools (`/tools` — this is the renamed "Resources" concept)
  - **Drones**: Drones fleet (`/`, `end` route), Inventory (`/inventory`)
- Sidebar bottom (outside the collapsible groups, always visible): **Account** and **Log out** — intentionally inert (`<span>`, not a link/button, `opacity-60`, `cursor-not-allowed`) per explicit instruction not to wire up auth yet. Don't add real functionality to these without being asked.
- The old flat top-nav destinations (Repositories, Logs, Competitions) were dropped in this restructure — the user's new IA didn't mention them and explicitly said "let's change **everything**" about the nav. Repositories' purpose folds into `recursos`/Tools (which already distinguishes CAD/GitHub/etc. via `icono_url`). If Logs or Competitions come back, ask before re-adding rather than guessing a schema.

## Content / IA decisions
- Brand name is **VespoUAV** only — no "Escudería CEM" / "Tec de Monterrey" wording anywhere in the UI.
- Drone display names strip a trailing " - <team>" suffix from the `nombre` field (`src/utils/drone.js` `droneDisplayName`) — Supabase stores e.g. "F450 - Escudería CEM", UI shows "F450".
- All UI copy is in English. Supabase table/column names stay in Spanish (`nombre`, `modelo`, `descripcion`, `dron_id`, `miembros`, `areas`, `sesiones`, `tareas`, `eventos`, `recursos`, `inventario`) — that's the DB schema, not UI text, and must not be translated.
- Gallery page (`/`) has **no hero/marketing header** — it's a dashboard, starts directly on the "Available models" widget grid.
- **`recursos` is one shared table** for both the team-wide Tools page (`dron_id is null`) and a drone's own "Resources" section on its detail page (`dron_id = <id>`) — this replaces `documentacion`, which the app no longer queries (left in the DB untouched, not dropped, in case old rows need manual migration). Every resource has an `icono_url` the UI renders at 32px next to the title, so the user can tell a CAD link from a GitHub link at a glance; falls back to a generic `Link2` icon when absent.
- New tables (`miembros`, `areas`, `sesiones`, `tareas`, `eventos`, `recursos`, `inventario`) are defined in `supabase/0002_dashboard_tables.sql` — the user runs this by hand in the Supabase SQL editor (no DB access/MCP was configured for this session; that's a deliberate choice pending the user's explicit go-ahead, since adding an MCP server is a persistent integration change). Until that SQL is run, every new page's Supabase query 404s gracefully into an empty-state UI (`setX(data || [])` pattern) rather than crashing — this is intended, not a bug, while the tables don't exist yet.
- Status/priority/type badges on Tasks/Inventory/Calendar map a Spanish enum value (`estado`, `prioridad`, `tipo` columns, each with a Postgres `check` constraint in the migration) to an English label + a badge color drawn from the same gold/brown contract above — see the `ESTADO_LABEL`/`ESTADO_STYLE` etc. maps at the top of each page file. Add new enum values in both the SQL check constraint and the page's label/style map together.

## Scope covered
Sidebar + collapsible groups, mobile drawer, DroneGallery (widget grid only, no hero), DroneCard, DroneDetail (specs + STL + shared resources), Members, Areas, Sessions, Tasks, Calendar, Tools, Inventory. Reuse these tokens/decisions verbatim for any new screen — don't re-derive, don't drift back toward the old Apple-blue palette or the old top-navbar shell.
