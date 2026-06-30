import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'SOLO'
const ghPagesBase = `/${repoName}/`

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? ghPagesBase : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'SOLO.',
        short_name: 'SOLO.',
        description: 'Solo training. Zero noise. Privacy-first thuistraining.',
        lang: 'nl',
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
  server: { host: true },
})
