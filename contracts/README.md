# Phone ↔ Android TV contracts

Versioned JSON messages the phone publishes and the TV HUD consumes over LAN (WebSocket in Phase 3).

| Artifact | Role |
| --- | --- |
| `tv-messages.schema.json` | JSON Schema (Draft 2020-12) for `TvMessage` |
| `goldens/*.json` | Canonical fixtures — encode/decode must round-trip in `:contracts` |
| `apps/contracts` | Kotlin codecs (`schemaVersion`, reject unknowns) |

**Breaking change:** bump `schemaVersion` and add a new golden; keep old goldens until both apps migrate.

Modes: `idle` · `prep` · `setup` · `session` (rest is nested) · `summary`.
