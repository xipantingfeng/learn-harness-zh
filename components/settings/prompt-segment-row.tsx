"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Toggle } from "./controls";

const SEGMENT_LABELS: Record<string, string> = {
	Method: "方法", Planning: "规划", Teaching: "教学", Predictions: "预测",
	"Question principles": "提问原则", Jobs: "任务", Demos: "演示", Images: "图片",
	"Probe doctrine": "探查原则", Base: "基础", Doctrine: "准则", "System prompt": "系统提示",
	Voice: "语气", Accuracy: "准确性", "Mental model": "心智模型", "Question tools": "提问工具",
	Confidence: "置信度", "Prompting guidelines": "提示准则", Rubric: "评分标准",
	Formatting: "格式", "Learner files": "学习者文件", "Side conversations": "侧边对话",
	Nudge: "提示"
};
function zhHint(hint?: string): string {
	if (!hint) return "";
	return hint
		.replace(/Used by 教师, 探针 and 练习/g, "由教师、探针和练习使用")
		.replace(/Used by 教师 and 探针/g, "由教师和探针使用")
		.replace(/Used by Teacher, Prober and practice/g, "由教师、探针和练习使用")
		.replace(/Used by Teacher and Prober/g, "由教师和探针使用")
		.replace(/Used by Teacher/g, "由教师使用")
		.replace(/Used by Prober/g, "由探针使用");
}
export function promptSegmentName(path: string): string {
	const name = (path.split("/").at(-1) ?? "").replace(/\.[^.]+$/, "").replace(/^[\d-]+/, "").replace(/-+/g, " ");
	const title = name.charAt(0).toUpperCase() + name.slice(1);
	return SEGMENT_LABELS[title] ?? title;
}

export function PromptSegmentRow({ path, usageHint, hasOverride, enabled, busy, switching, error, onView, onEdit, onToggle }: {
	path: string;
	usageHint?: string;
	hasOverride: boolean;
	enabled: boolean;
	busy: boolean;
	switching: boolean;
	error?: string;
	onView: (row: HTMLDivElement) => void;
	onEdit: (row: HTMLDivElement) => void;
	onToggle: (enabled: boolean) => void;
}) {
	const name = promptSegmentName(path);
	const row = useRef<HTMLDivElement>(null);
	return <div ref={row} role="group" aria-label={name} tabIndex={-1} data-testid={`prompt-segment-${path}`} className="border-t border-border/50 py-2 font-ui focus-visible:outline-1 focus-visible:outline-ring">
		<div data-testid={`prompt-row-${path}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<div className="min-w-0 flex-1 basis-44">
				<p className="font-prose text-(length:--lh-prose-size) text-foreground">{name}</p>
				{usageHint && <p className="mt-0.5 text-xs text-muted-foreground">{zhHint(usageHint)}</p>}
			</div>
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<Button type="button" size="xs" variant="ghost" disabled={busy} onClick={() => { if (row.current) onView(row.current); }}>查看默认值</Button>
				<Button type="button" size="xs" variant="outline" className={cn("w-[17ch]", switching && !busy && "disabled:opacity-100")} disabled={busy || switching} onClick={() => { if (row.current) onEdit(row.current); }}>
					{hasOverride ? "编辑覆盖" : "+ 添加覆盖"}
				</Button>
				<div className="flex items-center gap-2 sm:ml-2">
					<span className="w-[20ch] text-xs text-muted-foreground">使用中： <span className="text-foreground">{enabled ? "你的版本" : "默认"}</span></span>
					<span className={cn("flex", !hasOverride && "opacity-40")}>
						<Toggle label={`使用你的覆盖值：${name}`} title="使用你的覆盖值而非默认值" checked={enabled} disabled={!hasOverride || busy || switching} onChange={onToggle} />
					</span>
				</div>
			</div>
		</div>
		{error && <p role="alert" className="mt-1 text-xs text-error">{error}</p>}
	</div>;
}
