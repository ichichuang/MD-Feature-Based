declare module '@tiptap/vue-3/menus' {
  import { DefineComponent } from 'vue'
  import { Editor } from '@tiptap/core'

  export interface BubbleMenuProps {
    editor: Editor
    pluginKey?: string | any
    updateDelay?: number
    resizeDelay?: number
    shouldShow?: ((props: {
      editor: Editor
      element: HTMLElement
      view: any
      state: any
      oldState?: any
      from: number
      to: number
    }) => boolean) | null
    options?: any
    appendTo?: HTMLElement | (() => HTMLElement)
    getReferencedVirtualElement?: () => any
  }

  export const BubbleMenu: DefineComponent<BubbleMenuProps>
  export const FloatingMenu: DefineComponent<any>
}
