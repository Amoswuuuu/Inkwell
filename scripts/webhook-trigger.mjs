/**
 * Inkwell Webhook Trigger
 * 触发配置的 webhook URLs，支持构建完成和文章发布事件
 *
 * Usage:
 *   node scripts/webhook-trigger.mjs deploy      # 触发构建完成事件
 *   node scripts/webhook-trigger.mjs publish <slug> <title>  # 触发文章发布事件
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const event = process.argv[2]; // 'deploy' | 'publish'
const slug = process.argv[3] ?? '';
const postTitle = process.argv[4] ?? '';

if (!event || !['deploy', 'publish'].includes(event)) {
  console.error('Usage: node webhook-trigger.mjs <deploy|publish> [slug] [title]');
  process.exit(1);
}

const configPath = resolve(ROOT, 'config.yml');
if (!existsSync(configPath)) {
  console.log('[webhook] config.yml not found, skipping');
  process.exit(0);
}

const config = yaml.load(readFileSync(configPath, 'utf-8'));
const webhook = config?.webhook;

if (!webhook?.enabled || !webhook?.urls?.length) {
  console.log('[webhook] Webhook not enabled or no URLs configured, skipping');
  process.exit(0);
}

const siteUrl = (config.site?.url || 'https://inkwell.example.com').replace(/\/$/, '');
const timestamp = new Date().toISOString();

async function triggerWebhook(webhookConfig, eventType) {
  const { url, method = 'POST', headers = {}, body_template } = webhookConfig;

  if (!url) return;

  // 构建请求体
  let body = body_template
    ?.replace(/\{\{siteUrl\}\}/g, siteUrl)
    ?.replace(/\{\{postTitle\}\}/g, postTitle)
    ?.replace(/\{\{postUrl\}\}/g, slug ? `${siteUrl}/posts/${slug}/` : '')
    ?.replace(/\{\{eventType\}\}/g, eventType)
    ?.replace(/\{\{timestamp\}\}/g, timestamp)
    || JSON.stringify({ event: eventType, site: siteUrl, timestamp });

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (method !== 'GET') {
    options.body = body;
  }

  try {
    console.log(`[webhook] Triggering ${method} ${url}`);
    const response = await fetch(url, options);
    const status = response.status;
    const responseText = await response.text().catch(() => '');
    console.log(`[webhook] Response: ${status} ${responseText.slice(0, 100)}`);
  } catch (err) {
    console.error(`[webhook] Error: ${err.message}`);
  }
}

for (const webhookConfig of webhook.urls) {
  const events = webhookConfig.events || ['deploy'];
  if (events.includes(event)) {
    await triggerWebhook(webhookConfig, event);
  }
}

console.log('[webhook] Done');
