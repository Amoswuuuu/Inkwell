import { AIProvider, normalizeSummary } from './base.js';

/**
 * OpenAI Provider
 * 
 * 支持所有 OpenAI 兼容的 API：
 * - OpenAI 官方
 * - Azure OpenAI
 * - Anthropic（OpenAI 兼容模式）
 * - Gemini（OpenAI 兼容模式）
 * - 第三方兼容服务（如 Azure、Ollama、DeepSeek 等）
 */
export class OpenAIProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.endpoint = config.endpoint || 'https://api.openai.com/v1';
  }

  async generateSummary({ title, content, prompt }) {
    const defaultPrompt = `你是专业的文章摘要助手。请阅读文章，生成3-4个简短要点。要求：1)每点不超过30字 2)涵盖核心内容 3)返回纯JSON数组格式如["要点1","要点2","要点3"] 不要其他文字。`;

    const fullPrompt = `${prompt || defaultPrompt}\n\n标题：${title}\n\n正文：\n${content.slice(0, 3000)}`;

    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    
    if (!rawText) {
      throw new Error('Empty response from API');
    }

    return normalizeSummary(rawText, this.config.maxPoints, this.config.maxCharsPerPoint);
  }

  async generateDescription(summaryPoints) {
    // 使用 AI 生成更自然的 SEO 描述
    const prompt = `将以下要点整合为一句流畅的描述性文字（不超过 120 字），用于 SEO：

${summaryPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

直接输出描述文字，不要任何前缀或解释。`;

    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      // Fallback to simple join
      return summaryPoints.join('；');
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();
    
    return description || summaryPoints.join('；');
  }
}
