"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { HostDialog } from "@/components/host-dialog";
import type { CloseOutcome } from "@/components/interaction-layers";
import { Button } from "@/components/ui/button";
import { PromptText } from "./prompt-text";
import { SettingsSegmentedControl } from "./controls";

export type PromptSaveOutcome = "saved" | "save-failed" | "activation-failed";
export type PromptDeleteOutcome = "deleted" | "delete-failed" | "settings-busy";

export function PromptSegmentDialog({ name, source, override, mode, returnFocusFallback, onSave, onDelete, onClose }: {
	name: string;
	returnFocusFallback: HTMLElement;
	source: string;
	override: string | null;
	mode: "view" | "edit";
	onSave: (text: string, writeText: boolean) => Promise<PromptSaveOutcome>;
	onDelete: () => Promise<PromptDeleteOutcome>;
	onClose: () => void;
}) {
	const editing = mode === "edit";
	const [savedText, setSavedText] = useState(override);
	const [text, setText] = useState(editing ? override ?? source : source);
	const [preview, setPreview] = useState(!editing);
	const [busy, setBusy] = useState<"save" | "delete" | null>(null);
	const pending = useRef(false);
	const [activationFailed, setActivationFailed] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmDiscard, setConfirmDiscard] = useState(false);
	const keepEditing = useRef<HTMLButtonElement>(null);
	const returningToDraft = useRef(false);
	const closeButton = useRef<HTMLButtonElement>(null);
	const field = useRef<HTMLTextAreaElement>(null);
	const titleId = useId(), nameId = useId();
	const dirty = editing && text !== (savedText ?? source);
	const title = !editing ? "查看默认值" : savedText === null ? "添加覆盖" : "编辑覆盖";

	useLayoutEffect(() => {
		if (confirmDiscard) keepEditing.current?.focus();
		else if (returningToDraft.current) {
			returningToDraft.current = false;
			(preview ? closeButton.current : field.current)?.focus();
		}
	}, [confirmDiscard, preview]);

	function resumeEditing() {
		returningToDraft.current = true;
		setConfirmDiscard(false);
	}

	function requestClose(): CloseOutcome {
		if (pending.current) return "blocked";
		if (confirmDiscard) {
			resumeEditing();
			return "handled-without-close";
		}
		if (dirty) {
			setConfirmDiscard(true);
			return "handled-without-close";
		}
		onClose();
		return "closed";
	}

	async function save() {
		if (pending.current || (!dirty && !activationFailed)) return;
		pending.current = true;
		setBusy("save");
		setError(null);
		try {
			const result = await onSave(text, dirty);
			if (result === "saved") onClose();
			else if (result === "activation-failed") {
				setSavedText(text);
				setActivationFailed(true);
				setError("覆盖已保存，但未能启用。请在下方重试启用。");
			} else setError("无法保存覆盖，你的修改仍保留。");
		} finally {
			pending.current = false;
			setBusy(null);
		}
	}

	async function remove() {
		if (pending.current || savedText === null || dirty) return;
		pending.current = true;
		setBusy("delete");
		setError(null);
		try {
			const result = await onDelete();
			if (result === "deleted") onClose();
			else if (result === "settings-busy") setError("Settings is still saving. Try deleting the override again after the save finishes.");
			else setError("无法删除覆盖。");
		} finally {
			pending.current = false;
			setBusy(null);
		}
	}

	return <HostDialog open onClose={requestClose} returnFocusFallback={returnFocusFallback} aria-labelledby={titleId} aria-describedby={nameId}
		backdropProps={{ className: "fixed inset-0 flex items-center justify-center bg-background/80" }}
		frame={<div aria-busy={busy !== null} data-testid="prompt-segment-dialog" className="settings-dialog-pop mx-4 flex h-[720px] max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-border bg-card font-ui shadow-xl" />}>
		<header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
			<div className="min-w-0">
				<h2 id={titleId} className="text-sm font-semibold">{title}</h2>
				<p id={nameId} className="mt-0.5 font-prose text-(length:--lh-prose-size) text-muted-foreground">{name}</p>
			</div>
			<SettingsSegmentedControl label="提示词显示" disabled={confirmDiscard}
				options={[{ value: "markdown", label: "Markdown" }, { value: "preview", label: "预览" }]}
				value={preview ? "preview" : "markdown"} onChange={next => setPreview(next === "preview")} />
		</header>
		<div className="flex min-h-0 flex-1 flex-col px-4 pt-4" inert={confirmDiscard}>
			<PromptText text={text} preview={preview} fieldRef={field} onChange={editing ? setText : undefined} busy={busy !== null} />
		</div>
		<footer className="flex shrink-0 flex-col gap-2 px-4 py-3">
			{error && <p role="alert" className="text-xs text-error">{error}</p>}
			{confirmDiscard ? <div className="flex flex-wrap items-center justify-between gap-2">
				<p role="status" className="text-xs">放弃未保存的更改？</p>
				<div className="ml-auto flex gap-2">
					<Button ref={keepEditing} type="button" variant="outline" size="sm" onClick={resumeEditing}>继续编辑</Button>
					<Button type="button" variant="destructive" size="sm" onClick={onClose}>放弃更改</Button>
				</div>
			</div> : <div className="flex flex-wrap items-center justify-between gap-2">
				{editing && savedText !== null && <button type="button" className="rounded-sm border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40" disabled={busy !== null || dirty} onClick={() => void remove()}>{busy === "delete" ? "删除中…" : "删除覆盖"}</button>}
				<div className="ml-auto flex gap-2">
					<Button ref={closeButton} type="button" variant="ghost" size="sm" disabled={busy !== null} onClick={requestClose}>关闭</Button>
					{editing && <Button type="button" size="sm" disabled={busy !== null || (!dirty && !activationFailed)} onClick={() => void save()}>
						{busy === "save" ? "保存中…" : activationFailed && !dirty ? "重试启用" : "保存并启用"}
					</Button>}
				</div>
			</div>}
		</footer>
	</HostDialog>;
}
