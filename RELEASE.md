# OpenSay Zero v2.0.0 · 交付说明

本文件面向拿到仓库或发布包的人：怎么跑、怎么验、怎么定位到具体版本。

## 1. 这是什么

一个零基础成人英语口语产品：4 周、20 次、每天 10 分钟、5 个场景。
第 4 周结束时，目标是在咖啡店完成一次「问价 → 选款 → 付款」的简单对话。

技术形态：Vite + React + TypeScript 的单页应用，全部数据留在浏览器本机；
没有后端、账号、支付或 LLM。

## 2. 运行

### 从源码

要求 Node.js ≥ 20（开发时使用 24.21.0）。

```powershell
# 本机 Node 不在 PATH 时：
$env:PATH = "C:\Users\huan'xin\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin;" + $env:PATH

node node_modules/vite/bin/vite.js --host 127.0.0.1
```

打开 `http://127.0.0.1:5173`。

依赖已随仓库锁定在 `pnpm-lock.yaml`；首次在新机器上安装：

```powershell
pnpm install
```

`pnpm run` 在部分环境会触发 pnpm 的依赖校验；直接用 `node node_modules/...`
调用二进制可以绕开，命令见 `README.md`。

### 从发布包的 `dist`

`opensay-zero-v2.0.0-dist.zip` 解压后是一个静态站点：

```powershell
python -m http.server 8080 --directory dist
```

打开 `http://127.0.0.1:8080`。不要用 `file://` 直接打开 `index.html`，
浏览器会拦截 ES module。

## 3. 验证

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run
node node_modules/@playwright/test/cli.js test
node node_modules/vite/bin/vite.js build
```

预期结果：

- TypeScript：退出码 0
- Vitest：14 个文件 / 58 条用例通过
- Playwright：6 条用例通过（使用本机 Edge，不下载浏览器）
- 构建：`dist/` 生成成功

手工验收脚本见 `README.md` 的「手动验收」一节。

## 4. 可定位

- 版本：`2.0.0`
- Git tag：`v2.0.0`
- 提交：见仓库 `main` 的 `v2.0.0` tag，或发布资产里的 `BUILD_INFO.json`
- 构建信息：`BUILD_INFO.json` 记录版本、提交、构建时间、Node 版本、
  测试计数、产物 SHA-256
- 校验和：`SHA256SUMS.txt` 覆盖源码包与构建包

## 5. 可复查

- 设计：`docs/superpowers/specs/2026-10-20-opensay-zero-beginner-design.md`
- 计划：`docs/superpowers/plans/2026-10-20-opensay-zero.md`
- 检查点：`docs/superpowers/checkpoints.md`
- 评审响应：`docs/superpowers/review-fixes.md`
- 变更记录：`CHANGELOG.md`

测试与内容校验都可以在本地重跑，不依赖外部服务。

## 6. 数据与隐私

- 进度存 `localStorage`；录音存 IndexedDB，仅本机。
- 设置里可导出/导入 JSON、删除录音、清空全部进度。
- 录音 30 天后清理；离开句块页会停止录音并回收 URL。
- 运行时不发起网络请求（语音识别本身可能由浏览器调用其自带服务）。

## 7. 已知边界

见 `CHANGELOG.md` 的「Known limits」与 `README.md` 的「已知限制」。
