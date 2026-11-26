"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { NATIVE_SUBSCRIPTIONS, type NativeSubscriptionProviderId, type NativeSubscriptionStatus } from "@/src/core";
import { Button } from "@/components/ui/button";
import { notifySettingsSaved } from "@/components/settings-signal";
import { ConnectionDialog, ConnectionFooter, ConnectionRow } from "./connection-controls";
import { ChatGPTConnection } from "./chatgpt-connection";
import { Toggle } from "./controls";
import { useNativeSubscriptionBridge } from "./subscription-client";
import type { CloseOutcome } from "@/components/interaction-layers";

export const COPILOT_POLICY_NOTICE = "Pi 原生的 Copilot 登录可能会启用尚未配置策略的其他模型。被策略明确禁用的模型不会启用。组织限制仍然适用。";
export const SUBSCRIPTION_BACKGROUND_HINT = "允许知学的辅助智能体和自动后续任务使用此连接。";
export function subscriptionNotice(label: string, web = false): string { return `你的提示词、工具结果和相关会话上下文会发送给 ${label}，以执行你选择的工作。凭据保存在${web ? "运行知学的这台机器上" : "本机"}的所有者专用明文文件中。提供商条款、数据使用政策和套餐额度适用。此连接不会回退到 API 密钥。`; }
export function subscriptionDisconnectCopy(label: string, web = false): string { return `要断开 ${label} 与知学的连接吗？这会停止使用此连接的工作，并从${web ? "运行知学的这台机器上" : "本设备"}删除已保存的凭据。它不会取消你的订阅或撤销提供商处的访问权限。已保存的模型选择将保持不可用，直到你重新连接或修改它们。`; }
export function emptySubscriptionStatus(providerId: NativeSubscriptionProviderId): NativeSubscriptionStatus { return { providerId, available: false, connected: false, pending: false, allowBackgroundUse: true, connectionId: null, epoch: 0, authorityRevision: 0, revision: 0 }; }
const Context = createContext({ statuses: [] as NativeSubscriptionStatus[], busy: false, open: (_providerId: NativeSubscriptionProviderId) => {} });
const CONTROL_ERROR = "无法更改连接，请重试。";

export function NativeSubscriptionUIProvider({ children }: { children: React.ReactNode }) {
	const bridge = useNativeSubscriptionBridge();
	const web = typeof window !== "undefined" && bridge !== window.lh?.subscriptions;
	const [statuses, setStatuses] = useState<NativeSubscriptionStatus[]>([]);
	const [dialog, setDialog] = useState<NativeSubscriptionProviderId | null>(null);
	const [view, setView] = useState<"notice" | "connection" | "manage">("notice");
	const [confirm, setConfirm] = useState(false), [background, setBackground] = useState(true), [backgroundDirty, setBackgroundDirty] = useState(false), [promptValue, setPromptValue] = useState("");
	const [operation, setOperation] = useState<"login" | "control" | null>(null), [error, setError] = useState<string | null>(null);
	const mounted = useRef(false), sequence = useRef(0), generation = useRef(0), statusesRef = useRef(statuses);
	const descriptor = NATIVE_SUBSCRIPTIONS.find((p) => p.providerId === dialog);
	const status = statuses.find((s) => s.providerId === dialog) ?? (dialog ? emptySubscriptionStatus(dialog) : undefined);
	const interaction = status?.interaction, prompt = interaction?.prompt;
	const management = view === "manage";
	const busy = operation === "control" || status?.committing === true;
	async function refresh() {
		const request = ++sequence.current;
		try {
			const values = await bridge?.status();
			if (!mounted.current || request !== sequence.current || !Array.isArray(values)) return;
			const accepted = NATIVE_SUBSCRIPTIONS.map(({ providerId }) => {
				const next = values.find((s) => s.providerId === providerId), old = statusesRef.current.find((s) => s.providerId === providerId);
				return next && (!old || next.revision >= old.revision) ? next : old ?? emptySubscriptionStatus(providerId);
			});
			statusesRef.current = accepted; setStatuses(accepted);
		} catch { if (mounted.current && request === sequence.current) setError("The desktop connection is unavailable. Retry when the app is ready."); }
	}
	useEffect(() => {
		mounted.current = true; void refresh();
		const off = bridge?.onChange(() => { void refresh(); notifySettingsSaved("keys"); });
		return () => { mounted.current = false; generation.current++; off?.(); };
		// The root-lifetime subscriber reads current state through refs.
	}, [bridge]);
	useEffect(() => { setPromptValue(""); }, [prompt?.id]);
	function open(providerId: NativeSubscriptionProviderId) {
		if (operation || statusesRef.current.some((s) => s.pending)) return;
		generation.current++; setError(null); setConfirm(false); setBackgroundDirty(false);
		const current = statusesRef.current.find((s) => s.providerId === providerId);
		setBackground(current?.allowBackgroundUse ?? true); setView(current?.connectionId ? "manage" : "notice"); setDialog(providerId);
	}
	async function control(action: () => Promise<void>, close = false) {
		if (busy) return;
		const owner = ++generation.current; setOperation("control"); setError(null);
		try { await action(); await refresh(); if (mounted.current && owner === generation.current && close) setDialog(null); }
		catch { if (mounted.current && owner === generation.current) setError(CONTROL_ERROR); }
		finally { if (mounted.current && owner === generation.current) setOperation(null); }
	}
	function close(): CloseOutcome {
		if (!dialog || busy) return "blocked";
		if (confirm) { setConfirm(false); setError(null); return "handled-without-close"; }
		if ((status?.pending || operation === "login") && bridge) { void control(() => bridge.cancel(dialog), true); return "pending"; }
		generation.current++; setDialog(null); setError(null);
		return "closed";
	}
	function beginSignIn() {
		if (operation || busy || !status) return;
		generation.current++; setError(null); setConfirm(false); setBackground(status.allowBackgroundUse); setBackgroundDirty(false); setView("notice");
	}
	async function login() {
		if (!dialog || !bridge || operation || !status?.available) return;
		const owner = ++generation.current; setOperation("login"); setError(null);
		try { await bridge.login(dialog, backgroundDirty ? background : undefined); await refresh(); if (mounted.current && generation.current === owner) setDialog(null); }
		catch { if (mounted.current && generation.current === owner) setError("Sign-in did not complete. Try connecting again."); }
		finally { if (mounted.current && generation.current === owner) setOperation(null); }
	}
	return <Context.Provider value={{ statuses, busy: !!operation, open }}>
		{children}
		{dialog && descriptor && status && <ConnectionDialog key={`${dialog}:${view}:${confirm}`} label={`${descriptor.label} connection`} testid="subscription-connection-dialog" backdropTestid="subscription-dialog-backdrop" busy={busy} onClose={close}>
			<h2 className="text-sm font-semibold text-foreground">{descriptor.label}</h2>
			{confirm ? <>
				<p className="mt-3 text-sm font-semibold text-error">Disconnect {descriptor.label}?</p>
				<p className="mt-3 text-xs leading-relaxed text-muted-foreground">{subscriptionDisconnectCopy(descriptor.label, web)}</p>
			</> : view === "notice" ? <>
				<p className="mt-3 text-xs leading-relaxed text-muted-foreground" data-testid="subscription-privacy-notice">{subscriptionNotice(descriptor.label, web)}</p>
				{dialog === "github-copilot" && <p className="mt-3 text-xs leading-relaxed text-muted-foreground" data-testid="copilot-policy-notice">{COPILOT_POLICY_NOTICE}</p>}
			</> : <>
				<div className="mt-4 flex items-center gap-3 text-xs text-foreground">
					<Toggle label="允许后台任务" checked={management ? status.allowBackgroundUse : background} disabled={busy || !!operation || status.pending || !status.available} onChange={(enabled) => { setBackground(enabled); if (management && bridge) void control(() => bridge.consent(dialog, enabled)); else setBackgroundDirty(true); }} />
					<span>允许后台任务<span className="mt-1 block leading-relaxed text-muted-foreground">{SUBSCRIPTION_BACKGROUND_HINT}</span></span>
				</div>
				{!status.available && <p className="mt-3 text-xs text-muted-foreground">订阅登录需要桌面应用的私有服务器连接。API 密钥连接仍可在此使用。</p>}
				{view === "connection" && interaction && <div className="mt-3 space-y-3 text-xs" data-testid="subscription-login-interaction">
					{interaction.progress && <p role="status" className="text-muted-foreground">{interaction.progress}</p>}
					{interaction.userCode && <p>设备代码： <code className="select-text font-mono">{interaction.userCode}</code></p>}
					{interaction.browser && <Button variant="outline" size="sm" disabled={busy} onClick={() => bridge && void bridge.open(dialog, interaction.attemptId, interaction.browser!.id).catch(() => setError("无法打开浏览器，请重试。"))}>打开浏览器</Button>}
					{prompt && <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (bridge) void bridge.respond(dialog, interaction.attemptId, prompt.id, promptValue).catch(() => setError(CONTROL_ERROR)); }}>
						<label className="block" htmlFor="subscription-auth-prompt">{prompt.message}</label>
						{prompt.type === "select" ? <select id="subscription-auth-prompt" value={promptValue} onChange={(event) => setPromptValue(event.target.value)} className="w-full rounded-sm border border-border bg-background px-2 py-1.5"><option value="" disabled>请选择…</option>{prompt.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select> : <input id="subscription-auth-prompt" type={prompt.type === "secret" ? "password" : "text"} autoComplete="off" value={promptValue} placeholder={prompt.placeholder} onChange={(event) => setPromptValue(event.target.value)} className="w-full rounded-sm border border-border bg-background px-2 py-1.5" />}
						<Button type="submit" variant="outline" size="sm" disabled={busy || (prompt.type === "select" && !promptValue)}>继续</Button>
					</form>}
				</div>}
			</>}
			{(error || status.error) && <p role="alert" className="mt-3 text-xs text-error">{error || status.error}</p>}
			<ConnectionFooter testid="subscription-connection-footer" leading={!confirm && management && status.connectionId && !status.pending && <Button variant="ghost" size="sm" className="cursor-pointer text-error hover:bg-error/10 hover:text-error" disabled={busy || !!operation} onClick={() => setConfirm(true)}>断开连接</Button>}>
				{!confirm && management && status.connectionId && status.available && !status.connected && !!status.error && !status.pending && <>
					{status.error && <Button variant="outline" size="sm" disabled={busy || !!operation} onClick={() => bridge && void control(() => bridge.retry(dialog))}>重试</Button>}
					<Button variant="outline" size="sm" disabled={!status.available || busy || !!operation} onClick={beginSignIn}>重新登录</Button>
				</>}
				<Button variant={!confirm && management ? "outline" : "ghost"} size="sm" disabled={busy} onClick={close}>{confirm || !management ? "取消" : "关闭"}</Button>
				{confirm ? <Button variant="destructive" size="sm" disabled={busy} onClick={() => bridge && void control(() => bridge.disconnect(dialog), true)}>断开连接</Button> : view === "notice" ? <Button variant="outline" size="sm" disabled={!status.available || !!operation} onClick={() => setView("connection")}>继续</Button> : view === "connection" && <Button variant="outline" size="sm" disabled={!status.available || !!operation || status.pending} onClick={() => void login()}>连接</Button>}
			</ConnectionFooter>
		</ConnectionDialog>}
	</Context.Provider>;
}

export function NativeSubscriptionConnection({ providerId, labelClassName }: { providerId: NativeSubscriptionProviderId; labelClassName?: string }) {
	const ui = useContext(Context), descriptor = NATIVE_SUBSCRIPTIONS.find((p) => p.providerId === providerId)!;
	const status = ui.statuses.find((s) => s.providerId === providerId) ?? emptySubscriptionStatus(providerId);
	return <div className="flex flex-col gap-2" data-testid={`${providerId}-connection`}>
		<ConnectionRow label={descriptor.label} labelClassName={labelClassName} action={status.connectionId ? "Manage…" : "连接"} disabled={ui.busy || !status.available || ui.statuses.some((s) => s.pending)} onAction={() => ui.open(providerId)} />
		{status.error && <p role="alert" className="text-xs text-error">{status.error}</p>}
	</div>;
}
export function SubscriptionConnections({ setup = false }: { setup?: boolean }) {
	// Providers uses ordinary settings-label typography. The setup surface
	// keeps its existing compact labels; dialogs and actions are untouched.
	const labelClassName = setup ? undefined : "font-prose text-(length:--lh-prose-size) text-foreground";
	return <div className="space-y-3" data-testid="subscription-connections"><ChatGPTConnection setup={setup} labelClassName={labelClassName} />{NATIVE_SUBSCRIPTIONS.map((p) => <NativeSubscriptionConnection key={p.providerId} providerId={p.providerId} labelClassName={labelClassName} />)}</div>;
}
export function NativeSubscriptionBackgroundAccess({ provider }: { provider: string | undefined }) {
	const ui = useContext(Context), descriptor = NATIVE_SUBSCRIPTIONS.find((p) => p.logicalId === provider);
	const status = ui.statuses.find((s) => s.providerId === descriptor?.providerId);
	if (!descriptor || !status?.connected || status.allowBackgroundUse) return null;
	return <Button type="button" size="xs" variant="ghost" disabled={ui.busy} onClick={() => ui.open(descriptor.providerId)}>启用后台任务</Button>;
}
