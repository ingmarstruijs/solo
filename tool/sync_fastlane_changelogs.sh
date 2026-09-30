#!/usr/bin/env bash
# Sync Fastlane store changelogs from CHANGELOG.md ### Store section.
#
# Usage:
#   ./tool/sync_fastlane_changelogs.sh              # write changelogs/{versionCode}.txt
#   ./tool/sync_fastlane_changelogs.sh --check       # verify committed file matches
#   ./tool/sync_fastlane_changelogs.sh --version X.Y.Z --code N
#   ./tool/sync_fastlane_changelogs.sh --extract-section VERSION
#
# Version/code sources:
#   - package.json "version"
#   - metadata/net.moonbaseone.solo.yml CurrentVersionCode (until android/ versionCode is authoritative)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CHANGELOG="CHANGELOG.md"
FASTLANE_DIR="fastlane/metadata/android/en-US/changelogs"
META_YML="metadata/net.moonbaseone.solo.yml"

CHECK=0
EXTRACT_VERSION=""
FORCE_VERSION=""
FORCE_CODE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK=1; shift ;;
    --version) FORCE_VERSION="${2:-}"; shift 2 ;;
    --code) FORCE_CODE="${2:-}"; shift 2 ;;
    --extract-section)
      EXTRACT_VERSION="${2:-}"
      shift 2
      ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Usage: $0 [--check] [--version X.Y.Z --code N] [--extract-section VERSION]" >&2
      exit 1
      ;;
  esac
done

if [[ -n "$FORCE_VERSION" || -n "$FORCE_CODE" ]]; then
  if [[ -z "$FORCE_VERSION" || -z "$FORCE_CODE" ]]; then
    echo "--version and --code must be used together" >&2
    exit 1
  fi
fi

changelog_section() {
  local changelog="$1"
  local version="$2"
  awk -v ver="$version" '
    BEGIN { hdr = "## [" ver "]" }
    index($0, hdr) == 1 && $0 ~ /^## \[/ { grab=1; print; next }
    grab && /^## \[/ { exit }
    grab { print }
  ' "$changelog"
}

store_body() {
  awk '
    /^### Store/ { grab=1; next }
    grab && /^### / { exit }
    grab { print }
  ' | sed -e 's/[[:space:]]*$//' | awk '
    NF { seen=1 }
    seen { lines[++n]=$0 }
    END {
      while (n > 0 && lines[n] == "") n--
      if (n < 1) exit 1
      for (i = 1; i <= n; i++) print lines[i]
    }
  '
}

extract_store() {
  local version="$1"
  local section store
  section="$(changelog_section "$CHANGELOG" "$version")"
  if [[ -z "$section" ]]; then
    echo "Missing ## [$version] in $CHANGELOG" >&2
    return 1
  fi
  store="$(printf '%s\n' "$section" | store_body)" || {
    echo "Missing ### Store under ## [$version] in $CHANGELOG" >&2
    return 1
  }
  printf '%s\n' "$store"
}

pkg_version() {
  node -e "console.log(require('./package.json').version)"
}

meta_version_code() {
  awk '
    /^CurrentVersionCode:/ { print $2; exit }
  ' "$META_YML"
}

if [[ -n "$EXTRACT_VERSION" ]]; then
  changelog_section "$CHANGELOG" "$EXTRACT_VERSION"
  exit 0
fi

VERSION="${FORCE_VERSION:-$(pkg_version)}"
CODE="${FORCE_CODE:-$(meta_version_code)}"

if [[ -z "$VERSION" || -z "$CODE" ]]; then
  echo "Could not resolve version ($VERSION) or versionCode ($CODE)" >&2
  exit 1
fi

STORE="$(extract_store "$VERSION")"
OUT="$FASTLANE_DIR/${CODE}.txt"
mkdir -p "$FASTLANE_DIR"

if [[ "$CHECK" -eq 1 ]]; then
  if [[ ! -f "$OUT" ]]; then
    echo "Missing $OUT — run ./tool/sync_fastlane_changelogs.sh" >&2
    exit 1
  fi
  if ! diff -u "$OUT" <(printf '%s\n' "$STORE") >/dev/null; then
    echo "Fastlane changelog out of date for $VERSION (code $CODE)." >&2
    echo "Run: ./tool/sync_fastlane_changelogs.sh" >&2
    diff -u "$OUT" <(printf '%s\n' "$STORE") || true
    exit 1
  fi
  echo "OK: $OUT matches ### Store for $VERSION"
  exit 0
fi

printf '%s\n' "$STORE" > "$OUT"
echo "Wrote $OUT (SOLO $VERSION / versionCode $CODE)"
