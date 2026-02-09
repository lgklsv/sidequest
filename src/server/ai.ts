import { createServerFn } from "@tanstack/react-start";
import { POLARITIES, TONE_PROMPTS } from "@/lib/constants";
import type {
	AIBranch,
	PathStyle,
	Polarity,
	Timeline,
	Tone,
} from "@/lib/types";

const OPENROUTER_MODEL = "openrouter/aurora-alpha";

const TIMELINE_TOTAL: Record<Timeline, number> = {
	"1y": 1,
	"5y": 5,
	"10y": 10,
	lifetime: 60,
};

const TIMELINE_UNIT: Record<Timeline, string> = {
	"1y": "months",
	"5y": "years",
	"10y": "years",
	lifetime: "years",
};

function getTimeWindow(
	timeline: Timeline,
	currentLevel: number,
	totalLevels: number,
): string {
	const total = TIMELINE_TOTAL[timeline];
	const unit = TIMELINE_UNIT[timeline];

	if (timeline === "1y") {
		const monthsPerLevel = 12 / totalLevels;
		const from = Math.round((currentLevel - 1) * monthsPerLevel);
		const to = Math.round(currentLevel * monthsPerLevel);
		if (from === 0) return `the first ${to} ${unit}`;
		return `${unit} ${from}-${to}`;
	}

	const yearsPerLevel = total / totalLevels;
	const from = Math.round((currentLevel - 1) * yearsPerLevel);
	const to = Math.round(currentLevel * yearsPerLevel);

	if (timeline === "lifetime") {
		const labels = ["early life", "young adulthood", "mid-life", "later years"];
		if (currentLevel <= labels.length)
			return `during ${labels[currentLevel - 1]}`;
		return `${unit} ${from}-${to}`;
	}

	if (from === 0) return `the first ${to} ${unit}`;
	return `${unit} ${from}-${to}`;
}

function getTimelineDescription(timeline: Timeline, depth: number): string {
	const parts: string[] = [];
	for (let level = 1; level <= depth; level++) {
		parts.push(`Level ${level}: ${getTimeWindow(timeline, level, depth)}`);
	}
	return parts.join(", ");
}

// ── Single-node expansion prompt (used for manual expand on canvas) ──

function buildBranchPrompt(
	nodeText: string,
	tone: Tone,
	timeline: Timeline,
	pathStyle: PathStyle,
	ancestorPath: string[],
	currentLevel: number,
	totalLevels: number,
): string {
	const toneInstruction = TONE_PROMPTS[tone];
	const timeWindow = getTimeWindow(timeline, currentLevel, totalLevels);

	const contextBlock =
		ancestorPath.length > 0
			? `\nStory so far:\n${ancestorPath.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n`
			: "";

	if (pathStyle === "balanced") {
		return `Given the decision below, predict 3 outcomes for ${timeWindow} of a ${TIMELINE_TOTAL[timeline]}-${TIMELINE_UNIT[timeline]} timeline. ${toneInstruction} Respond in the SAME language as the decision text.
${contextBlock}
1. positive outcome
2. neutral outcome
3. negative outcome

Max 25 words each. No markdown, no extra text. Just the numbered list.

Decision: "${nodeText}"`;
	}

	const styleInstruction =
		pathStyle === "chaos"
			? "Be wildly unpredictable with twists."
			: "Make it a coherent narrative — positive events can lead to hubris, negative to comebacks.";

	return `Given the decision below, predict 3 possible next events for ${timeWindow} of a ${TIMELINE_TOTAL[timeline]}-${TIMELINE_UNIT[timeline]} timeline. ${toneInstruction} ${styleInstruction} Respond in the SAME language as the decision text.
${contextBlock}
For each, pick a polarity tag. Format exactly like this:
1. [positive] outcome text here
2. [negative] outcome text here
3. [neutral] outcome text here

Max 25 words each. No markdown, no extra text. Just the numbered list with [polarity] tags.

Decision: "${nodeText}"`;
}

// ── Full tree prompt (used for initial generation — single API call) ──

function buildTreePrompt(
	rootText: string,
	tone: Tone,
	timeline: Timeline,
	pathStyle: PathStyle,
	depth: number,
): string {
	const toneInstruction = TONE_PROMPTS[tone];
	const timeProgression = getTimelineDescription(timeline, depth);

	const polarityInstruction =
		pathStyle === "balanced"
			? 'Each group of 3 siblings MUST have exactly one "positive", one "neutral", and one "negative" node.'
			: pathStyle === "chaos"
				? "Assign polarities freely — be wildly unpredictable with twists."
				: "Assign polarities freely for narrative coherence — positive events can lead to hubris, negative to comebacks.";

	return `Generate 3 parallel storylines as JSON for the decision below. Each storyline is a linear chain of ${depth} events — no branching, just one event leading to the next.

Rules:
- Exactly 3 storylines, each ${depth} events long (linear chain, NOT a tree)
- Each event has: "text" (max 30 words, be detailed and specific), "polarity" ("positive"/"neutral"/"negative")
- Each event has a "next" field pointing to the next event, or omit "next" for the last event
- Time progression along each chain: ${timeProgression}
- ${toneInstruction}
- ${polarityInstruction}
- Respond in the SAME language as the decision text
- Return ONLY valid JSON array, no markdown, no code fences

Format:
[
  {"text": "...", "polarity": "positive", "next": {"text": "...", "polarity": "neutral", "next": {"text": "...", "polarity": "negative"}}},
  {"text": "...", "polarity": "neutral", "next": {"text": "...", "polarity": "positive", "next": {"text": "...", "polarity": "negative"}}},
  {"text": "...", "polarity": "negative", "next": {"text": "...", "polarity": "neutral", "next": {"text": "...", "polarity": "positive"}}}
]

Decision: "${rootText}"`;
}

// ── OpenRouter API call with retry ──

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callLLM(prompt: string): Promise<string> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

	const MAX_RETRIES = 3;

	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: OPENROUTER_MODEL,
				messages: [{ role: "user", content: prompt }],
			}),
		});

		if (!res.ok) {
			const body = await res.text();
			console.warn(
				`[AI attempt ${attempt + 1}/${MAX_RETRIES}] ${res.status}: ${body}`,
			);
			if (attempt < MAX_RETRIES - 1) {
				await sleep(2 ** (attempt + 1) * 1000);
				continue;
			}
			throw new Error(`OpenRouter API error: ${res.status} ${body}`);
		}

		const json = await res.json();
		const text = json.choices?.[0]?.message?.content?.trim() ?? "";

		if (text.length === 0) {
			console.warn(`[AI attempt ${attempt + 1}/${MAX_RETRIES}] empty response`);
			if (attempt < MAX_RETRIES - 1) {
				await sleep(2 ** (attempt + 1) * 1000);
				continue;
			}
			throw new Error("AI returned empty response after retries");
		}

		return text;
	}

	throw new Error("AI generation failed after retries");
}

// ── Parsers ──

type StorylineNodeJSON = {
	text: string;
	polarity: string;
	next?: StorylineNodeJSON;
};

function parseStorylines(raw: string): StorylineNodeJSON[] {
	const cleaned = raw
		.replace(/^```(?:json)?\s*/m, "")
		.replace(/```\s*$/m, "")
		.trim();
	return JSON.parse(cleaned);
}

function parseBranches(text: string, pathStyle: PathStyle): AIBranch[] {
	const cleaned = text
		.replace(/```[\s\S]*?```/g, "")
		.replace(/\*\*/g, "")
		.replace(/\*/g, "")
		.trim();

	const lines = cleaned
		.split("\n")
		.map((line: string) => line.trim())
		.filter((line: string) => /^\d+[.\)\-]/.test(line))
		.slice(0, 3);

	if (lines.length === 0) {
		const fallbackLines = cleaned
			.split("\n")
			.map((line: string) => line.trim())
			.filter((line: string) => line.length > 5)
			.slice(0, 3);

		return fallbackLines.map((line: string, i: number) => ({
			text: line.replace(/^\d+[.\)\-]\s*/, "").trim(),
			polarity: POLARITIES[i % 3] as Polarity,
		}));
	}

	if (pathStyle === "balanced") {
		return lines.map((line: string, i: number) => ({
			text: line.replace(/^\d+[.\)\-]\s*/, "").trim(),
			polarity: POLARITIES[i] as Polarity,
		}));
	}

	return lines.map((line: string, i: number) => {
		const stripped = line.replace(/^\d+[.\)\-]\s*/, "").trim();
		const match = stripped.match(
			/^\[?(positive|neutral|negative)\]?\s*[:\-–]?\s*/i,
		);
		if (match) {
			return {
				text: stripped
					.replace(/^\[?(positive|neutral|negative)\]?\s*[:\-–]?\s*/i, "")
					.trim(),
				polarity: match[1].toLowerCase() as Polarity,
			};
		}
		return { text: stripped, polarity: POLARITIES[i % 3] as Polarity };
	});
}

// ── Server functions ──

export const generateTree = createServerFn({ method: "POST" })
	.inputValidator(
		(input: {
			rootText: string;
			tone: string;
			timeline: string;
			pathStyle: string;
			depth: number;
		}) => input,
	)
	.handler(async ({ data }) => {
		const promptText = buildTreePrompt(
			data.rootText,
			data.tone as Tone,
			data.timeline as Timeline,
			data.pathStyle as PathStyle,
			data.depth,
		);

		const text = await callLLM(promptText);

		console.log("[AI tree raw]", `${text.slice(0, 200)}...`);

		try {
			const storylines = parseStorylines(text);
			console.log(
				"[AI storylines parsed]",
				`${JSON.stringify(storylines).slice(0, 200)}...`,
			);
			return { storylines };
		} catch (e) {
			console.error("[AI parse error]", e, "\nRaw:", text);
			throw new Error("Failed to parse AI response");
		}
	});

export const generateBranches = createServerFn({ method: "POST" })
	.inputValidator(
		(input: {
			nodeText: string;
			tone: string;
			timeline: string;
			pathStyle: string;
			ancestorPath: string[];
			currentLevel: number;
			totalLevels: number;
		}) => input,
	)
	.handler(async ({ data }) => {
		const promptText = buildBranchPrompt(
			data.nodeText,
			data.tone as Tone,
			data.timeline as Timeline,
			data.pathStyle as PathStyle,
			data.ancestorPath,
			data.currentLevel,
			data.totalLevels,
		);

		const text = await callLLM(promptText);

		console.log("[AI raw response]", JSON.stringify(text));

		const branches = parseBranches(text, data.pathStyle as PathStyle);

		console.log("[AI parsed branches]", JSON.stringify(branches));

		return { branches };
	});
