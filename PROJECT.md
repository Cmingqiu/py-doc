# PyDoc — Python 可视化学习工具

## 项目概述

通过动画交互，直观展示 Python 逻辑与程序流转情况，用于学习观看。

## 技术栈

| 工具 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.x | App Router + SSR/SSG |
| Turbopack | 内置 | 开发构建（替代 Vite） |
| pnpm | 10.x | 包管理 |
| Tailwind CSS | 4.x | 样式 |
| oxlint | 1.x | 代码检查 |
| oxfmt | 0.x | 代码格式化 |
| framer-motion | 11.x | 动画交互 |
| zustand | 5.x | 播放状态管理 |
| shiki | 3.x | 代码高亮（预留） |

## 目录结构

```
py-doc/
├── sources/                        # Python 源文件 + 步骤数据
│   ├── basics/
│   │   ├── variables.py            # Python 代码
│   │   ├── variables.steps.json    # 对应的可视化步骤描述
│   │   ├── conditionals.py
│   │   ├── conditionals.steps.json
│   │   ├── loops.py
│   │   └── loops.steps.json
│   ├── functions/
│   │   ├── recursion.py
│   │   └── recursion.steps.json
│   └── data-structures/
│       ├── linked_list.py
│       └── linked_list.steps.json
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 全局布局
│   │   ├── globals.css             # 渐变主题样式
│   │   ├── page.tsx                # 首页：源文件列表
│   │   └── learn/[slug]/
│   │       ├── page.tsx            # SSR 学习页
│   │       └── LearnPageClient.tsx  # 客户端可视化交互
│   ├── components/
│   │   ├── visualizer/
│   │   │   ├── CodeStepper.tsx     # 代码逐行高亮步进
│   │   │   ├── FlowAnimator.tsx    # 程序流转动画
│   │   │   ├── VariableTracker.tsx # 变量状态追踪
│   │   │   └── CallStack.tsx       # 调用栈可视化
│   │   └── player/
│   │       └── PlaybackBar.tsx     # 播放控制栏
│   ├── lib/
│   │   └── sources.ts             # 服务端读取 sources/ 目录
│   ├── stores/
│   │   └── playback.ts            # Zustand 播放状态
│   └── types/
│       └── visualizer.ts          # 类型定义
├── oxlintrc.json
├── .oxfmtrc.json
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## 核心数据模型

### Step（执行步骤）

每个 `.steps.json` 文件包含一组步骤，描述程序执行时的状态变化：

```typescript
interface Step {
  line: number;           // 当前高亮行号
  action: "assign" | "condition" | "loop_iter" | "call" | "return" | "output" | "swap";
  vars: Record<string, StepVar>;  // 变量快照
  note: string;           // 中文说明
  branch?: "true" | "false";     // 条件分支结果
  loopVar?: string;               // 循环变量名
  loopValue?: string;             // 循环变量当前值
  callStack?: string[];           // 调用栈
  output?: string;                // 输出内容
}

interface StepVar {
  value: string;
  type: string;       // int | str | float | bool | list | ...
  changed?: boolean;  // 值是否刚发生变化（高亮标记）
}
```

### 添加新的 Python 示例

1. 在 `sources/` 对应分类目录下添加 `.py` 文件
2. 同目录下创建同名 `.steps.json` 文件，按 Step 格式描述执行步骤
3. 构建时自动生成对应页面，无需修改代码

## 页面布局

```
┌─────────────────────────────────────────────────────┐
│ ← 返回  │  变量与赋值  │  Python中变量的创建赋值和类型变化  │
├─────────────────────────┬───────────────────────────┤
│                         │  执行流                    │
│  代码面板               │  [赋值] 第1/9步             │
│  (逐行高亮)             │  创建字符串变量 name         │
│                         ├───────────────────────────┤
│  → name = "Alice"      │  变量追踪                  │
│    age = 25             │  name = "Alice" [str]      │
│    height = 1.68        ├───────────────────────────┤
│                         │  调用栈                    │
│                         │  (递归时显示)               │
├─────────────────────────┴───────────────────────────┤
│ [重置] [◀] [▶▶] [▶] 速度: [0.5x][1x][2x][4x] ━━━━ 1/9 │
└─────────────────────────────────────────────────────┘
```

## UI 风格

- 深色主题，背景 `#050816`
- 渐变色彩：蓝 → 紫 → 粉的渐变文字和装饰
- 发光卡片效果（hover 时边框发光 + 上浮）
- 按钮：蓝紫渐变 + 光晕
- 全局径向渐变背景光
- 自定义滚动条和滑块样式

## SSR/SSG 策略

1. 构建时 `generateStaticParams()` 扫描 `sources/` 生成所有 slug
2. `getSourceBySlug()` 在服务端读取 `.py` + `.steps.json`
3. 数据作为 props 传入客户端组件
4. 客户端组件使用 framer-motion + zustand 处理动画和交互

## 后续迭代方向

### P1 — 核心体验完善
- [ ] 代码语法高亮（Shiki，当前为纯文本白色）
- [ ] 步骤播放自动循环
- [ ] 移动端响应式适配
- [ ] 更丰富的动画效果（变量值变化时的数字翻滚、条件分支的路径动画）

### P2 — 交互增强
- [ ] 用户可直接编辑步骤数据（可视化编辑器）
- [ ] 代码与步骤联动编辑
- [ ] 步骤注释支持 Markdown
- [ ] 进度记忆（localStorage 记录上次观看位置）

### P3 — 内容扩展
- [ ] 更多 Python 示例（装饰器、生成器、类继承、异常处理等）
- [ ] 支持用户上传 Python 文件
- [ ] Python AST 自动解析生成步骤（当前为手写 JSON）
- [ ] 多语言支持

### P4 — 高级可视化
- [ ] 控制流图（CFG）可视化
- [ ] 内存模型可视化（对象引用、列表内部结构）
- [ ] 时间线视图（全局执行时间轴）
- [ ] 多文件项目支持（import 关系图）

## 开发命令

```bash
pnpm dev          # 启动开发服务器 (Turbopack)
pnpm build        # 生产构建
pnpm start        # 启动生产服务
pnpm lint         # oxlint 检查
pnpm fmt          # oxfmt 格式化
pnpm fmt:check    # 格式化检查
```
