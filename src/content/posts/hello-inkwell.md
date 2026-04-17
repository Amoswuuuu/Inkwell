---
title: Welcome to Inkwell! 👋
date: 2024-06-01
updated: 2024-06-15
cover: https://cdn.jsdelivr.net/gh/volantis-x/cdn-wallpaper-minimalist/2020/006.jpg
categories:
  - 教程
tags:
  - astro
  - inkwell
description: 这是 Inkwell 主题的第一篇文章！本文展示了各项主要排版特性和主题设计哲学。
ai_summary:
  - Inkwell 是一个追求双重友好的博客系统：对人类体验优雅，对 AI Agent 提供高度语义化支持。
  - 本文为你展示了预设主题的页面组件、排版表现。
  - 沉浸式的 Zen Mode、自动化的 Github/Obsidian 工作流让写作变得毫无阻力。
draft: false
published: true
license: MIT
---

欢迎使用 **Inkwell** 主题！这是一个为文字工作者、开发者和喜欢安静思考的人设计的极简 Astro 博客主题。

## 两大核心设计

### 1. 人类阅读体验 (Human Experience)
Inkwell 的界面摒弃了多余的修饰，回归到文字内容本身。阅读体验上：
* **Zen Mode (禅定模式)**：文章页面支持一键/按 `Esc` 键进入全屏阅读模式，消除所有干扰。
* **完美的排版约束**：内置了经过微调的 `Prose` 样式包，在行高、字体间距上寻找完美平衡。

### 2. AI 原生 (AI Native)
在人类阅读界面背后，Inkwell 构建了完全**机器可读**的底层网络：
- `/api/posts.json`、`/feed.json` 等暴露原始数据的 endpoint。
- 自带 **AI 摘要 Pipeline**，自动把文章内容总结为前端卡片，并存入 Frontmatter。

## 代码高亮演示

默认支持日/夜模式自切换的 Shiki 代码高亮：

```ts
// src/example.ts
export function greeting() {
  const theme = "Inkwell";
  console.log(`Hello, welcome to ${theme}!`);
}
```

```python
# 同时也支持 Python
def solve_math(n):
    return sum(i for i in range(n) if i % 2 == 0)
```

## 数学公式演示 (KaTeX/MathJax)

无论是行内公式还是块级公式都不在话下。比如这个行内公式：$E = mc^2$。

或者是块级公式：
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

尽情享受写作吧！✒️
