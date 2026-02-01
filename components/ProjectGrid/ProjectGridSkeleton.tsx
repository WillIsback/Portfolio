export default function ProjectGridSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: 6 }, (_, i) => (
				<div
					key={`skeleton-${i}`}
					className="animate-pulse rounded-xl border border-gray-200 overflow-hidden"
				>
					{/* Image placeholder */}
					<div className="h-48 bg-gray-200" />

					{/* Content placeholder */}
					<div className="p-4 space-y-3">
						{/* Title */}
						<div className="h-5 bg-gray-200 rounded w-3/4" />

						{/* Description */}
						<div className="space-y-2">
							<div className="h-3 bg-gray-200 rounded w-full" />
							<div className="h-3 bg-gray-200 rounded w-5/6" />
						</div>

						{/* Tags */}
						<div className="flex gap-2 pt-2">
							<div className="h-6 bg-gray-200 rounded-full w-16" />
							<div className="h-6 bg-gray-200 rounded-full w-20" />
							<div className="h-6 bg-gray-200 rounded-full w-14" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
