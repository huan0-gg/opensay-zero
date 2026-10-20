# OpenSay Zero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个浏览器可用的零基础英语口语产品：4 周 20 次会话，5 个场景，第 4 周能在咖啡店完成「问价 → 选款 → 付款」的简单对话。

**Architecture:** Vite + React 单页应用，全部数据存本机。领域逻辑（复习调度、意图匹配、轮次过滤、计划生成）是纯函数；内容是可校验的 TypeScript 数据；对话是作者编写的状态机，语音通过可替换的 `SpeechPort` 注入，测试与 E2E 用假实现。

**Tech Stack:** TypeScript, React 19, react-router-dom, Zustand, Zod, idb-keyval, CSS Modules, Vitest, Testing Library, Playwright (msedge channel).

**Spec:** `docs/superpowers/specs/2026-10-20-opensay-zero-beginner-design.md`

## Global Constraints

- 工作目录：`E:\deekGZQ\opensay-zero`（新建）。
- Node 不在 PATH：每次命令先执行
  `$env:PATH = "C:\Users\huan'xin\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin;" + $env:PATH`
  再用 `pnpm`（`pnpm` 在 `C:\Users\huan'xin\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs`，可用 `node <path> ...` 调用）。
- 本机没有 git：计划中的「提交」改为「检查点」——运行测试与构建，把结果追加到 `docs/superpowers/checkpoints.md`，不执行 git 命令。
- 运行时零网络请求；不引入后端、账号、支付、LLM。
- 中文界面 + 英文学习内容；价格用数字 + 美元；A1 词汇。
- 时长红线：单次会话 12 分钟自动收束；提示在沉默 3 秒后出现；TTS 被打断 300ms 内停止。
- 每场景恰好 4 个 `core` + 8 个 `understand` 句块；每个必经节点 ≥ 2 条意图分支；无死路。
- 禁用词（出现即测试失败）：很差、太差、糟糕、错误、你说错了、需要加强、多练练、不及格、不达标、口音重。
- 不出现排名、用户对比、红叉。
- Playwright 用 `channel: 'msedge'`，设置 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`，不下载浏览器。

## Review Focus

1. **中式口音/半句输入**（"how much"、"card"）——必须命中意图而不是被判「没听懂」；由 Task 3 的 matcher 测试覆盖。
2. **浏览器没有识别能力或麦克风被拒**——点选 + 文字路径必须能走完整个会话；由 Task 11 的降级测试覆盖。
3. **TTS 被浏览器自动播放策略拦截或没有英文声**——字幕与重播仍可用，流程不中断；由 Task 7 与 Task 11 覆盖。
4. **对话中刷新/关闭再打开，或本机数据损坏**——断点续练、不重复计轮次，损坏时回退空状态并提示；由 Task 4 与 Task 11 覆盖。
5. **后台标签页计时与重复完成**——12 分钟收束只触发一次，重复完成不重复计入计划与连续天数；由 Task 11 与 Task 4 覆盖。

---

## File Structure

```text
opensay-zero/
├─ package.json, vite.config.ts, tsconfig.json, tsconfig.node.json, index.html
├─ playwright.config.ts
├─ src/
│  ├─ main.tsx
│  ├─ app/App.tsx, AppShell.tsx, routes.tsx
│  ├─ styles/tokens.css, global.css
│  ├─ domain/types.ts, scheduler.ts, turn-filter.ts, intent-matcher.ts,
│  │        corrections.ts, plan.ts, progress.ts
│  ├─ content/schema.ts, index.ts, validate.ts, schedule.ts,
│  │        scenes/{coffee,intro,supermarket,directions,restaurant}.ts
│  ├─ services/speech.ts, speech-web.ts, speech-fake.ts, recordings.ts, storage.ts
│  ├─ state/store.ts
│  ├─ features/
│  │  ├─ welcome/WelcomePage.tsx
│  │  ├─ assessment/AssessmentPage.tsx, assessment-data.ts
│  │  ├─ home/HomePage.tsx
│  │  ├─ scenes/ScenesPage.tsx, SceneDetailPage.tsx
│  │  ├─ session/SessionPage.tsx, ReviewPhase.tsx, DialoguePhase.tsx,
│  │  │          RecapPhase.tsx, useDialogue.ts, corrections.ts
│  │  ├─ chunks/ChunksPage.tsx, ChunkDetailPage.tsx
│  │  ├─ profile/ProfilePage.tsx
│  │  └─ settings/SettingsPage.tsx
│  └─ ui/{Button,Card,Screen,ProgressBar,MicButton,SubtitleLine,Chip,Stat}.tsx
├─ src/test/setup.ts, src/test/utils.tsx
└─ e2e/session.spec.ts
```

---

### Task 1: 脚手架、设计令牌、应用外壳与欢迎页

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/app/AppShell.tsx`, `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/ui/Button.tsx`, `src/ui/Screen.tsx`
- Create: `src/features/welcome/WelcomePage.tsx`
- Create: `src/test/setup.ts`, `src/test/utils.tsx`
- Test: `src/features/welcome/WelcomePage.test.tsx`

**Interfaces:**
- Produces: `<App />` mounted at `#root`; routes `/` welcome, `/assessment`, `/home`, `/scenes`, `/chunks`, `/profile`, `/settings`, `/session/:sceneId`; `<Button variant="primary"|"ghost" size="lg"|"md">`; `<Screen title children>`.
- Produces: CSS 变量 `--paper --ink --muted --accent --line --radius --shadow`。

- [ ] **Step 1: 初始化项目**

`package.json` 依赖：`react@^19`, `react-dom@^19`, `react-router-dom@^7`, `zustand@^5`, `zod@^4`, `idb-keyval@^6`；devDeps：`vite@^7`, `@vitejs/plugin-react`, `typescript@^5`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@types/react`, `@types/react-dom`, `@playwright/test`。scripts：`dev`, `build`（`tsc -b && vite build`）, `preview`, `test`（`vitest`）, `e2e`（`playwright test`）。

设置 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` 后 `pnpm install`。

- [ ] **Step 2: 写失败测试**

```tsx
// src/features/welcome/WelcomePage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WelcomePage } from './WelcomePage';

it('says the promise and offers one action', () => {
  render(<MemoryRouter><WelcomePage /></MemoryRouter>);
  expect(screen.getByText('每天 10 分钟')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /开始/ })).toHaveAttribute('href', '/assessment');
});
```

- [ ] **Step 3: 运行并确认失败**

Run: `pnpm test -- --run src/features/welcome/WelcomePage.test.tsx`
Expected: FAIL（组件不存在）。

- [ ] **Step 4: 实现外壳与欢迎页**

`AppShell` 提供底部导航（今日 / 场景 / 句块 / 我的），欢迎页不显示导航。欢迎页只放：一句话价值、一个主按钮「开始，说出第一句」、一个次按钮「先看看怎么练」。视觉令牌按设计文档：暖纸色、深墨色、暖橙强调、圆角与留白。

- [ ] **Step 5: 运行测试与构建**

Run: `pnpm test -- --run src/features/welcome/WelcomePage.test.tsx` → PASS
Run: `pnpm build` → 成功，产物在 `dist/`。

- [ ] **Step 6: 检查点**

在 `docs/superpowers/checkpoints.md` 记录：任务号、测试命令、结果、构建结果。

---

### Task 2: 进度类型与复习调度

**Files:**
- Create: `src/domain/types.ts`, `src/domain/scheduler.ts`
- Test: `src/domain/scheduler.test.ts`

**Interfaces:**
- Produces: `ChunkState { stage: number; dueAt: string; lapses: number; needsSupport?: boolean; lastResult?: 'pass' | 'fail' }`
- Produces: `scheduleNext(state: ChunkState, result: 'pass' | 'fail', now: Date): ChunkState`
- Produces: `isDue(state: ChunkState, now: Date): boolean`
- Produces: `newChunkState(now: Date): ChunkState`（stage 0，立即到期）。

- [ ] **Step 1: 写失败测试**

```ts
it('moves a passed chunk to stage 1 and schedules it tomorrow', () => {
  const now = new Date('2026-10-20T10:00:00+08:00');
  const next = scheduleNext(newChunkState(now), 'pass', now);
  expect(next.stage).toBe(1);
  expect(next.dueAt).toBe(new Date('2026-10-21T10:00:00+08:00').toISOString());
});

it('drops a failed chunk one stage and asks for support after two lapses', () => {
  const now = new Date('2026-10-20T10:00:00+08:00');
  const base: ChunkState = { stage: 4, dueAt: now.toISOString(), lapses: 1 };
  const next = scheduleNext(base, 'fail', now);
  expect(next.stage).toBe(3);
  expect(next.lapses).toBe(2);
  expect(next.needsSupport).toBe(true);
  expect(next.dueAt).toBe(new Date('2026-10-21T10:00:00+08:00').toISOString());
});

it('caps at stage 5 and clears support after a pass', () => {
  const now = new Date('2026-10-20T10:00:00+08:00');
  const next = scheduleNext({ stage: 5, dueAt: now.toISOString(), lapses: 2, needsSupport: true }, 'pass', now);
  expect(next.stage).toBe(5);
  expect(next.lapses).toBe(0);
  expect(next.needsSupport).toBe(false);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/domain/scheduler.test.ts` → FAIL。

- [ ] **Step 3: 实现**

间隔表 `[1, 3, 7, 15, 30]` 天：`stage` 1→1 天、2→3、3→7、4→15、5→30。失败：stage −1（不低于 0）、顺延 1 天、`lapses + 1`；`lapses >= 2` 时 `needsSupport = true`。通过：stage +1（不超过 5）、`lapses = 0`、`needsSupport = false`、按新 stage 排期。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/domain/scheduler.test.ts` → PASS。

---

### Task 3: 对话领域——轮次过滤、意图匹配、修正选择

**Files:**
- Create: `src/domain/turn-filter.ts`, `src/domain/intent-matcher.ts`, `src/domain/corrections.ts`
- Test: `src/domain/turn-filter.test.ts`, `src/domain/intent-matcher.test.ts`, `src/domain/corrections.test.ts`

**Interfaces:**
- Produces: `TurnInput { text: string; confidence: number; source: 'voice' | 'text' | 'choice'; usedHint: boolean; isRepeat: boolean; intentId?: string }`
- Produces: `isIndependentTurn(t: TurnInput): boolean`（语音置信度 ≥ 0.6；文本/点选视为满足；≥ 2 个词；有 intentId；未用提示；非逐字跟读）。
- Produces: `matchIntent(text: string, node: DialogueNode): { intentId: string | null; score: number }`
- Produces: `Correction { kind: 'chunk' | 'order' | 'pronunciation'; impact: number; said: string; better: string; why: string }`
- Produces: `selectCorrections(items: Correction[], max = 3): Correction[]`（按 impact 降序、按 kind 去重、过滤禁用词）。

- [ ] **Step 1: 写失败测试**

```ts
it('accepts a partial beginner answer with an intent', () => {
  expect(isIndependentTurn({ text: 'how much', confidence: 0.72, source: 'voice', usedHint: false, isRepeat: false, intentId: 'ask-price' })).toBe(true);
});

it('does not count a hinted or repeated turn', () => {
  expect(isIndependentTurn({ text: 'how much is this', confidence: 0.9, source: 'voice', usedHint: true, isRepeat: false, intentId: 'ask-price' })).toBe(false);
  expect(isIndependentTurn({ text: 'how much is this', confidence: 0.9, source: 'voice', usedHint: false, isRepeat: true, intentId: 'ask-price' })).toBe(false);
});

it('matches "how much" to the price intent', () => {
  const result = matchIntent('how much?', coffeeScene.nodes[0]);
  expect(result.intentId).toBe('ask-price');
  expect(result.score).toBeGreaterThanOrEqual(0.6);
});

it('returns null for unrelated speech', () => {
  expect(matchIntent('i like turtles', coffeeScene.nodes[0]).intentId).toBeNull();
});

it('keeps at most three corrections and drops banned words', () => {
  const items: Correction[] = [
    { kind: 'chunk', impact: 3, said: 'how much', better: 'How much is this?', why: '加上 is this 更像完整问句' },
    { kind: 'order', impact: 2, said: 'this one take', better: "I'll take this one.", why: '英语先说动作再说对象' },
    { kind: 'pronunciation', impact: 1, said: 'tink', better: 'think', why: 'th 的舌尖放在上下齿之间' },
    { kind: 'chunk', impact: 0, said: 'x', better: 'y', why: '你说错了' },
  ];
  const out = selectCorrections(items);
  expect(out).toHaveLength(3);
  expect(out.map((c) => c.kind)).toEqual(['chunk', 'order', 'pronunciation']);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/domain` → FAIL。

- [ ] **Step 3: 实现**

匹配：小写、去标点、压缩空格；命中 `patterns` 任一子串得 0.7；再按与 `intent.chunkIds` 对应句块变体的词集合 Jaccard 加成（最高 0.3）；低于 0.6 返回 null。只匹配当前节点，不跨节点匹配，保证 AC-Z-15。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/domain` → PASS。

---

### Task 4: 进度 Schema、存储与全局 Store

**Files:**
- Create: `src/domain/progress.ts`, `src/services/storage.ts`, `src/state/store.ts`
- Test: `src/domain/progress.test.ts`, `src/state/store.test.ts`

**Interfaces:**
- Produces: `Progress`（`schemaVersion: 1`, `assessment?`, `chunks`, `scenes`, `sessions`, `streak`, `settings`, `planIndex`）。
- Produces: `DEFAULT_PROGRESS`, `parseProgress(raw: string | null): { progress: Progress; recovered: boolean }`。
- Produces: `useProgress` store：`progress`, `completeSession(record)`, `recordChunkResult(chunkId, result)`, `setAssessment(result)`, `updateSettings(patch)`, `setPlanIndex(n)`, `reset()`, `replace(progress)`。
- Produces: `completeSession` 幂等：同一 `sessionId` 第二次调用不重复加计划、不重复加连续天数。

- [ ] **Step 1: 写失败测试**

```ts
it('recovers from corrupt storage with defaults', () => {
  const { progress, recovered } = parseProgress('{not json');
  expect(recovered).toBe(true);
  expect(progress.planIndex).toBe(0);
  expect(progress.sessions).toEqual([]);
});

it('does not double-count a repeated completion', () => {
  const store = createStore();
  const rec = sessionRecord({ id: 's1', date: '2026-10-20', sceneId: 'coffee', day: 1, completed: true });
  store.getState().completeSession(rec);
  store.getState().completeSession(rec);
  expect(store.getState().progress.sessions).toHaveLength(1);
  expect(store.getState().progress.planIndex).toBe(1);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/domain/progress.test.ts src/state/store.test.ts` → FAIL。

- [ ] **Step 3: 实现**

Zod 严格校验；未知 `schemaVersion` 回退默认并 `recovered = true`；`storage` 用 `localStorage`，key `opensay.progress.v1`。连续天数按本地日期比较：同一天不重复累计，隔一天 +1，断档重置为 1；每周 1 次补签（`freezesUsed` 每周重置，简化为「每 7 天最多 1 次」）。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/domain/progress.test.ts src/state/store.test.ts` → PASS。

---

### Task 5: 内容 Schema 与咖啡店场景

**Files:**
- Create: `src/content/schema.ts`, `src/content/scenes/coffee.ts`, `src/content/index.ts`
- Test: `src/content/coffee.test.ts`

**Interfaces:**
- Produces: `Scene`, `DialogueNode`, `Intent`, `Chunk` 类型与 Zod schema（字段见设计文档 10）。
- Produces: `coffeeScene: Scene`，`id: 'coffee'`，`week: 1`。
- Produces: `allScenes: Scene[]`（此后每次新增场景都追加）。

- [ ] **Step 1: 写失败测试**

```ts
it('has four core and eight understand chunks with unique ids', () => {
  expect(coffeeScene.chunks.filter((c) => c.tier === 'core')).toHaveLength(4);
  expect(coffeeScene.chunks.filter((c) => c.tier === 'understand')).toHaveLength(8);
  expect(new Set(coffeeScene.chunks.map((c) => c.id)).size).toBe(12);
});

it('gives every required node at least two intents and two hints', () => {
  for (const node of coffeeScene.nodes) {
    expect(node.intents.length).toBeGreaterThanOrEqual(2);
    expect(node.hints).toHaveLength(2);
  }
});

it('has no dead ends and no banned words', () => {
  for (const node of coffeeScene.nodes) {
    for (const intent of node.intents) {
      if (intent.next !== null) expect(coffeeScene.nodes.some((n) => n.id === intent.next)).toBe(true);
    }
    const text = JSON.stringify(node);
    for (const word of BANNED_WORDS) expect(text).not.toContain(word);
  }
  expect(reachesEnd(coffeeScene)).toBe(true);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/content/coffee.test.ts` → FAIL。

- [ ] **Step 3: 编写内容**

节点顺序：greet（问价 / 直接点单）→ size（杯型）→ here-or-to-go（堂食/带走）→ pay（刷卡/现金）→ close（道谢）。每个节点 2 个 NPC 变体、2 条提示、2 条以上意图；`ask-price` 在 greet 内回答后停留，便于用户再点单。4 个必说：`How much is this?`、`I'll take this one.`、`To go, please.`、`Card, please.`；8 个能懂覆盖杯型、堂食、付款、收据、道谢等。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/content/coffee.test.ts` → PASS。

---

### Task 6: 其余四个场景、20 次课表与内容校验

**Files:**
- Create: `src/content/scenes/{intro,supermarket,directions,restaurant}.ts`, `src/content/schedule.ts`, `src/content/validate.ts`
- Modify: `src/content/index.ts`
- Test: `src/content/all-scenes.test.ts`, `src/content/schedule.test.ts`

**Interfaces:**
- Produces: `introScene`, `supermarketScene`, `directionsScene`, `restaurantScene`。
- Produces: `SCHEDULE: Array<{ sceneId: SceneId; day: 1 | 2 | 3; kind: 'scene' | 'variation' | 'final' }>`（20 项）。
- Produces: `validateContent(scenes: Scene[]): string[]`（返回错误列表，空数组为通过）。

- [ ] **Step 1: 写失败测试**

```ts
it('ships five scenes with 4 + 8 chunks each', () => {
  expect(allScenes).toHaveLength(5);
  for (const scene of allScenes) {
    expect(scene.chunks.filter((c) => c.tier === 'core')).toHaveLength(4);
    expect(scene.chunks.filter((c) => c.tier === 'understand')).toHaveLength(8);
  }
});

it('schedules twenty sessions covering every scene', () => {
  expect(SCHEDULE).toHaveLength(20);
  expect(new Set(SCHEDULE.map((s) => s.sceneId)).size).toBe(5);
  expect(SCHEDULE.filter((s) => s.kind === 'final')).toHaveLength(1);
  expect(SCHEDULE[19]).toMatchObject({ sceneId: 'coffee', kind: 'final' });
});

it('reports no validation errors', () => {
  expect(validateContent(allScenes)).toEqual([]);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/content` → FAIL。

- [ ] **Step 3: 编写内容与课表**

- 自我介绍：Hi, I'm … / Nice to meet you. / I'm from China. / How about you?
- 超市结账：How much is it? / Can I have a bag? / Card, please. / Thank you.
- 问路：Excuse me, where is the station? / Is it far? / Turn left or right? / Thank you.
- 餐厅点餐：A table for two, please. / I'd like this one. / No spicy, please. / The bill, please.

课表按设计文档 7.1：W1 咖啡 D1–D3、自我介绍 D1–D2；W2 自我介绍 D3、超市 D1–D3、咖啡变体；W3 问路 D1–D3、餐厅 D1–D2；W4 餐厅 D3、综合 ×3、咖啡终测。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/content` → PASS。

---

### Task 7: 语音端口、浏览器实现与录音

**Files:**
- Create: `src/services/speech.ts`（接口与工厂）, `src/services/speech-web.ts`, `src/services/speech-fake.ts`, `src/services/recordings.ts`
- Test: `src/services/speech-fake.test.ts`, `src/services/recordings.test.ts`

**Interfaces:**
- Produces: `SpeechPort { speak(text, opts?): Promise<void>; cancel(): void; listen(opts?): Promise<AsrResult>; available: boolean }`
- Produces: `createSpeech(opts?: { forceFake?: boolean }): SpeechPort`；`?e2e=1` 或 jsdom 下用假实现。
- Produces: `FakeSpeech`：`queue(transcript, confidence?)`、`calls` 记录、`cancel` 标记。
- Produces: `RecordingStore { save(blob): Promise<string>; url(id): Promise<string | null>; remove(id); cleanup(now): Promise<number> }`，用 idb-keyval，30 天过期。

- [ ] **Step 1: 写失败测试**

```ts
it('returns queued transcripts and records cancellation', async () => {
  const speech = new FakeSpeech();
  speech.queue('how much is this', 0.9);
  const result = await speech.listen();
  expect(result.text).toBe('how much is this');
  speech.speak('hello');
  speech.cancel();
  expect(speech.cancelled).toBe(true);
});

it('expires recordings after thirty days', () => {
  const old = new Date('2026-09-01T00:00:00Z').toISOString();
  const now = new Date('2026-10-20T00:00:00Z');
  expect(isExpired(old, now)).toBe(true);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/services` → FAIL。

- [ ] **Step 3: 实现**

Web 实现：`speechSynthesis` 选 `en-US` 声、默认 0.8、`onend` resolve；`SpeechRecognition` 单轮 12 秒超时，`onerror`/无权限抛 `SpeechUnavailableError`；任何平台不支持时 `available = false`。录音用 `MediaRecorder`，失败不阻塞会话。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/services` → PASS。

---

### Task 8: 测评

**Files:**
- Create: `src/features/assessment/AssessmentPage.tsx`, `src/features/assessment/assessment-data.ts`
- Test: `src/features/assessment/AssessmentPage.test.tsx`

**Interfaces:**
- Produces: 6 题（3 听辨、2 跟读、1 开放），可跳过；完成后写 `assessment` 并跳 `/home`。
- Consumes: `useProgress.setAssessment`, `SpeechPort`。

- [ ] **Step 1: 写失败测试**

```tsx
it('lets a beginner skip without being blocked', async () => {
  renderApp('/assessment');
  await user.click(screen.getByRole('button', { name: /跳过/ }));
  expect(screen.getByRole('heading', { name: /今天/ })).toBeInTheDocument();
});

it('records the baseline after six answers', async () => {
  renderApp('/assessment');
  await answerAllSix();
  expect(useProgress.getState().progress.assessment?.heard).toBeGreaterThanOrEqual(0);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/features/assessment` → FAIL。

- [ ] **Step 3: 实现**

听辨题给英文音频 + 3 个中文选项；跟读题播放示范、录音、回放对比；开放题提供「按住说」与「点选回答」。结果页只展示「你听得懂 X 句」「你已经能说 Y 句」与基线录音，不显示分数或等级；A1 以下不做拦截。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/features/assessment` → PASS。

---

### Task 9: 今日页与计划生成

**Files:**
- Create: `src/domain/plan.ts`, `src/features/home/HomePage.tsx`
- Test: `src/domain/plan.test.ts`, `src/features/home/HomePage.test.tsx`

**Interfaces:**
- Produces: `nextAssignment(progress: Progress): { index: number; sceneId: SceneId; day: 1 | 2 | 3; kind: 'scene' | 'variation' | 'final' }`
- Produces: `todayPlan(progress)` → `{ reviewCount, sceneId, day, minutes: 10 }`。
- Home 显示：连续天数、本周独立轮次、「开始今天的 10 分钟」、待复习数；当天完成后显示「今天已完成」与加练入口。

- [ ] **Step 1: 写失败测试**

```ts
it('starts at coffee day one and advances after completion', () => {
  expect(nextAssignment(DEFAULT_PROGRESS)).toMatchObject({ sceneId: 'coffee', day: 1, index: 0 });
  const p = { ...DEFAULT_PROGRESS, planIndex: 3 };
  expect(nextAssignment(p)).toMatchObject({ sceneId: 'intro', day: 1, index: 3 });
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/domain/plan.test.ts` → FAIL。

- [ ] **Step 3: 实现**

`SCHEDULE[Math.min(planIndex, SCHEDULE.length - 1)]`；全部完成后返回最后一次（终测）并标记 `allDone`。Home 在当天已有 completed session 时显示完成态。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/domain/plan.test.ts src/features/home` → PASS。

---

### Task 10: 场景列表、场景详情、句块本

**Files:**
- Create: `src/features/scenes/ScenesPage.tsx`, `src/features/scenes/SceneDetailPage.tsx`, `src/features/chunks/ChunksPage.tsx`, `src/features/chunks/ChunkDetailPage.tsx`
- Test: `src/features/scenes/ScenesPage.test.tsx`, `src/features/chunks/ChunksPage.test.tsx`

**Interfaces:**
- 场景卡显示 5 个场景、D1/D2/D3 与徽章；未解锁场景可看不可练。
- 场景详情显示 4 必说 + 8 能懂、今日目标、开始按钮。
- 句块本支持「必说 / 能懂」筛选；详情可播放示范、播放我的录音、看 3 种说法。

- [ ] **Step 1: 写失败测试**

```tsx
it('shows five scenes with progress', () => {
  renderApp('/scenes');
  expect(screen.getAllByTestId('scene-card')).toHaveLength(5);
  expect(screen.getByText('咖啡店点单')).toBeInTheDocument();
});

it('filters the chunk book by tier', async () => {
  renderApp('/chunks');
  await user.click(screen.getByRole('button', { name: '必说' }));
  expect(screen.getAllByTestId('chunk-row')).toHaveLength(20);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/features/scenes src/features/chunks` → FAIL。

- [ ] **Step 3: 实现**

锁定规则：`scene.order > progress.planIndex` 的场景不可开始（可查看）；已完成场景可重练。句块本从内容聚合，按 `tier` 过滤。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/features/scenes src/features/chunks` → PASS。

---

### Task 11: 会话——复习、对话、提示、降级、时长红线

**Files:**
- Create: `src/features/session/SessionPage.tsx`, `ReviewPhase.tsx`, `DialoguePhase.tsx`, `useDialogue.ts`, `src/features/session/corrections.ts`
- Create: `src/ui/MicButton.tsx`, `src/ui/SubtitleLine.tsx`, `src/ui/ProgressBar.tsx`
- Test: `src/features/session/DialoguePhase.test.tsx`, `src/features/session/ReviewPhase.test.tsx`

**Interfaces:**
- Produces: 会话状态机 `review → dialogue → recap`；`useDialogue({ scene, speech, onFinish })` 返回 `{ node, line, state, turn, hintVisible, transcript, corrections, start, submit, useHint, exit }`。
- Produces: `DialogueSession` 记录 `turns / independentTurns / hints / minutes / corrections`。

- [ ] **Step 1: 写失败测试**

```tsx
it('shows two hint chips after three seconds of silence', async () => {
  vi.useFakeTimers();
  renderDialogue();
  vi.advanceTimersByTime(3000);
  expect(await screen.findByRole('button', { name: /How much is this/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /I'll take this one/ })).toBeInTheDocument();
});

it('does not count a hinted turn as independent', async () => {
  renderDialogue();
  await clickHint('How much is this?');
  await say('how much is this');
  expect(lastTurn().independent).toBe(false);
});

it('switches to the text path when the mic is unavailable', async () => {
  renderDialogue({ speech: unavailableSpeech() });
  expect(screen.getByRole('textbox', { name: /也可以打字/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /点选回答/ })).toBeInTheDocument();
});

it('ends at twelve minutes exactly once', async () => {
  vi.useFakeTimers();
  const onFinish = vi.fn();
  renderDialogue({ onFinish });
  vi.advanceTimersByTime(12 * 60 * 1000);
  expect(onFinish).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/features/session` → FAIL。

- [ ] **Step 3: 实现**

对话循环：NPC 说 → 聆听（12 秒上限）→ 识别 → 匹配当前节点 → 回应并推进；无匹配 → `repair`，不记错；连续 2 次无匹配 → 跑题拉回；3 次提示 → 本轮 assisted。提示浮层只在聆听态、沉默 3 秒后出现；点击播放并展示，不替用户说。TTS 播放中检测到用户发声则 `cancel()`。退出时保存断点（`sessionPointer`），轮次 ≥ 3 才计 WIT。

- [ ] **Step 4: 验证**

Run: `pnpm test -- --run src/features/session` → PASS。

---

### Task 12: 复盘、徽章、进步页、设置与端到端

**Files:**
- Create: `src/features/session/RecapPhase.tsx`, `src/features/profile/ProfilePage.tsx`, `src/features/settings/SettingsPage.tsx`, `e2e/session.spec.ts`, `playwright.config.ts`
- Test: `src/features/session/RecapPhase.test.tsx`, `src/features/profile/ProfilePage.test.tsx`, `e2e/session.spec.ts`

**Interfaces:**
- 复盘：≤ 3 条修正（你说的 → 更自然 → 为什么）、1 段最佳录音、「今天说对 N 句」、明日预告、现实任务；D3 完成 → 徽章 + 能说清单。
- 设置：语速 0.8/1.0/1.2、字幕 英文/中英/关、删除录音、导出/导入 JSON、重置。
- E2E：欢迎 → 跳过测评 → 今日 → 咖啡店 D1 → 完成 → 刷新后进度保留。

- [ ] **Step 1: 写失败测试**

```tsx
it('shows at most three corrections in the recap', () => {
  renderRecap({ corrections: fiveCorrections() });
  expect(screen.getAllByTestId('correction')).toHaveLength(3);
  expect(screen.getByText('你说的')).toBeInTheDocument();
  expect(screen.getByText('更自然')).toBeInTheDocument();
  expect(screen.getByText('为什么')).toBeInTheDocument();
});
```

```ts
test('a beginner finishes coffee day one and keeps progress after reload', async ({ page }) => {
  await page.goto('/?e2e=1');
  await page.getByRole('link', { name: /开始/ }).click();
  await page.getByRole('button', { name: /跳过/ }).click();
  await page.getByRole('link', { name: /开始今天的 10 分钟/ }).click();
  await answerDialogueByScript(page);
  await expect(page.getByText(/今天说对/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/今天已完成/)).toBeVisible();
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm test -- --run src/features/session/RecapPhase.test.tsx` → FAIL
Run: `pnpm e2e` → FAIL。

- [ ] **Step 3: 实现**

复盘文案只用「你说的 / 更自然 / 为什么」；不出现分数；无录音时用文字对比，不报错。E2E 通过 `?e2e=1` 注入脚本化识别队列；TTS 走假实现。

- [ ] **Step 4: 全量验证**

Run: `pnpm test -- --run` → 全部 PASS
Run: `pnpm build` → 成功
Run: `pnpm e2e` → 通过
Run: 手工用真实麦克风在 Edge 中走完咖啡店 D1（`pnpm dev`，打开 `http://localhost:5173`）。

---

## Self-Review

- **Spec coverage:** 设计文档 7.1–7.9 分别落到 Task 5–6（内容/课表）、Task 2/8（测评与复习）、Task 9（今日）、Task 10（句块）、Task 11（对话）、Task 12（复盘/进步/设置）。9.3 降级在 Task 7/11。11 的 20 条 AC 由 Task 11/12 的测试与 Task 6 的内容校验覆盖。
- **Type consistency:** `SceneId`、`Chunk`、`Intent.next`、`Progress.planIndex`、`SpeechPort` 在相关任务中同名同形。
- **Review Focus:** 五个失败模式分别落在 Task 3（半句/口音）、Task 11（无麦克风）、Task 7/11（TTS 失败）、Task 4/11（刷新与损坏）、Task 11（计时/重复完成）。
- **Proportion:** 计划描述接口与断言，不替实现写全部函数体；内容文案留给实现时编写。
