// src/core/editor/AllowStyle.ts
import { Extension } from '@tiptap/core'

export const AllowStyle = Extension.create({
  name: 'allowStyle',

  addGlobalAttributes() {
    return [
      {
        // 给所有标签 (types) 添加 style 属性支持
        types: [
          'heading', 
          'paragraph', 
          'textStyle', 
          'listItem', 
          'image', 
          'blockquote',
          'div' // Tiptap 默认没有 div，如果你用了 div，需要额外处理，见下文
        ],
        attributes: {
          style: {
            default: null,
            // 告诉编辑器：解析 HTML 时，把 style 属性的值读出来
            parseHTML: element => element.getAttribute('style'),
            // 告诉编辑器：导出 HTML 时，把 style 属性写回去
            renderHTML: attributes => {
              if (!attributes.style) {
                return {}
              }
              return { style: attributes.style }
            }
          },
        },
      },
    ]
  },
})
