# User Flows & Architecture

How SOLO. is structured today — controller vs TV receiver, session lifecycle, navigation, and on-device storage. Product pillars and **Now / Next** scope: **[README.md](README.md#the-5-pillars-of-solo)**. Planned phases: **[ROADMAP.md](ROADMAP.md)**.

---

## System overview

The phone is the **controller**; the TV is an optional **receiver**. Persistent state lives in `localStorage` (with a few `sessionStorage` keys for ephemeral prep/queue/summary). The TV page subscribes to a `BroadcastChannel` and renders the latest message — no backend, no account.

```mermaid
graph LR
  subgraph Phone["Phone (controller)"]
    A[Home / Workouts / Locker / Logboek]
    B[Prep + Session]
    C[sessionStore + historyStore]
    D[BroadcastChannel publish]
    E[Bottom nav center action]
  end
  subgraph TV["TV browser (/tv)"]
    F[BroadcastChannel subscribe]
    G[Session / Prep / Summary / Idle UI]
  end
  A --> B
  B --> C
  C --> D
  D --> F
  F --> G
  E --> B
```

| Surface | Route | Role |
|---|---|---|
| Mobile shell | `/`, `/workouts`, `/locker`, `/history` | Controller — home, templates, locker, logbook |
| Workout prep | `/workouts/prep?ids=…` | Targets, insights, TV connect, queue |
| Live session | `/session` | Active workout controller |
| Summary | `/session/summary` or `/history/:id` | Post-workout or historical recap |
| TV receiver | `/tv` | Passive display — open on TV or cast this tab |
| Labs | `/lab/*` | Architecture experiments (not main flow) |

---

## Bottom navigation — center action

The bottom bar has four tabs (Home, Workouts, Locker, Logboek) plus a **center action** button. Its label, icon, and enabled state depend on context (`centerNavState.ts` + `useWorkoutSelection`).

| Context | Center button | Enabled? |
|---|---|---|
| Home / Locker / Logboek, no session, multi-select off | Muted (no label) | No |
| Workouts, multi-select off | Muted | No |
| Workouts, multi-select on, 0 selected | **Kies** | No |
| Workouts (or any tab), multi-select on, N selected | **Prep N** | Yes → prep |
| Workout prep | **Start** | Yes → opens session (setup phase) |
| Session, setup (materials not confirmed) | **Voorbereiden** | On session: no; elsewhere: back to session |
| Session, exercises running, on `/session` | **Stop** | Yes (confirm + cancel) |
| Session, exercises running, elsewhere | **Live** | Yes → session |
| Summary after finish | **Workouts** | Yes → workouts list |

Multi-select state is global (`useWorkoutSelection`) so a prep count can persist while switching tabs.

---

## Pre-workout flow

```mermaid
graph TD
  A[Workouts] --> B{Multi-select?}
  B -- No --> C[Tap workout → Prep]
  B -- Yes --> D[Select N workouts]
  D --> E[Center: Prep N]
  C --> F[Workout Prep]
  E --> F
  F --> G[Overload planner + locker profile]
  G --> H{Garmin connected in settings?}
  H -- Yes --> I[Show recovery in insights + Home]
  H -- No --> J[Weights only — no recovery strip]
  I --> K{Recovery critical?}
  K -- Yes --> L[Reduce targets 5–10%]
  K -- No --> M[Keep targets]
  J --> M
  L --> N[Prep insights: all exercises across queue]
  M --> N
  N --> O[Optional: TV connect + camera/coach toggles]
  O --> P[Center: Start]
  P --> Q[Session setup phase]
```

Prep shows per-exercise targets, optional weight-assistant plates, and tappable rows that open an **exercise info modal** (mobile visual + description). Multi-workout queues are stored in `sessionStorage` until the last workout finishes.

---

## Live session flow

```mermaid
graph TD
  A[Session created — exercisesStarted false] --> B[Setup: materials checklist + controls]
  B --> C[User: Klaar — start workout]
  C --> D[exercisesStarted true — center becomes Stop/Live]
  D --> E[Publish state to TV]
  E --> F[Tap-to-complete exercises + sticky active row]
  F --> G{Coach enabled?}
  G -- Yes --> H[Announce next exercise / set]
  G -- No --> I[Silent progression]
  H --> J{Rest timer?}
  I --> J
  J -- Per exercise --> K[Countdown + coach ticks last 5s]
  J -- Set complete --> L{More sets/rounds?}
  L -- Yes --> M[Phase rest → next set]
  M --> F
  L -- No --> N{Queue has next workout?}
  N -- Yes --> O[Volgende workout]
  O --> A
  N -- No --> P[Workout afronden]
  P --> Q[Summary + logbook if fully complete]
  Q --> R[Center: Workouts]
```

Completed exercises sink to the bottom of the list; **Ongedaan** can undo a mistaken tap. Exercise rows open the same info modal as prep. Audio notes show a visible recording state while the mic is held.

Cancelled or incomplete sessions are cleared without a history entry.

---

## TV connect flow

```mermaid
graph TD
  A[User taps TV in prep or session] --> B[Ping open receivers]
  B --> C{Receiver answers?}
  C -- Yes --> D[Mark connected + publish current state]
  C -- No --> E[Open named /tv window once]
  E --> D
  D --> F[TV shows live HUD]
  F --> G{User disconnects?}
  G -- Yes --> H[Publish idle — manual TV tab may stay open]
  G -- No --> I[Periodic ping detects closed receiver]
```

HR / recovery on the TV sensor strip is gated on **Garmin connected** (settings toggle). Coach and camera flags travel with session TV state.

---

## Post-workout & logbook

```mermaid
graph TD
  A[Workout afronden] --> B{All exercises in last set done?}
  B -- No --> C[Session cleared — not in logbook]
  B -- Yes --> D[SessionSummary built]
  D --> E[historyStore max 100]
  E --> F[Summary UI: stats, trends, sparklines]
  F --> G[Logboek / Home recent]
  G --> H[Re-open /history/:id]
  H --> I[Delete entry or clear all]
```

---

## Data stores (implemented)

### localStorage (`localStore` — stable snapshot cache)

| Key | Contents |
|---|---|
| `solo-workouts` | Workout templates |
| `solo-lockers` | Locker profiles + equipment items |
| `solo-active-session` | In-progress session (`exercisesStarted`, pause, notes, …) |
| `solo-history` | Completed session records + full summaries |
| `solo-recovery-score` | Manual recovery % (mock until Health API) |
| `solo-garmin-connected` | Settings toggle — shows recovery UI when on |
| `solo-coach-enabled` / `solo-coach-voice-gender` | Coach prefs |
| `solo-camera-enabled` | Camera preview preference |
| `solo-theme` | Theme preference |
| `solo-auto-translate-wger` | Wger auto-translate |

### sessionStorage (ephemeral)

| Key | Contents |
|---|---|
| `solo-session-prep` | Last prep payload |
| `solo-workout-queue` | Remaining workouts in multi-session |
| `solo-last-summary` | Transient summary after finish |

### TV transport

| Channel | Role |
|---|---|
| `solo-tv-sync` | Session / prep / summary / idle payloads |
| Control ping/pong | Receiver handshake + connection status |

---

## Project layout

```
src/
  pages/              # Route screens (Home, Workouts, Prep, Session, Logboek, TV, labs)
  components/
    layout/           # BottomNav, centerNavState, PageBackButton
    session/          # Controls, rest bar, materials checklist, summary
    workout/          # Builder, cards, PrepInsightsPanel, ExerciseInfoModal, …
    locker/
  hooks/              # useActiveSession, useWorkoutSelection, useGarminConnected, …
  lib/
    storage/          # localStore + domain stores
    tv/               # broadcast, transport, coachEngine, exerciseMedia
    workout/          # overload planner, session prep/queue, summary, Wger import
    wger/
  config/             # nav, labs registry
```

---

*Pillar vision and future work: **[ROADMAP.md](ROADMAP.md)** · Product overview: **[README.md](README.md)**.*
