/**
 * 标签显示工具函数
 *
 * 解决 Obsidian 对纯数字标签的兼容问题：
 * - YAML 中使用 y 前缀（如 y2021）避开 Obsidian 解析 bug
 * - 前端渲染时自动去掉 y 前缀，用户看到干净的 2021
 */

/**
 * 将内部标签名转换为显示名称
 * 去掉年份标签的 'y' 前缀（y2021 → 2021）
 * 其他标签原样返回
 */
export function displayTag(tag: string): string {
  if (typeof tag !== 'string') return String(tag);
  // 匹配 y 开头后跟 4 位数字的模式（如 y2019, y2020）
  return tag.replace(/^y(\d{4})$/, '$1');
}

/**
 * 将显示名称转换回内部标签名（用于 URL 匹配）
 * 2021 → y2021，保持其他标签不变
 */
export function internalTag(displayName: string): string {
  if (typeof displayName !== 'string') return String(displayName);
  // 纯 4 数字 → 加 y 前缀
  if (/^\d{4}$/.test(displayName)) {
    return `y${displayName}`;
  }
  return displayName;
}
