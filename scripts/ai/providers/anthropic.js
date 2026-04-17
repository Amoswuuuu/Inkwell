import { AIProvider, normalizeSummary } from './base.js';

/**
 * Anthropic Claude Provider
 * 
 * 使用 Anthropic 原生 Messages API。
 * 注意：Anthropic 也支持 OpenAI 兼容模式，如果要统一接口可以改用 OpenAIProvider。
 */
export class AnthropicProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.endpoint = config.endpoint || 'https://api.anthropic.com';
  }

  async generateSummary({ title, content, prompt }) {
    const systemPrompt = prompt || `你是一个专业的技术博客编辑。请为给定的博文生成简洁的摘要。

要求：
1. 输出一个 JSON 数组，包含 3-4 个要点
2. 每个要点不超过 30 个字
3. 要点应该准确概括文章的核心内容
4. 语言风格简洁、专业

示例输出：
["介绍了 React 18 的新特性", "解释了并发渲染的工作原理", "提供了迁移指南和注意事项"]`;

    // 合并 system prompt + user content（兼容所有 Anthropic 兼容 API）
    const userContent = `${systemPrompt}\n\n---\n\n标题：${title}\n\n正文：\n${content.slice(0, 4000)}`;

    const response = await fetch(`${this.endpoint}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        messages: [
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text;
    
    if (!rawText) {
      throw new Error('Empty response from Anthropic API');
    }

    return normalizeSummary(rawText, this.config.maxPoints, this.config.maxCharsPerPoint);
  }

  async generateDescription(summaryPoints) {
    const prompt = `将以下要点整合为一句流畅的描述性文字（不超过 120 字），用于 SEO：

${summaryPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

直接输出描述文字，不要任何前缀或解释。`;

    const response = await fetch(`${this.endpoint}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      return summaryPoints.join('；');
    }

    const data = await response.json();
    const description = data.content?.[0]?.text?.trim();
    
    return description || summaryPoints.join('；');
  }
}
