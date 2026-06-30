# User Flows & Architecture

How SOLO. is structured today — controller vs TV receiver, session lifecycle, and on-device storage. For planned pillars and future flows (Garmin, pose, WebLLM), see **[ROADMAP.md](ROADMAP.md)**.

---

## System overview

The phone is the **controller**; the TV is an optional **receiver**. Session state lives in `localStorage`. The TV page subscribes to a broadcast channel and renders the latest message — no backend.

```mermaid
graph LR
  subgraph Phone["Phone (controller)"]
    A[Workouts / Prep / Session]
    B[sessionStore + historyStore]
    C[BroadcastChannel publish]
  end
  subgraph TV["TV browser (/tv)"]
    D[BroadcastChannel subscribe]
    E[Session / Prep / Summary / Idle UI]
  end
  A --> B
  B --> C
  C --> D
  D --> E
```

## Pre-workout flow

```mermaid
graph TD
  A[Open Workouts] --> B[Select workout or multi-select]
  B --> C[Workout Prep]
  C --> D[Overload planner adjusts weights to Home Locker]
  D --> E{Recovery score critical?}
  E -- Yes --> F[Reduce targets 5–10% + warning]
  E -- No --> G[Keep progressive targets]
  F --> H[Weight Assistant / plate diagram]
  G --> H
  H --> I{Connect TV?}
  I -- Optional --> J[Open /tv receiver + handshake]
  I -- Skip --> K[Start sessie]
  J --> K
  K --> L[Live session /session]
```

## Live session flow

```mermaid
graph TD
  A[Session starts] --> B[Publish state to TV]
  B --> C[Athlete completes exercises tap-to-check]
  C --> D{Coach enabled?}
  D -- Yes --> E[Announce next exercise / set]
  D -- No --> F[Silent progression]
  E --> G{Rest timer?}
  F --> G
  G -- Exercise rest --> H[Countdown + optional coach ticks]
  G -- All exercises done in set --> I{More sets/rounds?}
  I -- Yes --> J[Phase rest → next set]
  J --> C
  I -- No --> K[Workout afronden]
  K --> L[Build session summary]
  L --> M[Save to history if fully complete]
  M --> N[Summary screen + TV summary mode]
  N --> O{More in queue?}
  O -- Yes --> P[Next workout]
  O -- No --> Q[Back to workouts]
```

## TV connect flow

```mermaid
graph TD
  A[User taps TV in session] --> B[Ping open receivers]
  B --> C{Receiver answers?}
  C -- Yes --> D[Mark connected + publish current state]
  C -- No --> E[Open named /tv window once]
  E --> D
  D --> F[TV shows live HUD]
  F --> G{User taps TV ● disconnect?}
  G -- Yes --> H[Publish idle + close app-owned window]
  G -- No --> I[Receiver closed?]
  I -- Yes --> J[Status returns to disconnected via periodic ping]
```

## Post-workout & history

```mermaid
graph TD
  A[Workout afronden] --> B{All exercises in last set done?}
  B -- No --> C[Session cleared — not in history]
  B -- Yes --> D[SessionSummary built]
  D --> E[Stored in historyStore max 100]
  E --> F[Summary UI: stats, trends, sparklines]
  F --> G[Historie list / Home recent]
  G --> H[Re-open any past summary]
  H --> I[Optional delete entry or clear all]
```

## Data stores (implemented)

| Key | Contents |
|---|---|
| `solo-workouts` | Workout templates |
| `solo-locker` | Locker profiles + equipment items |
| `solo-active-session` | In-progress session |
| `solo-history` | Completed session records + full summaries |
| `solo-recovery-score` | Manual recovery % (mock until Health API) |
| `solo-coach` | Coach enabled + voice gender prefs |
| `solo-theme` | Theme preference |

## Project layout

```
src/
  pages/           # Route-level screens (session, prep, TV, history, labs)
  components/      # UI (session controls, workout builder, TV overlays)
  hooks/           # useActiveSession, useTvConnection, useHistory, …
  lib/
    storage/       # localStore + domain stores
    tv/            # broadcast, transport, coach engine
    workout/       # overload planner, session summary, Wger import
    wger/          # API client
  config/          # nav, labs registry
```
