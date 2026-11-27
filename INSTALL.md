# 安装指南 / Installation / インストール

所有安装包都在 [GitHub Releases](https://github.com/xipantingfeng/learn-harness-zh/releases/latest)，固定版本为 `v1.0.0`。

## 推荐：安装包

| 平台 | 文件 | 安装方式 |
| --- | --- | --- |
| Windows x64 | [zhixue-1.0.0-x64-setup.exe](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-x64-setup.exe) | 双击运行安装向导；默认安装到 `%LOCALAPPDATA%\Programs\知学`。未签名，Windows 可能提示“未知发布者”。 |
| Linux x64 | [zhixue-1.0.0-amd64.deb](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-amd64.deb) | `sudo apt install ./zhixue-1.0.0-amd64.deb` |
| Linux x64（免安装） | [zhixue-1.0.0-x86_64.AppImage](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-x86_64.AppImage) | `chmod +x zhixue-1.0.0-x86_64.AppImage && ./zhixue-1.0.0-x86_64.AppImage` |
| macOS Apple Silicon | [zhixue-1.0.0-arm64.dmg](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-arm64.dmg) | 打开 DMG，把 `知学.app` 拖进 Applications。未签名，若被 Gatekeeper 拦截请右键“打开”。 |
| macOS Intel | [zhixue-1.0.0-x64.dmg](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-x64.dmg) | 同上。 |

## 便携版（无需安装）

| 平台 | 文件 | 使用方式 |
| --- | --- | --- |
| Windows x64 | [zhixue-1.0.0-Windows-x64.zip](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-Windows-x64.zip) | 解压后双击 `知学.exe`。 |
| Linux x64 | [zhixue-1.0.0-Linux-x64.tar.gz](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-Linux-x64.tar.gz) | `tar -xzf ... && cd zhixue-1.0.0-Linux-x64 && bash run.sh` |
| macOS arm64 / x64 | [arm64.zip](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-macOS-arm64.zip) · [x64.zip](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/zhixue-1.0.0-macOS-x64.zip) | 解压打开 `知学.app`；必要时运行 `安装.command`。 |

## 校验

下载 [SHA256SUMS.txt](https://github.com/xipantingfeng/learn-harness-zh/releases/download/v1.0.0/SHA256SUMS.txt)，然后：

```bash
sha256sum -c SHA256SUMS.txt       # Linux
shasum -a 256 -c SHA256SUMS.txt   # macOS
```

## 说明

- 启动后会自动检查更新；发现新版本会先询问是否下载，下载完成后再次询问是否安装。程序不会静默替换。
- 学习数据保存在本机：`%APPDATA%\知学`（Windows）或 `~/.config/zhixue`（Linux/macOS）。
- 源码：`git clone https://github.com/xipantingfeng/learn-harness-zh.git`，构建见 [docs/zh-CN/build-windows.md](docs/zh-CN/build-windows.md)。
