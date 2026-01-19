import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite' // <--- 必须有这一行

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(), // <--- 注册插件
  ],
})
