# Skills Manager

A desktop application for visually managing AI coding tool skills locally.

Supports browsing, searching, format conversion, syncing, and downloading of skill files across 7 AI coding tools: Claude, Cursor, Copilot, Cline, Windsurf, Continue, and Trae.

## Features

- **Skill Browser** — Tree view and card view for local skills, with multi-tab support
- **Multi-Tool Formats** — Auto-detects skill formats and structures for Claude, Cursor, Copilot, Cline, Windsurf, Continue, and Trae
- **Convert & Sync** — One-click conversion between tool formats, sync to target directories (overwrite / merge / symlink modes)
- **Online Download** — Download skills from URL, GitHub repositories, or Gist
- **Full-Text Search** — `Ctrl+K` quick search with Fuse.js fuzzy matching
- **Desktop App** — Packaged as a native desktop app via Tauri 2 (Windows / macOS / Linux)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| UI Styling | Tailwind CSS |
| Icons | Lucide React |
| State Management | Zustand |
| Markdown Rendering | react-markdown + remark-gfm + rehype-raw |
| Search | Fuse.js |
| YAML Parsing | js-yaml |
| Diff | diff |
| Desktop Shell | Tauri 2 (Rust) |

## Quick Start

### Prerequisites

- Node.js >= 18
- Rust (desktop packaging only)

### Setup

```bash
# Install dependencies
npm install

# Browser dev mode
npm run dev

# Desktop dev mode
npm run desktop

# Build desktop app
npm run dist:win    # Windows
npm run dist:linux  # Linux
npm run dist:mac    # macOS
```

### Windows One-Click Launch

Double-click `启动SkillsManager.bat` in the project root to auto-start the Vite dev server and open a native desktop window.

## Project Structure

```
├── src/
│   ├── components/       # React components
│   │   ├── common/       #   Shared components (Toast, etc.)
│   │   ├── download/     #   Online download panel
│   │   ├── explorer/     #   Skill browser (tree / card / list)
│   │   ├── layout/       #   Layout (sidebar / toolbar / tabs)
│   │   ├── search/       #   Search panel
│   │   ├── settings/     #   Settings panel
│   │   ├── sync/         #   Sync panel
│   │   └── viewer/       #   Skill viewer + frontmatter panel
│   ├── services/         # Business logic
│   │   └── converters/   #   Per-tool format converters
│   ├── stores/           # Zustand state stores
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── src-tauri/            # Tauri 2 Rust backend
├── scripts/              # Helper scripts
├── public/               # Static assets
└── package.json
```

## Supported Tool Formats

| Tool | Skill File | Global Sync Dir | Project Sync Dir |
|------|-----------|-----------------|------------------|
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

[中文文档](README.zh-CN.md)
