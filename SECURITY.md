# Security — SOLO.

SOLO is a client-side PWA: no backend, no accounts, no secrets in the repository. User data stays in the browser (`localStorage` / `sessionStorage`).

This document describes what is already in place and which GitHub settings are worth enabling.

## What the repo already does

- **No secrets in code** — `.env` is gitignored; the deploy workflow does not use `secrets.*`
- **Minimal workflow permissions** — deploy workflow: `contents: read`, `pages: write`, `id-token: write`
- **Deploy only from `main`** — GitHub Pages via `.github/workflows/deploy.yml`
- **CI on pull requests** — `.github/workflows/ci.yml` runs `npm ci` + `npm run build`
- **Dependabot config** — `.github/dependabot.yml` for npm and GitHub Actions (enable alerts in GitHub settings; see below)

## Reporting vulnerabilities

If you find a security issue, open a [GitHub Security Advisory](https://github.com/ingmarstruijs/solo/security/advisories/new) or email the maintainer privately. Do not post exploit details in public issues before a fix is available.

## Maintainer checklist (GitHub.com)

### 1. Dependabot alerts

1. Open **https://github.com/ingmarstruijs/solo/settings/security_analysis**
2. Under **Dependabot**, enable:
   - **Dependabot alerts**
   - **Dependabot security updates** (optional but recommended — auto-PRs for known CVEs)
3. Save

After the next push that includes `.github/dependabot.yml`, you will also get **version update PRs** weekly (npm + Actions).

### 2. Branch protection on `main`

1. Open **https://github.com/ingmarstruijs/solo/settings/branches**
2. Click **Add branch ruleset** (or **Add classic branch protection rule**)
3. Branch name pattern: `main`
4. Recommended settings:
   - **Require a pull request before merging** — blocks direct push to `main`
   - **Require status checks to pass** — add check name: **`build`** (from the CI workflow)
   - **Require branches to be up to date before merging** — avoids merging stale green PRs
   - **Do not allow bypassing the above settings** (unless you want admin override)
5. Save

From then on: feature branch → PR → CI green → merge → deploy workflow runs on `main`.

### 3. Restrict Actions on forks (if you accept external PRs)

1. Open **https://github.com/ingmarstruijs/solo/settings/actions**
2. Under **Fork pull request workflows**, choose:
   - **Require approval for first-time contributors** (good default), or
   - **Disable** if you do not need CI on forks

This prevents strangers from running arbitrary workflow code on your repo without review.

### 4. GitHub Pages source

Confirm Pages uses **GitHub Actions** (not “Deploy from branch”):

1. **https://github.com/ingmarstruijs/solo/settings/pages**
2. **Build and deployment** → Source: **GitHub Actions**

### 5. What you do not need for SOLO

- Repository secrets for deploy (OIDC + `GITHUB_TOKEN` is enough)
- Private repo (unless you want hidden source code)
- Server-side auth or API keys in the frontend

## Local hygiene

- Never commit `.env`, tokens, or Garmin/API keys
- Run `npm run build` before merging large changes
- Review Dependabot PRs; merge security updates promptly
