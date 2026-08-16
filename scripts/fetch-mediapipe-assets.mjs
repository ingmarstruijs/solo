#!/usr/bin/env node
/**
 * Copy MediaPipe vision WASM from node_modules and fetch the lite pose model
 * into public/mediapipe so the PWA can load them from the same origin.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const wasmDest = join(root, 'public', 'mediapipe', 'wasm')
const modelDest = join(root, 'public', 'mediapipe', 'pose_landmarker_lite.task')
const modelUrl =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const from = join(src, entry)
    const to = join(dest, entry)
    if (statSync(from).isDirectory()) copyDir(from, to)
    else copyFileSync(from, to)
  }
}

if (!existsSync(wasmSrc)) {
  console.warn('[mediapipe] @mediapipe/tasks-vision wasm not found — skip asset sync')
  process.exit(0)
}

copyDir(wasmSrc, wasmDest)
console.log('[mediapipe] synced wasm → public/mediapipe/wasm')

if (existsSync(modelDest) && statSync(modelDest).size > 1_000_000) {
  console.log('[mediapipe] pose model already present')
  process.exit(0)
}

mkdirSync(dirname(modelDest), { recursive: true })
const res = await fetch(modelUrl)
if (!res.ok) {
  console.warn(`[mediapipe] failed to download pose model: ${res.status}`)
  process.exit(0)
}
const buffer = Buffer.from(await res.arrayBuffer())
const { writeFileSync } = await import('node:fs')
writeFileSync(modelDest, buffer)
console.log(`[mediapipe] downloaded pose model (${Math.round(buffer.length / 1024 / 1024)} MB)`)
