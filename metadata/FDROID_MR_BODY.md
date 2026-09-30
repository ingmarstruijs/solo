# F-Droid first listing — MR body paste kit (SOLO)

Use when opening a **New app** MR against [fdroiddata](https://gitlab.com/fdroid/fdroiddata).

**Title:** `New app: SOLO Home training`

## Checklist

- [ ] Metadata YAML copied from upstream `metadata/net.moonbaseone.solo.yml`
- [ ] `commit:` is the **full SHA** of annotated tag `vX.Y.Z` on `main` (not the tag name)
- [ ] `versionName` / `versionCode` match the Android `foss` release
- [ ] Local verify: `./tool/fdroid_build.sh` + `./tool/verify_reproducible.sh` against GitHub `foss` APK
- [ ] **Byte-RB enabled** for this listing (SOLO requirement — do not defer)
- [ ] Fastlane lives in upstream (`fastlane/metadata/android/en-US/`); **no** graphics dirs in this MR
- [ ] `foss` APK has no GMS / Cast / Firebase / non-free SDKs
- [ ] AGP `dependenciesInfo.includeInApk = false`
- [ ] Privacy linked from Fastlane full description → `PRIVACY.md` on `main`
- [ ] App inclusion template completed
- [ ] No npm/Vite steps in the foss recipe (Compose TV)

## Summary

SOLO Home training is an offline-first home workout app (phone controller + optional Android TV dashboard). No accounts, no telemetry. Android `foss` build is Kotlin + Jetpack Compose.

## Source

- Upstream: https://github.com/ingmarstruijs/solo
- License: MIT
- Application ID: `net.moonbaseone.solo`

## Build

See YAML `prebuild` / `gradle` / `output`. Recipe builds the `foss` product flavor only (no GMS/Cast).
