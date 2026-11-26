/** Nova-3 monolingual language codes, including documented locale aliases.
 * Source: https://developers.deepgram.com/docs/models-languages-overview
 * Multilingual is a separate mode; its supported language set differs.
 */
const NOVA_3_LANGUAGES = [
	["Afrikaans", ["af", "af-ZA"]],
	["العربية", ["ar", "ar-AE", "ar-SA", "ar-QA", "ar-KW", "ar-SY", "ar-LB", "ar-PS", "ar-JO", "ar-EG", "ar-SD", "ar-TD", "ar-MA", "ar-DZ", "ar-TN", "ar-IQ", "ar-IR"]],
	["Հայերեն", ["hy"]],
	["অসমীয়া", ["as", "as-IN"]],
	["Беларуская", ["be"]],
	["বাংলা", ["bn"]],
	["Bosanski", ["bs"]],
	["Български", ["bg"]],
	["Català", ["ca"]],
	["中文（粵語，繁體）", ["zh-HK"]],
	["中文（普通话，简体）", ["zh", "zh-CN", "zh-Hans"]],
	["中文（普通話，繁體）", ["zh-TW", "zh-Hant"]],
	["Hrvatski", ["hr"]],
	["Čeština", ["cs", "cs-CZ"]],
	["Dansk", ["da", "da-DK"]],
	["Nederlands", ["nl"]],
	["English", ["en", "en-US", "en-AU", "en-GB", "en-IN", "en-NZ"]],
	["Eesti", ["et"]],
	["Suomi", ["fi"]],
	["Vlaams", ["nl-BE"]],
	["Français", ["fr", "fr-CA"]],
	["ქართული", ["ka", "ka-GE"]],
	["Deutsch", ["de"]],
	["Deutsch (Schweiz)", ["de-CH"]],
	["Ελληνικά", ["el"]],
	["ગુજરાતી", ["gu", "gu-IN"]],
	["עברית", ["he"]],
	["हिन्दी", ["hi"]],
	["Magyar", ["hu"]],
	["Bahasa Indonesia", ["id"]],
	["Italiano", ["it"]],
	["日本語", ["ja"]],
	["ಕನ್ನಡ", ["kn"]],
	["Қазақша", ["kk", "kk-KZ"]],
	["한국어", ["ko", "ko-KR"]],
	["Latviešu", ["lv"]],
	["Lietuvių", ["lt"]],
	["Македонски", ["mk"]],
	["Bahasa Melayu", ["ms"]],
	["मराठी", ["mr"]],
	["Монгол", ["mn"]],
	["नेपाली", ["ne"]],
	["Norsk", ["no"]],
	["پښتو", ["ps", "ps-AF"]],
	["فارسی", ["fa"]],
	["Polski", ["pl"]],
	["Português", ["pt", "pt-BR", "pt-PT"]],
	["ਪੰਜਾਬੀ", ["pa", "pa-IN"]],
	["Română", ["ro"]],
	["Русский", ["ru"]],
	["Српски", ["sr"]],
	["Slovenčina", ["sk"]],
	["Slovenščina", ["sl"]],
	["Español", ["es", "es-419"]],
	["Svenska", ["sv", "sv-SE"]],
	["Tagalog", ["tl"]],
	["தமிழ்", ["ta"]],
	["తెలుగు", ["te"]],
	["ไทย", ["th", "th-TH"]],
	["Türkçe", ["tr", "tr-TR"]],
	["Українська", ["uk"]],
	["اردو", ["ur"]],
	["Tiếng Việt", ["vi"]],
] as const;

export type DictationLanguage = "multi" | (typeof NOVA_3_LANGUAGES)[number][1][number];

export const DICTATION_LANGUAGES: readonly { code: DictationLanguage; label: string }[] = [
	{ code: "multi", label: "多语言" },
	...NOVA_3_LANGUAGES.flatMap(([name, codes]) =>
		codes.map((code, i) => ({ code, label: i === 0 ? name : `${name} (${code})` })),
	).sort((a, b) => a.label.localeCompare(b.label, "en")),
];

export function isDictationLanguage(value: unknown): value is DictationLanguage {
	return DICTATION_LANGUAGES.some(({ code }) => code === value);
}

/** Only language varies. Keep the owner's tuned streaming parameters. */
export function deepgramListenUrl(language: DictationLanguage): string {
	return "wss://api.deepgram.com/v1/listen" +
		"?model=nova-3&encoding=linear16&sample_rate=16000&channels=1" +
		"&smart_format=true&punctuate=true&endpointing=300" +
		`&language=${encodeURIComponent(language)}`;
}
