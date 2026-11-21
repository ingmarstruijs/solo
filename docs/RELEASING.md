# Releasing SOLO (for maintainers / agents)

`main` should stay protected: no direct pushes for releases.

**Day-to-day device installs** use **GitHub Releases + [Obtainium](https://github.com/ImranR98/Obtainium)** (same habit as Kinetic’s GitHub channel). **F-Droid** is a later dual-channel step once Byte-RB is green — not required for early Android PR testing.

| Channel | When | Signing | Consumer |
| --- | --- | --- | --- |
| **GitHub `preview`** | Every `main` push that builds Android (and `workflow_dispatch`) | Project keystore if secrets exist; else debug | Obtainium (include pre-releases) |
| **GitHub `v*`** | Annotated tag on `main` | Project keystore (CI) | Obtainium / sideload |
| **F-Droid** | Manual fdroiddata MR after a stable tag + Byte-RB | F-Droid key | Later |

Agents: follow this file. Stack: [`docs/native-android-stack.md`](native-android-stack.md). Android plan: [`docs/ANDROID_DEVELOPMENT_PLAN.md`](ANDROID_DEVELOPMENT_PLAN.md).

## Early Android installs (Obtainium) — preferred while building PR B→H

Workflow: [`.github/workflows/build-release.yml`](../.github/workflows/build-release.yml).

1. Merge Android work to `main` (or run **Build & Sign Android** → `workflow_dispatch`).
2. CI publishes / updates the floating pre-release tag **`preview`** with:
   - `solo-preview-foss.apk` — phone (`net.moonbaseone.solo`)
   - `solo-tv-preview-foss.apk` — Android TV (`net.moonbaseone.solo.tv`)
   - `sha256.txt`
3. On the phone (and TV box), add the repo in Obtainium:

| Setting | Value |
| --- | --- |
| Source | `https://github.com/ingmarstruijs/SOLO` (this repo) |
| Include pre-releases | **On** (required for `preview`) |
| APK filter (phone) | `solo-preview-foss\.apk` |
| APK filter (TV) | `solo-tv-preview-foss\.apk` |

Use **two** Obtainium entries (one phone, one TV) so each app tracks the matching APK.

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
sha256sum solo-preview-foss.apk
keytool -printcert -jarfile solo-preview-foss.apk
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
