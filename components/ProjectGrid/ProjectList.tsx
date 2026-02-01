"use client";

import type { ProjectWithRelations } from "@/app/actions/projects.action";
import ProjectCard from "./ProjectCard/ProjectCard";

interface ProjectListProps {
	projects: ProjectWithRelations[];
}

export default function ProjectList({ projects }: ProjectListProps) {
	if (!projects.length) {
		return (
			<div className="text-center py-12 text-gray-500">
				<p className="text-lg">Aucun projet trouvé</p>
				<p className="text-sm mt-2">Essayez de modifier vos filtres</p>
			</div>
		);
	}

	return (
		<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{projects.map((project) => (
				<li key={project.id}>
					<ProjectCard
						id={project.id}
						name={project.title}
						description={project.description}
						image_path={project.imagePath ?? ""}
						type={project.frontends[0]?.frontend ?? "Autre"}
						github={project.github ?? ""}
						lastUpdate={
							project.lastUpdate instanceof Date
								? project.lastUpdate.toISOString()
								: (project.lastUpdate ?? undefined)
						}
						isPrivate={project.isPrivate}
						isAiGenerated={project.isAiGenerated}
						languages={project.languages.map((l) => l.language)}
						databases={project.databases.map((d) => d.database)}
						backends={project.backends.map((b) => b.backend)}
						frontends={project.frontends.map((f) => f.frontend)}
						devops={project.devops.map((d) => d.devops)}
					/>
				</li>
			))}
		</ul>
	);
}
