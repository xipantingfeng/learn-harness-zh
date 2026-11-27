# Changelog

## [1.0.0]

Initial public release of 知学.

- Adaptive teaching with a visible plan and a plan confirmation step.
- Practice sessions with adaptive problems and hints.
- Persistent local knowledge graph with propositions and reasoning chains.
- Chinese interface throughout, including settings, plugins, menus and status.
- One-line example prompts on the home screen; clicking one fills the composer and it can be sent directly.
- Reply-level quick actions that prefill input without sending automatically.
- Desktop packages for Windows, Linux and macOS.
- Local data directory, disabled in-app updates, Chinese error page.
- Plugin system, file attachments, dictation, visual explanations and interactive demos.
- Model providers, custom OpenAI-compatible endpoints, Claude Code CLI and subscription connections.

## Downloads

| Platform | Asset | Install |
| --- | --- | --- |
| Windows x64 | `zhixue-1.0.0-x64-setup.exe` | Run the NSIS installer. |
| Windows x64 (portable) | `zhixue-1.0.0-Windows-x64.zip` | Unpack and run `知学.exe`. |
| Linux x64 | `zhixue-1.0.0-amd64.deb` | `sudo apt install ./...deb`. |
| Linux x64 (portable) | `zhixue-1.0.0-x86_64.AppImage` / `zhixue-1.0.0-Linux-x64.tar.gz` | chmod +x the AppImage, or unpack the tar.gz and run `bash run.sh`. |
| macOS Apple Silicon | `zhixue-1.0.0-arm64.dmg` | Open the DMG and drag `知学.app` to Applications. |
| macOS Intel | `zhixue-1.0.0-x64.dmg` | Same as above. |
| macOS (portable) | `zhixue-1.0.0-macOS-arm64.zip` / `zhixue-1.0.0-macOS-x64.zip` | Unpack and open `知学.app`. |
| Checksums | `SHA256SUMS.txt` | `sha256sum -c SHA256SUMS.txt` |

Builds are produced by `.github/workflows/release.yml` on Windows, macOS and Linux runners.
Full guide: [INSTALL.md](https://github.com/xipantingfeng/learn-harness-zh/blob/main/INSTALL.md).

Source: https://github.com/xipantingfeng/learn-harness-zh
License: AGPL-3.0-only. See LICENSE and NOTICE.
