# Inkwell 示例内容

此目录包含 Inkwell 主题的示例内容，用于 GitHub Pages 预览和演示。

## 内容结构

```
example/
├── config.yml      # 配置示例
├── posts/          # 示例文章
│   ├── hello-world.md
│   ├── markdown-examples.md
│   └── math-formulas.md
└── pages/          # 示例页面
    ├── about.md
    └── friends.md
```

## 使用方法

### 方式一：预览主题

1. Fork 此仓库
2. 将 `example/` 下的文件复制到项目对应目录
3. 启用 GitHub Pages 查看效果

### 方式二：CDN 加速

部署到 GitHub Pages 后，可通过以下方式加速：

- **jsDelivr CDN**: `https://cdn.jsdelivr.net/gh/your-github-user/your-repo-name@gh-pages/`
- **cnb.cool**: 配置 `cnb.yml` 使用 cnb.cool CDN

### 方式三：本地预览

```bash
# 复制示例配置
cp example/config.yml config.yml

# 复制示例内容
cp -r example/posts/src/content/posts/
cp -r example/pages/src/content/pages/

# 安装依赖
npm install

# 启动开发
npm run dev
```

## 部署到 GitHub Pages

1. Fork 此仓库
2. 进入 **Settings → Pages**
3. Source 选择 **GitHub Actions**
4. 推送代码后自动部署
5. 访问 `https://yourusername.github.io/Inkwell/`

## CDN 加速

### jsDelivr

```
https://cdn.jsdelivr.net/gh/your-github-user/your-repo-name@gh-pages/
```

### cnb.cool

配置 `cnb.yml` 中的 `domains` 为你的域名。
