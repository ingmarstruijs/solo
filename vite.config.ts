import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'solo'
const ghPagesBase = `/${repoName}/`

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? ghPagesBase : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg'],
      workbox: {
        // Large on-demand assets (MediaPipe, WebLLM) stay out of the SW precache.
        globIgnores: ['**/mediapipe/**', '**/webllm-*.js', '**/lib-*.js'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'SOLO.',
        short_name: 'SOLO.',
        description: 'Solo training. Zero noise. Privacy-first home training.',
        lang: 'en',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0E11',
        theme_color: '#0B0E11',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
    {
      name: 'gh-pages-spa-fallback',
      closeBundle() {
        if (process.env.GITHUB_ACTIONS !== 'true') return
        const distIndex = join(process.cwd(), 'dist', 'index.html')
        const dist404 = join(process.cwd(), 'dist', '404.html')
        if (existsSync(distIndex)) copyFileSync(distIndex, dist404)
      },
    },
  ],
  resolve: {
    alias: { '@': srcDir },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mlc-ai/web-llm') || id.includes('@mlc-ai/web-runtime')) {
            return 'webllm'
          }
        },
      },
    },
  },
  server: { host: true },
})
