# 与上游 LearnHarness 的关系（UPSTREAM）

本分支 **learn-harness-zh（知学·学习助手）** 基于 **LearnHarness 0.7.0**（AGPL-3.0-only）制作，非官方。

## 上游信息

- 仓库：https://github.com/amosblomqvist/learnharness
- 许可证：AGPL-3.0-only（见 `LICENSE`）
- 本分支保留上游 `LICENSE`、原作者署名，并在 [NOTICE](NOTICE) 列出修改。
- 上游原始说明：[README.upstream.md](README.upstream.md)；上游文档：`docs/`。

## 版本映射

| 本分支版本 | 基于上游 | 说明 |
| --- | --- | --- |
| `0.7.0-zh.1` | `v0.7.0` | 首个中文本地化发布版 |

`package.json` 的 `version` 保持 `0.7.0` 以兼容插件清单校验（`appVersion`）；对外**发布标签**用 `v0.7.0-zh.1` 这种形式，并在 [CHANGELOG.md](CHANGELOG.md) 写清基线与改动。

## 如何同步上游

```bash
git remote add upstream https://github.com/amosblomqvist/learnharness.git   # 首次
git fetch upstream --tags
git checkout -b sync/upstream-vX.Y.Z main
git merge upstream/vX.Y.Z            # 或 git rebase，按团队习惯
# 解决冲突后：
npm install
npm run plugins:setup
npm run typecheck && npm run lint && npm test && npm run build
```

### 建议的同步频率与冲突面

- **频率**：每上游发布一个版本同步一次；不跨大版本直接合并。
- **高冲突区域**：`components/**`（汉化）、`src/core/pending.ts`、`src/agent/**`、`messages/`、`asar-src/`、`electron/`、`package.json`、`electron-builder.yml`。

### 为降低冲突，建议（本分支已朝这个方向走）

- 文案收敛到 `messages/zh-CN.json` + `t()`（#4-lite），但本分支目前是**源码级中文**，同步上游时需重新应用翻译；
- 不要改动模型提示词正文与协议/哨兵字符串（如 `Your thinking`、`Tutor quote`、`Operation aborted`、`plan_init`/`probe_done` 事件名、枚举值）；
- 桌面改名/禁用更新/数据目录集中在 `asar-src/electron/` 与 `electron-builder.yml`，不要散落。

## 插件源码 `plugins/`

核心插件（`core-plugins`、`plugin-authoring`）由上游 `plugins/` 源码在 `npm run build` 时生成。
`plugins/` 是**源码**，应随本分支一并入库；生成产物 `core-plugins/`、`plugin-authoring/`、`public/plugin-authoring/`、`dist/` 应忽略。

> 若本分支发布时不含 `plugins/`，请先 `git clone` 上游 v0.7.0 并把其 `plugins/` 目录复制到本仓库根目录，再 `npm run plugins:setup`。
