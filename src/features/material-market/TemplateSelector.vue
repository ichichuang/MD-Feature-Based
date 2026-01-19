<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../../stores/editorStore'
import { useConfirm } from '../../shared/composables/useConfirm'
import ConfirmDialog from '../../shared/components/ConfirmDialog.vue'

const store = useEditorStore()
const showDropdown = ref(false)
const { showDialog, dialogOptions, confirm, handleConfirm, handleCancel } = useConfirm()

// 定义整页模板
const templates = [
  // 🏥 医院/医疗专属模板
  {
    title: '👨‍⚕️ 专家介绍页',
    preview: '医生名片墙',
    html: `<div style="padding: 20px;">
      <h3 style="border-left: 4px solid #005eb8; padding-left: 10px; margin: 20px 0; color: #333333;">科室专家团队</h3>
      
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px;">
        <div style="flex: 1; min-width: 140px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; background: #eff6ff; color: #005eb8; font-size: 32px; font-weight: bold;">👨‍⚕️</div>
          <div style="font-weight: bold; color: #333333; font-size: 16px;">王主任</div>
          <div style="font-size: 12px; color: #666666; margin: 4px 0;">主任医师 / 教授</div>
          <div style="margin-top: 8px;">
             <span style="font-size: 10px; color: #d97706; background: #fffbeb; padding: 2px 6px; border-radius: 4px;">4.9 分</span>
          </div>
        </div>

        <div style="flex: 1; min-width: 140px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; background: #eff6ff; color: #005eb8; font-size: 32px; font-weight: bold;">👩‍⚕️</div>
          <div style="font-weight: bold; color: #333333; font-size: 16px;">李医师</div>
          <div style="font-size: 12px; color: #666666; margin: 4px 0;">副主任医师</div>
          <div style="margin-top: 8px;">
             <span style="font-size: 10px; color: #d97706; background: #fffbeb; padding: 2px 6px; border-radius: 4px;">4.8 分</span>
          </div>
        </div>
        
        <div style="flex: 1; min-width: 140px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; background: #eff6ff; color: #005eb8; font-size: 32px; font-weight: bold;">👨‍⚕️</div>
          <div style="font-weight: bold; color: #333333; font-size: 16px;">张医师</div>
          <div style="font-size: 12px; color: #666666; margin: 4px 0;">主治医师</div>
          <div style="margin-top: 8px;">
             <span style="font-size: 10px; color: #d97706; background: #fffbeb; padding: 2px 6px; border-radius: 4px;">4.9 分</span>
          </div>
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #999999; margin-top: 15px;">点击上方医生卡片可查看详细出诊时间</p>
    </div>`
  },
  {
    title: '🏥 科普文章头部',
    preview: '积水潭风格',
    html: `<div style="padding: 20px;">
      <h1 style="font-size: 22px; font-weight: bold; color: #333333; margin-bottom: 10px; line-height: 1.4;">【积医科普】清明养肝正当时，中医教你如何顺时养生</h1>
      
      <div style="font-size: 12px; color: #999999; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #666666;">原创</span>
        <span>王洋 首都医科大学附属北京积水潭医院</span>
        <span>2026-04-05</span>
      </div>

      <div style="border: 1px solid #8fc9ae; padding: 20px; border-radius: 8px; background: #fdfdfd; position: relative; margin: 20px 0;">
        <div style="position: absolute; top: -1px; left: -1px; width: 20px; height: 20px; border-top: 4px solid #8fc9ae; border-left: 4px solid #8fc9ae; border-radius: 4px 0 0 0;"></div>
        <div style="position: absolute; bottom: -1px; right: -1px; width: 20px; height: 20px; border-bottom: 4px solid #8fc9ae; border-right: 4px solid #8fc9ae; border-radius: 0 0 4px 0;"></div>
        
        <p style="color: #4b5563; font-size: 15px; line-height: 1.8; text-align: justify; margin: 0;">
          <strong>清明</strong>，是承载着追思先人与踏青赏春双重意味的节气。中医认为"春气通于肝"，此时正是养肝护肝的最佳时节。
          <br/><br/>
          在这个特殊的节气里，我们的身体也经历着阳气的逐渐生发。如何顺应天时进行调养？让我们一起来看看中医的智慧。
        </p>
      </div>
    </div>`
  },
  {
    title: '📢 医院公告栏',
    preview: '红框通知',
    html: `<div style="padding: 20px;">
      <div style="border: 1px solid #fca5a5; background: #fff1f2; border-radius: 6px; overflow: hidden; margin: 20px 0;">
        <div style="background: #fca5a5; color: #991b1b; padding: 8px 15px; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 5px;">
           <span>🔔 医院公告</span>
        </div>
        <div style="padding: 15px;">
           <p style="margin: 0 0 10px 0; font-size: 14px; color: #374151; border-bottom: 1px dashed #fecaca; padding-bottom: 10px;">
             🔴 <strong>停诊通知：</strong> 本周三下午，皮肤科王专家因公外出，暂停门诊一次。
           </p>
           <p style="margin: 0 0 10px 0; font-size: 14px; color: #374151; border-bottom: 1px dashed #fecaca; padding-bottom: 10px;">
             🔵 <strong>新开诊：</strong> 神经内科新增"睡眠障碍"专病门诊，欢迎预约挂号。
           </p>
           <p style="margin: 0; font-size: 14px; color: #374151;">
             🟢 <strong>便民服务：</strong> 门诊大厅现已提供 24 小时自助打印病历服务。
           </p>
        </div>
      </div>
    </div>`
  },
  {
    title: '🌿 中医风结尾',
    preview: '文艺诗词',
    html: `<div style="padding: 20px; margin-top: 40px; text-align: center;">
        <p style="font-size: 16px; color: #333333; margin-bottom: 10px; letter-spacing: 1px;">让我们以中医的古老智慧</p>
        <p style="font-size: 16px; color: #333333; margin-bottom: 10px; letter-spacing: 1px;">遵循天人相应的理念</p>
        <p style="font-size: 16px; color: #333333; margin-bottom: 10px; letter-spacing: 1px;">缅怀先人，珍惜当下</p>
        
        <div style="margin: 30px auto; width: 60px; height: 1px; background: #cccccc;"></div>
        
        <span style="display: inline-block; background: #8fc9ae; color: white; padding: 4px 15px; font-size: 12px; letter-spacing: 2px; border-radius: 2px;">END</span>
        
        <div style="margin-top: 30px; font-size: 12px; color: #999999; line-height: 1.6;">
          <p style="margin:0;">供稿 | 中医科 王洋</p>
          <p style="margin:0;">编发 | 宣传中心</p>
        </div>
        
        <div style="margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 10px;">
           <span style="font-size: 20px;">💬</span>
           <span style="color: #333333; font-weight: bold; font-size: 14px;">XX 医院官方号</span>
        </div>
      </div>`
  },
  // 原有模板
  {
    title: '🍱 美食食谱',
    preview: '图文并茂',
    html: `<div style="padding: 20px;">
      <h1 style="text-align: center; color: #f59e0b; font-size: 24px; font-weight: bold; margin-bottom: 20px;">我是菜名：例如红烧肉</h1>
      <p style="text-align: center; color: #666666; font-size: 14px;">这里写一句诱人的介绍...</p>
      <img src="https://placehold.co/600x400/orange/white?text=美食封面图" style="width: 100%; border-radius: 8px; margin: 15px 0;" />
      
      <h3 style="border-left: 4px solid #f59e0b; padding-left: 10px; color: #333333; margin: 20px 0;">🛒 准备食材</h3>
      <ul style="background: #fffbeb; padding: 15px 30px; border-radius: 8px; color: #555555; line-height: 1.8;">
        <li>食材 A：500g</li>
        <li>佐料 B：少许</li>
        <li>调料 C：适量</li>
      </ul>

      <h3 style="border-left: 4px solid #f59e0b; padding-left: 10px; color: #333333; margin: 20px 0;">🔥 烹饪步骤</h3>
      <p style="line-height: 1.8;"><span style="background:#f59e0b; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">步骤 1</span> 这里是第一步...</p>
      <p style="line-height: 1.8;"><span style="background:#f59e0b; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">步骤 2</span> 这里是第二步...</p>
      <p style="line-height: 1.8;"><span style="background:#f59e0b; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">步骤 3</span> 这里是第三步...</p>
    </div>`
  },
  {
    title: '📝 情感/日记',
    preview: '清新简约',
    html: `<div style="background-image: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
      <h2 style="margin: 0; font-size: 20px;">今日感悟</h2>
      <p style="opacity: 0.8; font-size: 12px; margin-top: 5px;">2026年1月16日</p>
    </div>
    <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 12px 12px; color: #555555; line-height: 1.8;">
      <p>这里写正文内容，行间距稍微大一点，看起来很舒服。</p>
      <p>生活就像一盒巧克力，你永远不知道下一颗是什么味道。</p>
      <p>珍惜当下，感恩拥有。</p>
    </div>`
  },
  {
    title: '✈️ 旅游打卡',
    preview: '实用攻略',
    html: `<div style="padding: 20px;">
      <h1 style="text-align: center; color: #3b82f6; font-size: 24px; font-weight: bold; margin-bottom: 10px;">📍 景点名称</h1>
      <p style="text-align: center; color: #666666; font-size: 14px; margin-bottom: 20px;">一次难忘的旅行体验</p>
      <img src="https://placehold.co/600x300/blue/white?text=景点美图" style="width: 100%; border-radius: 8px; margin: 15px 0;" />
      
      <h3 style="border-left: 4px solid #3b82f6; padding-left: 10px; color: #333333; margin: 20px 0;">💡 避坑指南</h3>
      <div style="background: #eff6ff; padding: 15px; border-radius: 8px; line-height: 1.8;">
        <p style="margin: 5px 0;">• 建议避开节假日，人少景美</p>
        <p style="margin: 5px 0;">• 提前预订门票，避免排队</p>
        <p style="margin: 5px 0;">• 注意防晒，带好遮阳帽</p>
      </div>

      <h3 style="border-left: 4px solid #3b82f6; padding-left: 10px; color: #333333; margin: 20px 0;">💰 费用清单</h3>
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; line-height: 1.8;">
        <p style="margin: 5px 0;">门票：¥100/人</p>
        <p style="margin: 5px 0;">交通：¥50/人</p>
        <p style="margin: 5px 0;">餐饮：¥80/人</p>
      </div>
    </div>`
  }
]

const selectTemplate = async (template: typeof templates[0]) => {
  const result = await confirm({
    title: '使用模板',
    message: '使用此模板将替换当前所有内容，确定要继续吗？',
    type: 'warning',
    confirmText: '使用模板',
    cancelText: '取消'
  })
  
  if (result) {
    store.replaceContent(template.html)
    showDropdown.value = false
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.template-selector')) {
    showDropdown.value = false
  }
}

// 监听点击事件
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}

// 清理事件监听器
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<template>
  <div class="template-selector relative">
    <button 
      @click.stop="showDropdown = !showDropdown"
      class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
    >
      <div class="i-carbon-template text-sm"></div>
      <span class="text-sm font-medium">选择模板</span>
      <div class="i-carbon-chevron-down text-xs transition-transform" :class="{ 'rotate-180': showDropdown }"></div>
    </button>

    <!-- 下拉菜单 -->
    <div 
      v-if="showDropdown"
      @click.stop
      class="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-[500px] overflow-y-auto custom-scrollbar"
    >
      <div class="p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div class="flex items-center gap-2">
          <div class="i-carbon-template text-purple-600"></div>
          <span class="font-bold text-sm text-gray-700">整页模板</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">选择一个模板快速开始</p>
      </div>

      <div class="p-3 flex flex-col gap-3">
        <div 
          v-for="(template, index) in templates" 
          :key="index"
          @click="selectTemplate(template)"
          class="group cursor-pointer border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all bg-white"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold text-sm text-gray-700">{{ template.title }}</span>
            <span class="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{{ template.preview }}</span>
          </div>
          <div class="pointer-events-none transform scale-[0.7] origin-top-left w-[140%] max-h-[120px] overflow-hidden opacity-70 rounded border border-gray-100" v-html="template.html"></div>
          <div class="mt-2 flex items-center gap-1 text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="i-carbon-arrow-right"></div>
            <span>点击使用此模板</span>
          </div>
        </div>
      </div>
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

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
</style>
