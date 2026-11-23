# Releasing SOLO (for maintainers / agents)

`main` should stay protected: no direct pushes for releases.

**Day-to-day device installs** use **GitHub Releases + [Obtainium](https://github.com/ImranR98/Obtainium)** (same habit as Kinetic’s GitHub channel). **F-Droid** is a later dual-channel step once Byte-RB is green — not required for early Android PR testing.

| Channel | When | Signing | Consumer |
| --- | --- | --- | --- |
| **GitHub preview `0.1.<N>`** | Every `main` push that builds Android (and `workflow_dispatch`) | Project keystore if secrets exist; else debug | Obtainium (include pre-releases) |
| **GitHub `v*`** | Annotated tag on `main` | Project keystore (CI) | Obtainium / sideload |
| **F-Droid** | Manual fdroiddata MR after a stable tag + Byte-RB | F-Droid key | Later |

Agents: follow this file. Stack: [`docs/native-android-stack.md`](native-android-stack.md). Android plan: [`docs/ANDROID_DEVELOPMENT_PLAN.md`](ANDROID_DEVELOPMENT_PLAN.md).

## Version numbering (SemVer + Android)

Both phone and TV APKs share the same `versionName` / `versionCode` for a given build (injected via `-PsoloVersionName` / `-PsoloVersionCode`; see `apps/versioning.gradle.kts`).

| Channel | GitHub tag | `versionName` | `versionCode` | GitHub Release |
| --- | --- | --- | --- | --- |
| **Preview** (early) | `0.1.<N>` (unique each build; **no** `v` prefix) | `0.1.<N>` | `N` = Actions `run_number` | Pre-release; APKs `solo-0.1.<N>-foss.apk` / `solo-tv-0.1.<N>-foss.apk` |
| **Milestone** | `v0.1.0-android.N` (or `vX.Y.Z-rc.N`) | tag without `v` | Actions `run_number` | Pre-release (`v*-phone` / `v*-tv`) |
| **Production** | `vX.Y.Z` (no `-` suffix) | `X.Y.Z` | Actions `run_number` | Full release (`v*-phone` / `v*-tv`) |

Rules:

- **`versionCode` always increases** (CI run number) so PackageManager treats the build as newer.
- **Preview `versionName` is `0.1.<N>`** (not `0.1.0-dev.<N>`). Obtainium’s default GitHub detector often strips SemVer pre-release suffixes after `-`, so `0.1.0-dev.9` and `0.1.0-dev.11` both looked like `0.1.0` and never offered an update.
- **Preview GitHub tag must equal `versionName` and change every build.** Obtainium’s GitHub source uses **`tag_name` as the version** by default. A floating `preview` tag therefore never looks like an update, even when the release/APK is recreated. Do not reintroduce a floating tag unless every Obtainium install enables “Release title as version”.
- Preview tags omit the `v` prefix so they do not re-trigger the workflow’s `v*` path.
- Milestone/production still use normal SemVer; a `-` in the tag → GitHub pre-release.
- Local builds without `-P` default to `versionName=0.1.0`, `versionCode=1`.
- First public/F-Droid line: prefer `v1.0.0` (or `v0.9.0` if you want to signal “not 1.0 yet”).

Manual dispatch may pass a custom `version` input as `versionName`; channel stays `preview` and `versionCode` is still the run number. Prefer `0.1.<N>`-shaped labels so Obtainium compares cleanly.

## Early Android installs (Obtainium) — preferred while building PR B→H

Workflow: [`.github/workflows/build-release.yml`](../.github/workflows/build-release.yml).

1. Merge Android work to `main` (or run **Build & Sign Android** → `workflow_dispatch`).
2. CI publishes a **unique** pre-release tag **`0.1.<N>`** (= `versionName`) with versioned APKs:
   - `solo-0.1.<N>-foss.apk` — phone (`net.moonbaseone.solo`)
   - `solo-tv-0.1.<N>-foss.apk` — Android TV (`net.moonbaseone.solo.tv`)
   - `sha256.txt`
   - APK metadata: `versionName=0.1.<N>`, `versionCode=<N>` (`N` = Actions `run_number`)
   - Legacy floating tag `preview` is deleted if still present
3. On the phone (and TV box), add the repo in Obtainium:

| Setting | Value |
| --- | --- |
| Source | `https://github.com/ingmarstruijs/solo` (this repo) |
| Include pre-releases | **On** (required for `0.1.<N>` preview tags) |
| APK filter (phone) | `^solo-[0-9].*-foss\.apk$` |
| APK filter (TV) | `^solo-tv-[0-9].*-foss\.apk$` |
| Release title as version | Off (not needed — tag == versionName) |

Use **two** Obtainium entries (one phone, one TV) so each app tracks the matching APK. After this change, a stuck Obtainium entry that still shows version `preview` should pick up the next `0.1.<N>` tag on refresh (include pre-releases on).

Milestone early builds can also use annotated tags like `v0.1.0-android.1` (GitHub **pre-release** because of the `-` suffix). Obtainium still needs “include pre-releases”.

Without `ANDROID_KEYSTORE_*` secrets, CI signs with the debug key — fine for private testing; set the project keystore before sharing widely so updates stay on one cert.

### Required GitHub secrets (project signing)

| Secret | Purpose |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` / `.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Store password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password (defaults to store password if omitted in CI) |

## Stable GitHub Releases (`v*`)

Same dual-app pattern as Kinetic:

1. Bump PR → merge to `main`
2. Tag the merge commit: `git tag -a vX.Y.Z -m "SOLO X.Y.Z" && git push origin vX.Y.Z`
3. Tag must be an ancestor of `main` or the release job fails
4. CI creates `vX.Y.Z-phone` and `vX.Y.Z-tv` Releases with versioned APKs

A `v*` tag **not** on `main` must not create GitHub Releases (gated in the workflow).

Versions with a SemVer pre-release suffix (`v0.2.0-android.3`) publish as GitHub **pre-releases** for Obtainium’s early track.

## Dual-channel checklist (stable versions → F-Droid later)

Only after Android `foss` APKs + Byte-RB tooling are real:

1. **Bump PR** (`release/X.Y.Z`) → merge to `main` after CI
   - `package.json` + Android `versionName` / `versionCode`
   - [`CHANGELOG.md`](../CHANGELOG.md) (`### Store`)
   - `./tool/sync_fastlane_changelogs.sh`
   - Keep `dependenciesInfo { includeInApk = false }`
2. **Tag** on `main` → wait for **Build & Sign Android** green
3. Full SHA into `metadata/*.yml` `commit:`
4. `./tool/fdroid_build.sh` + `./tool/verify_reproducible.sh`
5. **fdroiddata MR** only if RB passed

**Do not** publish an F-Droid update for a tag that failed reproducible verification.

## Verify release APKs

```bash
sha256sum solo-0.1.*.apk
keytool -printcert -jarfile solo-0.1.*.apk
```

F-Droid APKs (when they exist) use a **different** certificate than GitHub Releases.

## Local builds

### Web / PWA

```bash
npm ci
npm run build
```

### Android (Compose)

```bash
cd apps
./gradlew :android:assembleFossRelease :android-tv:assembleFossRelease
```

Debug / CI smoke:

```bash
cd apps
./gradlew :android:assembleFossDebug :android-tv:assembleFossDebug
```
