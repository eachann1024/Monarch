# Windows 本地构建

本 fork 默认使用简体中文，包括 MSI 安装界面。设备与配置方案名称保持原样；未知的系统或驱动诊断保留原文，并显示中文错误标签。

## 环境要求

- Windows 10 / 11，x64。
- Node.js 20+、Yarn Classic 1.22.22。
- Rust stable MSVC 工具链。
- Visual Studio Build Tools 2022，勾选“使用 C++ 的桌面开发”和 Windows SDK。
- Microsoft Edge WebView2 Runtime。

## 安装依赖

在仓库根目录运行。Node.js 20 自带 Corepack 时，可先执行以下命令启用 Yarn：

```powershell
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn install --frozen-lockfile
```

已有 Yarn Classic 时只需运行最后一条命令。使用项目中的 `yarn.lock`，不必创建 `package-lock.json`。

## 开发与构建

```powershell
# 启动 Windows 原生应用开发模式
yarn tauri dev

# 构建前端、Windows 可执行文件和中文 MSI
yarn build:msi
```

输出：

- `src-tauri/target/release/monarch-desktop.exe`
- `src-tauri/target/release/bundle/msi/*.msi`

GitHub Actions 的 [Windows build](https://github.com/eachann1024/Monarch/actions/workflows/pr-checks.yml) 使用同一锁文件构建，并上传 EXE / MSI。它只做编译与打包，不运行测试用例。

## 验证边界

前端打包或 Windows 编译通过不能证明显示器断开、恢复、HDR、音频切换和托盘快捷键在具体设备上可用。浏览器使用项目自带的模拟后端；真实硬件需按上游 [Windows 硬件检查清单](windows-hardware-checklist.md) 单独验证。

更新检查指向此 fork 的 Releases。尚未发布版本时会显示中文说明，可先在 Actions 页面下载构建产物；不会引导下载上游英文版。
