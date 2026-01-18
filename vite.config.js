import { defineConfig } from 'vite'

export default defineConfig({
  // ↓ここを直す
  base: '/fifty-guitars/', 
  build: {
    outDir: 'docs',
  }
})