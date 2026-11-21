import type { Locale } from "@/i18n/routing";
import type { SolutionCopy } from "@/lib/solutions";

/**
 * Textes de la page Grammaria, repris du README, de la documentation de
 * grammaria.fr et de celui du moteur grammaria-rc. La démonstration est la
 * sortie réelle du moteur (README de grammaria-rc) : la phrase reste en
 * français dans toutes les locales, seules les explications sont traduites.
 */
const DEMO_INPUT =
	"Elle semble être totalement ruiné. Les enfants mange des pommes.";

export const GRAMMARIA_COPY: Record<Locale, SolutionCopy> = {
	fr: {
		tagline:
			"Le correcteur de français qui corrige tout de suite, et vous aide à ne plus refaire les mêmes fautes.",
		summary:
			"Grammaria corrige votre texte avec le modèle de langage que vous choisissez, nomme chaque faute avec son propre moteur de grammaire et repère celles qui reviennent. Vos textes ne sont jamais gardés.",
		status: "Bêta 0.5 · Windows, Linux et Docker · open source",
		audience: [
			{
				title: "Ceux qui écrivent tous les jours",
				text: "Messages, courriels, comptes rendus : pour qui traîne des lacunes à l'écrit sans avoir le temps de les combler. Pas de cours, pas d'exercices.",
			},
			{
				title: "Les organisations",
				text: "Le modèle peut être celui de votre infrastructure ; installation sans droits d'administrateur, MSI pour un déploiement géré, ou serveur Docker.",
			},
			{
				title: "Les volontaires de la bêta",
				text: "Quatre à six semaines d'usage normal, puis, si vous le voulez, un fichier de chiffres sans aucun texte.",
			},
		],
		features: [
			{
				title: "Une correction instantanée",
				text: "Collez, cliquez sur Corriger : le texte corrigé s'affiche à mesure que le modèle l'écrit, et se copie aussitôt.",
			},
			{
				title: "Chaque faute nommée",
				text: "Le moteur de grammaire nomme chaque faute. Treize confusions courantes (a/à, on/ont, ces/ses, -er/-é…) ont une fiche « remplacez par X, car Y ».",
			},
			{
				title: "Les fautes qui reviennent",
				text: "Quand une faute revient, une astuce, puis un choix entre deux formes, s'affichent près du bouton Copier, sans retarder la copie.",
			},
			{
				title: "La progression visible",
				text: "Une note sur 20, un écran Progression et dix-huit badges sobres, sans série à ne pas casser.",
			},
		],
		privacy: [
			"Le texte n'est envoyé qu'au modèle de langage choisi : sur votre poste, sur un serveur interne ou chez un fournisseur compatible OpenAI.",
			"L'analyse des fautes et le journal restent sur votre poste.",
			"Le journal ne garde aucun texte : des identifiants de règles, des dates et des compteurs.",
			"Pas de compte, pas de serveur central, pas de télémétrie vers l'auteur ; la clé API est rangée dans le trousseau du système.",
		],
		figures: [
			{
				value: "0,5 s",
				label:
					"pour démarrer le moteur grammaria-rc, contre 4,5 s pour LanguageTool en JavaScript",
			},
			{
				value: "86,4 %",
				label: "des fautes trouvées sur les bancs d'essai, contre 76,4 %",
			},
			{
				value: "8,8",
				label: "alarmes pour 1 000 mots de prose soignée, contre 21,6",
			},
			{
				value: "7 Mo",
				label: "pour l'installeur Windows ; environ 9 Mo pour le paquet .deb",
			},
		],
		stack:
			"Application de bureau Tauri 2 et React, ou serveur Docker ; moteur de grammaire grammaria-rc en Rust, qui lit les règles françaises de LanguageTool et y ajoute 1 320 règles ; modèle de langage par Ollama, vLLM ou toute API compatible OpenAI.",
		limits: [
			"L'effet des astuces sur la progression n'est pas encore démontré : c'est l'objet de la bêta.",
			"Pas de version Mac.",
			"Le serveur Docker ne gère qu'un utilisateur et n'a pas d'authentification.",
			"Avec un fournisseur en ligne, le texte part chez lui ; avec un modèle local ou interne, rien ne sort de chez vous.",
		],
		visualAlt:
			"Exemple d'analyse : deux fautes de la phrase, nommées par le moteur de grammaire avec leur correction et leur explication.",
		visualCaption:
			"Sortie réelle du moteur grammaria-rc sur une phrase d'exemple.",
		demo: {
			input: DEMO_INPUT,
			faults: [
				{
					wrong: "ruiné",
					right: "ruinée",
					rule: "GRM_ATTRIBUT_GENRE_PRONOM",
					why: "Accord en genre : « ruiné » se rapporte au sujet « Elle », féminin singulier.",
				},
				{
					wrong: "mange",
					right: "mangent",
					rule: "ACCORD_SUJET_VERBE",
					why: "Le verbe devrait être à la 3ᵉ personne du pluriel.",
				},
			],
		},
	},
	en: {
		tagline:
			"The French spell and grammar checker that fixes your text at once, and helps you stop making the same mistakes.",
		summary:
			"Grammaria corrects your French text with the language model you choose, names each mistake with its own grammar engine and spots the ones that keep coming back. Your texts are never kept.",
		status: "Beta 0.5 · Windows, Linux and Docker · open source",
		audience: [
			{
				title: "People who write French every day",
				text: "Messages, emails, minutes: for anyone with gaps in their written French and no time to fill them. No lessons, no exercises.",
			},
			{
				title: "Organisations",
				text: "The model can be the one on your own infrastructure; installs without admin rights, an MSI for managed deployment, or a Docker server.",
			},
			{
				title: "Beta volunteers",
				text: "Four to six weeks of normal use, then, if you wish, a file of figures containing no text at all.",
			},
		],
		features: [
			{
				title: "Instant correction",
				text: "Paste, click Correct: the corrected text appears as the model writes it, and can be copied right away.",
			},
			{
				title: "Every mistake named",
				text: "The grammar engine names each mistake. Thirteen common French confusions (a/à, on/ont, ces/ses, -er/-é…) have a “replace with X, because Y” card.",
			},
			{
				title: "Recurring mistakes",
				text: "When a mistake comes back, a tip, then a choice between two forms, appears next to the Copy button, without delaying the copy.",
			},
			{
				title: "Visible progress",
				text: "A mark out of 20, a Progress screen and eighteen understated badges, with no streak to keep alive.",
			},
		],
		privacy: [
			"Your text is only sent to the language model you chose: on your computer, on an internal server or at an OpenAI-compatible provider.",
			"Mistake analysis and the log stay on your computer.",
			"The log keeps no text at all: rule identifiers, dates and counters.",
			"No account, no central server, no telemetry to the author; the API key is stored in the system keychain.",
		],
		figures: [
			{
				value: "0.5 s",
				label:
					"to start the grammaria-rc engine, against 4.5 s for LanguageTool in JavaScript",
			},
			{
				value: "86.4%",
				label: "of mistakes found across the benchmarks, against 76.4%",
			},
			{
				value: "8.8",
				label: "alarms per 1,000 words of well-edited prose, against 21.6",
			},
			{
				value: "7 MB",
				label: "for the Windows installer; about 9 MB for the .deb package",
			},
		],
		stack:
			"Tauri 2 and React desktop application, or a Docker server; grammaria-rc grammar engine in Rust, which reads LanguageTool's French rules and adds 1,320 of its own; language model through Ollama, vLLM or any OpenAI-compatible API.",
		limits: [
			"The effect of the tips on progress has not been shown yet: that is what the beta is for.",
			"No Mac version.",
			"The Docker server handles a single user and has no authentication.",
			"With an online provider, your text goes to that provider; with a local or internal model, nothing leaves your premises.",
		],
		visualAlt:
			"Analysis example: two mistakes in the sentence, named by the grammar engine with their correction and explanation.",
		visualCaption:
			"Actual output of the grammaria-rc engine on a sample French sentence.",
		demo: {
			input: DEMO_INPUT,
			faults: [
				{
					wrong: "ruiné",
					right: "ruinée",
					rule: "GRM_ATTRIBUT_GENRE_PRONOM",
					why: "Gender agreement: “ruiné” refers to the subject “Elle” (she), feminine singular.",
				},
				{
					wrong: "mange",
					right: "mangent",
					rule: "ACCORD_SUJET_VERBE",
					why: "The verb should be in the third person plural.",
				},
			],
		},
	},
	zh: {
		tagline: "立即纠正法语文本，并帮你不再重复犯同样错误的法语校对工具。",
		summary:
			"Grammaria 用你选择的语言模型校对法语文本，用自研的语法引擎为每个错误命名，并找出反复出现的错误。你的文本从不被保存。",
		status: "测试版 0.5 · Windows、Linux 和 Docker · 开源",
		audience: [
			{
				title: "每天用法语写作的人",
				text: "消息、邮件、会议纪要：适合法语书面表达有短板、却没时间补课的人。没有课程，也没有练习。",
			},
			{
				title: "机构",
				text: "可以使用你自己基础设施上的模型；无需管理员权限即可安装，提供用于统一部署的 MSI，也可用 Docker 服务器。",
			},
			{
				title: "测试版志愿者",
				text: "照常使用四到六周，然后如果你愿意，提交一个不含任何文本的数据文件。",
			},
		],
		features: [
			{
				title: "即时校对",
				text: "粘贴，点击“校对”：校正后的文本随模型书写逐步显示，可以马上复制。",
			},
			{
				title: "每个错误都有名字",
				text: "语法引擎为每个错误命名。十三种常见的法语混淆（a/à、on/ont、ces/ses、-er/-é……）配有“替换为 X，因为 Y”的说明卡。",
			},
			{
				title: "反复出现的错误",
				text: "当某个错误再次出现时，“复制”按钮旁会显示一条提示，下一次则让你在两种写法中选择，不会拖慢复制。",
			},
			{
				title: "看得见的进步",
				text: "20 分制评分、“进步”页面和十八枚低调的徽章，没有需要保持的连续打卡。",
			},
		],
		privacy: [
			"文本只发送给你选择的语言模型：在你的电脑上、内部服务器上，或兼容 OpenAI 的服务商。",
			"错误分析和日志都留在你的电脑上。",
			"日志不保存任何文本：只有规则标识、日期和计数。",
			"无需账号，没有中央服务器，不向作者发送遥测；API 密钥存放在系统钥匙串中。",
		],
		figures: [
			{
				value: "0.5 秒",
				label: "启动 grammaria-rc 引擎，JavaScript 版 LanguageTool 需要 4.5 秒",
			},
			{ value: "86.4%", label: "基准测试中找出的错误比例，对照为 76.4%" },
			{ value: "8.8", label: "每千词规范文本的报警数，对照为 21.6" },
			{ value: "7 MB", label: "Windows 安装程序大小；.deb 包约 9 MB" },
		],
		stack:
			"Tauri 2 与 React 桌面应用，或 Docker 服务器；Rust 编写的 grammaria-rc 语法引擎，读取 LanguageTool 的法语规则并新增 1,320 条规则；语言模型通过 Ollama、vLLM 或任何兼容 OpenAI 的 API 接入。",
		limits: [
			"提示对进步的效果尚未得到证明：这正是测试版要验证的。",
			"没有 Mac 版本。",
			"Docker 服务器只支持一个用户，且没有身份验证。",
			"使用在线服务商时，文本会发送给该服务商；使用本地或内部模型时，没有任何内容离开你的环境。",
		],
		visualAlt: "分析示例：句子中的两个错误，由语法引擎命名，并给出修改和解释。",
		visualCaption: "grammaria-rc 引擎对一个法语示例句子的真实输出。",
		demo: {
			input: DEMO_INPUT,
			faults: [
				{
					wrong: "ruiné",
					right: "ruinée",
					rule: "GRM_ATTRIBUT_GENRE_PRONOM",
					why: "性的配合：“ruiné”指代主语“Elle”（她），应为阴性单数。",
				},
				{
					wrong: "mange",
					right: "mangent",
					rule: "ACCORD_SUJET_VERBE",
					why: "动词应使用第三人称复数。",
				},
			],
		},
	},
};
