import { defineStore } from 'pinia'
import { shallowRef, ref } from 'vue'
import { type Editor } from '@tiptap/vue-3'
import { useStorage } from '@vueuse/core'
import { parseStyleString, stringifyStyle, normalizeColor } from '../utils/styleUtils'

export const useEditorStore = defineStore('editor', () => {
  const editor = shallowRef<Editor | undefined>()

  // 自动保存逻辑
  const savedContent = useStorage('magic-editor-content', '<p>👋 欢迎回来！您的内容已自动恢复。</p>')

  // ✨ 新增：当前选中元素的样式状态
  const currentStyles = ref({
    color: '#000000',
    backgroundColor: 'transparent',
    fontSize: '16px',
    lineHeight: '1.6',
    padding: '0px',
    margin: '0px',
    borderRadius: '0px',
    textAlign: 'left'
  })

  // ✨ 新增：更新选中状态（当用户点击编辑器时调用）
  const updateSelectionState = () => {
    if (!editor.value) return

    // 获取当前选中的节点属性
    const { state } = editor.value
    const { selection } = state

    // 1. 尝试获取 Text Style (文字颜色等)
    const textStyle = editor.value.getAttributes('textStyle').style || ''

    // 2. 尝试获取 Block Style (Div, Heading, Paragraph 的样式)
    let blockStyle = ''
    const node = state.doc.nodeAt(selection.from)

    if (!node) {
      // 如果没直接选中节点，尝试获取包裹它的 block 属性
      blockStyle = editor.value.getAttributes('div').style ||
        editor.value.getAttributes('heading').style ||
        editor.value.getAttributes('paragraph').style || ''
    } else {
      // 如果选中了节点，尝试从节点属性获取
      const nodeAttrs = node.attrs || {}
      blockStyle = nodeAttrs.style || ''

      // 如果节点没有 style，尝试从父级获取
      if (!blockStyle) {
        blockStyle = editor.value.getAttributes('div').style ||
          editor.value.getAttributes('heading').style ||
          editor.value.getAttributes('paragraph').style || ''
      }
    }

    // 3. 合并样式解析
    const parsedText = parseStyleString(textStyle)
    const parsedBlock = parseStyleString(blockStyle)

    // 4. 更新状态 (优先显示 Block 的背景，Text 的颜色)
    const rawColor = parsedText.color || parsedBlock.color || '#000000'
    const rawBgColor = parsedBlock['background-color'] || parsedBlock.backgroundColor || parsedBlock.background || 'transparent'

    currentStyles.value = {
      color: normalizeColor(rawColor), // 规范化颜色值
      backgroundColor: rawBgColor === 'transparent' ? 'transparent' : normalizeColor(rawBgColor), // 规范化背景色
      fontSize: parsedText['font-size'] || parsedText.fontSize || parsedBlock['font-size'] || parsedBlock.fontSize || '16px',
      lineHeight: parsedText['line-height'] || parsedBlock['line-height'] || '1.6',
      padding: parsedBlock.padding || '0px',
      margin: parsedBlock.margin || '0px',
      borderRadius: parsedBlock['border-radius'] || parsedBlock.borderRadius || '0px',
      textAlign: (parsedBlock['text-align'] || parsedBlock.textAlign || 'left') as string
    }
  }

  // ✨ 新增：应用样式（当右侧面板修改时调用）
  const applyStyle = (key: string, value: string) => {
    if (!editor.value) return

    // 逻辑：
    // 1. 如果是颜色/字号，应用到文字选区 (Text Mark)
    // 2. 如果是背景/边距，应用到块级元素 (Block Node)

    if (['color', 'font-size', 'line-height'].includes(key)) {
      // 文字样式：使用 Tiptap 的 setMark
      const current = parseStyleString(editor.value.getAttributes('textStyle').style || '')
      current[key] = value
      editor.value.chain().focus().setMark('textStyle', { style: stringifyStyle(current) }).run()
    } else {
      // 盒子样式：应用到当前包裹的块级元素
      // 按优先级尝试：div > heading > paragraph
      let targetType = 'paragraph'
      let currentStyle = ''

      if (editor.value.isActive('div')) {
        targetType = 'div'
        currentStyle = editor.value.getAttributes('div').style || ''
      } else if (editor.value.isActive('heading')) {
        targetType = 'heading'
        currentStyle = editor.value.getAttributes('heading').style || ''
      } else {
        targetType = 'paragraph'
        currentStyle = editor.value.getAttributes('paragraph').style || ''
      }

      const current = parseStyleString(currentStyle)
      current[key] = value

      editor.value.chain().focus().updateAttributes(targetType, { style: stringifyStyle(current) }).run()
    }

    // 立即更新本地状态
    updateSelectionState()
  }

  const setEditor = (instance: Editor) => {
    editor.value = instance
    if (savedContent.value) {
      instance.commands.setContent(savedContent.value)
    }
    instance.on('update', () => {
      savedContent.value = instance.getHTML()
    })
    // ✨ 监听选区变化，更新右侧面板
    instance.on('selectionUpdate', updateSelectionState)
    // 初始化时也更新一次
    updateSelectionState()
  }

  // 插入素材逻辑 - 🚨 修复版：防止 div 嵌套 + 支持空 div 和 section
  const insertMaterial = (html: string) => {
    if (!editor.value) return

    const instance = editor.value
    const { state } = instance
    const { selection } = state

    // 🚑 修复1：处理空 div（如波浪分割）
    // 检测是否是空 div（没有内容或只有空白），TipTap 即使支持 block* 也可能有问题，所以添加一个不可见的占位符
    const trimmedHtml = html.trim()
    const isEmptyDiv = /^<div[^>]*><\/div>$/i.test(trimmedHtml) || 
                       /^<div[^>]*>\s*<\/div>$/i.test(trimmedHtml) ||
                       /^<div[^>]*style="[^"]*"[^>]*><\/div>$/i.test(trimmedHtml) ||
                       /^<div[^>]*style="[^"]*"[^>]*>\s*<\/div>$/i.test(trimmedHtml)
    if (isEmptyDiv) {
      // 为空 div 添加一个零高度的段落，确保 TipTap 可以插入且不影响视觉效果
      html = html.replace(/(><\/div>)$/i, '><p style="margin: 0; padding: 0; height: 0; line-height: 0; visibility: hidden; overflow: hidden; font-size: 0;">&nbsp;</p></div>')
    }

    // 🚑 修复2：将 section 标签转换为 div（TipTap 不支持 section）
    html = html.replace(/<section([^>]*)>/gi, '<div$1>')
    html = html.replace(/<\/section>/gi, '</div>')

    // 1. 检测插入的 HTML 是否包含块级 div
    const isBlockMaterial = /<div/i.test(html)

    // 2. 智能跳出逻辑
    if (isBlockMaterial) {
      let depth = selection.$anchor.depth
      while (depth > 0) {
        const node = selection.$anchor.node(depth)
        if (node.type.name === 'div') {
          const posAfter = selection.$anchor.after(depth)

          instance.chain()
            .setTextSelection(posAfter)
            .insertContent(html)
            .insertContent('<p></p>') // 插完补个空行
            .scrollIntoView()
            .run()
          return
        }
        depth--
      }
    }

    // 3. 默认逻辑（如果不在 div 里，或者插入的只是文字）
    instance.chain()
      .focus()
      .insertContent(html)
      .insertContent('<p></p>')
      .scrollIntoView()
      .run()
  }

  // 替换整个内容（用于模板）
  const replaceContent = (html: string) => {
    if (!editor.value) return
    editor.value.chain()
      .focus()
      .setContent(html)
      .scrollIntoView()
      .run()
  }

  // 🚨 核心修复：HTML 兼容性增强（暴力样式注入版）
  const getHtml = () => {
    if (!editor.value) return ''

    let html = editor.value.getHTML()

    // 🚨 步骤1：修复错误的div嵌套结构（优先级最高）
    const divOpenRegex = /<div[^>]*>/gi
    const divCloseRegex = /<\/div>/gi
    
    const openMatches = html.match(divOpenRegex) || []
    const closeMatches = html.match(divCloseRegex) || []
    
    if (closeMatches.length > openMatches.length) {
      const parts: string[] = []
      let lastIndex = 0
      const regex = /(<div[^>]*>|<\/div>)/gi
      const stack: string[] = []
      
      let match: RegExpExecArray | null
      while ((match = regex.exec(html)) !== null) {
        if (match.index > lastIndex) {
          parts.push(html.substring(lastIndex, match.index))
        }
        
        const tag = match[1]
        if (!tag) continue
        
        if (tag.startsWith('</div>')) {
          if (stack.length > 0) {
            stack.pop()
            parts.push('</div>')
          }
        } else {
          stack.push(tag)
          parts.push(tag)
        }
        
        lastIndex = match.index + tag.length
      }
      
      if (lastIndex < html.length) {
        parts.push(html.substring(lastIndex))
      }
      
      while (stack.length > 0) {
        parts.push('</div>')
        stack.pop()
      }
      
      html = parts.join('')
    }

    // 🚨 步骤2：修复自闭合标签 (XHTML 兼容)
    html = html
      .replace(/<br>/g, '<br />')
      .replace(/<hr>/g, '<hr />')
      .replace(/<img([^>]*)>/g, '<img$1 />')

    // 🚑 步骤3：暴力样式注入 - 处理所有带 style 的标签
    html = html.replace(/(<[^>]+)(style="([^"]*)")/gi, (match, tagStart, _styleAttr, styleContent) => {
      if (!styleContent) return match

      // 解析现有样式
      const styles: Record<string, string> = {}
      styleContent.split(';').forEach((rule: string) => {
        const [key, value] = rule.split(':').map((s: string) => s.trim())
        if (key && value) {
          styles[key] = value
        }
      })

      // A. 规范化字体样式
      if (styles['font-weight'] === 'bold' || styles['font-weight'] === 'normal') {
        styles['font-weight'] = styles['font-weight'] === 'bold' ? '700' : '400'
      }

      if (styles['font-size'] && !/\d+(px|em|rem|%)/i.test(styles['font-size'])) {
        const num = parseFloat(styles['font-size'])
        if (!isNaN(num)) {
          styles['font-size'] = num + 'px'
        }
      }

      // B. 规范化间距（确保有单位）
      const spacingProps = ['margin', 'padding', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
        'padding-top', 'padding-bottom', 'padding-left', 'padding-right']
      
      spacingProps.forEach((prop: string) => {
        const propValue = styles[prop]
        if (propValue && !/\d+(px|em|rem|%)/i.test(propValue)) {
          const num = parseFloat(propValue)
          if (!isNaN(num)) {
            styles[prop] = num + 'px'
          }
        }
      })

      // C. 规范化 border-radius
      if (styles['border-radius'] && !/\d+(px|em|rem|%)/i.test(styles['border-radius'])) {
        const num = parseFloat(styles['border-radius'])
        if (!isNaN(num)) {
          styles['border-radius'] = num + 'px'
        }
      }

      // D. 规范化颜色值（rgb转hex，确保6位）
      Object.keys(styles).forEach(key => {
        const value = styles[key]
        if ((key.includes('color') || key.includes('background')) && value) {
          const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
          if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
            const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0')
            const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0')
            const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0')
            styles[key] = `#${r}${g}${b}`
          } else if (/^#([0-9a-f]{3})$/i.test(value)) {
            const hex = value.substring(1)
            styles[key] = `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
          }
        }
      })

      // E. 🚑 暴力注入：为 div 标签强制添加关键样式
      const isDiv = tagStart.trim().startsWith('<div')
      if (isDiv) {
        // 强制盒模型
        if (!styles['box-sizing']) {
          styles['box-sizing'] = 'border-box'
        }
        
        // 强制块级显示（除非是 flex 容器）
        if (!styles['display']) {
          const hasFlexProps = styles['flex-wrap'] || styles['justify-content'] || styles['align-items']
          if (!hasFlexProps) {
            styles['display'] = 'block'
          }
        }
        
        // 强制底部间距（对抗 MinDoc 的紧凑布局）
        const hasMarginBottom = styles['margin-bottom'] || (styles['margin'] && styles['margin'].includes('px'))
        if (!hasMarginBottom) {
          const isFlexContainer = styles['display'] === 'flex'
          if (!isFlexContainer) {
            styles['margin-bottom'] = '20px'
          }
        }
      }

      // 重新组装样式字符串（关键样式放在后面，提高优先级）
      const priorityProps = ['margin-bottom', 'box-sizing', 'display', 'border-radius']
      const normalEntries = Object.entries(styles).filter(([key]) => !priorityProps.includes(key))
      const priorityEntries = Object.entries(styles).filter(([key]) => priorityProps.includes(key))
      
      const orderedStyles = [...normalEntries, ...priorityEntries]
      const newStyleContent = orderedStyles
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ')

      return `${tagStart}style="${newStyleContent}"`
    })

    // 🚑 步骤3.5：处理 section 标签（转换为 div 并添加样式支持）
    // 因为 TipTap 不支持 section，在插入时已经转换为 div，但这里也处理一下以防万一
    html = html.replace(/<section([^>]*)style="([^"]*)"([^>]*)>/gi, (_match, before, styleContent, after) => {
      let styles = styleContent.trim()
      if (!styles.includes('display')) {
        styles += '; display: block'
      }
      if (!styles.includes('box-sizing')) {
        styles += '; box-sizing: border-box'
      }
      if (!styles.includes('margin-bottom')) {
        styles += '; margin-bottom: 20px'
      }
      // 转换为 div（因为 TipTap 不支持 section）
      return `<div${before}style="${styles}"${after}>`
    })
    html = html.replace(/<\/section>/gi, '</div>')

    // 🚑 步骤4：暴力注入 - 为所有 <p> 标签硬编码样式（修复嵌套问题）
    // 使用更精确的处理，避免破坏嵌套结构
    html = html.replace(/<p([^>]*?)>([\s\S]*?)<\/p>/g, (_match, attrs, content) => {
      // 检查内容中是否包含其他标签（嵌套情况）
      const hasNestedTags = /<[^/][^>]*>/.test(content)
      
      let cleaned: string
      if (!hasNestedTags) {
        // 没有嵌套标签，正常清理空白
        cleaned = content
          .replace(/\s+/g, ' ')
          .replace(/\s*<br\s*\/?>\s*/g, '<br />')
          .trim()
      } else {
        // 有嵌套标签，只清理首尾空白，保留内部结构
        cleaned = content.trim()
      }
      
      // 处理样式
      if (attrs && attrs.includes('style=')) {
        // 🚑 修复：确保保留 <p 开始标签，只更新 style 属性
        const updatedAttrs = attrs.replace(/style="([^"]*)"/i, (_styleMatch: string, styleContent: string) => {
          let styles = styleContent.trim()
          if (!styles.includes('margin-bottom')) {
            styles += '; margin-bottom: 10px'
          }
          if (!styles.includes('line-height')) {
            styles += '; line-height: 1.6'
          }
          return `style="${styles}"`
        })
        return `<p${updatedAttrs}>${cleaned}</p>`
      } else {
        return `<p${attrs} style="margin-bottom: 10px; line-height: 1.6;">${cleaned}</p>`
      }
    })

    // 🗑️ 步骤5：移除无效的空段落（但保护空div中的占位符p标签，如波浪分割）
    // 先保护空div中的占位符p标签（height: 0 的p标签）
    html = html.replace(/<p[^>]*style="[^"]*height:\s*0[^"]*"[^>]*>.*?<\/p>/gi, (match) => {
      // 标记这些p标签，避免被删除
      return match.replace(/<p/, '<p data-preserve="true"')
    })
    
    html = html
      .replace(/<p[^>]*><\/p>/g, '')
      .replace(/<p[^>]*>\s*<\/p>/g, '')
      .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/g, '')
    
    // 恢复占位符p标签的原始格式
    html = html.replace(/<p data-preserve="true"/gi, '<p')
    
    // 注意：不要删除 <div style="..."></div>，这些可能是波浪分割等装饰元素

    // 🎨 步骤6：为 strong 标签添加内联样式（确保加粗效果）
    html = html.replace(/<strong([^>]*)>/gi, (match, attrs) => {
      if (attrs && attrs.includes('style=')) {
        return match.replace(/style="([^"]*)"/i, (_styleMatch, styleContent) => {
          if (!styleContent.includes('font-weight')) {
            return `style="${styleContent}; font-weight: 700"`
          }
          return _styleMatch
        })
      }
      return `<strong${attrs} style="font-weight: 700">`
    })

    // 🧱 步骤7：给内层块级元素加换行
    const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote', 'pre']
    blockTags.forEach(tag => {
      const regex = new RegExp(`<\/${tag}>`, 'g')
      html = html.replace(regex, `</${tag}>\n\n`)
    })

    // 🪡 步骤8：修复嵌套缝隙
    html = html.replace(/\n\n<\/div>/g, '</div>')

    // 📦 步骤9：给外层 div 加换行
    html = html.replace(/<\/div>/g, '</div>\n\n')

    // 🧼 步骤10：全局洗地
    html = html.replace(/\n{3,}/g, '\n\n')

    // 清理首尾
    return html.trim()
  }

  return {
    editor,
    currentStyles, // 👈 导出状态
    applyStyle,    // 👈 导出动作
    setEditor,
    insertMaterial,
    replaceContent, // 👈 导出模板替换方法
    getHtml
  }
})
