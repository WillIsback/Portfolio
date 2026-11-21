import type { Locale } from "@/i18n/routing";
import type { SolutionCopy } from "@/lib/solutions";

/** Textes de la page Syntheo, repris du site syntheo.studio et de l'article de la bêta 0.7. */
export const SYNTHEO_COPY: Record<Locale, SolutionCopy> = {
	fr: {
		tagline: "Le bloc-notes de réunion par IA qui ne quitte pas votre machine.",
		summary:
			"Syntheo écoute votre réunion, garde vos notes et en fait un compte rendu clair, avec les modèles qui tournent sur votre machine ou sur vos propres serveurs. Sans compte, sans cloud, sans robot dans l'appel.",
		status: "Bêta 0.7 · Linux et Windows · open source",
		audience: [
			{
				title: "Agents publics",
				text: "Les notes de travail restent sur les postes et le réseau de l'administration, sans circuit de validation pour un service tiers.",
			},
			{
				title: "Santé et juridique",
				text: "Les échanges confidentiels n'atteignent jamais un prestataire extérieur.",
			},
			{
				title: "Entreprises soumises au RGPD",
				text: "Aucun sous-traitant à déclarer, aucun transfert de données à justifier.",
			},
			{
				title: "Passionnés d'IA locale",
				text: "Branchez les modèles que vous faites déjà tourner et gardez la main sur tout.",
			},
		],
		features: [
			{
				title: "Préparer",
				text: "Un ordre du jour et quelques idées dans la note, rangée dans son dossier projet. Syntheo rappelle ce qui s'est dit lors des dernières réunions du même projet.",
			},
			{
				title: "Écouter",
				text: "Le micro et le son de l'ordinateur, avec la transcription en direct dans la marge. Personne ne rejoint l'appel, et chaque source se coupe séparément.",
			},
			{
				title: "Synthétiser",
				text: "Vos notes deviennent le compte rendu. Ce qui vient de vous reste en vert, ce que Syntheo ajoute s'écrit à l'encre : on voit toujours qui a écrit quoi.",
			},
			{
				title: "Reprendre",
				text: "Chaque dossier projet tient un fil rouge des décisions, des points ouverts et des tâches, et propose l'ordre du jour de la réunion suivante.",
			},
		],
		privacy: [
			"Pas de compte, pas de télémétrie, pas de robot dans l'appel.",
			"L'audio vit en mémoire le temps d'être transcrit, puis disparaît : seule la note reste.",
			"Transcription et rédaction passent par les serveurs que vous choisissez : Ollama, vLLM, MLX, NVIDIA NIM, speaches ou toute API compatible OpenAI.",
			"Les notes sont dans une base SQLite sur votre poste.",
		],
		figures: [
			{ value: "0", label: "seconde d'audio conservée après la transcription" },
			{
				value: "20",
				label: "versions publiées en deux semaines, de la 0.1 à la 0.7",
			},
			{
				value: "≈ 4 000",
				label: "tests automatisés sur l'application, en plus des tests Rust",
			},
			{ value: "MIT", label: "licence open source, dérivé d'Anarlog" },
		],
		stack:
			"Tauri 2 (Rust) et React 19, base SQLite locale ; transcription en temps réel par NVIDIA NIM ou Whisper via speaches ; rédaction par toute API compatible OpenAI ; annulation d'écho DTLN (ONNX).",
		limits: [
			"Il faut un modèle de transcription et un modèle de langage que vous contrôlez : un petit modèle de transcription tient sur un portable récent, un modèle de langage moyen demande une RTX 3090, un Mac avec MLX ou un DGX Spark.",
			"Pas encore de version macOS.",
			"C'est une bêta : une base passée en 0.7 ne peut plus être ouverte par une 0.6.",
		],
		visualAlt:
			"Une note terminée dans Syntheo 0.7 : les notes de l'utilisateur, complétées par le compte rendu, avec la transcription dans la marge.",
		visualCaption:
			"Une note terminée dans Syntheo 0.7 (interface en anglais), transcrite et résumée par des modèles sur un serveur local.",
	},
	en: {
		tagline: "The AI meeting notepad that never leaves your machine.",
		summary:
			"Syntheo listens to your meeting, keeps your notes and turns them into a clear write-up, with the models running on your machine or on your own servers. No account, no cloud, no bot in the call.",
		status: "Beta 0.7 · Linux and Windows · open source",
		audience: [
			{
				title: "Civil servants",
				text: "Working notes stay on the administration's computers and network, with no approval process for a third-party service.",
			},
			{
				title: "Health and legal",
				text: "Confidential conversations never reach an outside provider.",
			},
			{
				title: "GDPR-bound companies",
				text: "No processor to declare, no data transfer to justify.",
			},
			{
				title: "Local AI enthusiasts",
				text: "Plug in the models you already run and keep control of everything.",
			},
		],
		features: [
			{
				title: "Prepare",
				text: "An agenda and a few ideas in the note, filed in its project folder. Syntheo recalls what was said in the last meetings of the same project.",
			},
			{
				title: "Listen",
				text: "Your microphone and your computer's sound, with the live transcript in the margin. Nobody joins the call, and each source can be muted separately.",
			},
			{
				title: "Summarise",
				text: "Your notes become the write-up. What comes from you stays green, what Syntheo adds is written in ink: you always see who wrote what.",
			},
			{
				title: "Pick up",
				text: "Each project folder keeps a running thread of decisions, open points and tasks, and suggests the agenda of the next meeting.",
			},
		],
		privacy: [
			"No account, no telemetry, no bot in the call.",
			"Audio lives in memory just long enough to be transcribed, then disappears: only the note remains.",
			"Transcription and writing go through the servers you choose: Ollama, vLLM, MLX, NVIDIA NIM, speaches or any OpenAI-compatible API.",
			"Notes are stored in a SQLite database on your computer.",
		],
		figures: [
			{ value: "0", label: "seconds of audio kept after transcription" },
			{ value: "20", label: "releases in two weeks, from 0.1 to 0.7" },
			{
				value: "≈ 4,000",
				label: "automated tests on the application, on top of the Rust tests",
			},
			{ value: "MIT", label: "open-source licence, derived from Anarlog" },
		],
		stack:
			"Tauri 2 (Rust) and React 19, local SQLite database; real-time transcription through NVIDIA NIM or Whisper via speaches; writing through any OpenAI-compatible API; DTLN echo cancellation (ONNX).",
		limits: [
			"You need a transcription model and a language model you control: a small transcription model fits on a recent laptop, a mid-sized language model needs an RTX 3090, a Mac with MLX or a DGX Spark.",
			"No macOS version yet.",
			"It is a beta: a database upgraded to 0.7 can no longer be opened by 0.6.",
		],
		visualAlt:
			"A finished note in Syntheo 0.7: the user's notes, completed by the write-up, with the transcript in the margin.",
		visualCaption:
			"A finished note in Syntheo 0.7, transcribed and summarised by models on a local server.",
	},
	zh: {
		tagline: "数据不出你电脑的 AI 会议记事本。",
		summary:
			"Syntheo 聆听你的会议，保留你的笔记，并用运行在你本机或你自己服务器上的模型整理成清晰的会议纪要。无需账号，不用云端，也没有机器人加入通话。",
		status: "测试版 0.7 · Linux 和 Windows · 开源",
		audience: [
			{
				title: "公务人员",
				text: "工作笔记留在机关的电脑和内网里，无需为第三方服务走审批流程。",
			},
			{
				title: "医疗与法律",
				text: "保密的交流永远不会到达外部服务商。",
			},
			{
				title: "受 GDPR 约束的企业",
				text: "没有需要申报的数据处理方，也没有需要说明的数据传输。",
			},
			{
				title: "本地 AI 爱好者",
				text: "接上你已经在运行的模型，一切由你掌控。",
			},
		],
		features: [
			{
				title: "会前准备",
				text: "在笔记里写下议程和几点想法，归入对应的项目文件夹。Syntheo 会提示同一项目最近几次会议谈过的内容。",
			},
			{
				title: "会中聆听",
				text: "采集麦克风和电脑声音，实时转写显示在页边。没有任何人加入通话，两路声音可分别静音。",
			},
			{
				title: "会后总结",
				text: "你的笔记成为会议纪要。来自你的内容保持绿色，Syntheo 补充的内容以墨色书写：谁写了什么一目了然。",
			},
			{
				title: "延续推进",
				text: "每个项目文件夹都维护一条决定、待议事项和任务的主线，并据此建议下一次会议的议程。",
			},
		],
		privacy: [
			"无需账号，没有遥测，没有机器人加入通话。",
			"音频只在内存中停留到转写完成，随即消失：留下的只有笔记。",
			"转写和撰写都经由你选择的服务器：Ollama、vLLM、MLX、NVIDIA NIM、speaches，或任何兼容 OpenAI 的 API。",
			"笔记保存在你电脑上的 SQLite 数据库中。",
		],
		figures: [
			{ value: "0", label: "秒：转写完成后保留的音频" },
			{ value: "20", label: "个版本：两周内从 0.1 发布到 0.7" },
			{ value: "≈ 4,000", label: "项应用自动化测试，另有 Rust 测试" },
			{ value: "MIT", label: "开源许可证，源自 Anarlog" },
		],
		stack:
			"Tauri 2（Rust）与 React 19，本地 SQLite 数据库；通过 NVIDIA NIM 或 speaches 上的 Whisper 实时转写；通过任何兼容 OpenAI 的 API 撰写；DTLN 回声消除（ONNX）。",
		limits: [
			"你需要一个自己掌控的转写模型和语言模型：小型转写模型可以在较新的笔记本上运行，中等规模的语言模型需要一块 RTX 3090、一台装有 MLX 的 Mac 或一台 DGX Spark。",
			"暂无 macOS 版本。",
			"这是测试版：升级到 0.7 的数据库无法再被 0.6 打开。",
		],
		visualAlt:
			"Syntheo 0.7 中一篇完成的笔记：用户的笔记由会议纪要补充完整，转写内容位于页边。",
		visualCaption:
			"Syntheo 0.7 中一篇完成的笔记（英文界面），由本地服务器上的模型转写并总结。",
	},
};
