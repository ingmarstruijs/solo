#!/usr/bin/env node
/**
 * Copy @ffmpeg/core ESM binaries into public/ffmpeg for same-origin loading.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm')
const destDir = join(root, 'public', 'ffmpeg')

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm']

if (!existsSync(srcDir)) {
  console.warn('[ffmpeg] @ffmpeg/core not found — skip asset sync')
  process.exit(0)
}

mkdirSync(destDir, { recursive: true })
for (const file of files) {
  const from = join(srcDir, file)
  if (!existsSync(from)) {
    console.warn(`[ffmpeg] missing ${file}`)
    continue
  }
  copyFileSync(from, join(destDir, file))
}
console.log('[ffmpeg] synced core → public/ffmpeg')
