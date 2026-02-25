import { ChevronLeft, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Schedule {
	id: string;
	name: string;
	totalDuration: number;
	startTime: string;
	endTime: string;
	feasible: boolean;
	conflicts: string[];
	items: ScheduleItem[];
}

interface ScheduleItem {
	movieId: string;
	sessionId: string;
	order: number;
	startTime: string;
	endTime: string;
	travelTime: number;
	movie?: {
		title: string;
	};
}

interface ScheduleSelectionStepProps {
	schedules: Schedule[];
	onSelect: (schedule: Schedule) => void;
	onBack: () => void;
}

export function ScheduleSelectionStep({
	schedules,
	onSelect,
	onBack,
}: ScheduleSelectionStepProps) {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={onBack}
					className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
				>
					<ChevronLeft className="h-5 w-5" />
				</Button>
				<div>
					<h2 className="font-semibold text-white text-xl">
						Cronogramas Sugeridos
					</h2>
					<p className="text-sm text-white/60">
						Encontramos {schedules.length} opções para você
					</p>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{schedules.map((schedule, index) => (
					<div
						key={schedule.id}
						className={`flex flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 ${
							schedule.feasible
								? "hover:border-emerald-300/90"
								: "hover:border-red-400/80"
						}`}
					>
						<div className="space-y-4">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="font-semibold text-lg text-white">
										Opção {index + 1}
									</h3>
									<div className="flex items-center gap-4 text-sm text-white/60">
										<span className="flex items-center gap-1">
											<Clock className="h-4 w-4" />
											{schedule.startTime} - {schedule.endTime}
										</span>
										<span>•</span>
										<span>{Math.round(schedule.totalDuration)} min total</span>
									</div>
								</div>
								{schedule.feasible ? (
									<div className="rounded-full bg-emerald-300/90 px-3 py-1 font-medium text-primary text-xs">
										✓ Viável
									</div>
								) : (
									<div className="rounded-full bg-red-400/80 px-3 py-1 font-medium text-primary-foreground text-xs">
										✗ Inviável
									</div>
								)}
							</div>

							{/* Mostrar conflitos se houver */}
							{schedule.conflicts && schedule.conflicts.length > 0 && (
								<div className="space-y-2 rounded-lg bg-black/30 p-3">
									<p className="font-medium text-white/80 text-xs">Detalhes:</p>
									{schedule.conflicts.map((conflict) => (
										<p
											key={`${schedule.id}-${conflict.substring(0, 20)}`}
											className={`text-xs ${
												conflict.startsWith("✅")
													? "text-emerald-300/90"
													: conflict.startsWith("❌")
														? "text-red-400/80"
														: "text-white/60"
											}`}
										>
											{conflict}
										</p>
									))}
								</div>
							)}

							<div className="space-y-3">
								{schedule.items
									.sort((a, b) => a.order - b.order)
									.map((item, i) => (
										<div key={item.sessionId} className="relative pl-8 pt-1.5">
											{/* Linha do tempo */}
											{i < schedule.items.length - 1 && (
												<div className="absolute top-6 left-[11px] h-full w-px bg-white/10" />
											)}
											<div className="absolute top-1.5 left-0 h-6 w-6 rounded-full border border-white/10 bg-black text-center font-medium text-[10px] text-white/60 leading-5">
												{i + 1}
											</div>

											<div className="space-y-1">
												<p className="font-medium text-white">
													{item.movie?.title || "Filme"}
												</p>
												<div className="flex items-center gap-3 text-white/50 text-xs">
													<span>
														{item.startTime} - {item.endTime}
													</span>
												</div>
												{item.travelTime > 0 && (
													<div className="flex items-center gap-1 py-1 text-blue-400 text-xs">
														<MapPin className="h-3 w-3" />
														{item.travelTime}min de deslocamento
													</div>
												)}
											</div>
										</div>
									))}
							</div>
						</div>

						<Button
							onClick={() => onSelect(schedule)}
							disabled={!schedule.feasible}
							className={`mt-6 w-full ${
								schedule.feasible
									? "cursor-pointer bg-white/10 text-white shadow-xl hover:bg-emerald-300/90 hover:text-primary"
									: "cursor-not-allowed bg-white/5 text-white/40"
							}`}
						>
							{schedule.feasible
								? "Selecionar Este Cronograma"
								: "Cronograma Inviável"}
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
