# F-Droid — SOLO

Metadata drafts live under `metadata/` in this repo. Listing on f-droid.org needs merge requests against [fdroiddata](https://gitlab.com/fdroid/fdroiddata).

Maintainer/agent release order (GitHub **and** F-Droid): [`docs/RELEASING.md`](../docs/RELEASING.md).  
Stack: [`docs/native-android-stack.md`](../docs/native-android-stack.md) — **Kotlin + Compose**, not Capacitor.

## Status

| App | Application ID | Listing |
| --- | --- | --- |
| SOLO | `net.moonbaseone.solo` | **Not submitted** — Compose Android + `foss` recipe not shipping yet |

Update this table when the first fdroiddata MR opens / goes live.

## Byte-reproducible builds — required

SOLO **requires** Reproducible Builds for F-Droid `foss` APKs. Unlike Kinetic’s deferred RB, do not list until verification passes.

| Factor | Assessment |
| --- | --- |
| Compose / AGP | Standard; pin JDK/AGP/Gradle for RB |
| Node in APK recipe | **Avoid** for `foss` — Compose TV, not Vite-in-APK |
| GMS / Cast | Out of `foss` |
| From-source | Required |
| **Byte-RB** | **Required** before first/listing update MRs |

### Verify before every F-Droid update

1. CI produces `foss` APK(s) for the tag  
2. `./tool/fdroid_build.sh` rebuilds from the same commit  
3. `./tool/verify_reproducible.sh` (to add) confirms match (diffoscope / apk comparison)  
4. Only then copy YAML to fdroiddata with the RB/`Binaries:` fields maintainers expect  

Details: [`docs/native-android-stack.md`](../docs/native-android-stack.md#reproducible-builds-byte-rb--required).

## Will F-Droid accept Kotlin + Compose?

**Yes.** Gradle/Compose is routine. Our bar is higher: **reproducible** `foss` phone (+ TV) APKs.

## Release flow (every version after first listing)

GitHub Releases and F-Droid are **separate**. Tagging `main` publishes GitHub APKs (once CI exists); F-Droid stays on the previous version until you open an fdroiddata MR.

1. **Version bump PR** (`release/X.Y.Z`):
   - Bump Android `versionName` / `versionCode` (+ `package.json` if web ships in lockstep)
   - Update `CHANGELOG.md` (`### Store` + detail), run `./tool/sync_fastlane_changelogs.sh`
   - Update `metadata/*.yml` version fields; set `commit:` to **full SHA** after the tag
   - Merge to `main` after CI
2. **Tag** the merge commit → GitHub APKs
3. **Verify** locally: `./tool/fdroid_build.sh`
4. **Update fdroiddata**: new `Builds:` entry + `CurrentVersion*`. Do **not** copy Fastlane/screenshot dirs
5. Watch [build logs](https://f-droid.org/wiki/page/Build)

### Version alignment checklist

- [ ] Android `versionName` / `versionCode` match metadata
- [ ] `CHANGELOG.md` has `## [X.Y.Z]` with `### Store`
- [ ] Fastlane `changelogs/{versionCode}.txt` synced (`./tool/sync_fastlane_changelogs.sh --check`)
- [ ] Metadata `commit: <full SHA>` of annotated tag on `main`
- [ ] JDK / AGP pins match CI / metadata
- [ ] `foss` has no GMS / Cast / non-free SDKs
- [ ] `dependenciesInfo.includeInApk = false` still set
- [ ] **Byte-RB:** `verify_reproducible.sh` (or equivalent) green for this tag
- [ ] fdroiddata RB / `Binaries:` fields filled per current F-Droid practice

## First-time submission (when Android is ready)

Paste kit starter: [`FDROID_MR_BODY.md`](FDROID_MR_BODY.md).

Rules that reject many first attempts:

1. Fastlane under `fastlane/metadata/android/en-US/` (title, short + full description, changelogs, icon, phoneScreenshots)
2. Tag on `main`; `commit:` = **full SHA** (not `vX.Y.Z`)
3. fdroiddata gets **yml only** — no asset directories
4. Title `New app: SOLO`, App inclusion template
5. Leave `AutoUpdateMode: None` until safe; **do not** skip Reproducible Builds — SOLO requires Byte-RB on first listing
6. No top-level `PrivacyPolicy:` metadata field (link privacy from Fastlane description instead)
7. No JetBrains `cache-redirector` Maven URLs
8. No Node/Vite steps in the `foss` APK recipe unless proven bit-identical under `SOURCE_DATE_EPOCH`

## Local build notes

`tool/fdroid_build.sh` must mirror YAML `prebuild` / `build`. Until `apps/android` (or `android/`) exists, the script exits with a clear message.

**Windows:** use Git Bash or WSL for bash scripts.

### Expected recipe shape (draft)

```yaml
# Conceptual — see metadata/net.moonbaseone.solo.yml
# No npm in foss path. Pinned JDK. Byte-RB required.
build:
  - cd apps/android && ./gradlew assembleFossRelease
output: apps/android/app/build/outputs/apk/foss/release/app-foss-release-unsigned.apk
```

Separate YAML (later) for `net.moonbaseone.solo.tv` with the same RB bar.

## Privacy

Link https://raw.githubusercontent.com/ingmarstruijs/solo/main/PRIVACY.md from the Fastlane full description. Keep `PRIVACY.md` accurate as BLE / camera / LAN server land.
