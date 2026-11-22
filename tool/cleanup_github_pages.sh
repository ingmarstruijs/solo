#!/usr/bin/env bash
# Retire GitHub Pages for this repo: disable the site, delete github-pages
# deployments, and remove the environment. Run as a repo admin (your user
# token — the cloud agent cannot do this with the integration token).
#
# Usage (from repo root):
#   ./tool/cleanup_github_pages.sh
#
# Requires: gh auth with admin:repo / pages write on ingmarstruijs/solo

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-ingmarstruijs/solo}"

echo "==> Disable GitHub Pages site on ${REPO}"
if gh api -X DELETE "repos/${REPO}/pages" >/dev/null 2>&1; then
  echo "Pages site deleted."
else
  echo "Pages already off or not deletable via API (check Settings → Pages)."
fi

echo "==> Delete github-pages deployments"
IDS=$(gh api --paginate "repos/${REPO}/deployments?environment=github-pages&per_page=100" --jq '.[].id' || true)
if [ -z "${IDS}" ]; then
  echo "No github-pages deployments found."
else
  for id in ${IDS}; do
    gh api -X POST "repos/${REPO}/deployments/${id}/statuses" \
      -f state=inactive \
      -f description='Retired: Pages no longer product path' \
      >/dev/null 2>&1 || true
    if gh api -X DELETE "repos/${REPO}/deployments/${id}" >/dev/null 2>&1; then
      echo "  deleted deployment ${id}"
    else
      echo "  could not delete ${id} (try UI: Deployments → github-pages)"
    fi
  done
fi

echo "==> Delete github-pages environment"
if gh api -X DELETE "repos/${REPO}/environments/github-pages" >/dev/null 2>&1; then
  echo "Environment github-pages deleted."
else
  echo "Could not delete environment via API — Settings → Environments → github-pages → Delete."
fi

echo "==> Done. Re-enable Pages later only when rolling a marketing site via Deploy web (manual)."
