/**
 * Export seed workouts from TypeScript to JSON for scripts/seed-workouts.mjs.
 * Run via: npx tsx scripts/export-seed-workouts.ts
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSeedWorkoutExport } from '../src/data/seedWorkouts.ts'

const out = join(dirname(fileURLToPath(import.meta.url)), 'seed-workouts.json')
writeFileSync(out, JSON.stringify(buildSeedWorkoutExport(), null, 2))
console.log(`Exported ${buildSeedWorkoutExport().workouts.length} workouts → ${out}`)
