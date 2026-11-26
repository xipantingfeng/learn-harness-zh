# 安装指南 / Installation / インストール

所有安装包都在 [GitHub Releases](https://github.com/xipantingfeng/learn-harness-zh/releases/latest)。下方链接固定指向 `v1.0.0`。

| 平台 | 文件 | 安装步骤 |
| --- | --- | --- |
| Windows x64 | [zhixue-1.0.0-Windows-x64.zip](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-Windows-x64.zip) | 解压 → 双击 `知学.exe`。无需安装，也无需 Node.js。 |
| Linux x64 | [zhixue-1.0.0-Linux-x64.tar.gz](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-Linux-x64.tar.gz) | `tar -xzf zhixue-1.0.0-Linux-x64.tar.gz` → `cd zhixue-1.0.0-Linux-x64` → `bash run.sh`（或 `chmod +x zhixue && ./zhixue`）。 |
| macOS Apple Silicon | [zhixue-1.0.0-macOS-arm64.zip](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-macOS-arm64.zip) | 解压 → 打开 `知学.app`。若被 Gatekeeper 拦截，右键选“打开”；也可先运行随附的 `安装.command`。 |
| macOS Intel | [zhixue-1.0.0-macOS-x64.zip](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-macOS-x64.zip) | 同上。 |
| 校验 | [SHA256SUMS.txt](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/SHA256SUMS.txt) | 下载后运行 `sha256sum -c SHA256SUMS.txt`（macOS 可用 `shasum -a 256 -c`）。 |

## Notes

- 应用内更新已关闭；升级请手动下载新版本。
- 学习数据保存在本机：`%APPDATA%\知学`（Windows）或 `~/.config/zhixue`（Linux/macOS）。
- Windows 包未签名，首次运行可能出现 SmartScreen 提示；macOS 包未公证，需手动允许。
- 源码：`git clone https://github.com/xipantingfeng/learn-harness-zh.git`，构建见 [docs/zh-CN/build-windows.md](docs/zh-CN/build-windows.md)。
