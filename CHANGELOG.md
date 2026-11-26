# 更新日志

本项目的所有重要改动记录在此。版本号遵循：基线 + 本分支迭代（`v<上游>-zh.N`）。

## [0.7.0-zh.1] — 2026-11-26

首个社区中文本地化发布版。

### 基线
- 基于 **LearnHarness 0.7.0**（AGPL-3.0-only，上游：amosblomqvist/learnharness）。

### 本分支改动（相对上游 0.7.0）
- **全面汉化**：界面、设置各分区、菜单、插件、知识链、状态/错误提示尽可能中文；模型提示词正文与品牌名保留英文。
- **独立中文桌面包**：程序名 知学·学习助手 / 知学.exe；数据目录 `%APPDATA%\知学` 与原版隔离；窗口标题/菜单 zh-CN；**自动更新关闭**。
- **首页示例提示**：4 个中文短提示、**单行显示**；点提示填入输入框并同步 `topicRef`，可直接发送。
- **回答级快捷操作**：仅在已有助手文本后显示；预填不自动发送。
- **计划确认卡**（#2-lite）：仅最新计划显示，确认/修改；非硬闸门。
- **中文全局错误页** `app/global-error.tsx`。
- **最小 i18n**（#4-lite）：`lib/i18n.ts` + `messages/zh-CN.json` + `t()`。
- **工程化**：`tsc --noEmit` 0 errors、`next build` exit 0、CI `.github/workflows/ci.yml`。
- 精简安装体积；修复 shiki 缺包；修复 6 个 TS 错误并移除 `ignoreBuildErrors`。
- 已翻译/新增文案同步更新 `messages/zh-CN.json`。

### 仍未完成（如实标注）
- **#2** 计划确认硬闸门（`probe_done`→等待确认→`plan_init`）。
- **#3** 错题/困惑回顾 + FSRS 复习队列。
- **#4** 完整 i18n + 设置中一键中/英文切换（`messages/en.json`）。

### 构建/许可
- 保留 `LICENSE`（AGPL-3.0-only）、原作者署名；新增 [NOTICE](NOTICE)、[UPSTREAM.md](UPSTREAM.md)。
- Windows 独立构建流程见 [docs/zh-CN/build-windows.md](docs/zh-CN/build-windows.md)。
