"use client";

import { t } from "@/lib/i18n";

// Chinese global error page (Next convention app/global-error.tsx).
// Shows a human-readable message, one-click reload/retry, and where logs live.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html lang="zh-CN">
			<body>
				<div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "12vh auto", padding: 32, textAlign: "center" }}>
					<h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>{t("error.title")}</h1>
					<p style={{ color: "#666", lineHeight: 1.6, marginBottom: 8 }}>{t("error.body")}</p>
					{error?.digest && <p style={{ color: "#999", fontSize: 12, marginBottom: 16 }}>{t("error.digest")}{error.digest}</p>}
					<div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
						<button onClick={() => reset()} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#111", color: "#fff", cursor: "pointer" }}>{t("error.reload")}</button>
						<button onClick={() => window.location.reload()} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>{t("error.refresh")}</button>
					</div>
					<p style={{ color: "#999", fontSize: 12, lineHeight: 1.6 }}>{t("error.logPath")}</p>
				</div>
			</body>
		</html>
	);
}
