import {
	Calendar as CalendarIcon,
	Check,
	ChevronLeft,
	Clock,
	Info,
	LoaderCircleIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Movie {
	id: string;
	title: string;
	genre?: string;
	duration?: string;
	rating?: string;
	posterUrl?: string;
	sessions: MovieSession[];
}

interface MovieSession {
	id: string;
	time: string;
	sessionType?: string;
}

interface AvailableDate {
	value: string;
	displayText: string;
	dayOfWeek: string;
}

interface FlexibilityOptions {
	allowLateEntry: number;
	allowEarlyExit: number;
	breakTime: number;
}

interface MovieSelectionStepProps {
	movies: Movie[];
	isLoading: boolean;
	selectedMovieIds: string[];
	onToggleMovie: (movieId: string) => void;
	onGenerate: () => void;
	isGenerating: boolean;
	availableDates: AvailableDate[];
	selectedDate: string;
	onSelectDate: (date: string) => void;
	flexibilityOptions: FlexibilityOptions;
	setFlexibilityOptions: (options: FlexibilityOptions) => void;
	onBack: () => void;
	cinemaName?: string;
	isLoadingDates: boolean;
	isScraping?: boolean;
}

export function MovieSelectionStep({
	movies,
	isLoading,
	selectedMovieIds,
	onToggleMovie,
	onGenerate,
	isGenerating,
	availableDates,
	selectedDate,
	onSelectDate,
	flexibilityOptions,
	setFlexibilityOptions,
	onBack,
	cinemaName,
	isLoadingDates,
	isScraping,
}: MovieSelectionStepProps) {
	const [showDateSelector, setShowDateSelector] = React.useState(false);
	const [showFlexibilitySettings, setShowFlexibilitySettings] =
		React.useState(false);

	const lateEntryId = useId();
	const earlyExitId = useId();
	const breakTimeId = useId();

	return (
		<div className="fade-in slide-in-from-bottom-4 animate-in space-y-6 duration-500">
			{/* Header e Controles */}
			<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
						<h2 className="font-bold text-2xl text-white tracking-tight">
							Selecione os Filmes
						</h2>
						<p className="text-white/60">
							{cinemaName} •{" "}
							{selectedDate
								? (() => {
										// Parse date as local to avoid timezone issues
										const [year, month, day] = selectedDate
											.split("-")
											.map(Number);
										const date = new Date(year, month - 1, day);
										return date.toLocaleDateString("pt-BR", {
											weekday: "long",
											day: "numeric",
											month: "long",
										});
									})()
								: "Selecione uma data"}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button
						variant="outline"
						onClick={() => setShowDateSelector(!showDateSelector)}
						className="cursor-pointer border-white/10 bg-white/5 text-white hover:bg-white/10"
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						Trocar Data
					</Button>
					<Button
						variant="outline"
						onClick={() => setShowFlexibilitySettings(!showFlexibilitySettings)}
						className="cursor-pointer border-white/10 bg-white/5 text-white hover:bg-white/10"
					>
						<Clock className="mr-2 h-4 w-4" />
						Flexibilidade
					</Button>
					<Button
						onClick={onGenerate}
						disabled={selectedMovieIds.length === 0 || isGenerating}
						className="cursor-pointer bg-emerald-300/90 text-primary shadow-emerald-300/90/20 shadow-lg hover:bg-emerald-300/90/90"
					>
						{isGenerating ? (
							<>
								<LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
								Gerando...
							</>
						) : (
							`Gerar Cronogramas (${selectedMovieIds.length})`
						)}
					</Button>
				</div>
			</div>

			{/* Seletor de Data */}
			{showDateSelector && (
				<div className="zoom-in-95 animate-in rounded-xl border border-white/10 bg-white/5 p-6 duration-200">
					<h3 className="mb-4 font-medium text-white">Datas Disponíveis</h3>

					{isLoadingDates ? (
						<div className="flex justify-center py-8">
							<LoaderCircleIcon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="grid gap-3 md:grid-cols-4">
							{availableDates.map((date) => (
								<button
									key={date.value}
									type="button"
									onClick={() => {
										onSelectDate(date.value);
										setShowDateSelector(false);
									}}
									className={`rounded-lg border p-3 text-left transition-all ${
										selectedDate === date.value
											? "border-emerald-300/90 bg-emerald-300/90/10"
											: "border-white/10 bg-white/5 hover:border-emerald-300/90 hover:bg-white/10"
									}`}
								>
									<p className="font-semibold text-sm text-white">
										{date.displayText}
									</p>
								</button>
							))}
						</div>
					)}
				</div>
			)}

			{/* Configurações de Flexibilidade */}
			{showFlexibilitySettings && (
				<div className="zoom-in-95 animate-in rounded-xl border border-white/10 bg-white/5 p-6 duration-200">
					<h3 className="mb-4 flex items-center gap-2 font-medium text-lg text-white">
						<Clock className="h-5 w-5 text-emerald-300/90" />
						Configurações de Flexibilidade
					</h3>

					<div className="grid gap-6 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor={lateEntryId} className="text-white">
								Atraso Permitido
							</Label>
							<div className="relative">
								<Input
									id={lateEntryId}
									type="number"
									min="0"
									max="30"
									value={flexibilityOptions.allowLateEntry}
									onChange={(e) =>
										setFlexibilityOptions({
											...flexibilityOptions,
											allowLateEntry: Number(e.target.value) || 0,
										})
									}
									className="border-white/10 bg-black/20 pr-16 text-white"
								/>
								<span className="-translate-y-1/2 absolute top-1/2 right-3 text-white/40 text-xs">
									minutos
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor={earlyExitId} className="text-white">
								Saída Antecipada
							</Label>
							<div className="relative">
								<Input
									id={earlyExitId}
									type="number"
									min="0"
									max="30"
									value={flexibilityOptions.allowEarlyExit}
									onChange={(e) =>
										setFlexibilityOptions({
											...flexibilityOptions,
											allowEarlyExit: Number(e.target.value) || 0,
										})
									}
									className="border-white/10 bg-black/20 pr-16 text-white"
								/>
								<span className="-translate-y-1/2 absolute top-1/2 right-3 text-white/40 text-xs">
									minutos
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor={breakTimeId} className="text-white">
								Intervalo Mínimo
							</Label>
							<div className="relative">
								<Input
									id={breakTimeId}
									type="number"
									min="0"
									max="60"
									value={flexibilityOptions.breakTime}
									onChange={(e) =>
										setFlexibilityOptions({
											...flexibilityOptions,
											breakTime: Number(e.target.value) || 0,
										})
									}
									className="border-white/10 bg-black/20 pr-16 text-white"
								/>
								<span className="-translate-y-1/2 absolute top-1/2 right-3 text-white/40 text-xs">
									minutos
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Lista de Filmes */}
			{isLoading ? (
				<div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
						<Skeleton
							key={i}
							className="aspect-[2/3] w-full rounded-xl bg-white/5"
						/>
					))}
				</div>
			) : isScraping || (movies.length === 0 && !isLoading) ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-16 text-center">
					<div className="relative mb-6">
						<div className="absolute inset-0 animate-ping rounded-full bg-emerald-300/90/20 opacity-75" />
						<div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-300/90/10 text-primary">
							<LoaderCircleIcon className="h-8 w-8 animate-spin" />
						</div>
					</div>
					<h3 className="mb-2 font-semibold text-white text-xl">
						Buscando programação atualizada...
					</h3>
					<p className="max-w-md text-white/60">
						Estamos verificando os horários mais recentes diretamente no site do
						cinema. Isso pode levar alguns segundos.
					</p>
				</div>
			) : movies.length === 0 ? (
				<div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
					<Info className="mx-auto mb-4 h-12 w-12 text-white/20" />
					<h3 className="mb-2 font-medium text-lg text-white">
						Nenhum filme encontrado
					</h3>
					<p className="text-white/60">
						Não encontramos sessões disponíveis para esta data. Tente selecionar
						outro dia.
					</p>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{movies.map((movie) => {
						const isSelected = selectedMovieIds.includes(movie.id);
						return (
							<button
								key={movie.id}
								type="button"
								onClick={() => onToggleMovie(movie.id)}
								className={`group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all duration-300 ${
									isSelected
										? "scale-[1.02] border-emerald-300/90 bg-white/5 shadow-emerald-300/90/10 shadow-xl"
										: "hover:-translate-y-1 border-transparent bg-white/5 hover:border-white/20 hover:bg-white/10"
								}`}
							>
								{/* Poster Image - Vertical */}
								<div className="relative aspect-[2/3] w-full overflow-hidden bg-black/40">
									{movie.posterUrl ? (
										<Image
											src={movie.posterUrl}
											alt={movie.title}
											fill
											className={`object-cover transition-transform duration-500 ${isSelected ? "scale-105" : "group-hover:scale-105"}`}
											sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
										/>
									) : (
										<div className="flex h-full items-center justify-center bg-white/5">
											<span className="text-white/20">Sem imagem</span>
										</div>
									)}

									{/* Overlay Gradient */}
									<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

									{/* Selection Indicator */}
									<div
										className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
											isSelected
												? "scale-100 bg-emerald-300/90 text-primary opacity-100"
												: "scale-90 bg-black/50 text-white/50 opacity-0 group-hover:opacity-100"
										}`}
									>
										<Check className="h-5 w-5" />
									</div>

									{/* Content Overlay */}
									<div className="absolute right-0 bottom-0 left-0 p-4">
										<h3 className="mb-1 line-clamp-2 font-bold text-white leading-tight">
											{movie.title}
										</h3>
										<div className="flex flex-wrap gap-2 font-medium text-[10px] text-white/70">
											{movie.genre && <span>{movie.genre}</span>}
											{movie.duration && (
												<>
													<span>•</span>
													<span>{movie.duration}</span>
												</>
											)}
										</div>
									</div>
								</div>

								{/* Sessions Info */}
								<div className="flex-1 border-white/5 border-t bg-white/5 p-3">
									<p className="mb-2 font-medium text-[10px] text-white/40 uppercase tracking-wider">
										Sessões
									</p>
									<div className="flex flex-wrap gap-1.5">
										{movie.sessions.slice(0, 5).map((session) => (
											<span
												key={session.id}
												className={`rounded px-1.5 py-0.5 font-medium text-[10px] ${
													isSelected
														? "bg-emerald-300/90 text-primary"
														: "bg-white/10 text-white/70"
												}`}
											>
												{session.time}
											</span>
										))}
										{movie.sessions.length > 5 && (
											<span className="rounded bg-white/5 px-1.5 py-0.5 font-medium text-[10px] text-white/40">
												+{movie.sessions.length - 5}
											</span>
										)}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
