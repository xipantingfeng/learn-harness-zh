"use client";

import { t } from "@/lib/i18n";

// Quick actions appended to the composer; each fills the draft (not auto-send)
// with a natural Chinese instruction the learner can tweak before sending.
const QUICK_ACTIONS = [
	{ labelKey: "chat.quick.againSimpler", instructionKey: "chat.quick.againSimpler.instruction" },
	{ labelKey: "chat.quick.againDetailed", instructionKey: "chat.quick.againDetailed.instruction" },
	{ labelKey: "chat.quick.otherExample", instructionKey: "chat.quick.otherExample.instruction" },
	{ labelKey: "chat.quick.notUnderstood", instructionKey: "chat.quick.notUnderstood.instruction" },
	{ labelKey: "chat.quick.summary", instructionKey: "chat.quick.summary.instruction" },
	{ labelKey: "chat.quick.quiz", instructionKey: "chat.quick.quiz.instruction" }
];

export function QuickActions({ onPick }: { onPick: (instruction: string) => void }) {
	return (
		<div className="mx-auto flex max-w-3xl flex-wrap gap-1.5 px-3 pb-1" data-testid="quick-actions">
			{QUICK_ACTIONS.map((a) => (
				<button
					key={a.labelKey}
					type="button"
					onClick={() => onPick(t(a.instructionKey))}
					className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
				>
					{t(a.labelKey)}
				</button>
			))}
		</div>
	);
}
