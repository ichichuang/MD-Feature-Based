import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
}

const showDialog = ref(false)
const dialogOptions = ref<ConfirmOptions>({
  title: '提示',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  type: 'warning'
})

let resolvePromise: ((value: boolean) => void) | null = null

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    dialogOptions.value = {
      title: options.title || '提示',
      message: options.message,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      type: options.type || 'warning'
    }
    showDialog.value = true
    
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
    showDialog.value = false
  }

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
    showDialog.value = false
  }

  return {
    showDialog,
    dialogOptions,
    confirm,
    handleConfirm,
    handleCancel
  }
}
