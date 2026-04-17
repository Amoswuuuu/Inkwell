---
title: Markdown 写作示例
date: 2024-01-20
tags: [y2024, markdown, tutorial]
description: 展示 Inkwell 主题支持的 Markdown 语法和扩展功能。
heroImage: https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200
---

这是一篇展示 Markdown 写作功能的示例文章。

<!-- more -->

## 代码块

```javascript
// JavaScript 示例
const greet = (name) => {
  return `Hello, ${name}!`;
};

console.log(greet('Inkwell'));
```

```python
# Python 示例
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print([fibonacci(i) for i in range(10)])
```

## 引用

> "写作是将思想转化为可见形式的过程。" — 未知

## 列表

### 无序列表

- 列表项一
- 列表项二
  - 嵌套列表项
  - 嵌套列表项
- 列表项三

### 有序列表

1. 第一步
2. 第二步
3. 第三步

## 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| 搜索 | ✅ | Pagefind 全局搜索 |
| 评论 | ✅ | Giscus 集成 |
| AI 摘要 | ✅ | 多 Provider 支持 |
| 暗色模式 | ✅ | 自动/手动切换 |
