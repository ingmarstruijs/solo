# AGENTS.md — SOLO

Instructions for AI agents and maintainers working in this repo.

## Product

SOLO. (**SOLO Home training**) is a privacy-first home workout product. **Android** (Kotlin/Compose, planned) is the phone target; optional Android TV via a companion app on LAN. The React/Vite tree remains as UX reference. **iOS is out of scope.** No accounts, no cloud backend. Data stays on-device.

Read first: [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md).

## Hard rules

- Do **not** add cloud accounts, telemetry, or paid infra
- Do **not** commit secrets, keystores, or `.env`
- Do **not** target Google Play or Apple App Store unless the user explicitly asks
- Prefer editing existing patterns over new frameworks
- Do not create commits unless the user asks

## Android / F-Droid direction

Stack research: [docs/native-android-stack.md](docs/native-android-stack.md).

- **Kotlin + Jetpack Compose** — phone app + **Android TV receiver** app; **iOS out of scope**
- Thin shared logic: JSON contracts + ported domain; React kept as reference only
- Phone controls TV over LAN (WebSocket); no Cast required for `foss`
- **Native BLE** on Android phone (not Web Bluetooth)
- Dual channel: **GitHub Releases** (project key) + **F-Droid** (rebuild; **Byte-RB required**)
- F-Droid ships **`foss` only** (no GMS / Cast / non-free SDKs)
- Do not open fdroiddata MRs without green reproducible verification for that tag

Release process: [docs/RELEASING.md](docs/RELEASING.md)  
F-Droid: [metadata/FDROID_SUBMISSION.md](metadata/FDROID_SUBMISSION.md)

## When releasing

Follow [docs/RELEASING.md](docs/RELEASING.md) end-to-end:

1. Bump version + [CHANGELOG.md](CHANGELOG.md) (`### Store` + detail sections)
2. Run `./tool/sync_fastlane_changelogs.sh` and commit Fastlane files
3. PR → merge to `main` → annotated `v*` tag on that commit
4. GitHub APKs (once Android CI exists); set metadata `commit:` to **full SHA**
5. Verify with `./tool/fdroid_build.sh`; open fdroiddata MR

## Web / PWA day-to-day

```bash
npm ci
npm run dev
npm run lint
npm run build
```

CI: `.github/workflows/ci.yml` (`npm ci` + build). Deploy Pages: `.github/workflows/deploy.yml`.

## Docs map

| Doc | Use |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Flows, stores, layout |
| [ROADMAP.md](ROADMAP.md) | Pillars / next work |
| [docs/i18n.md](docs/i18n.md) | Locales |
| [docs/native-android-stack.md](docs/native-android-stack.md) | Compose Android / F-Droid research |
| [docs/RELEASING.md](docs/RELEASING.md) | Tags, GitHub, F-Droid checklist |
| [PRIVACY.md](PRIVACY.md) | Store / F-Droid privacy text |
| [SECURITY.md](SECURITY.md) | Reporting + GitHub hardening |
| [CHANGELOG.md](CHANGELOG.md) | Keep a Changelog + `### Store` |

## Kinetic parity

Release/F-Droid habit is modeled on [Kinetic](https://github.com/ingmarstruijs/Kinetic) (`docs/RELEASING.md`, `metadata/`, Fastlane, dual-channel). Adapt Flutter-specific bits to **Kotlin/Compose + Gradle** as Android lands — do not copy Flutter tooling blindly.
