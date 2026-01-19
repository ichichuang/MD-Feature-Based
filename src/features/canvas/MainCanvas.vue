<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Node } from '@tiptap/core'
import { Table } from '@tiptap/extension-table/table'
import { TableCell } from '@tiptap/extension-table/cell'
import { TableHeader } from '@tiptap/extension-table/header'
import { TableRow } from '@tiptap/extension-table/row'
import { useEditorStore } from '../../stores/editorStore'
import { AllowStyle } from '../../core/editor/AllowStyle'

const store = useEditorStore()

// 🚨 核心修复：Div 扩展升级版
// 我们使用 Node.create 来创建块级节点
const DivExtension = Node.create({
  name: 'div',
  group: 'block',
  // 🚨 关键修复：改为 'block*' 允许 div 内部嵌套 div 或为空（为了支持 Flex 布局和波浪分割）
  // 'block*' 表示0个或多个块级元素，允许空 div（如波浪分割）
  // 之前为防止"套娃"限制为 '(paragraph|heading|bulletList|orderedList|blockquote)+'
  // 现在为了支持 Flex 布局的嵌套结构（如名片墙）和空装饰元素（如波浪分割），需要允许空 div
  content: 'block*',
  
  // 关键修改 2：isolating & defining
  // isolating: true -> 告诉编辑器这是一个独立的"岛屿"，不要轻易合并
  // defining: true -> 复制粘贴时保留结构
  isolating: true,
  defining: true,

  addOptions() { return { HTMLAttributes: {} } },

  parseHTML() { return [{ tag: 'div' }] },
  
  renderHTML({ HTMLAttributes }: { HTMLAttributes?: Record<string, any> }) { return ['div', HTMLAttributes || {}, 0] },
})

const editor = useEditor({
  content: '', 
  extensions: [
    StarterKit, // StarterKit 已经包含了 History 扩展
    Image.configure({ 
      inline: true,
      allowBase64: true, // 允许 Base64 图片
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    DivExtension,
    // 表格扩展配置
    Table,
    TableRow,
    TableHeader,
    TableCell,
    AllowStyle,
    TextStyle,
  ],
  editorProps: {
    attributes: {
      // 🚨 核心修复：
      // 1. !h-auto: 强制高度自动，绝对禁止 h-full
      // 2. min-h-[300px]: 给一个最小输入区域，但允许无限增高
      class: 'focus:outline-none w-full prose prose-slate max-w-none !h-auto min-h-[300px]', 
    },
    // 👇 核心：处理图片粘贴和拖拽
    handlePaste: (view, event) => {
      const items = Array.from(event.clipboardData?.items || [])
      const item = items.find(i => i.type.indexOf('image') === 0)
      
      if (item) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const src = e.target?.result as string
            // 检查 image 节点是否存在
            const imageNode = view.state.schema.nodes.image
            if (imageNode) {
              // 插入图片
              view.dispatch(view.state.tr.replaceSelectionWith(
                imageNode.create({ src })
              ))
            }
          }
          reader.readAsDataURL(file)
          return true // 阻止默认行为
        }
      }
      return false
    },
    handleDrop: (view, event, _slice, moved) => {
      if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
        const file = event.dataTransfer.files[0]
        if (file.type.indexOf('image') === 0) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const src = e.target?.result as string
            // 获取拖拽坐标并插入
            const { schema } = view.state
            const imageNode = schema.nodes.image
            if (imageNode) {
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
              if (coordinates) {
                view.dispatch(view.state.tr.insert(coordinates.pos, imageNode.create({ src })))
              }
            }
          }
          reader.readAsDataURL(file)
          event.preventDefault()
          return true
        }
      }
      return false
    }
  },
  onCreate() {
    if (editor.value) {
      store.setEditor(editor.value)
    }
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="w-full relative">
    
    <bubble-menu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100, zIndex: 999 }"
      class="bg-gray-800 text-white shadow-xl rounded-lg px-2 py-1 flex items-center gap-1 text-sm overflow-hidden z-50"
    >
      <button 
        @click="editor.chain().focus().toggleBold().run()"
        class="p-1.5 hover:bg-gray-700 rounded transition"
        :class="{ 'text-blue-400': editor.isActive('bold') }"
      >
        <div class="i-carbon-text-bold"></div>
      </button>
      <button 
        @click="editor.chain().focus().toggleItalic().run()"
        class="p-1.5 hover:bg-gray-700 rounded transition"
        :class="{ 'text-blue-400': editor.isActive('italic') }"
      >
        <div class="i-carbon-text-italic"></div>
      </button>
      <div class="w-[1px] h-4 bg-gray-600 mx-1"></div>
      <button 
        @click="editor.chain().focus().setMark('textStyle', { style: 'color: #ef4444' }).run()"
        class="p-1.5 hover:bg-gray-700 rounded transition text-red-400"
      >
        <div class="i-carbon-color-palette"></div>
      </button>
       <button 
        @click="editor.chain().focus().setMark('textStyle', { style: 'background-color: #dcfce7; color: #166534; padding: 0 4px;' }).run()"
        class="p-1.5 hover:bg-gray-700 rounded transition text-green-400"
      >
        <div class="i-carbon-paint-brush"></div>
      </button>
    </bubble-menu>

    <editor-content v-if="editor" :editor="editor" />
  </div>
</template>

<style>
/* 再次确保 ProseMirror 自身没有高度限制 */
.ProseMirror { 
  min-height: 300px; 
  height: auto !important; 
} 
.ProseMirror p { margin: 0.5em 0; line-height: 1.75; }
.ProseMirror-selectednode { outline: 2px solid #3b82f6; outline-offset: 2px; }

/* 表格样式 */
.ProseMirror table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0;
  overflow: hidden;
}
.ProseMirror td, .ProseMirror th {
  min-width: 1em;
  border: 2px solid #ced4da;
  padding: 3px 5px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}
.ProseMirror th {
  font-weight: bold;
  text-align: left;
  background-color: #f1f3f5;
}
</style>
