import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Cinema {
	id: string;
	code: string;
	name: string;
	state: string;
	optgroupLabel: string;
}

interface CinemaSelectionStepProps {
	cinemas: Cinema[];
	isLoading: boolean;
	onSelect: (cinema: Cinema) => void;
}

export function CinemaSelectionStep({
	cinemas,
	isLoading,
	onSelect,
}: CinemaSelectionStepProps) {
	// Agrupar cinemas por estado/cidade (optgroupLabel)
	const groupedCinemas = cinemas.reduce(
		(acc, cinema) => {
			if (!acc[cinema.optgroupLabel]) {
				acc[cinema.optgroupLabel] = [];
			}
			acc[cinema.optgroupLabel].push(cinema);
			return acc;
		},
		{} as Record<string, Cinema[]>,
	);

	return (
		<div className="fade-in slide-in-from-bottom-4 animate-in space-y-8 duration-500">
			<div className="space-y-2 text-left">
				<h2 className="font-bold text-2xl text-white tracking-tight">
					Escolha seu Cinema
				</h2>
				<p className="text-white/60">
					Selecione onde você quer assistir seu filme
				</p>
			</div>

			{isLoading ? (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Skeleton key={i} className="h-32 w-full rounded-xl bg-white/5" />
					))}
				</div>
			) : (
				<div className="space-y-8">
					{Object.entries(groupedCinemas).map(([label, cityCinemas]) => (
						<div key={label} className="space-y-4">
							<h3 className="flex items-center gap-2 pl-1 font-semibold text-lg text-white/80">
								<MapPin className="h-4 w-4 text-emerald-300/90" />
								{label}
							</h3>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{cityCinemas.map((cinema) => (
									<button
										key={cinema.id}
										type="button"
										onClick={() => onSelect(cinema)}
										className="group hover:-translate-y-1 relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-emerald-300/90 hover:bg-white/10 hover:shadow-lg hover:shadow-primary/5"
									>
										<div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />

										<div className="relative z-10 flex items-start justify-between gap-4">
											<div>
												<h4 className="mb-1 font-bold text-lg text-white transition-colors group-hover:text-emerald-300/90">
													{cinema.name}
												</h4>
											</div>
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-primary/20 group-hover:text-emerald-300/90">
												<ChevronRight className="h-4 w-4" />
											</div>
										</div>
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

import { ChevronRight } from "lucide-react";
