<script setup lang="ts">
import { useEditorStore } from '../../stores/editorStore'
import { computed, ref } from 'vue'

const store = useEditorStore()

// --- 状态控制 ---
const expandPadding = ref(false) // 是否展开内边距
const expandMargin = ref(false)  // 是否展开外边距

// --- 1. 更加人性化的预设配置 ---

// 字体大小档位 (从代码到人话的映射)
const fontSizeLevels = [
  { label: '特小', value: '12px' },
  { label: '小', value: '14px' },
  { label: '标准', value: '16px' },
  { label: '中等', value: '18px' },
  { label: '大', value: '20px' },
  { label: '特大', value: '24px' },
  { label: '超大', value: '32px' },
]

// 颜色预设 (莫兰迪色系 + 常用色，更适合普通人)
const friendlyColors = [
  '#000000', '#333333', '#666666', '#ffffff', // 基础
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', // 鲜艳
  '#fca5a5', '#fcd34d', '#86efac', '#93c5fd', // 柔和
  '#f3f4f6', '#fff1f2', '#ecfdf5', '#eff6ff', // 背景淡色
]

// --- 2. 辅助函数：帮助我们找到当前处于哪一档 ---

// 获取当前的像素数值 (去除 px)
const getPxValue = (val: string) => {
  if (!val) return 0
  const num = parseInt(val)
  return isNaN(num) ? 0 : num
}

// 查找当前字号对应的是哪个 Label (比如 16px -> "标准")
const currentFontSizeLabel = computed(() => {
  const current = store.currentStyles.fontSize
  const found = fontSizeLevels.find(l => l.value === current)
  return found ? found.label : '自定义' // 如果用户手动改了奇怪的数值
})

// 获取圆角描述文字
const getRadiusLabel = computed(() => {
  const val = getPxValue(store.currentStyles.borderRadius)
  if (val === 0) return '直角'
  if (val <= 4) return '微圆'
  if (val <= 8) return '圆润'
  if (val <= 16) return '大圆角'
  return '超圆'
})

// --- 3. 交互逻辑 ---

// 字号步进器 (上一档/下一档)
const stepFontSize = (direction: -1 | 1) => {
  const currentVal = store.currentStyles.fontSize
  let index = fontSizeLevels.findIndex(l => l.value === currentVal)
  
  // 如果当前值不在预设里，就找个最接近的
  if (index === -1) {
    // 找到最接近的档位
    const currentPx = getPxValue(currentVal)
    index = fontSizeLevels.findIndex((l, i) => {
      const next = fontSizeLevels[i + 1]
      if (!next) return true
      return currentPx >= getPxValue(l.value) && currentPx < getPxValue(next.value)
    })
    if (index === -1) index = 2 // 默认归位到标准
  }

  let newIndex = index + direction
  // 限制范围
  if (newIndex < 0) newIndex = 0
  if (newIndex >= fontSizeLevels.length) newIndex = fontSizeLevels.length - 1
  
  store.applyStyle('font-size', fontSizeLevels[newIndex].value)
}

// 简单的滑块处理 (直接映射到 px)
const handleRangeChange = (key: string, e: Event, suffix = 'px') => {
  const target = e.target as HTMLInputElement
  store.applyStyle(key, target.value + suffix)
}

// 处理颜色选择
const handleColorChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  store.applyStyle('color', target.value)
}

// 处理背景色选择
const handleBgColorChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  store.applyStyle('background-color', target.value)
}

// --- 行高控制逻辑 ---

// 行高解析
const currentLineHeight = computed(() => {
  const val = parseFloat(store.currentStyles.lineHeight || '1.6')
  return isNaN(val) ? 1.6 : val
})

const currentLineHeightLabel = computed(() => {
  const lh = currentLineHeight.value
  if (lh <= 1.4) return '紧凑'
  if (lh >= 1.6 && lh < 1.9) return '标准'
  if (lh >= 2.0) return '宽松'
  return lh.toFixed(1)
})

const updateLineHeight = (step: number) => {
  let newLh = currentLineHeight.value + step
  if (newLh < 1.0) newLh = 1.0
  if (newLh > 3.0) newLh = 3.0
  // toFixed(1) 避免出现 1.600000002
  store.applyStyle('line-height', newLh.toFixed(1))
}

// --- 核心逻辑：智能解析 Box Model ---

// 辅助：从 CSS 字符串中解析出 上、右、下、左 四个数值
const parseBoxValues = (valStr: string) => {
  if (!valStr) return [0, 0, 0, 0]
  // 去掉 px，按空格分割
  const parts = valStr.replace(/px/g, '').trim().split(/\s+/).map(v => parseInt(v) || 0)
  
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]] // 10px -> 全是10
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]] // 10px 20px -> 上下10 左右20
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]] // 上 左右 下
  if (parts.length === 4) return parts // 上 右 下 左
  return [0, 0, 0, 0]
}

// 获取当前 padding 的 4 个值
const currentPadding = computed(() => parseBoxValues(store.currentStyles.padding))
// 获取当前 margin 的 4 个值
const currentMargin = computed(() => parseBoxValues(store.currentStyles.margin))

// --- 更新逻辑 ---

// 更新整体 (保持原来的逻辑)
const updateUnified = (type: 'padding' | 'margin', val: string) => {
  store.applyStyle(type, val + 'px')
}

// 更新单个方向 (精细调整)
// sideIndex: 0=上, 1=右, 2=下, 3=左
const updateIndividual = (type: 'padding' | 'margin', sideIndex: number, val: string) => {
  const current = type === 'padding' ? [...currentPadding.value] : [...currentMargin.value]
  current[sideIndex] = parseInt(val) || 0
  
  // 组合回 CSS 标准缩写: "Tpx Rpx Bpx Lpx"
  const newVal = `${current[0]}px ${current[1]}px ${current[2]}px ${current[3]}px`
  store.applyStyle(type, newVal)
}

</script>

<template>
  <div class="flex flex-col gap-6 h-full overflow-y-auto p-2 custom-scrollbar select-none">
    
    <section>
      <div class="flex items-center gap-2 mb-3">
        <div class="i-carbon-text-font text-blue-600"></div>
        <span class="text-sm font-bold text-gray-700">文字怎么展示</span>
      </div>
      
      <div class="bg-white/50 rounded-xl p-3 border border-white/60 shadow-sm flex flex-col gap-4">
        
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">大小</span>
          <div class="flex items-center bg-gray-100 rounded-lg p-1 gap-2">
            <button 
              @click="stepFontSize(-1)"
              class="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600 active:scale-95 transition"
              title="变小"
            >
              <div class="i-carbon-subtract"></div>
            </button>
            
            <div class="w-16 text-center font-bold text-gray-700 text-sm">
              {{ currentFontSizeLabel }}
            </div>
            
            <button 
              @click="stepFontSize(1)"
              class="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600 active:scale-95 transition"
              title="变大"
            >
              <div class="i-carbon-add"></div>
            </button>
          </div>
        </div>

        <div>
          <span class="text-xs text-gray-500 mb-2 block">颜色</span>
          <div class="flex flex-wrap gap-2">
             <label class="relative w-8 h-8 rounded-full shadow-inner border border-gray-200 overflow-hidden cursor-pointer block">
               <input 
                 type="color" 
                 :value="store.currentStyles.color"
                 @input="handleColorChange"
                 class="absolute inset-0 w-full h-full cursor-pointer opacity-0"
               />
               <div class="absolute inset-0 pointer-events-none" :style="{ backgroundColor: store.currentStyles.color }"></div>
             </label>

             <div 
               v-for="c in friendlyColors.slice(0, 7)" 
               :key="c"
               @click="store.applyStyle('color', c)"
               class="w-8 h-8 rounded-full cursor-pointer border border-transparent hover:border-blue-400 hover:scale-110 transition shadow-sm"
               :style="{ backgroundColor: c }"
             ></div>
          </div>
        </div>

        <div class="h-[1px] bg-gray-100 my-2"></div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">行间距 (透气感)</span>
          <div class="flex items-center bg-gray-100 rounded-lg p-1 gap-2">
            <button 
              @click="updateLineHeight(-0.2)"
              class="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600 active:scale-95 transition"
              title="减小行间距"
            >
              <div class="i-carbon-text-height" style="transform: scaleY(0.8)"></div>
            </button>
            
            <div class="w-16 text-center font-bold text-gray-700 text-sm">
              {{ currentLineHeightLabel }}
            </div>
            
            <button 
              @click="updateLineHeight(0.2)"
              class="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600 active:scale-95 transition"
              title="增大行间距"
            >
              <div class="i-carbon-text-height"></div>
            </button>
          </div>
        </div>

      </div>
    </section>

    <section>
      <div class="flex items-center gap-2 mb-3">
        <div class="i-carbon-color-palette text-purple-600"></div>
        <span class="text-sm font-bold text-gray-700">卡片长什么样</span>
      </div>

      <div class="bg-white/50 rounded-xl p-3 border border-white/60 shadow-sm flex flex-col gap-4">
        
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs text-gray-500">背景颜色</span>
            <button 
              v-if="store.currentStyles.backgroundColor !== 'transparent'"
              @click="store.applyStyle('background-color', 'transparent')"
              class="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded hover:bg-red-100"
            >
              移除背景
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <div 
               v-for="c in friendlyColors.slice(8)" 
               :key="c"
               @click="store.applyStyle('background-color', c)"
               class="w-8 h-8 rounded-lg cursor-pointer border border-gray-100 hover:border-blue-400 hover:scale-110 transition shadow-sm"
               :style="{ backgroundColor: c }"
             ></div>
             <label class="relative w-8 h-8 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 bg-white">
               <div class="i-carbon-edit text-gray-400 text-xs pointer-events-none"></div>
               <input 
                 type="color" 
                 :value="store.currentStyles.backgroundColor === 'transparent' ? '#ffffff' : store.currentStyles.backgroundColor"
                 @input="handleBgColorChange"
                 class="absolute inset-0 w-full h-full cursor-pointer opacity-0"
               />
             </label>
          </div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs text-gray-500">圆润程度</span>
            <span class="text-xs font-bold text-purple-600">
              {{ getRadiusLabel }}
            </span>
          </div>
          <input 
            type="range" min="0" max="30" step="2"
            :value="getPxValue(store.currentStyles.borderRadius)"
            @input="(e) => handleRangeChange('border-radius', e)"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

      </div>
    </section>

    <section>
      <div class="flex items-center gap-2 mb-3">
        <div class="i-carbon-roadmap text-green-600"></div>
        <span class="text-sm font-bold text-gray-700">排版间距</span>
      </div>

      <div class="bg-white/50 rounded-xl p-3 border border-white/60 shadow-sm flex flex-col gap-5">
        
        <div>
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-1">
              <div class="i-carbon-maximize text-gray-400 text-xs"></div>
              <span class="text-xs text-gray-600 font-bold">内部空间</span>
            </div>
            
            <button 
              @click="expandPadding = !expandPadding"
              class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition"
              :class="expandPadding ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
            >
              <div :class="expandPadding ? 'i-carbon-chevron-up' : 'i-carbon-settings-adjust'"></div>
              {{ expandPadding ? '收起' : '单独调整' }}
            </button>
          </div>

          <div v-if="!expandPadding" class="flex items-center gap-2">
            <span class="text-[10px] text-gray-400">紧凑</span>
            <input 
              type="range" 
              min="0" 
              max="120" 
              step="2" 
              :value="currentPadding[0]" 
              @input="(e: any) => updateUnified('padding', e.target.value)" 
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500" 
            />
            <span class="text-[10px] text-gray-400">宽敞</span>
          </div>

          <div v-else class="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50/80 p-3 rounded-lg border border-gray-100">
            <div class="col-span-2 flex justify-center mb-1">
              <div class="text-[10px] text-gray-400">上</div>
            </div>
            <div class="col-span-2 flex justify-center">
               <input 
                 type="range" 
                 min="0" 
                 max="120" 
                 step="2"
                 :value="currentPadding[0]" 
                 @input="(e: any) => updateIndividual('padding', 0, e.target.value)" 
                 class="w-1/2 h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-green-500" 
               />
            </div>

            <div class="flex flex-col items-center">
               <span class="text-[10px] text-gray-400 mb-1">左</span>
               <input 
                 type="range" 
                 min="0" 
                 max="120" 
                 step="2"
                 :value="currentPadding[3]" 
                 @input="(e: any) => updateIndividual('padding', 3, e.target.value)" 
                 class="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-green-500" 
               />
            </div>
            <div class="flex flex-col items-center">
               <span class="text-[10px] text-gray-400 mb-1">右</span>
               <input 
                 type="range" 
                 min="0" 
                 max="120" 
                 step="2"
                 :value="currentPadding[1]" 
                 @input="(e: any) => updateIndividual('padding', 1, e.target.value)" 
                 class="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-green-500" 
               />
            </div>

            <div class="col-span-2 flex justify-center mt-1">
               <input 
                 type="range" 
                 min="0" 
                 max="120" 
                 step="2"
                 :value="currentPadding[2]" 
                 @input="(e: any) => updateIndividual('padding', 2, e.target.value)" 
                 class="w-1/2 h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-green-500" 
               />
            </div>
            <div class="col-span-2 flex justify-center">
              <div class="text-[10px] text-gray-400">下</div>
            </div>
          </div>
        </div>

        <div class="h-[1px] bg-gray-100"></div>

        <div>
          <div class="flex justify-between items-center mb-2">
             <div class="flex items-center gap-1">
              <div class="i-carbon-minimize text-gray-400 text-xs"></div>
              <span class="text-xs text-gray-600 font-bold">与外部距离</span>
            </div>
            
            <button 
              @click="expandMargin = !expandMargin"
              class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition"
              :class="expandMargin ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
            >
              <div :class="expandMargin ? 'i-carbon-chevron-up' : 'i-carbon-settings-adjust'"></div>
              {{ expandMargin ? '收起' : '单独调整' }}
            </button>
          </div>

          <div v-if="!expandMargin" class="flex items-center gap-2">
            <span class="text-[10px] text-gray-400">贴近</span>
            <input 
              type="range" 
              min="0" 
              max="120" 
              step="2" 
              :value="currentMargin[0]" 
              @input="(e: any) => updateUnified('margin', e.target.value)" 
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500" 
            />
            <span class="text-[10px] text-gray-400">疏远</span>
          </div>

          <div v-else class="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50/80 p-3 rounded-lg border border-gray-100">
             <div class="col-span-2 text-center text-[10px] text-gray-400">上</div>
             <div class="col-span-2 flex justify-center">
                <input 
                  type="range" 
                  min="0" 
                  max="120" 
                  step="2"
                  :value="currentMargin[0]" 
                  @input="(e: any) => updateIndividual('margin', 0, e.target.value)" 
                  class="w-1/2 h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-orange-500" 
                />
             </div>

             <div class="text-center text-[10px] text-gray-400">左</div>
             <div class="text-center text-[10px] text-gray-400">右</div>
             
             <input 
               type="range" 
               min="0" 
               max="120" 
               step="2"
               :value="currentMargin[3]" 
               @input="(e: any) => updateIndividual('margin', 3, e.target.value)" 
               class="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-orange-500" 
             />
             <input 
               type="range" 
               min="0" 
               max="120" 
               step="2"
               :value="currentMargin[1]" 
               @input="(e: any) => updateIndividual('margin', 1, e.target.value)" 
               class="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-orange-500" 
             />

             <div class="col-span-2 flex justify-center">
                <input 
                  type="range" 
                  min="0" 
                  max="120" 
                  step="2"
                  :value="currentMargin[2]" 
                  @input="(e: any) => updateIndividual('margin', 2, e.target.value)" 
                  class="w-1/2 h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-orange-500" 
                />
             </div>
             <div class="col-span-2 text-center text-[10px] text-gray-400">下</div>
          </div>
        </div>

      </div>
    </section>

    <div class="text-center mt-4 pb-2">
      <p class="text-[10px] text-gray-400">💡 提示：点击左侧编辑区的元素，即可在这里调整它的样子</p>
    </div>

  </div>
</template>
