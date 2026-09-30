#!/usr/bin/env bash
# Mirrors the F-Droid metadata build recipe for local verification.
# Usage: ./tool/fdroid_build.sh
#
# STATUS: Stub until Kotlin/Compose apps/android/ + foss flavor exist.
# When ready, this script must match metadata/net.moonbaseone.solo.yml
# prebuild/build exactly (same role as Kinetic's tool/fdroid_build.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ANDROID_DIR=""
if [[ -d apps/android ]]; then
  ANDROID_DIR="apps/android"
elif [[ -d android ]]; then
  ANDROID_DIR="android"
fi

if [[ -z "$ANDROID_DIR" ]]; then
  cat >&2 <<'EOF'
fdroid_build.sh: no apps/android/ (or android/) yet.

Scaffold Kotlin + Compose (foss flavor), then implement this script to:
  1. (cd apps/android && ./gradlew assembleFossRelease) — pinned JDK/AGP, no npm in foss
  2. Print the output APK path + expected versionCode
  3. Pair with ./tool/verify_reproducible.sh for Byte-RB (required before F-Droid)
EOF
  exit 1
fi

# Optional TV web asset build — DISABLED for foss Byte-RB by default.
# Prefer Compose Android TV. Do not enable npm here without proving bit-identical builds.

(
  cd "$ANDROID_DIR"
  ./gradlew assembleFossRelease
)

echo "APK (expected): $ANDROID_DIR/app/build/outputs/apk/foss/release/"
ls -la "$ANDROID_DIR/app/build/outputs/apk/foss/release/" 2>/dev/null || true
