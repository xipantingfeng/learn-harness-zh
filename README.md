# 知学 · 学习助手

> **learn-harness-zh** · 基于 [LearnHarness 0.7.0](https://github.com/amosblomqvist/learnharness) 的社区中文本地化版（**非官方**）
>
> 品牌名：**知学**；全名：**知学·学习助手**。许可证：**AGPL-3.0-only**。上游作者与署名见 [NOTICE](NOTICE) 与 [README.upstream.md](README.upstream.md)。

一句话定位：一个**有记忆的 AI 老师**——根据你当前的理解和目标规划课程，用你的回答和思考决定下一步教什么，在教学、练习之间持续构建并更新一张**本地知识图谱**。

本仓库做的事，是在保留 LearnHarness 全部能力的前提下，把界面与提示**尽可能完整汉化为中文**，并做了一层**独立中文桌面包**（品牌、安装目录、数据目录隔离、关闭自动更新）。模型提示词正文保持英文原文，以免改变 AI 行为；品牌名（ChatGPT、Claude、DeepSeek、Deepgram、Tavily 等）不翻译。

---

## 这是什么 / 不是什么

**是**：LearnHarness 0.7.0 的**非官方中文社区分支**，保留原作者与许可证，同样开源。
**不是**：LearnHarness 官方项目、官方中文版，也不隶属于上游；不要把它当作上游的官方发行。

## 与上游 LearnHarness 的关系

- 上游：[amosblomqvist/learnharness](https://github.com/amosblomqvist/learnharness)（AGPL-3.0）。如果本项目对你有帮助，**请也给上游点个 Star**。
- 本分支：[xipantingfeng/learn-harness-zh](https://github.com/xipantingfeng/learn-harness-zh)。
- 同步策略与版本映射见 [UPSTREAM.md](UPSTREAM.md)；每次发布说明“基于上游哪个版本 + 本分支改了什么”，见 [CHANGELOG.md](CHANGELOG.md)。

## 主要差异（相对上游 0.7.0）

| 维度 | 上游 LearnHarness | 本分支 知学·学习助手 |
| --- | --- | --- |
| 界面语言 | 英文（无完整 i18n） | **尽可能全中文**；模型提示词正文保留英文；品牌名不翻译 |
| 品牌 / 安装 | LearnHarness | 品牌「知学」，全名「知学·学习助手」，`知学.exe` |
| 数据目录 | 原目录 | `%APPDATA%\知学`，**与原版隔离** |
| 自动更新 | 可能有 | **默认关闭** |
| 首页示例提示 | 英文示例 | **4 个中文提示，单行显示**，点提示即填入输入框 |
| 回答级快捷操作 | 部分 | 老师说过话后出现（再简单点/再详细点/换个例子/我没懂/总结一下/考考我），预填不自动发送 |
| 计划确认 | — | 计划生成后出**确认卡**（确认，开始教学 / 修改计划），仅最新计划显示 |
| 全局错误 | 默认 | 中文错误页 `app/global-error.tsx` |
| 工程化 | — | `tsc` 0 errors、`next build` exit 0、CI（`.github/workflows/ci.yml`） |
| 本地化机制 | — | `lib/i18n.ts` + `messages/zh-CN.json` + `t()`（#4-lite，**非完整 i18n**） |

## 功能

与上游一致：自适应教学、练习模式、会话与**持久知识图谱**、模型与提供商设置（多提供商 / 自定义 OpenAI 兼容 / Claude Code / 订阅）、插件系统、交互式演示、可视化、PDF 阅读与导入、听写、FSRS 记忆卡片、推理可视化等。详细文档见 [docs/](docs)。

## 快速开始

### Windows 桌面包（推荐）

从本仓库 **Releases** 下载 `知学` 安装包（若尚未发布构建，见“开发与构建”自行构建）：

- 安装目录：`C:\Users\<你>\AppData\Local\Programs\知学`
- 数据目录：`%APPDATA%\知学`
- 数据与模型密钥**仅保存在本机**，不会上传到本项目。

### 从源码运行（跨平台）

```bash
# Node.js 24 + npm
git clone https://github.com/xipantingfeng/learn-harness-zh.git
cd learn-harness-zh
npm install
npm run plugins:setup        # 安装插件源码依赖（需要 plugins/，见下）
npm run build
npm start                    # 默认 http://localhost:3000
# Windows 桌面模式
npm run desktop:dev
```

> 本分支的中文包是**源码级汉化**：不是对编译产物做文本替换，修改都在 `app/ components/ src/ lib/ messages/ asar-src/` 里。

## 数据与隐私

- 所有学习记录、知识图谱、会话**保存在本地数据目录**（`%APPDATA%\知学`）。
- 模型密钥保存在本机 `auth.json`；**不要提交 `auth.json`、`.env`、`data/`、日志**（`.gitignore` 已排除）。
- 与你所选模型提供商之间的网络请求遵循其自身条款；本项目不内置遥测。
- **自动更新已关闭**，不会偷偷拉取新版本。

## 已知限制 / 路线图（如实说明）

以下相对“完全体”仍未完成，**不要当作已实现**：

- **#2 计划确认硬闸门**：当前是“确认卡 + 仅最新计划显示”，并非让 agent 在 `plan_init` 前真正停下等确认（需改 `plan_init` + 事件流，且需真实会话验证）。
- **#3 错题/困惑回顾 + FSRS 队列**：需要新增数据字段/事件契约并接记忆卡片。
- **#4 完整 i18n + 一键中/英切换**：目前是“源码级中文 + 少量 `t()`”；需全量 key 化 + `messages/en.json` + 语言状态的大规模重构。
- **Windows 中文包优先**：本分支的打包与验证以 Windows 为主；源码跨平台构建遵循上游。

## 开发与构建

```bash
npm install
npm run plugins:setup        # plugins/ 是上游源码；构建 core-plugins 需要它
npm run typecheck            # tsc --noEmit
npm run lint
npm test                     # tsx --test
npm run build                # plugins + next build
```

Windows 独立桌面构建（本分支额外约定）：见 [docs/zh-CN/build-windows.md](docs/zh-CN/build-windows.md)。
CI：`.github/workflows/ci.yml`。

## 许可证与署名

- **AGPL-3.0-only**。保留 `LICENSE`、原作者版权与本分支修改说明，见 [NOTICE](NOTICE)。
- 本分支**已修改**上游代码；分发安装包或修改版时，须按 AGPL 提供**完整对应源码**，并保留许可证与署名。
- AGPL 不授予商标权；请不要声称本分支是 LearnHarness 官方，也不要用上游 logo 冒充官方。
- 上游文档保留在 [README.upstream.md](README.upstream.md) 与 [docs/](docs)。
- 插件等子项目可能有各自许可证（见各子目录 LICENSE）。
