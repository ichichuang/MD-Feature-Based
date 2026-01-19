import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@unocss/reset/tailwind.css' // <--- 样式重置，防止不同浏览器显示不一样
import 'virtual:uno.css'           // <--- 激活 UnoCSS
import './style.css'               // <--- 留着放一些 Tiptap 的全局样式
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
