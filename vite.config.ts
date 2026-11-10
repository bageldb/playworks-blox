import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { bloxPlugin } from '@bagelink/blox/vite'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [...bloxPlugin({ ssr: true }), vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    dedupe: ['vue', 'vue-router', 'pinia'],
  },
  ssr: {
    noExternal: ['@bageldb/blox-renderer', /^@bagelink\//, 'vue', 'vue-router', 'pinia'],
  },
  build: {
    ...(isSsrBuild
      ? {
          ssr: true,
          rollupOptions: { input: 'src/main.server.ts' },
          outDir: 'dist/server',
        }
      : {}),
  },
}))
