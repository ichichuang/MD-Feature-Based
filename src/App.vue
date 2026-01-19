<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { toPng } from 'html-to-image'
import { useEditorStore } from './stores/editorStore'
import MainCanvas from './features/canvas/MainCanvas.vue'
import MaterialPanel from './features/material-market/MaterialPanel.vue'
import StylePanel from './features/settings/StylePanel.vue'
import TemplateSelector from './features/material-market/TemplateSelector.vue'
import ConfirmDialog from './shared/components/ConfirmDialog.vue'
import { useConfirm } from './shared/composables/useConfirm'

const store = useEditorStore()
const { copy, copied } = useClipboard()
const { showDialog, dialogOptions, confirm, handleConfirm, handleCancel } = useConfirm()

const handleCopy = () => {
  const html = store.getHtml()
  copy(html)
}

// 截图逻辑：包含自动修复高度
const handleDownloadImage = async () => {
  const node = document.getElementById('magic-paper')
  if (!node) return
  
  try {
    // 显式获取真实滚动高度，防止截断
    const width = node.scrollWidth
    const height = node.scrollHeight

    const dataUrl = await toPng(node, { 
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: width,   
      height: height, 
      style: {
        transform: 'none', 
        maxHeight: 'none',
        height: 'auto' // 截图时强制高度自动
      }
    })
    
    const link = document.createElement('a')
    link.download = `magic-editor-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('图片生成失败', error)
    await confirm({
      title: '操作失败',
      message: '图片生成失败，请重试',
      type: 'danger',
      confirmText: '知道了',
      cancelText: '' // 隐藏取消按钮，只显示一个按钮
    })
  }
}

const isMobilePreview = ref(false)

const clearCanvas = async () => {
  const result = await confirm({
    title: '确认清空',
    message: '确定要清空所有内容吗？此操作不可撤销。',
    type: 'danger',
    confirmText: '清空',
    cancelText: '取消'
  })
  
  if (result) {
    store.editor?.commands.clearContent()
  }
}
</script>

<template>
  <div class="h-screen w-screen bg-gradient-to-br from-[#f3e7e9] to-[#e3eeff] flex flex-col font-sans text-gray-700 overflow-hidden">
    
    <header class="h-16 bg-white/70 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
      <div class="flex items-center gap-2">
        <div class="i-carbon-magic-wand-filled text-blue-600 text-xl"></div>
        <h1 class="font-bold text-lg tracking-tight text-gray-800">Magic Editor</h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- 模板选择器 -->
        <TemplateSelector />
        
        <!-- 撤销/重做按钮组 -->
        <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-2">
          <button 
            @click="store.editor?.chain().focus().undo().run()"
            :disabled="!store.editor?.can().undo()"
            class="w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
            title="撤销 (Ctrl+Z)"
          >
            <div class="i-carbon-undo text-sm"></div>
          </button>

          <button 
            @click="store.editor?.chain().focus().redo().run()"
            :disabled="!store.editor?.can().redo()"
            class="w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
            title="重做 (Ctrl+Y)"
          >
            <div class="i-carbon-redo text-sm"></div>
          </button>
        </div>

        <button @click="handleDownloadImage" class="btn-ghost text-sm bg-white/50 hover:bg-white">
          <div class="i-carbon-image"></div> 存为图片
        </button>
        <button 
          @click="handleCopy" 
          class="btn-primary shadow-lg shadow-blue-500/30"
          :class="copied ? '!bg-green-600' : ''"
        >
          <div :class="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'"></div> 
          {{ copied ? '已复制！' : '一键复制 HTML' }}
        </button>
      </div>
    </header>

    <div class="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr_300px] overflow-hidden">
      
      <aside class="hidden md:flex flex-col border-r border-white/40 bg-white/60 backdrop-blur-lg h-full overflow-hidden">
        <div class="p-4 border-b border-black/5 font-bold text-sm text-gray-600 flex items-center gap-2 shrink-0">
          <div class="i-carbon-template"></div> 素材库
        </div>
        <div class="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <MaterialPanel />
        </div>
      </aside>

      <main class="h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center custom-scrollbar scroll-smooth relative">
        
        <div 
          id="magic-paper"
          class="bg-white shadow-2xl rounded-xl relative border border-white/60 shrink-0 h-auto"
          :class="isMobilePreview ? 'w-[375px] min-h-[667px]' : 'w-full max-w-[800px] min-h-[1000px]'"
        >
           <div class="p-8">
             <MainCanvas />
           </div>
        </div>

        <div class="h-20 shrink-0 w-full"></div>
      </main>

      <aside class="hidden md:flex flex-col border-l border-white/40 bg-white/60 backdrop-blur-lg h-full">
        <div class="p-4 border-b border-black/5 font-bold text-sm text-gray-600 shrink-0 flex justify-between items-center">
          <span>🎨 样式调整</span>
        </div>
        
        <div class="flex-1 overflow-hidden flex flex-col">
           <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
             <StylePanel />
           </div>

           <div class="p-4 border-t border-white/40 bg-white/40">
              <div class="flex items-center justify-between cursor-pointer group select-none mb-4">
                <span class="text-gray-600 text-xs font-bold">手机预览</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="isMobilePreview" class="sr-only peer">
                  <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <button @click="clearCanvas" class="w-full py-2 text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition">
                清空所有内容
              </button>
           </div>
        </div>
      </aside>

    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      :show="showDialog"
      :title="dialogOptions.title"
      :message="dialogOptions.message"
      :confirm-text="dialogOptions.confirmText"
      :cancel-text="dialogOptions.cancelText"
      :type="dialogOptions.type"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @update:show="showDialog = $event"
    />
  </div>
</template>

<style>
.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.4); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.7); }
</style>
