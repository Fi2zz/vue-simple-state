import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: true,
      include: ['src/**/*.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueSimpleState',
      fileName: 'vue-simple-state',
    },
    rollupOptions: {
      external: ['vue', 'lodash-es'],
      output: {
        globals: {
          vue: 'Vue',
          'lodash-es': '_',
        },
      },
    },
  },
})
