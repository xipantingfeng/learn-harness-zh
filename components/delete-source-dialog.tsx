"use client";

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { HostDialog } from "./host-dialog";
import type { SourceEntry, SourceFolder } from "@/src/core";

export function DeleteSourceBody({ sources, folders, deleteSessions, onDeleteSessions, busy, failure, onClose, onRun, renderFrame }: {
	sources: SourceEntry[]; folders: SourceFolder[]; deleteSessions: boolean; onDeleteSessions: (checked: boolean) => void;
	busy: boolean; failure: string; onClose: () => void; onRun: () => void;
	renderFrame?: (frame: ReactElement<{ children: ReactNode }>) => ReactNode;
}) {
	const chats = sources.filter((s) => s.kind === "chat");
	const names = [...sources.map((s) => s.label ?? s.id), ...folders.map((f) => f.name)];
	const frame = <div role="dialog" aria-modal="true" aria-label="删除来源" data-testid="delete-source-dialog"
		onClick={(e) => e.stopPropagation()} className="w-[32rem] max-w-[calc(100vw-2rem)] rounded-xl border bg-card p-5 shadow-xl">
		<h2 className="text-sm font-semibold text-destructive">删除选中的来源和文件夹？</h2>
		<p className="mt-1.5 font-mono text-sm" data-testid="source-deletion-names">{names.slice(0, 8).join(", ")}{names.length > 8 ? `，另有 ${names.length - 8} 个` : ""}</p>
		{sources.length > 0 && <p className="mt-2 text-sm text-muted-foreground" data-testid="source-deletion-contributions">
			这会移除这些来源对命题和推理链的贡献。有其他来源支持的知识会保留；仅由这些来源支持的知识将被移除。
		</p>}
		<p className="mt-2 text-xs text-muted-foreground">已导入的来源记录会被删除，但磁盘上的原始文件不会改动。选中的文件夹仅在为空时删除；仍被保留会话需要的文件夹会留下。</p>
		{chats.length > 0 && <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 px-4 py-3">
			<input type="checkbox" data-testid="delete-source-sessions" checked={deleteSessions} disabled={busy}
				onChange={(e) => onDeleteSessions(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary" />
			<span className="min-w-0"><span className="block text-sm">同时删除选中的 {chats.length} 个会话</span>
				<span className="mt-1 block text-xs text-muted-foreground">不勾选时，会话会留在原文件夹中，之后仍可重新提取。无论是否勾选，它们对知识图谱的贡献和提取覆盖记录都会被清除。勾选还会永久删除这些会话的消息和后台任务。</span>
			</span>
		</label>}
		{failure && <p role="alert" data-testid="source-delete-failure" className="mt-3 text-xs text-foreground">{failure}</p>}
		<div className="mt-4 flex justify-end gap-2">
			<button type="button" data-testid="source-delete-cancel" disabled={busy} onClick={onClose} className="rounded-sm px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">取消</button>
			<button type="button" data-testid="source-delete-confirm" disabled={busy} onClick={onRun} className="rounded-sm border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40">{busy ? "正在删除…" : failure ? "重试" : "删除"}</button>
		</div>
	</div>;
	return renderFrame ? renderFrame(frame) : frame;
}

export function DeleteSourceDialog({ open, sources, folders, onDelete, onClose }: {
	open: boolean; sources: SourceEntry[]; folders: SourceFolder[]; onDelete: (deleteSessions: boolean) => Promise<void>; onClose: () => void;
}) {
	const [deleteSessions, setDeleteSessions] = useState(false), [busy, setBusy] = useState(false), [failure, setFailure] = useState("");
	useEffect(() => { if (!open) { setDeleteSessions(false); setBusy(false); setFailure(""); } }, [open]);

	if (!open) return null;
	const run = async () => {
		if (busy) return;
		setBusy(true); setFailure("");
		try { await onDelete(deleteSessions); onClose(); }
		catch (error) { setFailure(error instanceof Error ? error.message : String(error)); }
		finally { setBusy(false); }
	};
	return <DeleteSourceBody sources={sources} folders={folders} deleteSessions={deleteSessions} onDeleteSessions={setDeleteSessions}
		busy={busy} failure={failure} onClose={onClose} onRun={() => { void run(); }}
		renderFrame={(frame) => <HostDialog open frame={frame} onClose={() => {
			if (busy) return "blocked";
			onClose(); return "closed";
		}} backdropProps={{ className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80" }}>{frame.props.children}</HostDialog>} />;
}
