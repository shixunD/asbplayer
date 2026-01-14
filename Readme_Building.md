# asbplayer 项目构建指南

## 项目概述

asbplayer 是一个语言学习工具，由 Web 客户端和浏览器扩展组成。项目使用 Yarn 工作区管理，包含三个主要包：client、extension 和 common。

## 构建命令

### Web 客户端 (Client)

```bash
# 完整构建（包含校验）
yarn workspace @project/client run build

# 快速构建（不做校验）
yarn workspace @project/client run buildFast

# Windows 上的构建
yarn workspace @project/client run buildWin

$env:VITE_APP_BASE_PATH="/dist"; yarn workspace @project/client run buildWin
# 暂存环境构建
yarn workspace @project/client run buildStaging
```

### 浏览器扩展 (Extension)

```bash
# Chrome
yarn workspace @project/extension run build
yarn workspace @project/extension run zip           # 打包成 zip

# Firefox
yarn workspace @project/extension run build:firefox
yarn workspace @project/extension run zip:firefox   # 打包成 zip

# Firefox Android
yarn workspace @project/extension run build:firefox-android
yarn workspace @project/extension run zip:firefox-android --sources
```

## 构建输出目录

| 项目 | 输出目录 | 说明 |
|------|---------|------|
| **Client** | `client/dist/` | Web 应用的构建输出 |
| **Extension (Chrome)** | `.wxt/chrome-mv3/` | Chrome 扩展（MV3） |
| **Extension (Firefox)** | `.wxt/firefox-mv2/` | Firefox 扩展（MV2） |
| **Zip 包** | `dist/` | 各平台的 zip 压缩包 |

## 完整构建步骤

如果要完整构建整个项目（推荐）：

```bash
# 1. 构建 Web 客户端
yarn workspace @project/client run build

# 2. 构建并打包 Extension (Chrome)
yarn workspace @project/extension run zip

# 3. 构建并打包 Extension (Firefox)
yarn workspace @project/extension run zip:firefox
```

## 注意事项

- Client 的 `build` 命令会先执行 `verify`（包括 linting、测试、类型检查），然后调用 Vite 进行打包。
- Extension 的打包同样包含验证步骤。
- 确保在构建前安装所有依赖：`yarn`。
