// src/utils/styleUtils.ts

// 把 "color: red; font-size: 14px" 解析成对象 { color: 'red', 'font-size': '14px' }
export const parseStyleString = (styleString: string): Record<string, string> => {
  if (!styleString) return {}
  
  return styleString.split(';').reduce((acc, rule) => {
    const [key, value] = rule.split(':')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {} as Record<string, string>)
}

// 把对象转回字符串
export const stringifyStyle = (styleObj: Record<string, string>): string => {
  return Object.entries(styleObj)
    .filter(([_, value]) => value) // 过滤掉空值
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}

// 规范化颜色值：将 3 位简写转换为 6 位完整格式
// #555 -> #555555, #abc -> #aabbcc
// rgb(r, g, b) -> #rrggbb
export const normalizeColor = (color: string): string => {
  if (!color) return '#000000'
  
  // 如果是透明，返回 transparent
  if (color === 'transparent') {
    return color
  }
  
  // 处理 rgb/rgba 格式，转换为十六进制
  if (color.startsWith('rgb')) {
    // 匹配 rgb(r, g, b) 或 rgba(r, g, b, a)
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10)
      const g = parseInt(rgbMatch[2], 10)
      const b = parseInt(rgbMatch[3], 10)
      // 转换为十六进制，确保是两位数
      const toHex = (n: number) => {
        const hex = n.toString(16).padStart(2, '0')
        return hex
      }
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }
    // 如果匹配失败，返回默认黑色
    return '#000000'
  }
  
  // 处理 hsl/hsla 格式（HSL 转 RGB 比较复杂，这里先返回默认值）
  if (color.startsWith('hsl')) {
    // 如果需要支持 HSL，可以添加转换逻辑
    return '#000000'
  }
  
  // 处理 # 开头的颜色
  if (color.startsWith('#')) {
    // 如果是 3 位简写格式 #abc，转换为 #aabbcc
    if (color.length === 4) {
      const r = color[1]
      const g = color[2]
      const b = color[3]
      return `#${r}${r}${g}${g}${b}${b}`
    }
    // 如果已经是 6 位或 8 位（带透明度），直接返回
    if (color.length === 7 || color.length === 9) {
      return color
    }
  }
  
  // 如果是命名颜色（如 red, blue），尝试转换为 hex
  // 这里只处理常见情况，其他情况返回原值
  const namedColors: Record<string, string> = {
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'white': '#ffffff',
    'black': '#000000',
    'gray': '#808080',
    'grey': '#808080',
  }
  
  if (namedColors[color.toLowerCase()]) {
    return namedColors[color.toLowerCase()]
  }
  
  // 如果无法识别，返回默认黑色
  return '#000000'
}
