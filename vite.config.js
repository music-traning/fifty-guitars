import { defineConfig } from 'vite'

export default defineConfig({
  // リポジトリ名を設定（これが重要！）
  base: '/fifty-gutars/',
  build: {
    outDir: 'docs', // 出力先を 'dist' ではなく 'docs' に変更
  }
})