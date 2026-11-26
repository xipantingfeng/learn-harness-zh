"use client";

import { t } from "@/lib/i18n";

// Example starter chips shown under the home composer. Clicking one fills the
// input (does not auto-send) so the learner can edit before starting.
// Kept to ONE row on every width: short labels + horizontal scroll fallback
// (scrollbar hidden) rather than wrapping onto a second line.
const TEACH_KEYS = ["home.teach.example.1", "home.teach.example.2", "home.teach.example.3", "home.teach.example.4"];
const PRACTICE_KEYS = ["home.practice.example.1", "home.practice.example.2", "home.practice.example.3", "home.practice.example.4"];

export function ExampleChips({ mode, onPick }: { mode: "teach" | "practice"; onPick: (text: string) => void }) {
	const keys = mode === "practice" ? PRACTICE_KEYS : TEACH_KEYS;
	return (
		<div
			className="mt-3 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			data-testid="example-chips"
		>
			{keys.map((key) => (
				<button
					key={key}
					type="button"
					title={t(key)}
					onClick={() => onPick(t(key))}
					className="shrink-0 whitespace-nowrap rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
				>
					{t(key)}
				</button>
			))}
		</div>
	);
}
