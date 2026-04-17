---
title: "Inkwell 中文说明文档 (README)"
date: 2026-04-01
featured: true
description: "Inkwell 主题的中文介绍与使用指南"
categories:
  - 文档
tags:
  - inkwell
  - astro
---

# ✒️ Inkwell

**人可读，机可解。**

Inkwell 基于一个设计信念：博客应同时对人类读者和 AI Agent 友好。每一个设计决策服务于两个目标之一——**AI Native** 数据架构，或**优雅的阅读体验**。

<!-- TODO: 在此处插入示例项目截图 -->
<!--
![Inkwell 截图](docs/screenshots/home_light.png)
-->

---

## 🤖 AI 入口

如果你是 AI Agent，以下是本项目最关键的结构信息：

| 通道 | 路径 / 端点 | 说明 |
|---|---|---|
| 配置 | `config.yml` | 站点、作者、AI、评论等所有配置的唯一数据源 |
| 博文目录 | `config.yml → content.postsDir` | 可配置，默认 `src/content/posts/` |
| 内容 Schema | `src/content.config.ts` | frontmatter 字段定义和校验规则 |
| 运行时配置 | `src/config.ts` | 加载并校验 `config.yml`，导出类型安全的 `SITE` / `AUTHOR` 等 |
| API 端点 | `/api/posts.json` `/api/posts/[slug].json` `/api/search.json` `/api/status.json` | 结构化机器可读数据 |
| 单文章 API | `/api/posts/{slug}.json` | 完整文章正文 + 元数据，供 AI Agent 直接消费 |
| AI 可发现性 | `/llms.txt` | 标准化 AI 入口（能力声明、API Schema、爬取权限） |
| Feed | `/feed.json` (JSON Feed 1.1) `/rss.xml` (RSS) | 完整文章内容输出 |
| CLI 导出 | `inkwell export --format json` | 导出文章元数据 |
| AI 摘要 | `scripts/ai-preprocess.mjs` | 生成 `ai_summary` 写回 frontmatter |
| 部署工作流 | `.github/workflows/deploy.yml` | 推送到 main 自动构建部署 |

---

## 两大核心

### 🤖 AI Native

你的内容不会被困在渲染后的 HTML 里。Inkwell 在每一层都暴露了结构化的机器可读数据：

```
/feed.json          JSON Feed 1.1 — 完整文章内容，AI 友好
/rss.xml            标准 RSS Feed
/api/posts.json     文章索引（metadata + AI 摘要）
/api/search.json    ?q=关键词&category=分类&tag=标签 — 结构化搜索
/api/status.json    站点健康状态 + 能力端点
inkwell export      CLI 导出为 JSON 或 CSV
```

每篇文章都携带 **JSON-LD Schema**（Article 类型），AI 爬虫无需解析 HTML 即可提取结构化元数据。**AI 摘要**流水线支持 OpenAI 兼容 API 和 Anthropic 兼容 API（也支持 Gemini），生成要点摘要写回 frontmatter — 同时服务于 UI 卡片和任何能读取源文件的 Agent。

### ✨ 人类体验

在结构化数据层之下，是一个精心打磨的阅读环境：

| 维度 | 实现 |
|---|---|
| **布局** | 三栏：导航栏 + 内容区 + 固定侧边栏（个人资料、分类、标签云、站点信息） |
| **阅读** | 禅定模式 (Zen Mode) 支持 Esc 快捷退出 · 目录自动折叠 · 阅读进度条 · 预估时间 |
| **舒适** | 暗色模式（无闪烁）· KaTeX 数学公式 |
| **代码** | 双主题代码语法高亮 (自动适配网页日夜模式) · 语言标签 · 一键复制 |
| **讨论** | Giscus（GitHub Discussions）— 主题自适应，隐私友好 |
| **速度** | 静态优先 · 零数据库 · Pagefind 客户端搜索 · 图片懒加载 |
| **写作** | Obsidian 写作 → 一键发布 · `inkwell lint` 源文件净化 · `inkwell ai` 生成摘要 |

---

## ✨ 功能特性

- 🗂 **三栏布局** — 导航栏、内容区、固定侧边栏（个人资料、分类、标签云、站点信息挂件）
- 📄 **文章详情页** — 封面图、AI 摘要卡片、阅读时间、目录自动折叠、Giscus 评论、版权信息
- 🔍 **全文搜索** — 基于 [Pagefind](https://pagefind.app)，零依赖服务端，支持 `Cmd/Ctrl + K` 快捷键
- 🤖 **AI 摘要** — 支持 OpenAI 兼容 API（GPT、DeepSeek 等）、Anthropic 兼容 API（Claude 等）和 Gemini API，生成 `ai_summary` 写回 frontmatter，渲染为可折叠卡片
- 🌙 **暗色模式** — 手动切换，localStorage 持久化，访问无闪烁
- 🧘 **禅定阅读 (Zen Mode)** — 隐藏侧边栏与页眉页脚，拓宽阅读区，一键/Esc 回退，带来极致沉浸的阅读心流体验
- ⌨️ **Markdown 净化器** — 自动检测并修复含有隐藏零宽字符 (BOM) 与语法缺失的 Markdown 源文件，保障严格编译环境，带 `--fix` 一键治愈
- 📡 **RSS + JSON Feed** — 每次构建自动生成，两种格式完整输出
- 💬 **Giscus 评论** — GitHub Discussions 支持，主题自适应
- ⚙️ **单文件配置** — 全部在 `config.yml`，无散落硬编码
- 📝 **Obsidian 工作流** — 在 Obsidian 写作，通过 CLI 一键发布到 Git
- 🪝 **Webhook 支持** — 构建完成或文章发布时自动通知外部 Agent
- ⭐ **精选推荐** — 在 frontmatter 中设置 `featured: true`，文章将出现在首页精选区块
- 🔍 **图片灯箱** — 点击正文任意图片可全屏放大，ESC 或点击背景关闭
- 🤖 **`/llms.txt`** — 标准化 AI 入口，暴露所有 API 端点、内容 Schema 和爬取权限
- 📦 **单文章 API** — `/api/posts/{slug}.json` 提供完整 Markdown 正文 + 结构化元数据

---

## 🛠️ 技术栈

| 层级 | 选择 |
|---|---|
| 框架 | Astro 6 |
| 语言 | TypeScript |
| 样式 | 原生 CSS（Scoped `<style>` 块）+ CSS 自定义属性 |
| 内容 | Astro Content Collections（glob loader） |
| 搜索 | Pagefind |
| 评论 | Giscus |
| 配置 | js-yaml |
| 代码高亮 | rehype-pretty-code + Shiki |
| AI | OpenAI / Anthropic / Gemini API（Provider 可配置） |

---

## 📋 环境要求

- **Node.js >= 22.12.0**（Astro 6 需要，Node 20 会在构建时被拒绝）
- npm >= 10

---

## 🚀 快速开始

```bash
git clone https://github.com/Amoswuuuu/Inkwell.git
cd inkwell
npm install
npm run dev
```

打开 `http://localhost:4321`。

> **💡 注意**：搜索 UI（`/pagefind/pagefind-ui.js`）由 `npm run build` 生成，dev 模式下不存在。搜索弹窗会显示"需要构建"的提示，这是预期行为。

---

## 📁 项目结构

```
inkwell/
├── config.yml                 # 所有配置的单一数据源
├── astro.config.mjs           # Astro 框架配置（site URL、集成）
├── public/                    # 静态资源（头像、favicon 等）
├── scripts/
│   ├── ai-preprocess.mjs      # AI 摘要生成
│   ├── obsidian-publish.mjs   # 从 Obsidian 仓库发布文章
│   └── webhook-trigger.mjs    # 构建/发布时触发 Webhook
├── src/
│   ├── components/
│   │   ├── widgets/           # 侧边栏挂件（Profile、Category、TagCloud、SiteInfo）
│   │   ├── AISummaryCard.astro
│   │   ├── GiscusComments.astro
│   │   ├── HeroBanner.astro
│   │   ├── Navbar.astro
│   │   ├── PostCard.astro         # 横向卡片（左图右文）
│   │   ├── PostCardVertical.astro # 网格卡片（上图下文）
│   │   └── Search.astro
│   ├── content/
│   │   └── posts/             # Markdown 文章
│   ├── data/
│   │   └── friends.md         # 友链数据
│   ├── layouts/
│   │   ├── BaseLayout.astro   # 共享外壳（导航栏、页脚、搜索弹窗）
│   │   └── BlogLayout.astro   # 文章布局（目录、评论、版权）
│   ├── pages/                 # 文件路由 + API 端点
│   │   ├── feed.json.ts       # JSON Feed 1.1
│   │   ├── rss.xml.ts         # RSS Feed
│   │   └── api/               # 机器可读 API 端点
│   ├── styles/
│   │   └── global.css         # 设计令牌、Prose 样式、目录样式
│   ├── config.ts              # 运行时加载并校验 config.yml
│   └── content.config.ts      # Content collection schema
└── .github/workflows/         # CI/CD（GitHub Actions）
```

---

## 📦 命令

> 💡 在项目目录运行 `npm link` 后，即可使用全局 `inkwell` 命令。也可以使用 `node scripts/inkwell.mjs` 或下方列出的 npm script。

### Inkwell CLI

| 命令 | 别名 | 说明 |
|---|---|---|
| `inkwell generate` | `g` | 生产构建 + Pagefind 索引 |
| `inkwell build` | `b` | generate 的别名 |
| `inkwell server` | `s` | 启动 dev 服务器（热重载） |
| `inkwell preview` | `p` | 本地预览生产构建 |
| `inkwell clean` | `c` | 删除 dist/ 和 .astro/ 缓存 |
| `inkwell deploy` | `d` | 构建 + 部署到 GitHub Pages |
| `inkwell ai` | `a` | 运行 AI 摘要生成 |
| `inkwell lint` | `l` | 检测 Markdown 格式隐患 (后接 `--fix` 自动修复) |
| `inkwell export` | `e` | 导出文章为 JSON 或 CSV |
| `inkwell status` | `st` | 显示站点状态 |

### NPM Scripts

| 命令 | 说明 |
|---|---|
| `npm run dev` | 在 `localhost:4321` 启动 dev 服务器 |
| `npm run build` | `inkwell generate` 的别名 |
| `npm run preview` | 带搜索支持地预览 dist/ |
| `npm run ai:preprocess` | 运行 AI 摘要生成 |
| `npm run publish:obsidian` | 从 Obsidian 发布文章 |

---

## ⚙️ 配置

所有运行时配置集中在项目根目录的 `config.yml` 中。

```yaml
site:
  title: "我的博客"
  subtitle: '我的 tagline'
  description: 我的博客描述
  url: https://yourdomain.com
  startDate: '2024-01-01'        # 必须为字符串
  timezone: Asia/Shanghai
  heroImage: https://example.com/hero.jpg
  postsPerPage: 10

author:
  name: 你的名字
  bio: |
    个人简介。
    两行也可以。
  avatar: /avatar.jpg            # 把头像放到 public/avatar.jpg
  language: zh-CN

social:
  github: your-github-username
  twitter: ""
  email: you@example.com

# 侧边栏头像设置
avatar:
  shape: circle                  # "circle" | "rounded" | "square"
  size: 80                       # 直径 px
  border: true                   # 显示强调色边框

# Hero 横幅背景
background:
  image: ""                      # URL 或路径；留空则使用上方的 heroImage
  blur: 0                        # 背景模糊 px（0 = 不模糊）
  overlayOpacity: 0.45           # 遮罩透明度（0–1）

# 站点统计（Umami — 隐私友好，可自建）
# 配置指南：https://umami.is/docs/getting-started
stats:
  umami:
    enabled: false
    src: ''                      # 你的 Umami 脚本 URL
    websiteId: ''                # Umami 仪表盘中的 Website ID

post:
  listStyle: horizontal          # "horizontal"（左图右文）| "card"（网格，上图下文）

giscus:
  repo: your-org/your-repo
  repoId: ""                     # 从 giscus.app 获取
  category: Announcements
  categoryId: ""                 # 从 giscus.app 获取
  lang: zh-CN

navLinks:
  - href: /
    label: 首页
  - href: /archives
    label: 归档
  - href: /categories
    label: 分类
  - href: /friends
    label: 友链
  - href: /about
    label: 关于

license:
  default: CC-BY-SA              # 文章默认协议

ai:
  enabled: false                 # 设为 true 开启 AI 摘要生成和渲染
  provider: openai               # "openai" | "anthropic" | "gemini"
  summary:
    maxPoints: 4                 # 要点数量上限
    maxCharsPerPoint: 60         # 每点字数上限
  description:
    autoGenerate: true           # 是否从摘要自动生成 SEO 描述
    maxLength: 120               # SEO 描述字数限制
  providers:
    openai:
      apiKey: ${OPENAI_API_KEY}  # 从 .env 或环境变量读取
      model: gpt-4o-mini
      endpoint: https://api.openai.com/v1   # 或任意 OpenAI 兼容 API（DeepSeek、Ollama 等）
    # anthropic:
    #   apiKey: ${ANTHROPIC_API_KEY}
    #   model: claude-3-haiku-20240307
    #   endpoint: https://api.anthropic.com   # 或任意 Anthropic 兼容 API
    # gemini:
    #   apiKey: ${GEMINI_API_KEY}
    #   model: gemini-2.0-flash
    #   endpoint: https://generativelanguage.googleapis.com/v1beta
```

> ⚠️ **`startDate`**：必须加引号（`'2019-01-01'`）。YAML 日期字面量会被解析为 Date 对象，导致构建错误。

### 💬 配置 Giscus

1. 在 GitHub 仓库开启 **Discussions**
2. 安装 [Giscus GitHub App](https://github.com/apps/giscus) 到仓库
3. 访问 [giscus.app](https://giscus.app)，填写仓库信息，复制 `repoId` 和 `categoryId`
4. 将值填入 `config.yml` 的 `giscus` 配置项

---

## ✍️ 撰写文章

文章默认放在 `src/content/posts/` 目录下，以 Markdown 或 MDX 格式书写。你可以在 `config.yml` 中通过 `content.postsDir` 指定其他目录（支持绝对路径，如 Obsidian 仓库路径）。

### Frontmatter 参考

```yaml
---
title: 文章标题
date: 2024-06-01
updated: 2024-06-15           # 可选：最后更新日期
cover: https://example.com/cover.jpg
categories:
  - 教程                    # 多个分类必须用数组形式
tags:
  - astro
  - typescript
description: 一段简短的描述，用于 SEO 和社交分享。
ai_summary:                   # 由 inkwell ai 自动生成；也可手动填写
  - 核心要点一
  - 核心要点二
  - 核心要点三
draft: false
published: true
license: CC-BY-SA             # 使用 config.yml 中定义的预设；留空则用默认
abbrlink: abc123              # 可选：自定义 URL slug
---
```

> ⚠️ **`categories` 和 `tags`**：多个值必须使用 YAML 列表语法（`- item`）。行内逗号分隔字符串**不支持**，会变成一个合并条目。

### 📜 协议字段

`license` 字段支持：

- **预设键**（字符串）：如 `CC-BY-SA`、`MIT`、`CC0` — 解析为 `config.yml` 的 `license.presets`
- **别名**（字符串）：如 `DEFAULT`、`CC`、`GPL` — 解析为 `config.yml` 的 `license.aliases`
- **自定义对象**：
  ```yaml
  license:
    name: 我的自定义协议
    url: https://example.com/license
    notice: 自定义复用声明
  ```

---

## 🤖 AI 摘要

Inkwell 支持三种 AI Provider 生成文章摘要：

| Provider | 配置键 | 兼容 API 示例 |
|---|---|---|
| **OpenAI** | `openai` | GPT-4o-mini、DeepSeek、Ollama、任意 OpenAI 兼容端点 |
| **Anthropic** | `anthropic` | Claude 3 Haiku、任意 Anthropic 兼容端点 |
| **Gemini** | `gemini` | Google Gemini 2.0 Flash |

### 使用方法

```bash
# 1. 在 .env 中配置 API Key（按所选 provider）
OPENAI_API_KEY=sk-xxx          # OpenAI 兼容
# 或 ANTHROPIC_API_KEY=xxx     # Anthropic 兼容
# 或 GEMINI_API_KEY=xxx        # Gemini

# 2. 在 config.yml 中启用并选择 provider
# ai:
#   enabled: true
#   provider: openai            # 或 anthropic / gemini

# 3. 运行摘要生成
inkwell ai
# 或
npm run ai:preprocess
```

脚本逻辑：
1. 读取 `config.yml` 检查 `ai.enabled` 和 `ai.provider`
2. 扫描所有缺少 `ai_summary` 的文章
3. 通过所选 Provider API 生成要点摘要
4. 将摘要写回文章 frontmatter 的 `ai_summary` 字段
5. 同时生成 SEO `description`（可在配置中关闭）

已有 `ai_summary` 的文章会被跳过。使用 `--force` 强制重新生成。

---

## 📝 Obsidian 集成

Inkwell 支持将 Obsidian 作为写作前端，实现"Obsidian 写 → 博客发"的工作流。

### 方式一：指向 Obsidian 仓库（推荐）

在 `config.yml` 中将 `content.postsDir` 设置为 Obsidian 仓库中博文目录的绝对路径：

```yaml
content:
  postsDir: /path/to/your/obsidian-vault/400 Output/401 Post
```

构建时 Inkwell 会直接从该目录读取 Markdown 文件，无需复制。

> **💡 提示**：本地开发时使用绝对路径最方便。CI 环境中可通过环境变量 `INKWELL_POSTS_DIR` 覆盖。

### 方式二：单篇发布脚本

如果你只想发布单篇文章：

```bash
node scripts/obsidian-publish.mjs "/path/to/article.md"
```

脚本会：
1. 设置 `published: true`
2. 清除 `draft` 字段
3. 更新发布日期
4. 只提交并推送目标文件（不会影响仓库中的其他文件）

### 完整自动化（Obsidian → 博客）

如果你想实现"Obsidian 推送 → 博客自动重建"：

1. 将博文存放在 Obsidian 私有仓库
2. 在博客仓库配置 **Repository Secrets**：
   - `OBSIDIAN_PAT` — 有权访问私有仓库的 Personal Access Token
   - `OBSIDIAN_REPO` — 私有仓库名（如 `yourname/obsidian-posts`）
   - `OBSIDIAN_POSTS_DIR` — 仓库中博文子目录路径
   - `OPENAI_API_KEY` — AI 摘要生成（可选）
3. 在 Obsidian 仓库配置 webhook，触发博客仓库的 `repository_dispatch`
4. 每次推送 Obsidian 仓库，博客自动重建

---

## 🌍 部署

构建产物是 `dist/` 目录下的标准静态站点，可部署到任何静态托管服务。

### GitHub Pages

项目内置 `deploy.yml` 工作流，推送到 `main` 分支自动构建部署。

1. Fork 本仓库
2. 进入 **Settings → Pages → Source** 选择 **GitHub Actions**
3. 推送到 `main` 分支 — 自动部署

你的站点地址：`https://yourusername.github.io/Inkwell/`

### Cloudflare Pages

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com) 创建 Pages 项目
2. 关联 GitHub 仓库
3. 构建设置：
   - **构建命令**：`npm run build`
   - **输出目录**：`dist`
   - **Node.js 版本**：`22`
4. 部署完成

> **💡 提示**：如果博文目录不在本仓库内，需在 Cloudflare 环境变量中设置 `INKWELL_POSTS_DIR`。

### 任意静态托管

```bash
npm run build
# 将 dist/ 的内容上传到你的托管服务
```

---

## ⚠️ 已知限制

- 🔍 **Dev 模式搜索**：Pagefind 索引只在 `npm run build` 后存在，搜索弹窗会显示提示，这是预期行为。
- 🖥️ **无服务端渲染**：这是纯静态站点，动态功能（评论、搜索）依赖客户端 JavaScript 或外部服务。
- 🔗 **`astro.config.mjs` 中的 `site` URL**：已从 `config.yml` 的 `site.url` 自动读取，修改域名只需改 `config.yml` 一处即可。

---

## 🤝 贡献

欢迎提交 Bug 修复和 Pull Request。请到 [Issues](https://github.com/Amoswuuuu/Inkwell/issues) 页面提交问题或功能请求。

---

## 📄 许可证

MIT — 详见 [LICENSE](LICENSE)。
