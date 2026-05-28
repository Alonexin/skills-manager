# Skills Manager

本地可视化管理 AI Coding 工具 Skills 的桌面应用。

支持 Claude、Cursor、Copilot、Cline、Windsurf、Continue、Trae 七种 AI 编程工具的 Skill 文件浏览、搜索、格式互转、同步和下载。

## 功能

- **Skill 浏览** — 树状目录 + 卡片视图浏览本地 Skill，支持多标签页打开
- **多工具格式** — 自动识别 Claude、Cursor、Copilot、Cline、Windsurf、Continue、Trae 的 Skill 格式和结构
- **格式转换与同步** — 将一个工具的 Skill 一键转换为其他工具格式，并同步到目标目录（支持覆盖/合并/符号链接）
- **在线下载** — 支持从 URL、GitHub 仓库、Gist 下载 Skill 到本地
- **全文搜索** — `Ctrl+K` 快速搜索，基于 Fuse.js 模糊匹配
- **桌面应用** — 基于 Tauri 2 打包为原生桌面应用（Windows / macOS / Linux）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| UI 样式 | Tailwind CSS |
| 图标库 | Lucide React |
| 状态管理 | Zustand |
| Markdown 渲染 | react-markdown + remark-gfm + rehype-raw |
| 搜索 | Fuse.js |
| YAML 解析 | js-yaml |
| Diff 对比 | diff |
| 桌面壳 | Tauri 2 (Rust) |

## 快速开始

### 环境要求

- Node.js >= 18
- Rust（仅桌面打包需要）

### 安装运行

```bash
# 安装依赖
npm install

# 浏览器开发模式
npm run dev

# 桌面开发模式
npm run desktop

# 桌面打包
npm run dist:win    # Windows
npm run dist:linux  # Linux
npm run dist:mac    # macOS
```

### Windows 一键启动

双击项目根目录的 `启动SkillsManager.bat`，自动启动 Vite 开发服务器并打开原生桌面窗口。

## 项目结构

```
├── src/
│   ├── components/       # React 组件
│   │   ├── common/       #   通用组件（Toast 等）
│   │   ├── download/     #   在线下载面板
│   │   ├── explorer/     #   技能浏览（树/卡片/列表）
│   │   ├── layout/       #   布局（侧栏/工具栏/标签页）
│   │   ├── search/       #   搜索
│   │   ├── settings/     #   设置面板
│   │   ├── sync/         #   同步面板
│   │   └── viewer/       #   技能查看器 + Frontmatter 面板
│   ├── services/         # 业务逻辑
│   │   └── converters/   #   各工具格式转换器
│   ├── stores/           # Zustand 状态管理
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
├── src-tauri/            # Tauri 2 Rust 后端
├── scripts/              # 辅助脚本
├── public/               # 静态资源
└── package.json
```

## 支持的工具格式

| 工具 | Skill 文件 | 同步目录（全局） | 同步目录（项目） |
|------|-----------|-----------------|-----------------|
| Claude | `SKILL.md` | `~/.claude/skills/` | `.claude/skills/` |
| Cursor | `.cursor/rules/*.mdc` | `~/.cursor/rules/` | `.cursor/rules/` |
| Copilot | `.github/instructions/*.md` | — | `.github/instructions/` |
| Cline | `.clinerules/*.md` | — | `.clinerules/` |
| Windsurf | `.windsurf/rules/*.md` | — | `.windsurf/rules/` |
| Continue | `.continue/rules/*.md` | — | `.continue/rules/` |
| Trae | `.trae/rules/*.md` | — | `.trae/rules/` |

## License

MIT

---

[English Documentation](README.md)
