// uno.config.ts
import { defineConfig, presetUno, presetIcons, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(), // 默认的 Tailwind 风格工具类
    presetIcons({ scale: 1.2, warn: true }), // 自动引入图标
    presetWebFonts({
      provider: 'google', // 使用 Google Fonts 代理
      fonts: {
        sans: 'Inter:400,700', // 现代无衬线字体
        mono: 'Fira Code',     // 代码字体
      },
    }),
  ],
  // 快捷方式：把一堆类名打包成一个名字，写起来更爽
  shortcuts: {
    'btn-base': 'px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer border-none outline-none',
    'btn-primary': 'btn-base bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95',
    'btn-ghost': 'btn-base bg-transparent text-gray-600 hover:bg-gray-100',
    'panel-box': 'bg-white border border-gray-100 shadow-sm rounded-xl',
  },
  // 主题配置
  theme: {
    colors: {
      brand: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        900: '#1e3a8a',
      }
    }
  }
})
