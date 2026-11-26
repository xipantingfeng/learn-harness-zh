"use client";

import { RefreshCw, Settings } from "lucide-react";
import { usePlugins } from "@/components/plugins";
import type { FrontendPlugin } from "@/components/plugin-manager";
import { Button } from "@/components/ui/button";
import { SettingsRow, SettingsSection, Toggle } from "./controls";

export const PLUGIN_TRUST_WARNING = "只启用你信任的插件。插件以受信任的本地代码运行，具有广泛的文件和网络访问权限，且不在沙箱中运行。损坏的插件可能需要重启知学。";

export function PluginsSection({ onOpenSettings, origin = "community" }: { onOpenSettings?: (pluginId: string) => void; origin?: "core" | "community" }) {
	const { manager, snapshot } = usePlugins();
	const core = origin === "core";
	const plugins = snapshot.plugins.filter(plugin => plugin.info.origin === origin);
	return <SettingsSection title={core ? "核心插件" : "社区插件"} testid={core ? "section-core-plugins" : "section-plugins"}>
		{!core && <>
		<p className="font-prose text-sm text-muted-foreground">{PLUGIN_TRUST_WARNING}</p>
		<details data-testid="plugin-install-help" className="text-xs text-muted-foreground">
			<summary className="w-fit cursor-pointer list-none text-muted-foreground underline underline-offset-2 hover:text-foreground [&::-webkit-details-marker]:hidden">如何安装插件</summary>
			<ol className="mt-2 list-decimal space-y-2 pl-5">
				<li>将插件克隆或复制到下方目录，并以插件 ID 作为文件夹名。</li>
				<li>对于源码项目，请按仓库说明安装依赖并运行 <code>npm run build</code>。预编译包已包含 <code>dist/manifest.json</code>，无需构建。</li>
				<li>刷新列表后启用插件。新插件默认处于禁用状态。</li>
				<li>修改已加载的代码后请重启知学。更新时请保留 <code>dist/</code> 旁边的 <code>data/</code> 目录。</li>
			</ol>
		</details>
		<div data-testid="plugin-authoring-help" className="space-y-2 border-t border-border/60 pt-3">
			<h3 className="text-xs uppercase tracking-widest">构建插件</h3>
			<p className="font-prose text-sm text-muted-foreground">为你的编程智能体下载创作技能。</p>
			<Button variant="outline" size="sm" asChild><a href="/plugin-authoring/learnharness-plugins.zip" download={`learnharness-plugins-${process.env.LH_VERSION ?? "authoring"}.zip`} data-testid="download-plugin-authoring">下载创作技能</a></Button>
		</div>
		<div data-testid="plugin-directory" className="border-t border-border/60 pt-3">
			<p className="text-xs text-muted-foreground">插件目录</p>
			<div className="mt-1 flex items-center gap-3">
				<code className="min-w-0 flex-1 break-all text-xs select-text">{snapshot.directory}</code>
				<Button variant="outline" size="icon-sm" aria-label="刷新插件" title="刷新插件" aria-busy={snapshot.refreshing}
					disabled={!manager || snapshot.refreshing || snapshot.plugins.some(plugin => plugin.busy)} onClick={() => void manager?.refresh()}>
					<RefreshCw aria-hidden="true" className={snapshot.refreshing ? "animate-spin" : undefined} />
				</Button>
			</div>
		</div>
		{snapshot.conflicts.map(conflict => <p role="alert" key={conflict.id} className="break-words text-xs text-destructive">{conflict.error}</p>)}
		</>}
		{snapshot.error && <p role="alert" className="text-xs text-destructive">{snapshot.error}</p>}
		{snapshot.loading ? <p role="status" className="text-xs text-muted-foreground">正在加载插件…</p>
			: plugins.length === 0 ? <p className="text-xs text-muted-foreground">{core ? "暂无可用的核心插件。" : "尚未安装社区插件。"}</p>
				: plugins.map(plugin => <PluginRow key={plugin.info.id} plugin={plugin}
					onSettings={() => onOpenSettings?.(plugin.info.id)} />)}
	</SettingsSection>;
}

function PluginRow({ plugin, onSettings }: { plugin: FrontendPlugin; onSettings: () => void }) {
	const { manager, snapshot } = usePlugins();
	const { info } = plugin;
	const name = info.manifest?.name ?? info.id;
	return <div className="border-t border-border/60 pt-3" data-testid={`plugin-${info.id}`}>
		<SettingsRow label={name} hint={[info.origin === "community" ? info.manifest?.version : undefined, plugin.busy ? "保存中…" : plugin.error ? "错误" : plugin.phase === "loading" ? "加载中…" : info.enabled ? "已启用" : "已禁用"].filter(Boolean).join(" · ")}>
			<div className="flex shrink-0 items-center gap-2">
				{info.enabled && <button type="button" aria-label={`设置：${name}`} title={`设置：${name}`}
					className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					onClick={onSettings}><Settings className="size-3.5" aria-hidden="true" /></button>}
				<Toggle label={`启用 ${name}`} checked={info.enabled} disabled={!manager || plugin.busy || snapshot.refreshing || (!info.manifest && !info.enabled)} onChange={enabled => void manager?.setEnabled(info.id, enabled)} />
			</div>
		</SettingsRow>
		{info.manifest?.description && <p className="mt-1 font-prose text-sm text-muted-foreground">{info.manifest.description}</p>}
		{plugin.error && <p role="alert" className="mt-2 break-words text-xs text-destructive">{plugin.error}</p>}
	</div>;
}
