import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { resolveConfigPath } from './utils/resolveConfig';

export interface LicenseInfo {
  name: string;
  url: string;
  notice: string;
}

interface NavLink {
  href: string;
  label: string;
}

interface SiteSection {
  title: string;
  subtitle: string;
  description: string;
  url: string;
  startDate: string;
  timezone: string;
  heroImage: string;
  postsPerPage: number;
  travellings: string;
}

interface AuthorSection {
  name: string;
  bio: string;
  avatar: string;
  language: string;
}

interface SocialSection {
  github: string;
  twitter: string;
  email: string;
}

interface GiscusSection {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  lang: string;
}

interface AvatarSection {
  shape: 'circle' | 'square' | 'rounded';
  size: number;
  border: 'none' | 'ring';
}

interface BackgroundSection {
  image: string;
  blur: number;
  overlay: number;
  overlayColor: string;
}

interface StatsSection {
  umami: {
    enabled: boolean;
    src: string;
    websiteId: string;
  };
}

interface PostSection {
  listStyle: 'horizontal' | 'card';
  math: boolean;
  codeHighlight: boolean;
  lineNumber: boolean;
}

interface SiteInfoSection {
  statStyle: 'block' | 'text';
  showRuntime: boolean;
  showPostCount: boolean;
  showTagCount: boolean;
  showWordCount: boolean;
  showStartDate: boolean;
  showLastUpdated: boolean;
}

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  showPoweredBy: boolean;
  showTheme: boolean;
  showHosted: boolean;
  hostedLabel: string;
  hostedUrl: string;
  links: FooterLink[];
}

interface AiProviderConfig {
  apiKey?: string;
  model: string;
  endpoint: string;
  displayName?: string;  // 自定义显示名称
}

interface AiSection {
  enabled: boolean;
  provider: string;
  summary?: {
    maxPoints?: number;
    maxCharsPerPoint?: number;
    prompt?: string;
  };
  description?: {
    autoGenerate?: boolean;
    maxLength?: number;
  };
  providers: Record<string, AiProviderConfig>;
}

// Legacy interface for backwards compatibility
interface AiAbstractSection {
  enabled: boolean;
  model: string;
  label: string;
  apiEndpoint: string;
  prompt: string;
}

interface ContentSection {
  postsDir: string;
}

interface AppConfig {
  site: SiteSection;
  author: AuthorSection;
  avatar: AvatarSection;
  background: BackgroundSection;
  stats: StatsSection;
  social: SocialSection;
  giscus: GiscusSection;
  navLinks: NavLink[];
  dateFormat: string;
  timeFormat: string;
  post: PostSection;
  license: {
    default: string;
    presets: Record<string, LicenseInfo>;
    aliases: Record<string, string>;
  };
  ai?: AiSection;               // New AI config (optional)
  'ai-abstract'?: AiAbstractSection;  // Legacy config (optional)
  footer: FooterSection;
  siteInfo: SiteInfoSection;
  content: ContentSection;
}

type UnknownRecord = Record<string, unknown>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findConfigUp(): string {
  const found = resolveConfigPath(__dirname);
  if (found) return found;
  throw new Error(`Unable to locate config.yml from ${__dirname}`);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expectRecord(value: unknown, keyPath: string): UnknownRecord {
  if (!isRecord(value)) {
    throw new Error(`Invalid config.yml: "${keyPath}" must be an object.`);
  }

  return value;
}

function expectString(value: unknown, keyPath: string, options?: { allowEmpty?: boolean }): string {
  // YAML parses bare dates (e.g. 2019-01-01) as Date objects; coerce to ISO date string.
  if (value instanceof Date) {
    value = value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') {
    throw new Error(`Invalid config.yml: "${keyPath}" must be a string.`);
  }

  if (!options?.allowEmpty && value.trim() === '') {
    throw new Error(`Invalid config.yml: "${keyPath}" must not be empty.`);
  }

  return value;
}

function expectBoolean(value: unknown, keyPath: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid config.yml: "${keyPath}" must be a boolean.`);
  }

  return value;
}

function expectNumber(value: unknown, keyPath: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid config.yml: "${keyPath}" must be a number.`);
  }

  return value;
}

function expectStringRecord(value: unknown, keyPath: string): Record<string, string> {
  const record = expectRecord(value, keyPath);
  const result: Record<string, string> = {};

  for (const [key, entry] of Object.entries(record)) {
    result[key] = expectString(entry, `${keyPath}.${key}`);
  }

  return result;
}

function parseAiProviders(providers: unknown, keyPath: string): Record<string, AiProviderConfig> {
  const record = expectRecord(providers, keyPath);
  const result: Record<string, AiProviderConfig> = {};

  for (const [name, prov] of Object.entries(record)) {
    const provPath = `${keyPath}.${name}`;
    const p = expectRecord(prov, provPath);
    result[name] = {
      apiKey: typeof p.apiKey === 'string' ? p.apiKey : undefined,
      model: expectString(p.model, `${provPath}.model`),
      endpoint: expectString(p.endpoint, `${provPath}.endpoint`),
      displayName: typeof p.displayName === 'string' ? p.displayName : undefined,
    };
  }
  return result;
}

function parseLicenseInfo(value: unknown, keyPath: string): LicenseInfo {
  const record = expectRecord(value, keyPath);

  return {
    name: expectString(record.name, `${keyPath}.name`),
    url: expectString(record.url, `${keyPath}.url`),
    notice: expectString(record.notice, `${keyPath}.notice`),
  };
}

function parseLicensePresets(value: unknown, keyPath: string): Record<string, LicenseInfo> {
  const record = expectRecord(value, keyPath);
  const result: Record<string, LicenseInfo> = {};

  for (const [key, entry] of Object.entries(record)) {
    result[key] = parseLicenseInfo(entry, `${keyPath}.${key}`);
  }

  if (Object.keys(result).length === 0) {
    throw new Error(`Invalid config.yml: "${keyPath}" must define at least one preset.`);
  }

  return result;
}

function parseNavLinks(value: unknown, keyPath: string): NavLink[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid config.yml: "${keyPath}" must be an array.`);
  }

  return value.map((entry, index) => {
    const record = expectRecord(entry, `${keyPath}[${index}]`);

    return {
      href: expectString(record.href, `${keyPath}[${index}].href`),
      label: expectString(record.label, `${keyPath}[${index}].label`),
    };
  });
}

function expectStringEnum<T extends string>(
  value: unknown, keyPath: string, allowed: readonly T[], fallback?: T,
): T {
  const s = typeof value === 'string' ? value : fallback;
  if (!s || !allowed.includes(s as T)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Invalid config.yml: "${keyPath}" must be one of [${allowed.join(', ')}].`);
  }
  return s as T;
}

function validateConfig(value: unknown): AppConfig {
  const root = expectRecord(value, 'config');
  const site = expectRecord(root.site, 'site');
  const author = expectRecord(root.author, 'author');
  const social = expectRecord(root.social, 'social');
  const giscus = expectRecord(root.giscus, 'giscus');
  const post = expectRecord(root.post, 'post');
  const license = expectRecord(root.license, 'license');

  // AI config: prefer new 'ai' section, fall back to legacy 'ai-abstract'
  const aiRaw = isRecord(root.ai) ? root.ai : null;
  const aiAbstractRaw = isRecord(root['ai-abstract']) ? root['ai-abstract'] : null;

  // Optional sections with defaults
  const siteInfoRaw = isRecord(root.siteInfo) ? root.siteInfo : {};
  const footerRaw = isRecord(root.footer) ? root.footer : {};
  const footerLinksRaw = Array.isArray(footerRaw.links) ? footerRaw.links : [];
  const avatarRaw = isRecord(root.avatar) ? root.avatar : {};
  const bgRaw = isRecord(root.background) ? root.background : {};
  const statsRaw = isRecord(root.stats) ? root.stats : {};
  const umamiRaw = isRecord(statsRaw.umami) ? statsRaw.umami : {};
  const contentRaw = isRecord(root.content) ? root.content : {};

  return {
    site: {
      title: expectString(site.title, 'site.title'),
      subtitle: expectString(site.subtitle, 'site.subtitle'),
      description: expectString(site.description, 'site.description'),
      url: expectString(site.url, 'site.url'),
      startDate: expectString(site.startDate, 'site.startDate'),
      timezone: expectString(site.timezone, 'site.timezone'),
      heroImage: expectString(site.heroImage, 'site.heroImage'),
      postsPerPage: expectNumber(site.postsPerPage, 'site.postsPerPage'),
      travellings: expectString(site.travellings, 'site.travellings'),
    },
    author: {
      name: expectString(author.name, 'author.name'),
      bio: expectString(author.bio, 'author.bio'),
      avatar: expectString(author.avatar, 'author.avatar'),
      language: expectString(author.language, 'author.language'),
    },
    avatar: {
      shape: expectStringEnum(avatarRaw.shape, 'avatar.shape', ['circle', 'square', 'rounded'] as const, 'circle'),
      size: typeof avatarRaw.size === 'number' ? avatarRaw.size : 80,
      border: expectStringEnum(avatarRaw.border, 'avatar.border', ['none', 'ring'] as const, 'ring'),
    },
    background: {
      image: typeof bgRaw.image === 'string' ? bgRaw.image : '',
      blur: typeof bgRaw.blur === 'number' ? bgRaw.blur : 0,
      overlay: typeof bgRaw.overlay === 'number' ? bgRaw.overlay : 0.3,
      overlayColor: typeof bgRaw.overlayColor === 'string' ? bgRaw.overlayColor : '#000',
    },
    stats: {
      umami: {
        enabled: typeof umamiRaw.enabled === 'boolean' ? umamiRaw.enabled : false,
        src: typeof umamiRaw.src === 'string' ? umamiRaw.src : '',
        websiteId: typeof umamiRaw.websiteId === 'string' ? umamiRaw.websiteId : '',
      },
    },
    social: {
      github: expectString(social.github, 'social.github'),
      twitter: expectString(social.twitter, 'social.twitter', { allowEmpty: true }),
      email: expectString(social.email, 'social.email'),
    },
    giscus: {
      repo: expectString(giscus.repo, 'giscus.repo'),
      repoId: expectString(giscus.repoId, 'giscus.repoId'),
      category: expectString(giscus.category, 'giscus.category'),
      categoryId: expectString(giscus.categoryId, 'giscus.categoryId'),
      lang: expectString(giscus.lang, 'giscus.lang'),
    },
    navLinks: parseNavLinks(root.navLinks, 'navLinks'),
    dateFormat: expectString(root.dateFormat, 'dateFormat'),
    timeFormat: expectString(root.timeFormat, 'timeFormat'),
    post: {
      listStyle: expectStringEnum(post.listStyle, 'post.listStyle', ['horizontal', 'card'] as const, 'horizontal'),
      math: expectBoolean(post.math, 'post.math'),
      codeHighlight: expectBoolean(post.codeHighlight, 'post.codeHighlight'),
      lineNumber: expectBoolean(post.lineNumber, 'post.lineNumber'),
    },
    license: {
      default: expectString(license.default, 'license.default'),
      presets: parseLicensePresets(license.presets, 'license.presets'),
      aliases: license.aliases === undefined ? {} : expectStringRecord(license.aliases, 'license.aliases'),
    },
    // AI config: return new format if present, otherwise legacy format
    ...(aiRaw ? {
      ai: {
        enabled: expectBoolean(aiRaw.enabled, 'ai.enabled'),
        provider: expectString(aiRaw.provider, 'ai.provider'),
        summary: aiRaw.summary,
        description: aiRaw.description,
        providers: parseAiProviders(aiRaw.providers, 'ai.providers'),
      }
    } : {}),
    ...(aiAbstractRaw ? {
      'ai-abstract': {
        enabled: expectBoolean(aiAbstractRaw.enabled, 'ai-abstract.enabled'),
        model: expectString(aiAbstractRaw.model, 'ai-abstract.model'),
        label: expectString(aiAbstractRaw.label, 'ai-abstract.label'),
        apiEndpoint: expectString(aiAbstractRaw.apiEndpoint, 'ai-abstract.apiEndpoint'),
        prompt: expectString(aiAbstractRaw.prompt, 'ai-abstract.prompt'),
      }
    } : {}),
    siteInfo: {
      statStyle: (siteInfoRaw.statStyle === 'text' ? 'text' : 'block') as 'block' | 'text',
      showRuntime: typeof siteInfoRaw.showRuntime === 'boolean' ? siteInfoRaw.showRuntime : true,
      showPostCount: typeof siteInfoRaw.showPostCount === 'boolean' ? siteInfoRaw.showPostCount : true,
      showTagCount: typeof siteInfoRaw.showTagCount === 'boolean' ? siteInfoRaw.showTagCount : true,
      showWordCount: typeof siteInfoRaw.showWordCount === 'boolean' ? siteInfoRaw.showWordCount : true,
      showStartDate: typeof siteInfoRaw.showStartDate === 'boolean' ? siteInfoRaw.showStartDate : true,
      showLastUpdated: typeof siteInfoRaw.showLastUpdated === 'boolean' ? siteInfoRaw.showLastUpdated : true,
    },
    footer: {
      showPoweredBy: typeof footerRaw.showPoweredBy === 'boolean' ? footerRaw.showPoweredBy : true,
      showTheme: typeof footerRaw.showTheme === 'boolean' ? footerRaw.showTheme : true,
      showHosted: typeof footerRaw.showHosted === 'boolean' ? footerRaw.showHosted : true,
      hostedLabel: typeof footerRaw.hostedLabel === 'string' ? footerRaw.hostedLabel : 'GitHub Pages',
      hostedUrl: typeof footerRaw.hostedUrl === 'string' ? footerRaw.hostedUrl : 'https://pages.github.com',
      links: footerLinksRaw
        .filter(isRecord)
        .map((l) => ({
          label: typeof l.label === 'string' ? l.label : '',
          href: typeof l.href === 'string' ? l.href : '',
        }))
        .filter((l) => l.label && l.href),
    },
    content: {
      postsDir: typeof contentRaw.postsDir === 'string' && contentRaw.postsDir.trim()
        ? contentRaw.postsDir.trim()
        : 'src/content/posts',
    },
  };
}

const configPath = findConfigUp();
const parsedConfig = yaml.load(readFileSync(configPath, 'utf-8'));
const rawConfig = validateConfig(parsedConfig);

export const LICENSES = rawConfig.license.presets;
export const LICENSE_ALIASES = rawConfig.license.aliases;

function resolveLicenseKey(key: string) {
  const normalized = key.trim().toUpperCase();
  return LICENSE_ALIASES[normalized] ?? normalized;
}

const defaultLicenseKey = resolveLicenseKey(rawConfig.license.default);
const fallbackLicense = LICENSES[defaultLicenseKey];

if (!fallbackLicense) {
  throw new Error(`Unknown default license key in config.yml: ${rawConfig.license.default}`);
}

export const SITE = {
  title: rawConfig.site.title,
  subtitle: rawConfig.site.subtitle,
  description: rawConfig.site.description,
  url: rawConfig.site.url,
  startDate: rawConfig.site.startDate,
  timezone: rawConfig.site.timezone,
  heroImage: rawConfig.site.heroImage,
  postsPerPage: rawConfig.site.postsPerPage,
  travellings: rawConfig.site.travellings,
  author: rawConfig.author,
  avatar: rawConfig.avatar,
  background: rawConfig.background,
  stats: rawConfig.stats,
  social: rawConfig.social,
  giscus: rawConfig.giscus,
  navLinks: rawConfig.navLinks,
  dateFormat: rawConfig.dateFormat,
  timeFormat: rawConfig.timeFormat,
  post: rawConfig.post,
  license: fallbackLicense,
  // AI: prefer new format, fallback to legacy
  aiAbstract: rawConfig.ai ? {
    enabled: rawConfig.ai.enabled,
    model: rawConfig.ai.providers?.[rawConfig.ai.provider]?.model || 'unknown',
    label: rawConfig.ai.providers?.[rawConfig.ai.provider]?.displayName 
      || rawConfig.ai.providers?.[rawConfig.ai.provider]?.model 
      || rawConfig.ai.provider,
  } : rawConfig['ai-abstract'] ? {
    enabled: rawConfig['ai-abstract'].enabled,
    model: rawConfig['ai-abstract'].model,
    label: rawConfig['ai-abstract'].label,
  } : { enabled: false, model: '', label: '' },
  footer: rawConfig.footer,
  siteInfo: rawConfig.siteInfo,
  content: rawConfig.content,
} as const;

/**
 * 解析后的博文源文件绝对路径（支持中文路径）
 * 用于外部脚本读取博文目录
 */
export const POSTS_DIR = path.resolve(__dirname, rawConfig.content.postsDir);

// Export AI config (prefer new format)
export const AI_CONFIG = rawConfig.ai || rawConfig['ai-abstract'] || { enabled: false };

export function resolveLicense(key: string, fallback: LicenseInfo = fallbackLicense): LicenseInfo {
  return LICENSES[resolveLicenseKey(key)] ?? fallback;
}
