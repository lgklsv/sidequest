import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	DEFAULT_SETTINGS,
	DEPTH_OPTIONS,
	PATH_STYLE_OPTIONS,
	TIMELINE_OPTIONS,
	TONE_OPTIONS,
} from "@/lib/constants";
import { storylinesToFlow } from "@/lib/tree-builder";
import type { PathStyle, Timeline, Tone } from "@/lib/types";
import { generateTree } from "@/server/ai";
import { useGraphStore } from "@/stores/graph-store";

export const Route = createFileRoute("/")({ component: PromptScreen });

const SUGGESTION_PROMPTS = [
	"Should I adopt a cat or a dog?",
	"Should I learn to play the drums?",
	"Should I move to a new country?",
	"Should I say yes to karaoke tonight?",
	"Should I switch careers to become a chef?",
	"Should I go back to school?",
];

function PromptScreen() {
	const [prompt, setPrompt] = useState("");
	const [tone, setTone] = useState<Tone>(DEFAULT_SETTINGS.tone);
	const [timeline, setTimeline] = useState<Timeline>(DEFAULT_SETTINGS.timeline);
	const [pathStyle, setPathStyle] = useState<PathStyle>(
		DEFAULT_SETTINGS.pathStyle,
	);
	const [depth, setDepth] = useState(DEFAULT_SETTINGS.depth);
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState("");
	const setGraph = useGraphStore((s) => s.setGraph);
	const setSettings = useGraphStore((s) => s.setSettings);
	const reset = useGraphStore((s) => s.reset);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim() || loading) return;

		const settings = { tone, timeline, pathStyle, depth };
		setLoading(true);
		setProgress("Starting generation...");

		try {
			reset();
			setSettings(settings);
			setProgress("Generating decision tree...");

			const result = await generateTree({
				data: {
					rootText: prompt.trim(),
					tone,
					timeline,
					pathStyle,
					depth,
				},
			});

			const { nodes, edges } = storylinesToFlow(
				prompt.trim(),
				result.storylines,
			);

			setGraph(nodes, edges);
			navigate({ to: "/canvas" });
		} catch (error) {
			console.error("Failed to generate tree:", error);
			setLoading(false);
			setProgress("");
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle className="text-xl">SideQuest</CardTitle>
					<CardDescription>
						Enter a decision and explore AI-generated outcomes as a branching
						tree.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="flex flex-col gap-5">
						<Textarea
							placeholder="Should I quit my job to start a business?"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							disabled={loading}
							rows={3}
						/>

						<div className="flex flex-wrap gap-1.5">
							{SUGGESTION_PROMPTS.map((suggestion) => (
								<Button
									key={suggestion}
									type="button"
									variant="outline"
									size="xs"
									disabled={loading}
									onClick={() => setPrompt(suggestion)}
									className="rounded-full text-muted-foreground hover:text-foreground"
								>
									{suggestion}
								</Button>
							))}
						</div>

						<details className="group">
							<summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-muted-foreground select-none hover:text-foreground">
								<ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
								Settings
							</summary>
							<div className="mt-3 grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs text-muted-foreground">Tone</Label>
									<Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{TONE_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								<div className="flex flex-col gap-1.5">
									<Label className="text-xs text-muted-foreground">
										Timeline
									</Label>
									<Select
										value={timeline}
										onValueChange={(v) => setTimeline(v as Timeline)}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{TIMELINE_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								<div className="flex flex-col gap-1.5">
									<Label className="text-xs text-muted-foreground">
										Path Style
									</Label>
									<Select
										value={pathStyle}
										onValueChange={(v) => setPathStyle(v as PathStyle)}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{PATH_STYLE_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								<div className="flex flex-col gap-1.5">
									<Label className="text-xs text-muted-foreground">Depth</Label>
									<Select
										value={String(depth)}
										onValueChange={(v) => setDepth(Number(v))}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{DEPTH_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={String(opt.value)}>
														{opt.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>
						</details>

						<Button
							type="submit"
							size="lg"
							disabled={!prompt.trim() || loading}
						>
							{loading ? (
								<>
									<Loader2
										className="size-4 animate-spin"
										data-icon="inline-start"
									/>
									{progress}
								</>
							) : (
								<>Start</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
