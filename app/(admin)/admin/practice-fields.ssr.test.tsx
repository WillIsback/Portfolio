import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PracticeFields } from "./PracticeFields";
import { TrainingSelect } from "./TrainingSelect";

describe("PracticeFields", () => {
	it("trois groupes, libellés français, état coché", () => {
		const html = renderToStaticMarkup(
			<PracticeFields selected={["Hardening"]} onToggle={() => {}} />,
		);
		for (const legend of ["DevOps", "SecOps", "MLOps"])
			expect(html).toContain(legend);
		expect(html).toContain("Durcissement");
		expect(html).toContain("Évaluation / monitoring LLM");
		expect(html.match(/checked=""/g)).toHaveLength(1);
	});
});

describe("TrainingSelect", () => {
	it("options et indice OpenClassrooms", () => {
		const html = renderToStaticMarkup(
			<TrainingSelect id="t" value={null} onChange={() => {}} hint />,
		);
		expect(html).toContain("Aucune");
		expect(html).toContain("Développeur FullStack IA");
		expect(html).toContain("AI Engineer");
		expect(html).toContain("Ressemble à un projet OpenClassrooms");
		expect(
			renderToStaticMarkup(
				<TrainingSelect
					id="t"
					value="AIEngineer"
					onChange={() => {}}
					hint={false}
				/>,
			),
		).not.toContain("Ressemble");
	});
});
