#!/usr/bin/env bash
# Mirrors the F-Droid metadata build recipe for local verification.
# Usage: ./tool/fdroid_build.sh
#
# Early device installs use GitHub Releases + Obtainium (see docs/RELEASING.md).
# This script is for the later F-Droid / Byte-RB path only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d apps/android || ! -f apps/settings.gradle.kts ]]; then
  cat >&2 <<'EOF'
fdroid_build.sh: expected apps/ Android Gradle project missing.
EOF
  exit 1
fi

(
  cd apps
  ./gradlew :android:assembleFossRelease :android-tv:assembleFossRelease
)

echo "Phone APK:"
ls -la apps/android/build/outputs/apk/foss/release/ 2>/dev/null || true
echo "TV APK:"
ls -la apps/android-tv/build/outputs/apk/foss/release/ 2>/dev/null || true
