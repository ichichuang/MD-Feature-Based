<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

interface Props {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
  show: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  confirmText: '确定',
  cancelText: '取消',
  type: 'warning',
  show: false
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:show': [value: boolean]
}>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:show', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}

// ESC 键关闭
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    handleCancel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div 
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click.self="handleCancel"
      >
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        
        <!-- 对话框 -->
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
          <!-- 顶部装饰条 -->
          <div 
            class="h-1"
            :class="{
              'bg-gradient-to-r from-yellow-400 to-orange-500': type === 'warning',
              'bg-gradient-to-r from-red-400 to-pink-500': type === 'danger',
              'bg-gradient-to-r from-blue-400 to-purple-500': type === 'info'
            }"
          ></div>
          
          <div class="p-6">
            <!-- 图标和标题 -->
            <div class="flex items-start gap-4 mb-4">
              <div 
                class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                :class="{
                  'bg-yellow-100': type === 'warning',
                  'bg-red-100': type === 'danger',
                  'bg-blue-100': type === 'info'
                }"
              >
                <div 
                  class="text-2xl"
                  :class="{
                    'i-carbon-warning text-yellow-600': type === 'warning',
                    'i-carbon-warning-alt text-red-600': type === 'danger',
                    'i-carbon-information text-blue-600': type === 'info'
                  }"
                ></div>
              </div>
              
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-800 mb-2">{{ title }}</h3>
                <p class="text-sm text-gray-600 leading-relaxed">{{ message }}</p>
              </div>
            </div>
            
            <!-- 按钮组 -->
            <div class="flex gap-3 justify-end mt-6" :class="{ 'justify-center': !cancelText }">
              <button
                v-if="cancelText"
                @click="handleCancel"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                :class="{
                  'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600': type === 'warning',
                  'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600': type === 'danger',
                  'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600': type === 'info'
                }"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .relative,
.dialog-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .relative,
.dialog-leave-to .relative {
  transform: scale(0.95) translateY(-10px);
  opacity: 0;
}
</style>
