import { AIProvider, normalizeSummary } from './base.js';

/**
 * Google Gemini Provider
 * 
 * 使用 Gemini 原生 API。
 * 注意：Gemini 也支持 OpenAI 兼容模式，可以改用 OpenAIProvider。
 */
export class GeminiProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.0-flash';
    this.endpoint = config.endpoint || 'https://generativelanguage.googleapis.com/v1beta';
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

    const userContent = `标题：${title}\n\n正文：\n${content.slice(0, 4000)}`;

    const response = await fetch(
      `${this.endpoint}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error('Empty response from Gemini API');
    }

    return normalizeSummary(rawText, this.config.maxPoints, this.config.maxCharsPerPoint);
  }

  async generateDescription(summaryPoints) {
    const prompt = `将以下要点整合为一句流畅的描述性文字（不超过 120 字），用于 SEO。直接输出描述文字，不要任何前缀或解释。

${summaryPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;

    const response = await fetch(
      `${this.endpoint}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5 },
        }),
      }
    );

    if (!response.ok) {
      return summaryPoints.join('；');
    }

    const data = await response.json();
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    return description || summaryPoints.join('；');
  }
}
