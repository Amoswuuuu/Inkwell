/**
 * AI Provider 基础抽象类
 * 
 * 所有 AI provider（OpenAI/Anthropic/Gemini）都需要实现这个接口。
 * 这个架构为未来的 AI 能力扩展预留了充足空间：
 * - 摘要生成（当前）
 * - 多语言翻译（未来）
 * - 图片生成（未来）
 * - 对话交互（未来）
 */
export class AIProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * 生成博文摘要（要点数组）
   * @param {Object} params
   * @param {string} params.title - 博文标题
   * @param {string} params.content - 博文正文内容
   * @param {string} params.prompt - 自定义 prompt
   * @returns {Promise<string[]>} 摘要要点数组
   */
  async generateSummary({ title, content, prompt }) {
    throw new Error('generateSummary() must be implemented by subclass');
  }

  /**
   * 从摘要生成 SEO 描述
   * @param {string[]} summaryPoints - 摘要要点数组
   * @returns {Promise<string>} SEO 描述文本
   */
  async generateDescription(summaryPoints) {
    // 默认实现：简单拼接
    // 子类可以覆盖，使用 AI 生成更自然的描述
    return summaryPoints.join('；');
  }

  /**
   * 统一的错误处理
   * @param {Error} error 
   * @param {string} context 
   */
  handleError(error, context) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${this.constructor.name}] ${context}: ${message}`);
    throw error;
  }
}

/**
 * 通用的摘要格式化工具
 */
export function normalizeSummary(rawText, maxPoints = 4, maxCharsPerPoint = 30) {
  let parsed;
  
  // 尝试解析 JSON
  try {
    parsed = JSON.parse(rawText.trim());
  } catch (e) {
    // 如果不是 JSON，尝试按行分割
    parsed = rawText
      .split(/\n+/)
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI response is not a valid summary array');
  }

  // 标准化并限制
  return parsed
    .map(item => String(item).trim())
    .filter(Boolean)
    .slice(0, maxPoints)
    .map(point => point.length > maxCharsPerPoint 
      ? point.slice(0, maxCharsPerPoint - 1) + '…' 
      : point
    );
}
