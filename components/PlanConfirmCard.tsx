"use client";

import { t } from "@/lib/i18n";

// Minimal plan confirmation affordance rendered under a plan block.
// Additive only: does not pause the agent or change `plan_init` control flow;
// "确认" sends a confirmation message, "修改计划" prefills the composer.
export function PlanConfirmCard({ onConfirm, onRevise }: { onConfirm: () => void; onRevise: () => void }) {
	return (
		<div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2" data-testid="plan-confirm-card">
			<span className="text-xs text-muted-foreground">{t("plan.confirm.ask")}</span>
			<button
				type="button"
				onClick={onConfirm}
				className="rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground transition-colors hover:opacity-90"
			>
				{t("plan.confirm.yes")}
			</button>
			<button
				type="button"
				onClick={onRevise}
				className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:bg-accent"
			>
				{t("plan.confirm.revise")}
			</button>
		</div>
	);
}
