import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.app.json',
      exclude: ['src/main.ts', 'src/App.vue'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SileoVue',
      fileName: 'sileo-vue',
    },
    rollupOptions: {
      external: ['vue', 'motion-v'],
      output: {
        globals: {
          vue: 'Vue',
          'motion-v': 'MotionV',
        },
      },
    },
  },
})