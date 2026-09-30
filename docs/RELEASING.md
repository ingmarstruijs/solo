# Releasing SOLO (for maintainers / agents)

`main` should stay protected: no direct pushes for releases. Every Android version eventually ships on **two channels** that do not auto-sync:

| Channel | What publishes it | Signing |
| --- | --- | --- |
| **GitHub Releases** | Annotated `v*` tag whose commit is on `main` | Project keystore (CI) |
| **F-Droid** | Manual fdroiddata MR after the tag | F-Droid key (re-signed) |

Agents: follow this file end-to-end. Stack decisions: [`docs/native-android-stack.md`](native-android-stack.md). F-Droid details: [`metadata/FDROID_SUBMISSION.md`](../metadata/FDROID_SUBMISSION.md).

> **Status:** PWA + Pages deploy today. Kotlin/Compose Android APK CI is **not** wired yet. Still keep CHANGELOG / Fastlane / metadata discipline so the first APK release can follow Kinetic’s path.

## Dual-channel checklist (every version)

1. **Bump PR** (`release/X.Y.Z`) → merge to `main` after CI
   - `package.json` → `"version": "X.Y.Z"` (and Android `versionName` / `versionCode` once `android/` exists)
   - Move `## [Unreleased]` into `## [X.Y.Z] - YYYY-MM-DD` in [`CHANGELOG.md`](../CHANGELOG.md) (include `### Store`)
   - Run `./tool/sync_fastlane_changelogs.sh` and commit `fastlane/metadata/android/en-US/changelogs/{N}.txt`
   - When Android exists: keep `dependenciesInfo { includeInApk = false }` in the app Gradle file (F-Droid `check apk`)
   - Draft `metadata/*.yml` updates (`commit:` filled **after** tag)
2. **Tag** the merge commit on `main`
3. Put the **full SHA** of `vX.Y.Z` into `metadata/*.yml` `commit:` (never a bare tag name for F-Droid)
4. Verify recipe + **Byte-RB**: `./tool/fdroid_build.sh` and `./tool/verify_reproducible.sh` (once Android exists)
5. **fdroiddata MR** — only if RB verification passed; include RB/`Binaries:` as required
6. Watch [F-Droid build logs](https://f-droid.org/wiki/page/Build) after merge

**Do not** publish an F-Droid update for a tag that failed reproducible verification.

## Version bump → tag

1. Open a PR (`release/x.y.z`) that bumps:
   - `package.json` version
   - [`CHANGELOG.md`](../CHANGELOG.md) (`### Store` = Fastlane / F-Droid store notes)
   - Run `./tool/sync_fastlane_changelogs.sh` (do not hand-edit Fastlane changelog txt unless regenerating)
   - `metadata/*.yml` version fields; leave `commit:` placeholder until the tag exists
2. Wait for CI (`build`), merge to `main`
3. Tag **that** merge commit:

```bash
git checkout main && git pull
git tag -a vX.Y.Z -m "SOLO X.Y.Z"
git push origin vX.Y.Z
git rev-parse vX.Y.Z   # full SHA → metadata commit: + fdroiddata
```

A `v*` tag **not** on `main` must not create GitHub Releases (gate the release job like Kinetic).

## GitHub release artifacts (target shape)

Once Android CI exists, each tag should publish:

- `solo-X.Y.Z-foss.apk` (F-Droid-compatible flavor; also for sideload)
- optional `solo-X.Y.Z-full.apk` (GitHub-only; may include Cast/GMS)
- `sha256.txt`
- Release notes = `## [X.Y.Z]` from `CHANGELOG.md` + checksum + signing fingerprint

F-Droid APKs use a **different** certificate than GitHub Releases.

## F-Droid

Tagging does **not** update f-droid.org. After each tag:

1. Set `commit:` in repo `metadata/*.yml` to `git rev-parse vX.Y.Z`
2. Copy **yml only** into an [fdroiddata](https://gitlab.com/fdroid/fdroiddata) fork
3. Open the GitLab MR; see [`metadata/FDROID_SUBMISSION.md`](../metadata/FDROID_SUBMISSION.md)

Do not put store graphics in fdroiddata (Fastlane stays in this repo). Do not re-enable AGP `dependenciesInfo` in APKs.

## Verify release APKs

### 1. File integrity (SHA-256 of the APK bytes)

```bash
sha256sum solo-X.Y.Z-foss.apk
```

### 2. Signing certificate fingerprint

What AppVerifier shows. Listed in the GitHub Release. F-Droid builds differ.

```bash
keytool -printcert -jarfile solo-X.Y.Z-foss.apk
```

## Local builds

### Web / PWA (today)

```bash
npm ci
npm run build
```

### F-Droid-shaped Android (after Compose app)

```bash
./tool/fdroid_build.sh
```

Must mirror metadata exactly (pinned JDK/AGP, `assembleFossRelease`, **no npm in foss**). Then run reproducible verification against the CI/GitHub artifact before any fdroiddata MR. See [native-android-stack.md](native-android-stack.md#reproducible-builds-byte-rb--required).

SOLO requires **Byte-RB**; do not defer it.
