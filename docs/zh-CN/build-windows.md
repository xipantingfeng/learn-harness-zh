# Windows 独立中文桌面构建（知学·学习助手）

Windows 包的构建约定：**复制 Electron 壳（`asar-src`）+ Next standalone 构建**，不直接修改编译产物。

> 不要替换编译产物做翻译（曾导致 React error #306）。所有改动在 `app/ components/ src/ lib/ messages/ asar-src/`。

## 前置

- Node.js 24 + npm（构建命令用 `node node_modules/next/dist/bin/next build`，系统 PATH 若无 node 请显式指定 Node 24 路径）。
- 干净检出后先 `npm install`、`npm run plugins:setup`（安装 `plugins/` 各插件源码依赖）。

## 标准流程（每次构建后固定执行）

在仓库根目录 `<repo>`：

```powershell
$env:PATH = "<Node24目录>;" + $env:PATH
Push-Location <repo>

# 1) 类型检查 + 构建（npm run build 会先构建 plugins；这里直接调 next build）
npx tsc --noEmit
node node_modules/next/dist/bin/next build          # exit 0

# 2) 补全 standalone：复制静态资源与 public
robocopy .next\static .next\standalone\.next\static /E
robocopy public .next\standalone\public /E

# 3) 修复 shiki 缺包：复制到 standalone/.next/node_modules/@shikijs
$s = ".next\standalone\node_modules\@streamdown\code\node_modules\@shikijs"
$t = ".next\standalone\.next\node_modules\@shikijs"
New-Item -ItemType Directory -Path $t -Force | Out-Null
foreach ($n in @('core','engine-oniguruma','engine-javascript','langs','themes','types')) {
  if ((Test-Path -LiteralPath "$s\$n") -and -not (Test-Path -LiteralPath "$t\$n")) {
    Copy-Item -LiteralPath "$s\$n" -Destination "$t\$n" -Recurse -Force
  }
}

# 4) 清理构建副产物：删除 .next\standalone\dist（否则每次同步会产生 3GB+ 嵌套重复）
if (Test-Path -LiteralPath ".next\standalone\dist") { Remove-Item -LiteralPath ".next\standalone\dist" -Recurse -Force }

# 5) 同步到 dist\resources\server\standalone
$dst = "dist\resources\server\standalone"
Remove-Item -LiteralPath $dst -Recurse -Force -ErrorAction SilentlyContinue
robocopy .next\standalone $dst /E

# 6) 同步到安装目录（示例：%LOCALAPPDATA%\Programs\知学）
robocopy dist "$env:LOCALAPPDATA\Programs\知学" /E

Pop-Location
```

## 重新打包 Electron 壳

```powershell
# 用 @electron/asar 的 createPackage(asar-src, app.asar) 生成 app.asar，覆盖 dist\resources\app.asar
node -e "require('@electron/asar').createPackage('asar-src','app.asar')"
```

## 注意

- `npm run build` 会先 `plugins:build-core` + `plugins:build-authoring`；若只想重打 Next，用 `next build` 并保留已生成的 `core-plugins/`。
- `dist/` 不入库；首次分发需保留 Electron 运行时（electron-builder 输出）。本分支独立包不依赖原版 LearnHarness。
- 自动更新已关闭；数据目录 `%APPDATA%\知学` 与原版隔离。
- 曾精简 Chromium locales（仅保留 zh-CN/en-US）、删除嵌套重复 dist 以减小体积（可选，非必须）。

详见上游 `docs/desktop-release.md`。
