---
title: 数学公式渲染测试
date: 2024-01-25
tags: [y2024, math, latex]
description: 测试 Inkwell 主题的 KaTeX 数学公式渲染功能。
heroImage: https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200
---

Inkwell 支持使用 KaTeX 渲染数学公式。

<!-- more -->

## 行内公式

欧拉公式：$e^{i\pi} + 1 = 0$

二次方程的解：$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$

## 块级公式

### 傅里叶变换

$$
\mathcal{F}(f)(t) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x t} \, dx
$$

### 矩阵

$$
\begin{bmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{bmatrix}
$$

### 求和

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
