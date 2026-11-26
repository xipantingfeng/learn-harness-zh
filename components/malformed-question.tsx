"use client";

import { Button } from "@/components/ui/button";

/** Recovery belongs to the transcript, never the answer dock. The caller
 * only offers it for the current saved malformed batch, not failed/aborted
 * generations or historical attempts. */
export function MalformedQuestion({ onRetry, disabled, reason }: {
	onRetry?: () => void;
	disabled?: boolean;
	reason?: string;
}) {
	return (
		<div data-testid="malformed-question" className="my-2 rounded-xl border border-dashed bg-card/60 p-3 text-sm text-muted-foreground">
			<p>这道题暂时无法显示。{onRetry ? " 可重试，或直接发消息继续。" : ""}</p>
			{onRetry && <Button type="button" variant="outline" size="xs" className="mt-2" disabled={disabled}
				title={reason ?? "向模型请求替换这道题。"} data-testid="retry-malformed-question" onClick={onRetry}>
				重试问题
			</Button>}
			{reason && <p className="mt-1 text-xs">{reason}</p>}
		</div>
	);
}
