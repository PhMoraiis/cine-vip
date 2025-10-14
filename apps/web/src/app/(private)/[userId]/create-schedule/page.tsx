"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/auth-client";

interface Cinema {
	id: string;
	code: string;
	name: string;
	state: string;
	optgroupLabel: string;
}

interface AvailableDate {
	value: string;
	displayText: string;
	dayOfWeek: string;
}

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
}

type Step = "cinema" | "movies" | "schedules" | "name";

export default function CreateSchedulePage() {
	const { data: session, isPending: sessionPending } = useSession();
	const router = useRouter();
	const params = useParams();
	const userIdFromUrl = params.userId as string;
	const scheduleNameId = useId();
	const lateEntryId = useId();
	const earlyExitId = useId();
	const breakTimeId = useId();

	// State
	const [step, setStep] = useState<Step>("cinema");
	const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
	const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
		null,
	);
	const [scheduleName, setScheduleName] = useState<string>("");
	const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
	const [showDateSelector, setShowDateSelector] = useState(false);
	const [showFlexibilitySettings, setShowFlexibilitySettings] = useState(false);
	const [flexibilityOptions, setFlexibilityOptions] = useState({
		allowLateEntry: 5,
		allowEarlyExit: 5,
		breakTime: 5,
	});

	// Queries
	const { data: cinemasData, isLoading: cinemasLoading } = useQuery({
		queryKey: ["cinemas"],
		queryFn: async () => {
			const response = await fetch("http://localhost:3000/api/cinemas");
			if (!response.ok) throw new Error("Failed to fetch cinemas");
			const data = await response.json();

			// Se não houver cinemas, fazer scraping
			if (!data.cinemas || data.cinemas.length === 0) {
				const scrapeResponse = await fetch(
					"http://localhost:3000/api/cinemas",
					{
						method: "POST",
					},
				);
				if (scrapeResponse.ok) {
					const newData = await scrapeResponse.json();
					return newData;
				}
			}

			return data;
		},
	});

	// Mutation para fazer scraping de datas
	const scrapeDates = useMutation({
		mutationFn: async (cinemaCode: string) => {
			const response = await fetch(
				`http://localhost:3000/api/date/${cinemaCode}`,
				{
					method: "POST",
				},
			);
			if (!response.ok) throw new Error("Failed to scrape dates");
			return response.json();
		},
		onSuccess: (data) => {
			setAvailableDates(data.availableDates || []);
			// Selecionar automaticamente a primeira data após o scraping
			const firstDate = data.availableDates?.[0]?.value;
			if (firstDate) {
				setSelectedDate(firstDate);
				setStep("movies");
			}
		},
	});

	// Mutation para buscar datas disponíveis
	const fetchAvailableDates = useMutation({
		mutationFn: async (cinemaCode: string) => {
			const response = await fetch(
				`http://localhost:3000/api/dates/${cinemaCode}`,
				{
					method: "GET",
				},
			);
			if (!response.ok) throw new Error("Failed to fetch available dates");
			return response.json();
		},
		onSuccess: (data) => {
			const dates = data.availableDates || [];
			setAvailableDates(dates);

			// Verificar se a primeira data é diferente de hoje
			const today = new Date().toISOString().split("T")[0];
			const firstDate = dates[0]?.value;

			if (firstDate && firstDate !== today && selectedCinema) {
				// Fazer scraping de datas se a primeira data não for hoje
				scrapeDates.mutate(selectedCinema.code);
			} else if (firstDate) {
				// Selecionar automaticamente a primeira data (hoje)
				setSelectedDate(firstDate);
				setStep("movies");
			}
		},
	});

	// Mutation para fazer scraping de sessões
	const scrapeSessions = useMutation({
		mutationFn: async ({
			cinemaCode,
			date,
		}: {
			cinemaCode: string;
			date: string;
		}) => {
			const response = await fetch(
				`http://localhost:3000/api/sessions/${cinemaCode}/${date}`,
				{
					method: "POST",
				},
			);
			if (!response.ok) throw new Error("Failed to scrape sessions");
			return response.json();
		},
	});

	const { data: moviesData, isLoading: moviesLoading } = useQuery({
		queryKey: ["movies", selectedCinema?.code, selectedDate],
		queryFn: async () => {
			if (!selectedCinema || !selectedDate) return null;
			const response = await fetch(
				`http://localhost:3000/api/sessions/${selectedCinema.code}/${selectedDate}`,
				{
					method: "GET",
				},
			);

			// Se não houver dados (404 ou vazio), fazer scraping
			if (!response.ok) {
				const scrapeResponse = await scrapeSessions.mutateAsync({
					cinemaCode: selectedCinema.code,
					date: selectedDate,
				});
				return scrapeResponse;
			}

			const data = await response.json();

			// Se retornar mas não houver filmes, fazer scraping
			if (!data.movies || data.movies.length === 0) {
				const scrapeResponse = await scrapeSessions.mutateAsync({
					cinemaCode: selectedCinema.code,
					date: selectedDate,
				});
				return scrapeResponse;
			}

			return data;
		},
		enabled: !!selectedCinema && !!selectedDate && step === "movies",
	});

	// Mutation para gerar cronogramas
	const generateSchedules = useMutation({
		mutationFn: async (movieIds: string[]) => {
			if (!selectedCinema || !selectedDate || !session?.user?.id) {
				throw new Error("Missing required data");
			}

			console.log("🎬 Gerando cronogramas com:", {
				userId: session.user.id,
				cinemaCode: selectedCinema.code,
				date: selectedDate,
				movieIds,
			});

			const response = await fetch(
				"http://localhost:3000/api/schedules/generate",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: session.user.id,
						cinemaCode: selectedCinema.code,
						date: selectedDate,
						movieIds,
						flexibilityOptions,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("❌ Erro na resposta:", errorData);
				throw new Error("Failed to generate schedules");
			}

			const data = await response.json();
			console.log("✅ Cronogramas recebidos:", data);
			return data;
		},
		onSuccess: (data) => {
			console.log(
				"✅ Mutation success, schedules:",
				data?.schedules || data?.recommendations,
			);
		},
		onError: (error) => {
			console.error("❌ Mutation error:", error);
		},
	});

	// Mutation para salvar cronograma
	const saveSchedule = useMutation({
		mutationFn: async ({
			name,
			scheduleId,
		}: {
			name: string;
			scheduleId: string;
		}) => {
			if (!session?.user?.id) throw new Error("User not authenticated");

			const response = await fetch("http://localhost:3000/api/schedules/save", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: session.user.id,
					name,
					scheduleId,
				}),
			});

			if (!response.ok) throw new Error("Failed to save schedule");
			return response.json();
		},
		onSuccess: () => {
			router.push(`/${session?.user?.id}/dashboard`);
		},
	});

	// Validar usuário
	useEffect(() => {
		if (!sessionPending && !session) {
			router.push("/auth");
		}
		if (!sessionPending && session && userIdFromUrl !== session.user.id) {
			router.push(`/${session.user.id}/create-schedule`);
		}
	}, [session, sessionPending, userIdFromUrl, router]);

	const handleLogout = async () => {
		await signOut();
		router.push("/auth");
	};

	const handleSelectCinema = (cinema: Cinema) => {
		setSelectedCinema(cinema);
		setSelectedDate("");
		setSelectedMovieIds([]);
		fetchAvailableDates.mutate(cinema.code);
	};

	const handleSelectDate = (date: string) => {
		setSelectedDate(date);
		setSelectedMovieIds([]);
		setStep("movies");
	};

	const handleToggleMovie = (movieId: string) => {
		setSelectedMovieIds((prev) =>
			prev.includes(movieId)
				? prev.filter((id) => id !== movieId)
				: [...prev, movieId],
		);
	};

	const handleGenerateSchedules = async () => {
		if (selectedMovieIds.length === 0) return;

		try {
			const result = await generateSchedules.mutateAsync(selectedMovieIds);
			console.log("📊 Resultado completo:", result);

			// A API retorna 'recommendations' em vez de 'schedules'
			if (result?.recommendations && result.recommendations.length > 0) {
				setStep("schedules");
			} else {
				console.error("❌ Nenhum cronograma foi gerado");
			}
		} catch (error) {
			console.error("Error generating schedules:", error);
		}
	};

	const handleSelectSchedule = (schedule: Schedule) => {
		setSelectedSchedule(schedule);
		setScheduleName(`Cronograma ${selectedCinema?.name} - ${selectedDate}`);
		setStep("name");
	};

	const handleSaveSchedule = async () => {
		if (!selectedSchedule || !scheduleName.trim()) return;

		try {
			await saveSchedule.mutateAsync({
				name: scheduleName,
				scheduleId: selectedSchedule.id,
			});
		} catch (error) {
			console.error("Error saving schedule:", error);
		}
	};

	if (sessionPending || !session) {
		return null;
	}

	const cinemas: Cinema[] = cinemasData?.cinemas || [];
	const movies: Movie[] = moviesData?.movies || [];
	// A API retorna 'recommendations' em vez de 'schedules'
	const schedules: Schedule[] =
		generateSchedules.data?.recommendations ||
		generateSchedules.data?.schedules ||
		[];

	// Agrupar cinemas por estado
	const cinemasByState = cinemas.reduce(
		(acc, cinema) => {
			const state = cinema.state || "Outros";
			if (!acc[state]) {
				acc[state] = [];
			}
			acc[state].push(cinema);
			return acc;
		},
		{} as Record<string, Cinema[]>,
	);

	const sortedStates = Object.keys(cinemasByState).sort();

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="relative">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
					<Link href="/" className="group inline-flex items-center gap-3">
						<Image src="/switch.png" alt="Logo" width={24} height={24} />
						<div className="flex flex-col leading-none">
							<span
								className="font-normal text-[15px] text-white/90 tracking-tight"
								style={{ fontFamily: '"Inter", ui-sans-serif, system-ui' }}
							>
								OnCine
							</span>
							<span
								className="font-normal text-[11px] text-white/50"
								style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
							>
								Agendas de filmes inteligentes
							</span>
						</div>
					</Link>

					<nav className="hidden items-center gap-7 md:flex">
						<Link
							href={`/${session.user.id}/dashboard`}
							className="font-normal text-[14px] text-white/70 transition-colors hover:text-white"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							Meus Cronogramas
						</Link>
					</nav>

					<div className="flex items-center gap-3">
						<Button
							className="cursor-pointer rounded-md bg-white/10 px-3.5 py-2 font-normal text-[14px] text-white shadow-md ring-1 ring-white/15 transition-all hover:bg-white/20"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
							onClick={handleLogout}
						>
							Encerrar Sessão
						</Button>
					</div>
				</div>
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="h-px w-full bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
				<div className="mb-8">
					<h1 className="mb-2 font-semibold text-3xl text-white">
						Criar Cronograma
					</h1>
					<p className="text-white/60">
						Selecione cinema, data e filmes para gerar seu cronograma perfeito
					</p>
				</div>

				{/* Steps Indicator */}
				<div className="mb-8 flex items-center gap-4">
					{["cinema", "movies", "schedules", "name"].map((s, index) => (
						<div key={s} className="flex items-center gap-2">
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm ${
									step === s
										? "bg-blue-600 text-white"
										: index <
												["cinema", "movies", "schedules", "name"].indexOf(step)
											? "bg-green-600 text-white"
											: "bg-white/10 text-white/40"
								}`}
							>
								{index + 1}
							</div>
							{index < 3 && <div className="h-px w-12 bg-white/10" />}
						</div>
					))}
				</div>

				{/* Step: Selecionar Cinema */}
				{step === "cinema" && (
					<div className="space-y-6">
						<h2 className="font-semibold text-white text-xl">
							Selecione um Cinema
						</h2>
						{cinemasLoading ? (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{[1, 2, 3, 4, 5, 6].map((i) => (
									<Skeleton key={i} className="h-20 w-full rounded-lg" />
								))}
							</div>
						) : (
							<div className="space-y-6">
								{sortedStates.map((state) => (
									<div key={state} className="space-y-3">
										<h3 className="font-semibold text-lg text-white/80">
											{state}
										</h3>
										<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
											{cinemasByState[state].map((cinema) => (
												<button
													key={cinema.id}
													type="button"
													onClick={() => handleSelectCinema(cinema)}
													className="rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-blue-500 hover:bg-white/10"
												>
													<h4 className="font-semibold text-white">
														{cinema.name}
													</h4>
													<p className="text-sm text-white/60">
														{cinema.state}
													</p>
												</button>
											))}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Step: Selecionar Filmes */}
				{step === "movies" && (
					<div className="space-y-4">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div className="flex items-center gap-4">
								<Button
									variant="outline"
									onClick={() => {
										setStep("cinema");
										setSelectedCinema(null);
										setSelectedDate("");
										setSelectedMovieIds([]);
									}}
									className="text-white"
								>
									← Voltar
								</Button>
								<div>
									<h2 className="font-semibold text-white text-xl">
										Selecione os Filmes
									</h2>
									<p className="text-sm text-white/60">
										{selectedCinema?.name} - {selectedDate}
									</p>
								</div>
							</div>

							<div className="flex gap-3">
								<Button
									variant="outline"
									onClick={() => setShowDateSelector(!showDateSelector)}
									className="text-white"
								>
									📅 Trocar Data
								</Button>
								<Button
									variant="outline"
									onClick={() =>
										setShowFlexibilitySettings(!showFlexibilitySettings)
									}
									className="text-white"
								>
									⚙️ Flexibilidade
								</Button>
								<Button
									onClick={handleGenerateSchedules}
									disabled={
										selectedMovieIds.length === 0 || generateSchedules.isPending
									}
									className="bg-blue-600 hover:bg-blue-700"
								>
									{generateSchedules.isPending ? (
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
							<div className="rounded-lg border border-white/10 bg-white/5 p-4">
								<h3 className="mb-3 font-medium text-white">
									Datas Disponíveis
								</h3>
								{fetchAvailableDates.isPending || scrapeDates.isPending ? (
									<div className="grid gap-3 md:grid-cols-4">
										{[1, 2, 3, 4].map((i) => (
											<Skeleton key={i} className="h-16 w-full rounded-lg" />
										))}
									</div>
								) : (
									<div className="grid gap-3 md:grid-cols-4">
										{availableDates.map((date) => (
											<button
												key={date.value}
												type="button"
												onClick={() => {
													handleSelectDate(date.value);
													setShowDateSelector(false);
												}}
												className={`rounded-lg border p-3 text-left transition-all ${
													selectedDate === date.value
														? "border-blue-500 bg-blue-500/10"
														: "border-white/10 bg-white/5 hover:border-blue-500 hover:bg-white/10"
												}`}
											>
												<p className="font-semibold text-sm text-white">
													{date.displayText}
												</p>
												<p className="text-white/60 text-xs">
													{date.dayOfWeek}
												</p>
											</button>
										))}
									</div>
								)}
							</div>
						)}

						{/* Configurações de Flexibilidade */}
						{showFlexibilitySettings && (
							<div className="rounded-lg border border-white/10 bg-white/5 p-6">
								<h3 className="mb-4 font-medium text-lg text-white">
									⚙️ Configurações de Flexibilidade
								</h3>
								<p className="mb-6 text-sm text-white/60">
									Ajuste as margens de tempo para tornar os cronogramas mais
									flexíveis
								</p>

								<div className="grid gap-6 md:grid-cols-3">
									<div className="space-y-2">
										<Label htmlFor={lateEntryId} className="text-white">
											Atraso Permitido
										</Label>
										<div className="flex items-center gap-3">
											<Input
												id={lateEntryId}
												type="number"
												min="0"
												max="30"
												value={flexibilityOptions.allowLateEntry}
												onChange={(e) =>
													setFlexibilityOptions({
														...flexibilityOptions,
														allowLateEntry:
															Number.parseInt(e.target.value, 10) || 0,
													})
												}
												className="w-20"
											/>
											<span className="text-sm text-white/60">minutos</span>
										</div>
										<p className="text-white/50 text-xs">
											Você pode chegar até este tempo após o início da sessão
										</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor={earlyExitId} className="text-white">
											Saída Antecipada
										</Label>
										<div className="flex items-center gap-3">
											<Input
												id={earlyExitId}
												type="number"
												min="0"
												max="30"
												value={flexibilityOptions.allowEarlyExit}
												onChange={(e) =>
													setFlexibilityOptions({
														...flexibilityOptions,
														allowEarlyExit:
															Number.parseInt(e.target.value, 10) || 0,
													})
												}
												className="w-20"
											/>
											<span className="text-sm text-white/60">minutos</span>
										</div>
										<p className="text-white/50 text-xs">
											Você pode sair este tempo antes do fim do filme
										</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor={breakTimeId} className="text-white">
											Intervalo Entre Filmes
										</Label>
										<div className="flex items-center gap-3">
											<Input
												id={breakTimeId}
												type="number"
												min="0"
												max="60"
												value={flexibilityOptions.breakTime}
												onChange={(e) =>
													setFlexibilityOptions({
														...flexibilityOptions,
														breakTime: Number.parseInt(e.target.value, 10) || 0,
													})
												}
												className="w-20"
											/>
											<span className="text-sm text-white/60">minutos</span>
										</div>
										<p className="text-white/50 text-xs">
											Tempo de descanso/deslocamento entre sessões
										</p>
									</div>
								</div>

								<div className="mt-6 rounded-lg bg-blue-500/10 p-4">
									<p className="text-blue-400 text-sm">
										💡 <strong>Resumo:</strong> Você pode chegar até{" "}
										{flexibilityOptions.allowLateEntry}min atrasado, sair{" "}
										{flexibilityOptions.allowEarlyExit}min antes do fim, com{" "}
										{flexibilityOptions.breakTime}min de intervalo entre filmes.
									</p>
								</div>
							</div>
						)}

						{moviesLoading ? (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{[1, 2, 3, 4, 5, 6].map((i) => (
									<Skeleton key={i} className="h-40 w-full rounded-lg" />
								))}
							</div>
						) : movies.length === 0 ? (
							<div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
								<p className="text-white/60">
									Nenhum filme disponível para esta data
								</p>
							</div>
						) : (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{movies.map((movie) => (
									<div
										key={movie.id}
										className={`rounded-lg border transition-all ${
											selectedMovieIds.includes(movie.id)
												? "border-blue-500 bg-blue-500/10"
												: "border-white/10 bg-white/5"
										}`}
									>
										{/* Header com Checkbox e Poster */}
										<div className="relative">
											{movie.posterUrl && (
												<div className="relative h-64 w-full overflow-hidden rounded-t-lg">
													<Image
														src={movie.posterUrl}
														alt={movie.title}
														fill
														className="object-cover"
													/>
													<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
												</div>
											)}

											{movie.posterUrl ? (
												<div className="absolute inset-x-3 bottom-3">
													<div className="flex items-start gap-3">
														<Checkbox
															checked={selectedMovieIds.includes(movie.id)}
															onCheckedChange={() =>
																handleToggleMovie(movie.id)
															}
															className="mt-1 bg-white/90"
														/>
														<div className="flex-1">
															<h3 className="font-semibold text-white">
																{movie.title}
															</h3>
														</div>
													</div>
												</div>
											) : (
												<div className="p-4">
													<div className="flex items-start gap-3">
														<Checkbox
															checked={selectedMovieIds.includes(movie.id)}
															onCheckedChange={() =>
																handleToggleMovie(movie.id)
															}
															className="mt-1 bg-white/90"
														/>
														<div className="flex-1">
															<h3 className="font-semibold text-white">
																{movie.title}
															</h3>
														</div>
													</div>
												</div>
											)}
										</div>

										{/* Informações do Filme */}
										<div className="space-y-3 p-4">
											{/* Metadados */}
											<div className="flex flex-wrap gap-2 text-xs">
												{movie.genre && (
													<span className="rounded-full bg-purple-500/20 px-2 py-1 text-purple-300">
														{movie.genre}
													</span>
												)}
												{movie.duration && (
													<span className="rounded-full bg-blue-500/20 px-2 py-1 text-blue-300">
														⏱️ {movie.duration}
													</span>
												)}
												{movie.rating && (
													<span className="rounded-full bg-yellow-500/20 px-2 py-1 text-yellow-300">
														{movie.rating}
													</span>
												)}
											</div>

											{/* Sessões Disponíveis */}
											<div className="space-y-2">
												<p className="font-medium text-sm text-white/80">
													📍 {movie.sessions.length} sessões disponíveis:
												</p>
												<div className="grid grid-cols-3 gap-2">
													{movie.sessions.slice(0, 6).map((session) => (
														<div
															key={session.id}
															className="rounded bg-white/5 px-2 py-1 text-center"
														>
															<p className="font-medium text-white text-xs">
																{session.time}
															</p>
															{session.sessionType && (
																<p className="text-[10px] text-white/50">
																	{session.sessionType}
																</p>
															)}
														</div>
													))}
												</div>
												{movie.sessions.length > 6 && (
													<p className="text-center text-white/40 text-xs">
														+{movie.sessions.length - 6} mais sessões
													</p>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Step: Ver Cronogramas Gerados */}
				{step === "schedules" && schedules.length > 0 && (
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<Button
								variant="outline"
								onClick={() => setStep("movies")}
								className="text-white"
							>
								← Voltar
							</Button>
							<div>
								<h2 className="font-semibold text-white text-xl">
									Escolha um Cronograma
								</h2>
								<p className="text-sm text-white/60">
									{schedules.length} cronogramas otimizados gerados
								</p>
							</div>
						</div>

						<div className="space-y-6">
							{schedules.map((schedule) => {
								// Separar conflitos de warnings
								const realConflicts = schedule.conflicts.filter(
									(c) => !c.startsWith("✅"),
								);
								const warnings = schedule.conflicts.filter((c) =>
									c.startsWith("✅"),
								);

								return (
									<button
										key={schedule.id}
										type="button"
										onClick={() => handleSelectSchedule(schedule)}
										disabled={!schedule.feasible}
										className={`w-full rounded-lg border p-6 text-left transition-all ${
											schedule.feasible
												? "border-white/10 bg-white/5 hover:border-blue-500 hover:bg-white/10"
												: "cursor-not-allowed border-red-500/30 bg-red-500/10 opacity-50"
										}`}
									>
										{/* Header */}
										<div className="mb-6 flex items-center justify-between">
											<div>
												<h3 className="font-semibold text-white text-xl">
													{schedule.name}
												</h3>
												<p className="text-sm text-white/60">
													⏱️ {schedule.startTime} - {schedule.endTime} • ⏳{" "}
													{Math.floor(schedule.totalDuration / 60)}h{" "}
													{schedule.totalDuration % 60}min
												</p>
											</div>
											<span
												className={`rounded-full px-3 py-1.5 text-sm ${
													schedule.feasible
														? "bg-green-600/20 text-green-400"
														: "bg-red-600/20 text-red-400"
												}`}
											>
												{schedule.feasible ? "✓ Viável" : "⚠ Conflito"}
											</span>
										</div>

										{/* Timeline */}
										<div className="space-y-4">
											{schedule.items.map((item, index) => {
												const movie = movies.find((m) => m.id === item.movieId);
												if (!movie) return null;

												const session = movie.sessions.find(
													(s) => s.id === item.sessionId,
												);
												if (!session) return null;

												return (
													<div key={item.movieId} className="space-y-2">
														{/* Travel time */}
														{index > 0 && item.travelTime && (
															<div className="flex items-center gap-2 text-white/40 text-xs">
																<div className="h-4 w-px bg-white/20" />
																<span>
																	🚗 {item.travelTime} min de deslocamento
																</span>
															</div>
														)}

														{/* Movie session */}
														<div className="flex gap-4">
															{/* Poster */}
															{movie.posterUrl ? (
																<div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-lg shadow-lg">
																	<Image
																		src={movie.posterUrl}
																		alt={movie.title}
																		fill
																		className="object-cover"
																	/>
																</div>
															) : (
																<div className="flex h-40 w-28 shrink-0 items-center justify-center rounded-lg bg-white/5">
																	<span className="text-4xl">🎬</span>
																</div>
															)}

															{/* Info */}
															<div className="min-w-0 flex-1">
																<h4 className="font-semibold text-lg text-white">
																	{movie.title}
																</h4>
																<div className="mt-2 flex flex-wrap items-center gap-2">
																	<span className="rounded bg-blue-500/20 px-2.5 py-1 text-blue-300 text-sm">
																		⏰ {session.time}
																	</span>
																	<span className="rounded bg-purple-500/20 px-2.5 py-1 text-purple-300 text-sm">
																		{session.sessionType}
																	</span>
																	{movie.genre && (
																		<span className="text-sm text-white/60">
																			{movie.genre}
																		</span>
																	)}
																	{movie.duration && (
																		<span className="text-sm text-white/60">
																			• {movie.duration} min
																		</span>
																	)}
																	{movie.rating && (
																		<span className="rounded bg-orange-500/20 px-2.5 py-1 text-orange-300 text-sm">
																			{movie.rating}
																		</span>
																	)}
																</div>
															</div>
														</div>
													</div>
												);
											})}
										</div>

										{/* Footer com warnings e conflitos */}
										{(warnings.length > 0 || realConflicts.length > 0) && (
											<div className="mt-6 space-y-3 border-white/10 border-t pt-4">
												{warnings.length > 0 && (
													<div className="space-y-1">
														<p className="font-medium text-green-400 text-xs">
															✨ Folgas disponíveis:
														</p>
														<div className="space-y-0.5">
															{warnings.slice(0, 3).map((warning) => (
																<p
																	key={warning}
																	className="text-green-400/80 text-xs"
																>
																	{warning.replace("✅ Folga de ", "• ")}
																</p>
															))}
															{warnings.length > 3 && (
																<p className="text-green-400/60 text-xs">
																	+{warnings.length - 3} mais folgas
																</p>
															)}
														</div>
													</div>
												)}

												{realConflicts.length > 0 && (
													<div className="space-y-1">
														<p className="font-medium text-red-400 text-xs">
															⚠️ Conflitos:
														</p>
														<div className="space-y-0.5">
															{realConflicts.slice(0, 3).map((conflict) => (
																<p
																	key={conflict}
																	className="text-red-400/80 text-xs"
																>
																	• {conflict}
																</p>
															))}
															{realConflicts.length > 3 && (
																<p className="text-red-400/60 text-xs">
																	+{realConflicts.length - 3} mais conflitos
																</p>
															)}
														</div>
													</div>
												)}
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Step: Nomear Cronograma */}
				{step === "name" && selectedSchedule && (
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<Button
								variant="outline"
								onClick={() => setStep("schedules")}
								className="text-white"
							>
								← Voltar
							</Button>
							<h2 className="font-semibold text-white text-xl">
								Nomear Cronograma
							</h2>
						</div>

						<div className="mx-auto max-w-2xl space-y-4">
							<div className="rounded-lg border border-white/10 bg-white/5 p-6">
								<Label htmlFor={scheduleNameId} className="text-white">
									Nome do Cronograma
								</Label>
								<Input
									id={scheduleNameId}
									value={scheduleName}
									onChange={(e) => setScheduleName(e.target.value)}
									placeholder="Ex: Maratona de Ação - Sábado"
									className="mt-2"
								/>

								<div className="mt-6 space-y-2 text-sm text-white/60">
									<p>📍 Cinema: {selectedCinema?.name}</p>
									<p>📅 Data: {selectedDate}</p>
									<p>
										⏱️ {selectedSchedule.startTime} - {selectedSchedule.endTime}
									</p>
									<p>🎬 {selectedSchedule.items.length} filmes</p>
								</div>
							</div>

							<div className="flex gap-4">
								<Button
									onClick={handleSaveSchedule}
									disabled={!scheduleName.trim() || saveSchedule.isPending}
									className="flex-1 bg-blue-600 hover:bg-blue-700"
								>
									{saveSchedule.isPending ? (
										<>
											<LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
											Salvando...
										</>
									) : (
										"Salvar Cronograma"
									)}
								</Button>
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
