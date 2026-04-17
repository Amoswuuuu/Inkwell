import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';

/**
 * AI Provider 工厂
 * 
 * 根据 config 中的 provider 类型创建对应的 Provider 实例。
 * 支持的 provider：
 * - openai: OpenAI 及所有兼容 API（Azure、Ollama、DeepSeek 等）
 * - anthropic: Claude 原生 API
 * - gemini: Google Gemini 原生 API
 */
export function createProvider(config) {
  const { provider, providers } = config;
  
  // 获取对应 provider 的配置
  const providerConfig = providers?.[provider];
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${provider}. Available: ${Object.keys(providers || {}).join(', ')}`);
  }

  // 合并全局配置和 provider 特定配置
  const mergedConfig = {
    ...providerConfig,
    maxPoints: config.summary?.maxPoints || 4,
    maxCharsPerPoint: config.summary?.maxCharsPerPoint || 30,
  };

  switch (provider) {
    case 'openai':
      return new OpenAIProvider(mergedConfig);
    case 'anthropic':
      return new AnthropicProvider(mergedConfig);
    case 'gemini':
      return new GeminiProvider(mergedConfig);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export { AIProvider } from './base.js';
export { OpenAIProvider } from './openai.js';
export { AnthropicProvider } from './anthropic.js';
export { GeminiProvider } from './gemini.js';
