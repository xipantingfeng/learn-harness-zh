"use client";

import type { CacheRetention } from "@earendil-works/pi-ai";

const OPTIONS = [
	{ value: undefined, compact: "default", label: "Pi 默认", description: "不设置该选项，使用 Pi 的默认行为和环境覆盖。" },
	{ value: "none", compact: "not requested", label: "Don’t request caching", description: "Pass Pi’s native none preference. Providers may still cache automatically." },
	{ value: "short", compact: "short", label: "短保留", description: "使用 Pi 原生的短保留偏好，时长取决于提供商和模型。" },
	{ value: "long", compact: "long", label: "长保留", description: "使用 Pi 原生的长保留偏好，缓存写入费用可能更高。" },
] as const;

export function cacheRetentionLabel(value: CacheRetention | undefined): string {
	return `Cache: ${OPTIONS.find((option) => option.value === value)!.compact}`;
}

export function CacheRetentionMenu({ value, onPick }: {
	value: CacheRetention | undefined;
	onPick: (value: CacheRetention | undefined) => void;
}) {
	return <>
		<div className="border-b border-border px-2 pb-2">
			<p className="text-card-foreground">缓存保留</p>
			<p className="mt-1 text-muted-foreground">Controls the cache-retention preference sent to Pi. Support and duration depend on the provider and model. This does not guarantee a cache hit.</p>
		</div>
		{OPTIONS.map((option) => <button
			key={option.value ?? "default"}
			type="button"
			data-testid={`cache-retention-option-${option.value ?? "default"}`}
			aria-pressed={value === option.value}
			onClick={() => onPick(option.value)}
			className={`rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted ${value === option.value ? "bg-muted/60" : ""}`}
		>
			<span className="flex justify-between gap-2 text-card-foreground"><span>{option.label}</span>{value === option.value && <span aria-hidden>✓</span>}</span>
			<span className="mt-1 block text-muted-foreground">{option.description}</span>
		</button>)}
	</>;
}
