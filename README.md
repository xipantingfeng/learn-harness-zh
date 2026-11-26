<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/zh/home.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/zh/home.png">
    <img src="docs/assets/zh/home.png" alt="知学" width="640">
  </picture>
</p>

<p align="center"><strong>An agent harness for learning.</strong></p>

<p align="center">
  <a href="https://github.com/xipantingfeng/learn-harness-zh/releases">Download</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="https://github.com/xipantingfeng/learn-harness-zh/issues">Issues</a>
</p>

知学 1.0 uses AI agents to plan and teach lessons from your current understanding to your goal. It builds a detailed picture of what you understand and how you reason. That picture is updated as you learn. The whole interface is in Chinese, with a focused home screen, one-line example prompts, and actions that stay out of the way until they are useful.

Instead of just giving you an explanation, it uses your answers and thinking to decide what you need next. Teaching builds understanding one reasoning step at a time. Practice makes it usable. A persistent knowledge graph carries it across sessions.

![知学 home screen](docs/assets/zh/home.png)

## How it works

1. **Measure.** Before teaching, the agent finds where your understanding ends on each part the lesson depends on. Your answers, confidence, and thinking show it where to start.
2. **Plan.** It works out a dependency map from that starting point to your goal. The plan is visible, and a confirmation card lets you approve or revise it before teaching begins.
3. **Teach.** Each step builds on something you already understand. You predict, get an explanation, and check your understanding. Confusions are repaired before anything is built on them. Reply-level actions — simpler, more detail, another example, quiz me — prefill the composer without sending on your behalf.
4. **Practice.** Separate sessions pose varied problems that require the right knowledge to come to mind without being named first. Problems and hints adapt to your reasoning.

**Think out loud.** The thinking fields let you explain your reasoning, uncertainties, and reactions in your own words. This is how the agent gets a detailed picture rather than just a record of right and wrong answers. You can type or use dictation.

**Bring your files.** In the desktop app, attach PDFs, photos, or any other file with the paperclip, or drag them in. The file stays where it is: the message carries its path, and the agent reads it from there.

The agent can also research questions in the background, create visual explanations, show your own images in the lesson and mark them up with arrows and labels (including figures it crops straight out of your PDFs, such as lecture slides), and build interactive demonstrations.

## Knowledge that carries forward

What you are taught accumulates as propositions and reasoning chains: individual claims and the premises that lead to them. The graph shows this structure, with links back to the source sessions. You can also import notes.

Future teaching sessions can read the graph instead of starting from scratch. Practice sessions can draw their material from it. It stores the ideas and their connections, not ratings of your ability.

## Download and get started

**[Download from GitHub Releases](https://github.com/xipantingfeng/learn-harness-zh/releases/latest)**

- **Windows (x64):** unpack the archive and run `知学.exe`. No installer, no Node.js, no dependency downloads.
- **Linux (x64):** unpack the archive and run the `知学` executable.
- **macOS (Apple Silicon / Intel):** unpack the archive and open `知学.app`. Gatekeeper may ask you to allow an app from an unidentified developer; right-click and choose Open once.

Choose your models, then start a session with what you want to understand. You can use provider API keys, supported subscription connections in the desktop app, an installed Claude Code CLI, or a custom OpenAI-compatible endpoint, including a local model server. Optional dictation and web search use separate service keys.

See [Getting started](docs/getting-started.md) for model setup, dictation, files, and notes imports, and [context, caching, and costs](docs/compaction-accounting.md) for advanced cache preferences.

In-app updates are disabled: the app never replaces itself silently.

## Your keys, your data

- **Your keys and models.** No subscription or markup. Billing depends on your provider, CLI configuration, subscription, or local setup. The live cost meter estimates known API costs, not subscription, CLI, or custom-endpoint charges.
- **Local storage.** Your chats, graph, settings, and API keys live on your machine under `%APPDATA%\知学`. Learning records are plain files you can inspect.
- **External services.** Models run through your configured providers. Model requests send the context needed for the task; web research and dictation also contact external services. Local storage does not mean offline processing.
- **Inspectable behavior.** System prompts are visible and editable. The app is open source under the AGPL-3.0 license.

## Development and support

```bash
npm ci
npm run plugins:setup
npm run dev        # http://localhost:3000
npm test           # fixtures and fake providers
```

See the [documentation index](docs/README.md) for all guides, [development](docs/development.md) for setup and checks, [architecture](docs/architecture.md) for the runtime, [keyboard shortcuts](docs/keyboard.md), and [desktop builds](docs/zh-CN/build-windows.md) for the packaging flow.

Questions, bug reports, and feature requests: [GitHub Issues](https://github.com/xipantingfeng/learn-harness-zh/issues).

Security vulnerabilities: report privately as described in [SECURITY.md](SECURITY.md), not in public issues.

## License

[AGPL-3.0](LICENSE)

Includes code from LearnHarness; attribution and modification notes are in [NOTICE](NOTICE). The app is free and open forever. If anything is ever charged, it will be for convenience — managed keys, hosting — never for features you can run locally.
