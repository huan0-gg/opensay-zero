# 开口英语 OpenSay · 零基础版

每天 10 分钟，4 周后能在咖啡店完成一次「问价 → 选款 → 付款」的简单对话。

这是按《开口英语 OpenSay PRD v2.0》的机制、针对**零基础成人**重做的一个可运行版本：PRD 从 A2 起步、8 周 18 个场景；这一版从 A1 以下起步、4 周 5 个场景，把「先敢说」放在「说得对」前面。

## 现在能做什么

- **4 周 20 次路径**：咖啡店点单 → 自我介绍 → 超市结账 → 问路 → 餐厅点餐，每个场景三天闭环（学 → 复现 → 全开放）。
- **对话**：作者编写的状态机 + 意图匹配，AI 每轮 1–2 句；必经节点不可跳过；跑题会自然拉回；不打断、不实时纠错。
- **兜底**：沉默 3 秒浮出 2 条可点句；另有「卡住了？说这三句救场」的全局救场句。
- **句块**：每场景 4 必说 + 8 能懂；到期句块在复习里出现，连续失败降级为跟读；对话中第一次用出必说句块会自动进入复习队列。
- **复盘**：最多 3 条修正（你说的 → 更自然 → 为什么）、今天说出口的句子、现实任务、明日预告。
- **进步**：连续天数、本周独立开口轮次、能说清单；不排名、不比较、不打分。
- **数据**：全部在本机（localStorage + IndexedDB），可导出/导入 JSON，可删除录音。
- **降级**：没有语音识别或麦克风被拒时，自动落到「打字 + 点选」，完整流程仍可走完。

## 运行

本机 Node 不在 PATH 上。先设置：

```powershell
$env:PATH = "C:\Users\huan'xin\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin;" + $env:PATH
```

开发服务器：

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1
```

打开 `http://127.0.0.1:5173`。生产构建与预览：

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1
```

> 依赖已安装。`pnpm run` 会触发 pnpm 的依赖校验，而本机 pnpm 拒绝执行 esbuild 的构建脚本；直接调用 `node_modules` 里的二进制可以绕开这个问题。`package.json` 里的 scripts 仍然保留。

## 测试

```powershell
# 单元 + 组件（Vitest）
node node_modules/vitest/vitest.mjs run

# 端到端（Playwright，使用本机 Edge，不下载浏览器）
node node_modules/@playwright/test/cli.js test
```

当前结果：

- TypeScript：`tsc --noEmit` 通过
- 单元/组件：14 个文件、58 条用例通过
- 端到端：6 条通过（完整咖啡店 D1、3 秒兜底、重复练习不跳课、断点续练、D3 变价、损坏进度提示）
- 构建：`vite build` 通过

E2E 用 `?e2e=1` 强制「无语音识别」路径，通过打字完成对话；这样测试不依赖麦克风，也顺带验证了降级路径。

## 手动验收（真实麦克风）

1. 用 Edge 打开 `http://127.0.0.1:5173`（不要带 `?e2e=1`）。
2. 「开始，说出第一句」→ 可跳过测评 → 今日 →「开始今天的 10 分钟」。
3. 允许麦克风；听到 NPC 后点麦克风说：
   - `How much is this?`
   - `I'll take this one.`
   - `Medium.`
   - `To go, please.`
   - `Card, please.`
   - `Thank you.`
4. 应进入复盘页，显示「今天说对了 4 句」；点「完成，回到今天」后首页显示「今天已完成」。
5. 刷新页面，进度仍在。

如果浏览器不支持识别，页面会提示「直接打字也可以」，用输入框完成同样步骤即可。

## 与 PRD 的关系

保留的机制：4 必说 + 8 能懂、三天闭环、首轮不打断、复盘只给 3 条修正、到期句块在对话里复现、3 秒兜底、12 分钟收束。

有意的偏离：

| PRD | 这一版 | 原因 |
|:--|:--|:--|
| A2–B2、8 周、18 场景 | A1 以下、4 周、5 场景 | 用户要的是零基础一个月能简单对话 |
| LLM 生成对话 | 作者状态机 + 意图匹配 | 无后端；零基础经不起生成长句；可测、可审 |
| 音素级发音评分 | 词级 + 作者发音提示 | 浏览器内无法做可靠 GOP；先保证不打击 |
| 云端账号与同步 | 纯本机 | 首发不做账号；导出 JSON 备份 |
| WIT ≥ 30 轮/周 | 本机独立轮次（≥ 2 词、非提示、非跟读） | 零基础前期的轮次口径要放宽 |
| F7 8 周报告含录音 | 能说清单 + 本周轮次 + 本机录音 | 录音只在句块详情里录制与回放 |

## 目录

```text
src/
├─ app/          路由与应用外壳
├─ domain/       调度器、意图匹配、轮次过滤、修正、安全过滤、课表
├─ content/      5 个场景、句块、状态机节点、内容校验
├─ features/     欢迎、测评、今日、场景、对话/复习/复盘、句块、我的、设置
├─ services/     语音（TTS/ASR + 假实现）、录音、存储
├─ state/        Zustand store
└─ ui/           图标、按钮、屏幕骨架
e2e/             Playwright
docs/superpowers 设计文档、计划、检查点
```

## 已知限制

- 语音识别依赖浏览器（Chrome/Edge 的 `webkitSpeechRecognition`）；Safari/Firefox 会走打字路径。
- 测评为 6 题轻量版（PRD 为 12 题），只记录起点与基线，不输出等级、不拦截用户。
- 没有 LLM，NPC 的措辞是作者写的；每个节点 2 个变体，避免完全背台词，但复杂追问接不住。
- 复习只挑「当前场景」的到期句块，不是跨场景队列。
- 录音只存在本机，换设备不会同步；30 天清理逻辑在设置页调用。
- 第 4 周没有单独的「8 周报告」页面，进步集中在「我的」。

## 文档

- 设计文档：`docs/superpowers/specs/2026-10-20-opensay-zero-beginner-design.md`
- 实施计划：`docs/superpowers/plans/2026-10-20-opensay-zero.md`
- 检查点：`docs/superpowers/checkpoints.md`
