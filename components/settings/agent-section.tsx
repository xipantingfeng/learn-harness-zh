"use client";
/**
 * The Agent section (settings-app wave): the THREE MODEL SLOTS, the tool
 * toggles + the search-engine preference, and the prompt override
 * switches — three GROUPS (owner, 2026-09-20: clear separation — Models /
 * Tools / System prompts).
 *
 * Model slots (model-slots wave, 2026-09-20, owner ruling: SLOTS ONLY —
 * the six per-role rows disappeared; per-role overrides remain in the
 * schema for a future advanced surface): Strong = Prober + Teacher, Cheap
 * = the five workhorse roles, Vision = Visual maker + PDF reader. Each
 * slot row carries the shared dropdown (fuzzy search, arrow-walk, Enter
 * pick — ModelMenuList/ThinkingMenuList from ./model-menu.tsx) over the
 * FEDERATED catalog (/api/models serves only keyed providers, fresh per
 * call — saving a key in Keys immediately widens this picker). The
 * vision slot filters to image-capable models (Model.input). The slots
 * live in the `models` settings section (PUT /api/settings/models — slot
 * pins are engine-level, not per-chat); the rest of the section writes
 * the `agent` section as before. Resolution per tier: slot override →
 * factory pin (GET /api/models' `slots` — resolved, cannot drift from
 * what runs). The Default row clears the slot override; a stored id stays
 * VISIBLE even when its provider's key lapsed out of the catalog — a
 * trigger showing "Default" over a live override would lie about the
 * record.
 *
 * Search engine (search wave, 2026-09-20, owner: no default — an engine
 * is live iff its key is present; with a key the engine AUTO-activates,
 * the explicit choice is only a preference between live engines): a row
 * in the Tools group, with the same shared-menu look and
 * the live reason line from /api/search. No engine key at all → the row
 * grays whole-row (a choice without a key would only BLOCK another
 * engine's auto-activation).
 *
 * Tools — the owner's final list (2026-09-19): research, demo, visual, pdf.
 * Absent key = enabled in the schema; the UI writes explicit booleans for
 * all four (simpler to reason about, sanitize-equivalent).
 *
 * Prompts: GET /api/settings/prompts segments — Teacher, Prober, Practice,
 * then Shared LAST. The server returns each agent's actual segments,
 * including its shared subset; sectionedSegments deduplicates shared
 * chunks and derives per-fragment usage from membership in those lists.
 * Each row can view the shipped text or edit its sole override. The
 * version switch requires an override file (route-enforced).
 * The segments view re-reads on the 'lh:settings-saved' signal for the
 * agent section — the view's enabled flags derive from the record's
 * switches, and the 2026-09-26 state-echo bug was exactly this reader
 * missing (the toggle painted its old state until a remount re-fetched).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CacheRetention } from "@earendil-works/pi-ai";
import { CacheRetentionMenu, cacheRetentionLabel } from "./cache-retention-menu.tsx";
import { MenuShell } from "@/components/menu-shell";
import { useInteractionLayers } from "@/components/interaction-layers";
import { useSettingsSaved } from "@/components/settings-signal";
import { defaultOrderLevel, populateLevel } from "@/components/thinking-default";
import { RefreshCw } from "lucide-react";
import { refreshRemoteModelCatalog, useModelCatalog } from "@/components/model-catalog";
import type { ModelCatalogRefreshOutcome } from "@/src/core";
import { Hint } from "@/components/ui/hint";
import { Button } from "@/components/ui/button";
import { PromptSegmentDialog, type PromptDeleteOutcome, type PromptSaveOutcome } from "./prompt-segment-dialog";
import { PromptSegmentRow, promptSegmentName } from "./prompt-segment-row";
import type React from "react";
import {
	COMPACTION_THRESHOLD_FLOOR,
	MODEL_SLOTS,
	SEARCH_ENGINES,
	resolveSettings,
	isFileAccessFolder,
	type AgentSettings,
	type CompactionSettings,
	type GraphSettings,
	type ModelSlotName,
	type ModelsSettings,
	type SearchEngineId,
} from "@/src/core";
import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import { prettyModel } from "@/components/usage-format";
import { cn } from "@/lib/utils";
import { SettingsGroup, SettingsRow, SettingsMenuTrigger, SettingsSegmentedControl, Toggle, CommitInput } from "./controls.tsx";
import { ModelMenuList, ThinkingMenuList } from "./model-menu";
import { ChatGPTBackgroundAccess } from "./chatgpt-connection";
import { NativeSubscriptionBackgroundAccess } from "./subscription-connections";

/** One slot's display identity — the tier's roster as the row hint rides
 *  with the resolved default (owner: the hint ALWAYS names the default). */
const SLOT_META: Record<ModelSlotName, { label: string; roster: string }> = {
	strong: { label: "强模型", roster: "会话使用的主要模型" },
	cheap: { label: "经济模型", roster: "负责研究、制作演示和评分的助手" },
	vision: { label: "视觉模型", roster: "负责绘图和阅读 PDF 的助手" },
};

/** The owner's final toggleable-tool list (confirm with the user before
 *  changing — the Teacher stream settled this 2026-09-19). */
export const TOGGLE_TOOLS = ["research", "demo", "visual", "pdf"] as const;
const TOOL_LABELS: Record<string, string> = { research: "研究", demo: "演示", visual: "可视化", pdf: "PDF" };
const PROMPT_LABELS: Record<string, string> = {
	Method: "方法", Planning: "规划", Teaching: "教学", Predictions: "预测",
	"Question principles": "提问原则", Jobs: "任务", Demos: "演示", Images: "图片",
	"Probe doctrine": "探查原则", Base: "基础", Doctrine: "准则", "System prompt": "系统提示",
	Voice: "语气", Accuracy: "准确性", "Mental model": "心智模型", "Question tools": "提问工具",
	Shared: "共享", Teacher: "教师", Prober: "探针", Practice: "练习"
};

const CATALOG_REFRESH_MESSAGES: Record<ModelCatalogRefreshOutcome | "pending" | "failed", string> = {
	pending: "正在刷新…",
	updated: "模型目录已更新。",
	unchanged: "未发现目录变化。",
	"no-providers": "已配置的提供商都不支持刷新目录。",
	failed: "刷新失败，当前目录仍然可用。",
};

function ModelCatalogRefreshRow() {
	const [state, setState] = useState<keyof typeof CATALOG_REFRESH_MESSAGES>();
	const pending = state === "pending";
	async function refresh() {
		setState("pending");
		try { setState(await refreshRemoteModelCatalog()); }
		catch { setState("failed"); }
	}
	return <SettingsRow label="模型目录" testid="model-catalog-refresh-row" hint={
		<span role="status" className={state === "failed" ? "text-destructive" : undefined}>
			{state ? CATALOG_REFRESH_MESSAGES[state] : "检查 Pi 新模型"}
		</span>
	}>
		<Button type="button" variant="outline" size="icon-sm" aria-label="刷新模型目录" title="刷新模型目录" aria-busy={pending}
			disabled={pending} onClick={() => void refresh()}>
			<RefreshCw aria-hidden="true" className={pending ? "animate-spin" : undefined} />
		</Button>
	</SettingsRow>;
}

const THINKING_LEVELS: readonly ThinkingLevel[] = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];

/** SegmentInfo as GET /api/settings/prompts returns it. */
interface SegmentInfo {
	path: string;
	sourceText: string;
	overrideText: string | null;
	enabled: boolean;
	shared: boolean;
}

type PromptView = Record<"teacher" | "prober" | "practice", SegmentInfo[]>;
type PromptRow = SegmentInfo & { usageHint?: string };

/** Compose: one tool toggled, the rest of the section carried verbatim.
 *  Pure — exported for tests. */
export function composeTool(agent: AgentSettings | undefined, id: string, on: boolean): AgentSettings {
	return { ...agent, tools: { ...agent?.tools, [id]: on } };
}

/** A file-access folder entry the server will accept: absolute (POSIX or
 *  Windows drive/UNC) or "~"-anchored. Pure — exported for tests. */
export function isFolderEntry(folder: string): boolean { return isFileAccessFolder(folder); }

/** The switch changes ONLY restriction, never discards saved folders. */
export function composeFileRestriction(agent: AgentSettings | undefined, restricted: boolean): AgentSettings {
	return { ...agent, fileAccess: { restricted, folders: agent?.fileAccess?.folders ?? [] } };
}

/** Compose: add one allowed folder (trimmed; duplicates and invalid entries
 *  are no-ops). Pure — exported for tests. */
export function composeAddFolder(agent: AgentSettings | undefined, folder: string): AgentSettings {
	const next = folder.trim();
	const folders = agent?.fileAccess?.folders ?? [];
	const restricted = agent?.fileAccess?.restricted ?? false;
	if (!isFolderEntry(next) || folders.includes(next)) return { ...agent, fileAccess: { restricted, folders } };
	return { ...agent, fileAccess: { restricted, folders: [...folders, next] } };
}

/** Removing the last folder NEVER changes the restriction switch. */
export function composeRemoveFolder(agent: AgentSettings | undefined, folder: string): AgentSettings {
	return { ...agent, fileAccess: { restricted: agent?.fileAccess?.restricted ?? false, folders: (agent?.fileAccess?.folders ?? []).filter((f) => f !== folder) } };
}

/** Parse the numeric draft and compose the WHOLE agent section. Empty
 *  removes the override; invalid input never writes, rounds, or clamps.
 *  Pure — exported for tests. */
export function composeWorkerRequestConcurrency(
	agent: AgentSettings | undefined,
	value: string,
): { ok: true; settings: AgentSettings } | { ok: false; error: string } {
	const next = { ...agent };
	const draft = value.trim();
	if (draft === "") {
		delete next.workerRequestConcurrency;
		return { ok: true, settings: next };
	}
	const invalid = { ok: false as const, error: "请输入一个可安全表示的正整数。" };
	const concurrency = Number(draft);
	if (!Number.isSafeInteger(concurrency) || concurrency <= 0) return invalid;
	// Preserve native decimal/exponent syntax, but check fractional digits
	// BEFORE accepting Number's result: e.g. 8.0000000000000001 rounds to 8.
	// Trailing coefficient zeroes cancel negative decimal places exactly;
	// this needs no arbitrary-precision arithmetic or unbounded powers.
	const decimal = draft.match(/^\+?(\d+(?:\.\d*)?|\.\d+)(?:e([+-]?\d+))?$/i);
	if (!decimal) return invalid;
	const mantissa = decimal[1]!;
	const fractionalPlaces = mantissa.split(".")[1]?.length ?? 0;
	const coefficient = mantissa.replace(".", "");
	const trailingZeroes = coefficient.length - coefficient.replace(/0+$/, "").length;
	if (Number(decimal[2] ?? 0) - fractionalPlaces + trailingZeroes < 0) return invalid;
	next.workerRequestConcurrency = concurrency;
	return { ok: true, settings: next };
}

/** The quizzing mechanics (owner 2026-09-27): a segmented control, not a
 *  toggle — exactly one mechanic is ever active. `explain: true` arms
 *  free-recall (explain in, quiz out); anything else is multiple choice.
 *  `quiz` itself is never written (mechanics-managed — see quizMechanics
 *  in agent/tools.ts). Pure — exported for tests. */
export function composeQuizMechanics(agent: AgentSettings | undefined, mechanics: "choice" | "free"): AgentSettings {
	return { ...agent, tools: { ...agent?.tools, explain: mechanics === "free" } };
}

/** Compose the prober graph-tools toggle (wave 7): its own key in the
 *  agent section — never in the tool-toggles map (owner ruling). Absent =
 *  ON (the toggle discipline); the write is explicit either way, so an
 *  explicit-off record stays visible as stored. Pure — exported for tests. */
export function composeGraphTools(agent: AgentSettings | undefined, on: boolean): AgentSettings {
	return { ...agent, graphTools: { enabled: on } };
}

/** Compose: one slot's model/thinking override. Empty model = absent
 *  override (Default — falls to the factory pin); empty thinking = the
 *  tier keeps its resolved thinking budget. Per-field independence, same
 *  as the schema's ModelSlot. Pure — exported for tests. */
export function composeSlotModel(
	models: ModelsSettings | undefined,
	slot: ModelSlotName,
	provider: string,
	id: string,
	thinking: string,
): ModelsSettings {
	const prev = models?.[slot];
	const next = { ...models };
	if (!provider && !id && !thinking) {
		delete next[slot];
		return next;
	}
	next[slot] = {
		...(prev?.cacheRetention !== undefined ? { cacheRetention: prev.cacheRetention } : {}),
		...(provider && id ? { model: { provider, id } } : prev?.model ? { model: prev.model } : {}),
		...(thinking ? { thinkingLevel: thinking as ThinkingLevel } : {}),
	};
	return next;
}

/** Retention is slot-only; selecting Pi default removes the field entirely. */
export function composeSlotCacheRetention(models: ModelsSettings | undefined, slot: ModelSlotName, value: CacheRetention | undefined): ModelsSettings {
	const next = { ...models?.[slot] };
	if (value === undefined) delete next.cacheRetention;
	else next.cacheRetention = value;
	return { ...models, [slot]: next };
}

/** Compose: the search-engine preference. null = the explicit pin is
 *  REMOVED (auto-activation takes over — the schema's resting state).
 *  Pure — exported for tests. */
export function composeSearchEngine(
	agent: AgentSettings | undefined,
	engine: SearchEngineId | null,
): AgentSettings {
	if (engine === null) {
		if (!agent?.search) return { ...agent };
		const { search: _drop, ...rest } = agent;
		return { ...rest } as AgentSettings;
	}
	return { ...agent, search: { engine } };
}

/** Prompt sections in display order; Shared is deduplicated and last. */
export interface PromptSection {
	id: keyof PromptView | "shared";
	label: string;
	segments: PromptRow[];
}

/** Keep each agent's own assembly order, then list shared chunks once.
 *  Usage is derived from the API's actual per-agent membership, never a
 *  second copy of the runtime's Practice shared-fragment allowlist.
 *  Pure — exported for tests. */
export function sectionedSegments(view: PromptView): PromptSection[] {
	const agents = [
		{ id: "teacher", label: "教师" },
		{ id: "prober", label: "探针" },
		{ id: "practice", label: "练习" },
	] as const;
	const shared = new Map<string, SegmentInfo>();
	for (const { id } of agents) {
		for (const segment of view[id]) {
			if (segment.shared && !shared.has(segment.path)) shared.set(segment.path, segment);
		}
	}
	return [
		...agents.map(({ id, label }) => ({ id, label, segments: view[id].filter((s) => !s.shared) })),
		{
			id: "shared",
			label: "共享",
			segments: [...shared.values()].map((segment) => {
				const users = agents.filter(({ id }) => view[id].some((s) => s.path === segment.path)).map(({ label }) => label);
				const usage = users.length > 1 ? `${users.slice(0, -1).join(", ")} and ${users.at(-1)}` : users[0];
				return { ...segment, usageHint: `Used by ${usage}` };
			}),
		},
	];
}

/** Compose: one prompt switch. on = explicit true; off = key REMOVED
 *  (absent = off is the schema's resting state; explicit false is the
 *  same thing but noisier). Pure — tests. */
export function composePromptSwitch(agent: AgentSettings | undefined, path: string, on: boolean): AgentSettings {
	const prompts = { ...agent?.prompts };
	if (on) prompts[path] = true;
	else delete prompts[path];
	return { ...agent, prompts };
}

/** The collapsed select look (owner: "the look of the collapsed menu is
 *  good") — now a button that opens the shared model-picker dropdown. */
function MenuTrigger({
	value,
	emptyLabel,
	ariaLabel,
	testid,
	open,
	onClick,
	widthClass,
	disabled,
	hint,
}: {
	value: string;
	hint?: string;
	/** What the trigger shows when there is no override ("Default"). */
	emptyLabel: string;
	ariaLabel: string;
	testid: string;
	open: boolean;
	onClick: () => void;
	/** Owner (2026-09-20): the thinking trigger is FIXED at the width the
	 *  Default state needs (values shifting it mid-edit shifted the row);
	 *  the model trigger takes the same width as a MINIMUM — its values
	 *  genuinely vary in length. */
	widthClass: string;
	/** The no-key search state grays the whole row; the trigger follows. */
	disabled?: boolean;
}) {
	const button = (
		<SettingsMenuTrigger
			value={value || emptyLabel}
			aria-label={ariaLabel}
			aria-expanded={open}
			data-testid={testid}
			onClick={() => {
				if (!disabled) onClick();
			}}
			unavailable={disabled}
			className={widthClass}
		/>
	);
	return hint ? <Hint label={hint}>{button}</Hint> : button;
}

/* The section's dropdowns all mount the shared MenuShell (fix wave chunk
 * B): portaled to document.body, fixed-anchored to the open trigger by
 * testid (the section's one-ref pattern), opening DOWN with the shell's
 * viewport cap and auto-flip. data-lh-menu rides the shell — the
 * outside-click contract's exemption mark. */

export function AgentSection({
	agent,
	fileAccessError,
	models,
	graph,
	compaction,
	onSectionChange,
	onDeletePromptOverride,
	onModelsChange,
	onCompactionChange,
}: {
	agent: AgentSettings | undefined;
	fileAccessError?: string | null;
	/** The `models` section (slot pins — engine-level, PUT /api/settings/models). */
	models: ModelsSettings | undefined;
	/** The `graph` section — READ ONLY here: the graphTools row composes its
	 *  master switch (graph.enabled off dims + disables the row; the
	 *  effective gate is server-side, per-turn fresh). */
	graph: GraphSettings | undefined;
	/** The `compaction` section — its own PUT (the threshold is engine
	 *  behavior, not an agent-section key; owner round 14, Agent tab). */
	compaction: CompactionSettings | undefined;
	/** Writes the composed WHOLE agent section (replace-PUT discipline). */
	onSectionChange: (next: AgentSettings, confirms?: (stored: AgentSettings) => boolean) => boolean | Promise<boolean>;
	/** Order the override DELETE against Settings' full-record acknowledgements. */
	onDeletePromptOverride?: (path: string, remove: () => Promise<boolean>) => Promise<PromptDeleteOutcome>;
	/** Writes the composed models section (slots — replace-PUT discipline). */
	onModelsChange: (next: ModelsSettings) => void;
	/** Writes the whole compaction section (replace-PUT discipline). */
	onCompactionChange: (next: CompactionSettings) => boolean | Promise<boolean>;
}) {
	const { catalog: body, failed: catalogFailed, refresh: refreshCatalog } = useModelCatalog();
	const catalog = body?.models;
	const slots = body?.slots;
	/** The live search state (/api/search) — the row's reason line. */
	const [folderInput, setFolderInput] = useState("");
	const [folderError, setFolderError] = useState<string | null>(null);
	const [search, setSearch] = useState<{ available: boolean; engine: string | null; reason: string } | null>(null);
	/** Which search engines have a key (/api/keys) — the no-keys-anywhere
	 *  state grays the row; per-engine marks ride the menu rows. */
	const [engineKeys, setEngineKeys] = useState<Partial<Record<SearchEngineId, boolean>>>({});
	const [prompts, setPrompts] = useState<PromptView | null>(null);
	const [promptListStatus, setPromptListStatus] = useState<"loading" | "ready" | "failed">("loading");
	const promptRead = useRef<AbortController | null>(null);
	const latestAgent = useRef(agent);
	latestAgent.current = agent;
	const [openSegment, setOpenSegment] = useState<{ info: SegmentInfo; mode: "view" | "edit"; row: HTMLElement } | null>(null);
	const [switchPending, setSwitchPending] = useState(false);
	const switchingPrompt = useRef(false);
	const [switchError, setSwitchError] = useState<string | null>(null);
	/** One open dropdown for the whole section: which slot (or the search
	 *  row), which kind. */
	const [openMenu, setOpenMenu] = useState<{ target: ModelSlotName | "search"; kind: "model" | "thinking" | "engine" | "cache" } | null>(null);
	const [advancedModels, setAdvancedModels] = useState(false);
	const [workerConcurrencyError, setWorkerConcurrencyError] = useState<string | null>(null);
	const menuAnchorRef = useRef<HTMLSpanElement>(null);
	const interactions = useInteractionLayers();

	const refreshSearch = () =>
		fetch("/api/search")
			.then((r) => r.json())
			.then((body: { available: boolean; engine: string | null; reason: string }) => setSearch(body))
			.catch(() => setSearch(null));

	/** Re-read the prompt-segment view — the signal seam for the
	 *  2026-09-26 state-echo fix: the view's `enabled` flags DERIVE from
	 *  the settings record's agent switches (the toggle's truth lives
	 *  here, not in the `agent` prop), so an agent-section write must
	 *  re-read it or the toggle keeps painting its pre-write state until
	 *  a remount. Ignore out-of-order reads and retain the last good view
	 *  if a refresh fails. */
	const readPrompts = useCallback(async (background = false) => {
		promptRead.current?.abort();
		const request = new AbortController();
		promptRead.current = request;
		if (!background) setPromptListStatus("loading");
		try {
			const res = await fetch("/api/settings/prompts", { signal: request.signal });
			if (!res.ok) throw new Error(String(res.status));
			const body: PromptView = await res.json();
			if (request.signal.aborted) return;
			setPrompts(body);
			setPromptListStatus("ready");
		} catch {
			if (!request.signal.aborted && !background) setPromptListStatus("failed");
		}
	}, []);

	// The shared catalog seeds the first frame and refreshes per mount and
	// keys/models signal. Settings props still own saved selections/levels.
	useSettingsSaved((section) => {
		// THE state-echo root cause: the prompt switches write through the
		// agent section, but this view (the toggles' truth) never re-read —
		// the settings-saved law (every reader re-reads) was missing this
		// one reader.
		if (section === "agent" && !switchingPrompt.current) void readPrompts();
	});

	useEffect(() => {
		void readPrompts();
		fetch("/api/keys")
			.then((r) => r.json())
			.then((body: { keys: { id: string; present: boolean }[] }) => {
				const present: Partial<Record<SearchEngineId, boolean>> = {};
				for (const { id, envVar } of SEARCH_ENGINES) {
					present[id] = body.keys.some((k) => k.id === envVar && k.present);
				}
				setEngineKeys(present);
			})
			.catch(() => {});
		return () => promptRead.current?.abort();
	}, [readPrompts]);

	// The reason line re-reads /api/search AFTER an engine write lands —
	// the write updates the `agent` prop (the dialog's record mirror), so
	// keying on the pin avoids the race where the fetch beat the PUT and
	// the hint contradicted the trigger it sits under.
	useEffect(() => {
		refreshSearch();
	}, [agent?.search?.engine]);

	// The dropdown contract (the chat model selector's, mirrored): any
	// click outside the open menu — or an Esc — closes it. Esc is CLAIMED
	// with stopPropagation so the settings dialog behind does NOT also
	// close. A pointerdown on the backdrop is left for the dialog (its own
	// click closes everything); a click inside the dialog just closes us.
	useEffect(() => {
		if (openMenu === null) return;
		const onPointerDown = (e: PointerEvent) => {
			const testid = openMenu.target === "search" ? "search-engine-menu" : `slot-${openMenu.kind}-menu-${openMenu.target}`;
			if (!interactions.isElementEligible(document.querySelector<HTMLElement>(`[data-testid="${testid}"]`))) return;
			const target = e.target as Node;
			if (menuAnchorRef.current?.contains(target)) return;
			if (target instanceof Element && target.closest("[data-lh-menu]")) return;
			if (target instanceof Element && target.closest('[role="dialog"]')) {
				setOpenMenu(null);
			}
			// else: outside the dialog — the dialog's own close handles it.
		};
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [openMenu, interactions]);

	async function switchSegment(path: string, on: boolean) {
		if (switchingPrompt.current || promptListStatus !== "ready") return;
		switchingPrompt.current = true;
		setSwitchPending(true);
		setSwitchError(null);
		let saved = false;
		try {
			saved = await onSectionChange(composePromptSwitch(latestAgent.current, path, on), stored => (stored.prompts?.[path] === true) === on);
		} catch {
			// A rejected write is handled below just like a negative acknowledgement.
		} finally {
			if (saved) {
				// Only the acknowledged version changes; don't clear/dim the list
				// while its ordinary canonical refresh catches up.
				const update = (segments: SegmentInfo[]) => segments.map(s => s.path === path ? { ...s, enabled: on } : s);
				setPrompts(view => view && { teacher: update(view.teacher), prober: update(view.prober), practice: update(view.practice) });
			} else setSwitchError(path);
			switchingPrompt.current = false;
			void readPrompts(saved);
			setSwitchPending(false);
		}
	}

	async function saveSegment(path: string, text: string, writeText: boolean): Promise<PromptSaveOutcome> {
		try {
			if (writeText) {
				const res = await fetch(`/api/settings/prompts/${path}`, {
					method: "PUT",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ text }),
				});
				if (!res.ok) return "save-failed";
			}
		} catch {
			return "save-failed";
		}
		// Keep save-and-activate: the switch write must follow the file write.
		// Report partial success separately so retry needn't rewrite the file.
		try {
			// A mirrored ON is not proof: the route can clear it (e.g. on
			// deletion). Require the switch in the actual write acknowledgement.
			const saved = await onSectionChange(composePromptSwitch(latestAgent.current, path, true), stored => stored.prompts?.[path] === true);
			return saved ? "saved" : "activation-failed";
		} catch {
			return "activation-failed";
		} finally {
			void readPrompts();
		}
	}

	async function deleteSegment(path: string): Promise<PromptDeleteOutcome> {
		let outcome: PromptDeleteOutcome = "delete-failed";
		try {
			const remove = async () => (await fetch(`/api/settings/prompts/${path}`, { method: "DELETE" })).ok;
			outcome = onDeletePromptOverride ? await onDeletePromptOverride(path, remove) : await remove() ? "deleted" : "delete-failed";
		} catch {
			// The same UI handles rejected requests and non-OK responses.
		}
		if (outcome !== "settings-busy") void readPrompts();
		return outcome;
	}

		/** The search-engine menu row — label + the quiet live-key mark. */
	const engineOption = (
		id: SearchEngineId | "auto",
		label: string,
		active: boolean,
		live: boolean | null,
		onPick: () => void,
	) => (
		<button
			key={id}
			type="button"
			data-testid={`engine-option-${id}`}
			onClick={onPick}
			className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted ${
				active ? "bg-muted/60 text-card-foreground" : "text-card-foreground"
			}`}
		>
			<span>{label}</span>
			<span className="text-muted-foreground">
				{live === null ? (active && <span aria-hidden>✓</span>) : live ? <span aria-hidden>✓ key</span> : <span aria-hidden>· no key</span>}
			</span>
		</button>
	);


	// Resolved through the SAME core resolver the server's effective
	// settings use (the GraphSection precedent): the hint and placeholder
	// report exactly the number the trigger waits for.
	const resolvedAgent = resolveSettings(agent === undefined ? null : { version: 1, agent }).agent;
	const resolvedCompaction = resolveSettings(
		compaction === undefined ? null : { version: 1, compaction },
	).compaction;

	return (
		<>
			<SettingsGroup label="模型" testid="group-models">
				<button
					type="button"
					data-testid="models-advanced"
					aria-expanded={advancedModels}
					onClick={() => { setAdvancedModels(!advancedModels); setOpenMenu(null); }}
					className="mb-1 self-start text-xs text-muted-foreground hover:text-foreground"
				>{advancedModels ? "隐藏高级设置" : "显示高级设置"}</button>
				{catalogFailed && <p role="alert" className="text-xs text-error">Model catalog could not be loaded. Check the connection and retry. <button type="button" className="underline" onClick={refreshCatalog}>重试</button></p>}
				{MODEL_SLOTS.map((slot) => {
					const override = models?.[slot];
					const modelId = override?.model?.id ?? "";
					const provider = override?.model?.provider ?? "";
					const thinking = override?.thinkingLevel ?? "";
					// The tier's resolved pin is machinery only now (owner, fix
					// wave): the UI never names the factory fallback — the hint
					// carries the roster, the triggers read "—" when unpicked — but
					// the pin still governs the thinking level LIST when no override
					// names a model to read levels from.
					const pin = slots?.[slot];
					// The model whose levels govern the thinking list: the
					// override, else the resolved pin (when it's in the federated
					// catalog); the standard ladder as the last fallback.
					const coord = override?.model ?? pin?.model;
					const chosen = coord ? catalog?.find((m) => m.id === coord.id && m.provider === coord.provider) : undefined;
					const levels = chosen ? chosen.supportedLevels : THINKING_LEVELS;
					const thisMenuOpen = openMenu?.target === slot ? openMenu.kind : null;
					return (
						<SettingsRow
							key={slot}
							label={SLOT_META[slot].label}
							hint={SLOT_META[slot].roster}
							testid={`slot-row-${slot}`}
						>
							{/* The anchor for the outside-click contract is the
							    span holding BOTH triggers of the open menu. */}
							<span
								ref={thisMenuOpen ? menuAnchorRef : undefined}
								className={`relative flex items-center gap-2 ${advancedModels ? "shrink-0" : ""}`}
							>
								{slot !== "strong" && <><ChatGPTBackgroundAccess provider={coord?.provider} /><NativeSubscriptionBackgroundAccess provider={coord?.provider} /></>}
								<MenuTrigger
									value={modelId ? prettyModel(modelId) : ""}
									hint={modelId ? `${provider}:${modelId}` : undefined}
									emptyLabel="—"
									ariaLabel={`${SLOT_META[slot].label} 模型`}
									testid={`slot-model-${slot}`}
									open={thisMenuOpen === "model"}
									onClick={() => setOpenMenu(thisMenuOpen === "model" ? null : { target: slot, kind: "model" })}
									widthClass="min-w-20"
								/>
								<MenuTrigger
									// Legacy display (chunk 2 item 4): no stored level + a known
									// model → the RESOLVED level (the ordering's first supported —
									// what the engine build runs). Display-only until a pick writes.
									value={thinking || (chosen ? defaultOrderLevel(levels) : "")}
									emptyLabel="—"
									ariaLabel={`${SLOT_META[slot].label} 思考级别`}
									testid={`slot-thinking-${slot}`}
									open={thisMenuOpen === "thinking"}
									onClick={() => setOpenMenu(thisMenuOpen === "thinking" ? null : { target: slot, kind: "thinking" })}
									widthClass="w-20"
								/>
								{advancedModels && <MenuTrigger
									value={cacheRetentionLabel(override?.cacheRetention)}
									emptyLabel="Cache: default"
									ariaLabel={`${SLOT_META[slot].label} 缓存保留`}
									testid={`slot-cache-${slot}`}
									open={thisMenuOpen === "cache"}
									disabled={!override?.model}
									onClick={() => setOpenMenu(thisMenuOpen === "cache" ? null : { target: slot, kind: "cache" })}
									widthClass="w-40"
								/>}
								{advancedModels && thisMenuOpen === "cache" && <MenuShell
									preferredSide="down"
									anchorTestid={`slot-cache-${slot}`}
									testid={`slot-cache-menu-${slot}`}
									onClose={() => { setOpenMenu(null); return "closed"; }}
									menuClass="flex w-80 flex-col gap-0.5 rounded-xl border border-border bg-card p-2 text-xs shadow-xl"
								>
									<CacheRetentionMenu value={override?.cacheRetention} onPick={(value) => {
										onModelsChange(composeSlotCacheRetention(models, slot, value));
										setOpenMenu(null);
									}} />
								</MenuShell>}
								{thisMenuOpen === "model" && (
									<MenuShell
										preferredSide="down"
											anchorTestid={`slot-model-${slot}`}
										testid={`slot-model-menu-${slot}`}
										onClose={() => { setOpenMenu(null); return "closed"; }}
										menuClass="flex w-[22rem] flex-col rounded-xl border border-border bg-card p-2 text-xs shadow-xl"
									>
										<ModelMenuList
											models={catalog ?? undefined}
											effectiveId={modelId}
											effectiveProvider={provider}
											vision={slot === "vision"}
											onPick={(entry) => {
												// Auto-populate (chunk 2, owner: "populate everywhere"): the
												// fresh pick writes a level — the stored one rides as-is
												// (the write clamps server-side), else the ordering's level.
												const next = populateLevel(thinking || undefined, entry.supportedLevels);
												onModelsChange(composeSlotModel(models, slot, entry.provider, entry.id, next));
												setOpenMenu(null);
											}}
											footer={
												catalog && catalog.length === 0
													? "暂无模型——请在「提供商」中添加密钥"
													: "该层级的所有智能体都会使用此模型"
											}
										/>
									</MenuShell>
								)}
								{thisMenuOpen === "thinking" && (
									<MenuShell
										preferredSide="down"
											anchorTestid={`slot-thinking-${slot}`}
										testid={`slot-thinking-menu-${slot}`}
										onClose={() => { setOpenMenu(null); return "closed"; }}
										menuClass="flex w-44 flex-col gap-0.5 rounded-xl border border-border bg-card p-2 text-xs shadow-xl"
									>
										<ThinkingMenuList
											levels={levels.map(String)}
											// The ✓ sits on the RESOLVED level for legacy unset records —
											// the same one the trigger shows.
											effectiveLevel={thinking || (chosen ? defaultOrderLevel(levels) : undefined)}
											onPick={(level) => {
												onModelsChange(composeSlotModel(models, slot, provider, modelId, level));
												setOpenMenu(null);
											}}
										/>
									</MenuShell>
								)}
							</span>
						</SettingsRow>
					);
				})}
				<ModelCatalogRefreshRow />
				<SettingsRow
					label="并发工作请求"
					hint="后台工作模型的最大并发请求数。直接对话不受限制。"
					testid="worker-request-concurrency-row"
				>
					<div
						className="flex flex-col items-end gap-1"
						onChangeCapture={() => setWorkerConcurrencyError(null)}
						onBlurCapture={(event) => {
							// Browsers expose incomplete numeric input (e.g. "1e")
							// as an empty value. It is INVALID, not a blank reset.
							if (event.target instanceof HTMLInputElement && event.target.validity.badInput) {
								event.stopPropagation();
								setWorkerConcurrencyError("请输入一个可安全表示的正整数。");
							}
						}}
					>
						<CommitInput
							type="number"
							min={1}
							step={1}
							value={String(agent?.workerRequestConcurrency ?? "")}
							placeholder={String(resolvedAgent.workerRequestConcurrency)}
							ariaLabel="并发工作请求"
							testid="input-worker-request-concurrency"
							onCommit={(value) => {
								const next = composeWorkerRequestConcurrency(agent, value);
								setWorkerConcurrencyError(next.ok ? null : next.error);
								return next.ok ? onSectionChange(next.settings) : false;
							}}
						/>
						{workerConcurrencyError && <p role="alert" className="text-xs text-error">{workerConcurrencyError}</p>}
					</div>
				</SettingsRow>
			</SettingsGroup>

			<SettingsGroup label="工具" testid="group-tools">
				{/* The prober's graph tools (wave 7, owner ruling 2026-09-23):
				    FIRST row of the group — its subject is the map, its
				    mechanism is agent capability, so it lives in Tools but
				    NOT in the tool-toggles list. Its own agent-section key
				    (agent.graphTools), the search-row hint discipline: a
				    smaller line under it explaining what it is — this
				    connects prior sessions' knowledge into new ones. */}
				{(() => {
					const graphOn = graph?.enabled ?? true;
					return (
						<SettingsRow
							label="图谱工具"
							hint={graphOn ? "让老师在会话之间查阅你的知识图谱" : "图谱功能已关闭"}
							testid="graph-tools-row"
							dimmed={!graphOn}
						>
							<Toggle
								checked={agent?.graphTools?.enabled ?? true}
								disabled={!graphOn}
								label="图谱工具"
								onChange={(on) => onSectionChange(composeGraphTools(agent, on))}
							/>
						</SettingsRow>
					);
				})()}
				{/* The quizzing mechanic (owner 2026-09-27): segmented — exactly one
				    of Multiple choice / Free recall is active; the choice swaps which
				    quizzing tool BOTH agents carry (prober checks + teach checks).
				    Persisted as agent.tools.explain; absent = Multiple choice. */}
				{(() => {
					const free = agent?.tools?.explain === true;
					return (
						<SettingsRow
							label="测验中"
							hint="两位老师如何检验你的理解"
							testid="quiz-mechanics-row"
						>
							<SettingsSegmentedControl label="测验机制" testidPrefix="quiz-mechanics"
								options={[{ value: "choice", label: "选择题" }, { value: "free", label: "自由回忆" }]}
								value={free ? "free" : "choice"} onChange={(next) => onSectionChange(composeQuizMechanics(agent, next))} />
						</SettingsRow>
					);
				})()}
				{TOGGLE_TOOLS.map((id) => (
					<SettingsRow
						key={id}
						label={`工具：${TOOL_LABELS[id] ?? id}`}
						testid={`tool-row-${id}`}
					>
						<Toggle
							checked={agent?.tools?.[id] ?? true}
							label={`工具：${TOOL_LABELS[id] ?? id}`}
							onChange={(on) => onSectionChange(composeTool(agent, id, on))}
						/>
					</SettingsRow>
				))}
				{(() => {
					const folders = agent?.fileAccess?.folders ?? [];
					const restricted = Boolean(fileAccessError) || agent?.fileAccess?.restricted === true;
					const effectiveAgent = fileAccessError ? { ...agent, fileAccess: { restricted: true, folders } } : agent;
					const addFolder = () => {
						const next = folderInput.trim();
						if (!isFolderEntry(next)) { setFolderError("Enter an absolute path or ~/folder."); return; }
						if (!folders.includes(next)) onSectionChange(composeAddFolder(effectiveAgent, next));
						setFolderInput("");
						setFolderError(null);
					};
					return (
						<div data-testid="file-access-row" className="flex flex-col gap-2">
							<SettingsRow label="文件访问" hint={!restricted
								? "广泛的本地文件访问（受保护位置除外）"
								: folders.length ? "仅限下列文件夹及其子文件夹。"
									: "受限：不允许访问任何文件夹。添加文件夹以启用访问。"}>
								<div className="flex items-center gap-2 text-xs">
									<span>限制为列出的文件夹</span>
									<Toggle checked={restricted} label="限制为列出的文件夹" onChange={(on) => onSectionChange(composeFileRestriction(effectiveAgent, on))} />
								</div>
							</SettingsRow>
							{fileAccessError && <p role="alert" data-testid="file-access-config-error" className="text-xs text-error">{fileAccessError}</p>}
							<div className="flex gap-2 pl-3">
								<input value={folderInput} aria-label="允许的文件夹路径" data-testid="file-access-add" placeholder="绝对路径或 ~/文件夹"
									onChange={(event) => { setFolderInput(event.target.value); setFolderError(null); }}
									onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addFolder(); } }}
									className="min-w-0 flex-1 rounded-sm border border-border bg-background px-2 py-1 font-ui text-xs" />
								<button type="button" data-testid="file-access-add-button" disabled={!folderInput.trim()} onClick={addFolder} className="rounded-sm border border-border px-2 text-xs disabled:opacity-40">添加文件夹</button>
							</div>
							{folderError && <p role="alert" data-testid="file-access-input-error" className="pl-3 text-xs text-error">{folderError}</p>}
							{folders.map((folder) => (
								<div key={folder} data-testid="file-access-folder" className="flex items-center justify-between gap-4 pl-3 text-xs">
									<span title={folder} className="min-w-0 truncate font-ui text-muted-foreground">{folder}</span>
									<button type="button" aria-label={`Remove ${folder}`} data-testid="file-access-remove"
										onClick={() => onSectionChange(composeRemoveFolder(effectiveAgent, folder))}
										className="rounded-sm px-1.5 text-muted-foreground hover:text-foreground">移除</button>
								</div>
							))}
						</div>
					);
				})()}
				{(() => {
					const engine = agent?.search?.engine ?? null;
					const anyKey = SEARCH_ENGINES.some(({ id }) => engineKeys[id] === true);
					const open = openMenu?.target === "search";
					return (
						<SettingsRow
							label="搜索引擎"
							hint={search?.reason ?? undefined}
							testid="search-engine-row"
							dimmed={!anyKey}
						>
							<span ref={open ? menuAnchorRef : undefined} className="relative flex items-center gap-2">
								<MenuTrigger
									value={SEARCH_ENGINES.find(({ id }) => id === engine)?.label ?? ""}
									emptyLabel="自动"
									ariaLabel="搜索引擎"
									testid="search-engine-trigger"
									open={open}
									onClick={() => setOpenMenu(open ? null : { target: "search", kind: "engine" })}
									widthClass="min-w-20"
									disabled={!anyKey}
								/>
								{open && (
									<MenuShell
										preferredSide="down"
											anchorTestid="search-engine-trigger"
										testid="search-engine-menu"
										onClose={() => { setOpenMenu(null); return "closed"; }}
										menuClass="flex w-44 flex-col gap-0.5 rounded-xl border border-border bg-card p-2 text-xs shadow-xl"
									>
										{engineOption("auto", "自动", engine === null, null, () => {
											onSectionChange(composeSearchEngine(agent, null));
											setOpenMenu(null);
										})}
										{SEARCH_ENGINES.map(({ id, label }) =>
											engineOption(id, label, engine === id, engineKeys[id] ?? false, () => {
												onSectionChange(composeSearchEngine(agent, id));
												setOpenMenu(null);
											}),
										)}
									</MenuShell>
								)}
							</span>
						</SettingsRow>
					);
				})()}
			</SettingsGroup>

			<SettingsGroup label="上下文" testid="group-context">
				<SettingsRow
					label="压缩阈值"
					hint={`${resolvedCompaction.thresholdTokens} tok`}
					testid="compaction-row-threshold"
				>
					<CommitInput
						type="number"
						value={String(compaction?.thresholdTokens ?? "")}
						placeholder={String(resolvedCompaction.thresholdTokens)}
						ariaLabel="压缩阈值"
						testid="input-compaction-threshold"
						onCommit={(v) => {
							// Empty = factory default (the budget row's discipline):
							// absence is the unset for numbers.
							if (v === "") {
								return onCompactionChange({ ...compaction, thresholdTokens: undefined });
							}
							const n = Number(v);
							if (!Number.isFinite(n) || n <= 0) return false; // bad input: no write
							// Mirror the server floor (anti-churn: each compaction
							// keeps a ~20k-token tail); no ceiling — the effective
							// trigger is min(threshold, contextWindow − 16k) anyway.
							return onCompactionChange({
								...compaction,
								thresholdTokens: Math.max(COMPACTION_THRESHOLD_FLOOR, Math.round(n)),
							});
						}}
					/>
				</SettingsRow>
				<SettingsRow
					label="在令牌估算中包含推理（仅 OpenAI Responses）"
					hint="使用已保存的输出令牌用量计入匹配模型的重放推理。关闭则使用原始文本估算。"
					testid="compaction-row-reasoning"
				>
					<Toggle
						label="在令牌估算中包含推理（仅 OpenAI Responses）"
						checked={resolvedCompaction.includeReasoning}
						onChange={(includeReasoning) => onCompactionChange({ ...compaction, includeReasoning })}
					/>
				</SettingsRow>
			</SettingsGroup>

			<SettingsGroup label="系统提示" testid="group-prompts">
				<p className="text-xs text-muted-foreground">用开关在默认值与你保存的覆盖值之间选择。</p>
				{promptListStatus !== "ready" && <div className="flex items-center gap-2">
					{promptListStatus === "failed" ? <p role="alert" className="text-xs text-error">无法加载提示词分段。</p> :
						<p role="status" className="text-xs text-muted-foreground">{prompts ? "正在刷新提示词分段…" : "正在加载提示词分段…"}</p>}
					<Button type="button" size="xs" variant="outline" onClick={() => void readPrompts()}>重试</Button>
				</div>}
				{prompts && (
					<div className="flex flex-col gap-4">
						{/* Teacher, Prober, Practice, Shared — shared chunks once,
						    each agent's own section in prompt-assembly order. */}
						{sectionedSegments(prompts).map((section) => (
							<div key={section.id} data-testid={`prompt-section-${section.id}`}>
								<p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground/70">
									{PROMPT_LABELS[section.label] ?? section.label}
								</p>
								{section.segments.map((info) => <PromptSegmentRow key={info.path}
									path={info.path} usageHint={info.usageHint} hasOverride={info.overrideText !== null} enabled={info.enabled}
									busy={promptListStatus !== "ready"} switching={switchPending} error={switchError === info.path ? "无法切换提示词版本。" : undefined}
									onView={row => setOpenSegment({ info, mode: "view", row })}
									onEdit={row => setOpenSegment({ info, mode: "edit", row })}
									onToggle={(on) => void switchSegment(info.path, on)}
								/>)}
							</div>
						))}
					</div>
				)}
			</SettingsGroup>
			{openSegment && <PromptSegmentDialog
				name={promptSegmentName(openSegment.info.path)} returnFocusFallback={openSegment.row} source={openSegment.info.sourceText} override={openSegment.info.overrideText} mode={openSegment.mode}
				onSave={(text, writeText) => saveSegment(openSegment.info.path, text, writeText)}
				onDelete={() => deleteSegment(openSegment.info.path)}
				onClose={() => setOpenSegment(null)}
			/>}
		</>
	);
}
