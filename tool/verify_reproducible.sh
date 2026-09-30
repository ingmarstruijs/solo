#!/usr/bin/env bash
# Verify byte-reproducible foss APKs (SOLO hard requirement).
# Usage:
#   ./tool/verify_reproducible.sh path/to/reference.apk
#   ./tool/verify_reproducible.sh path/to/reference.apk path/to/rebuilt.apk
#
# STATUS: Stub until apps/android exists and fdroid_build.sh produces APKs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REF="${1:-}"
REBUILT="${2:-}"

if [[ -z "$REF" ]]; then
  cat >&2 <<'EOF'
verify_reproducible.sh: Byte-RB gate for SOLO.

Usage:
  ./tool/verify_reproducible.sh <reference-foss.apk> [rebuilt-foss.apk]

If only the reference is passed, this script should (once implemented):
  1. Run ./tool/fdroid_build.sh in a clean tree
  2. Compare reference vs rebuilt (strip signatures / use apkdiff or diffoscope)
  3. Exit 0 only on match

Until Android lands, always exit 1.
See docs/native-android-stack.md (Byte-RB section).
EOF
  exit 1
fi

if [[ ! -f "$REF" ]]; then
  echo "Reference APK not found: $REF" >&2
  exit 1
fi

if [[ -z "$REBUILT" ]]; then
  echo "Auto-rebuild compare not implemented yet — pass rebuilt APK as arg 2, or scaffold Android first." >&2
  exit 1
fi

if [[ ! -f "$REBUILT" ]]; then
  echo "Rebuilt APK not found: $REBUILT" >&2
  exit 1
fi

# Placeholder comparison — replace with apkdiff/diffoscope / apksigcopier flow.
if command -v sha256sum >/dev/null; then
  echo "REF:    $(sha256sum "$REF")"
  echo "REBUILT:$(sha256sum "$REBUILT")"
fi

echo "TODO: implement signature-stripped APK comparison (Byte-RB)." >&2
exit 1
