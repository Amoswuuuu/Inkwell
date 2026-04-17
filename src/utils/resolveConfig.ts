/**
 * 统一查找 config.yml 的共享逻辑
 * content.config.ts 和 config.ts 共用此模块，避免重复实现
 */
import { resolve } from 'path';
import { existsSync } from 'fs';

const CONFIG_NAME = 'config.yml';

/**
 * 从给定目录向上搜索 config.yml，最多 6 层
 */
export function resolveConfigPath(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, CONFIG_NAME);
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, '..');
    if (parent === dir) break; // 到达根目录
    dir = parent;
  }
  return null;
}
