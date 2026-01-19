<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const store = useEditorStore()
const activeTab = ref('title') // 默认显示标题

// 定义分类
const tabs = [
  { id: 'title', label: '标题' },
  { id: 'card', label: '卡片' },
  { id: 'text', label: '正文' },
  { id: 'end', label: '结尾' },
]

// 模拟更丰富的数据
const allMaterials = [
  // 标题类
  { category: 'title', title: '渐变标题', html: `<h2 style="border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; color: #2563eb;">输入标题</h2>` },
  { category: 'title', title: '色块标题', html: `<h2 style="background: #2563eb; color: white; display: inline-block; padding: 5px 15px; border-radius: 4px;">输入标题</h2>` },
  { category: 'title', title: '🔥 爆款标题', html: `<h2 style="border-left: 5px solid #2563eb; padding-left: 12px; color: #1e40af; background: linear-gradient(90deg, #eff6ff 0%, transparent 100%); padding-top:5px; padding-bottom:5px;">在此输入标题</h2>` },
  
  // 卡片类
  { category: 'card', title: '警告卡片', html: `<div style="background: #fff4f4; border-left: 4px solid #ef4444; padding: 15px; color: #b91c1c;">⚠️ <strong>注意：</strong> 这里是警告内容</div>` },
  { category: 'card', title: '成功卡片', html: `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; color: #15803d;">✅ <strong>搞定：</strong> 操作成功！</div>` },
  { category: 'card', title: '📌 重点卡片', html: `<div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 10px 0;">
             <strong style="color: #b45309;">💡 划重点：</strong> 
             <span style="color: #92400e;">这里是核心内容，适合写注意事项。</span>
           </div>` },
  
  // 正文类
  { category: 'text', title: '💬 微信引用', html: `<section style="background: #f7f7f7; padding: 20px; border-radius: 6px; text-align: center; color: #666; font-size: 14px;">
             " 这里是一段很有哲理的话，用来提升文章格调。 "
           </section>` },
  { category: 'text', title: '🟢 步骤条', html: `<div style="margin-top: 10px;">
             <span style="display:inline-block; width:24px; height:24px; background:#10b981; color:white; border-radius:50%; text-align:center; line-height:24px; font-weight:bold;">1</span>
             <span style="font-weight:bold; color:#059669; margin-left: 8px;">第一步操作</span>
             <p style="color:#333; font-size:14px; margin-top:5px;">这里是具体的操作描述...</p>
           </div>` },

  // 结尾类
  { category: 'end', title: '求关注', html: `<div style="text-align: center; margin-top: 40px; border-top: 1px dashed #ddd; padding-top: 20px;"><span style="background:#2563eb; color:white; padding:5px 10px; border-radius:20px;">关注我</span></div>` }
]

const filteredMaterials = computed(() => allMaterials.filter(m => m.category === activeTab.value))
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex p-2 bg-white/30 backdrop-blur-sm rounded-lg mb-4 gap-1">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex-1 py-1.5 text-xs font-bold rounded-md transition-all text-gray-500 hover:text-gray-900"
        :class="activeTab === tab.id ? 'bg-white/80 shadow text-blue-600' : ''"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
      <div 
        v-for="(item, index) in filteredMaterials" 
        :key="index"
        @click="store.insertMaterial(item.html)"
        class="group cursor-pointer border border-transparent hover:border-blue-300 bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
      >
        <div class="text-xs text-gray-400 mb-2 flex justify-between">
          <span>{{ item.title }}</span>
          <span v-if="item.preview" class="text-[10px] bg-gray-100 px-1 rounded">{{ item.preview }}</span>
        </div>
        <div class="pointer-events-none transform scale-[0.8] origin-top-left w-[120%] max-h-[150px] overflow-hidden opacity-80" v-html="item.html"></div>
        
        <div class="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/10 transition-colors"></div>
        <div class="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
          <div class="i-carbon-add-filled text-xl"></div>
        </div>
      </div>
    </div>
  </div>
</template>
