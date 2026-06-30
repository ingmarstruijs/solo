#!/usr/bin/env node
/**
 * Seed SOLO workouts into browser localStorage.
 *
 * Usage:
 *   npm run seed:workouts              # print browser console snippet
 *   npm run seed:workouts -- --write   # write public/seed-workouts.json
 *   npm run seed:workouts -- --merge   # merge instead of replace (in snippet)
 *
 * Paste the printed snippet in DevTools while the app is open, then reload.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const KEY = 'solo-workouts'
const SEEDED_KEY = 'solo-workouts-seeded'

const args = new Set(process.argv.slice(2))
const shouldWrite = args.has('--write')
const merge = args.has('--merge')

function loadSeedExport() {
  // Keep JSON in sync from TypeScript source of truth.
  execSync('npx tsx scripts/export-seed-workouts.ts', { cwd: ROOT, stdio: 'pipe' })
  const jsonPath = join(ROOT, 'scripts', 'seed-workouts.json')
  return JSON.parse(readFileSync(jsonPath, 'utf8'))
}

function buildBrowserSnippet(exportData) {
  const workoutsJson = JSON.stringify(exportData.workouts)

  if (merge) {
    return `(function(){const KEY='${KEY}';const SEEDED='${SEEDED_KEY}';const incoming=${workoutsJson};const existing=JSON.parse(localStorage.getItem(KEY)||'[]');const ids=new Set(existing.map(w=>w.id));const merged=[...existing,...incoming.filter(w=>!ids.has(w.id))];localStorage.setItem(KEY,JSON.stringify(merged));localStorage.setItem(SEEDED,'1');console.log('Merged',incoming.length,'seed workouts →',merged.length,'total');location.reload();})();`
  }

  return `(function(){const KEY='${KEY}';const SEEDED='${SEEDED_KEY}';const workouts=${workoutsJson};localStorage.setItem(KEY,JSON.stringify(workouts));localStorage.setItem(SEEDED,'1');console.log('Seeded',workouts.length,'workouts');location.reload();})();`
}

function main() {
  const exportData = loadSeedExport()

  if (shouldWrite) {
    const outPath = join(ROOT, 'public', 'seed-workouts.json')
    writeFileSync(outPath, JSON.stringify(exportData, null, 2))
    console.log(`Wrote ${outPath} (${exportData.workouts.length} workouts)`)
  }

  console.log('\nSOLO workout seed')
  console.log('=================')
  console.log(`Workouts: ${exportData.workouts.length}`)
  console.log(`Mode: ${merge ? 'merge (skip existing ids)' : 'replace'}`)
  console.log('\n1. Open the app in your browser (npm run dev)')
  console.log('2. Open DevTools → Console')
  console.log('3. Paste and run:\n')
  console.log(buildBrowserSnippet(exportData))
  console.log('\n')
}

main()
