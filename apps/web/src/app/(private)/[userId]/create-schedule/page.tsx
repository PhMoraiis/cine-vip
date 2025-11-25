"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CinemaSelectionStep } from "@/components/create-schedule/cinema-selection-step";
import { MovieSelectionStep } from "@/components/create-schedule/movie-selection-step";
import { ScheduleNameStep } from "@/components/create-schedule/schedule-name-step";
import { ScheduleSelectionStep } from "@/components/create-schedule/schedule-selection-step";
import { StepsIndicator } from "@/components/create-schedule/steps-indicator";
import { Button } from "@/components/ui/button";
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
	movie?: {
		title: string;
	};
}

type Step = "cinema" | "movies" | "schedules" | "name";

export default function CreateSchedulePage() {
	const { data: session, isPending: sessionPending } = useSession();
	const router = useRouter();
	const params = useParams();
	const userIdFromUrl = params.userId as string;

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
	const [flexibilityOptions, setFlexibilityOptions] = useState({
		allowLateEntry: 5,
		allowEarlyExit: 5,
		breakTime: 5,
	});

	// Queries
	const { data: cinemasData, isLoading: cinemasLoading } = useQuery({
		queryKey: ["cinemas"],
		queryFn: async () => {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cinemas`);
			if (!response.ok) throw new Error("Failed to fetch cinemas");
			const data = await response.json();

			// Se não houver cinemas, fazer scraping
			if (!data.cinemas || data.cinemas.length === 0) {
				const scrapeResponse = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/api/cinemas`,
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
				`${process.env.NEXT_PUBLIC_API_URL}/api/date/${cinemaCode}`,
				{
					method: "POST",
				},
			);
			if (!response.ok) throw new Error("Failed to scrape dates");
			return response.json();
		},
		onSuccess: (data) => {
			const dates = data.availableDates || [];
			setAvailableDates(dates);

			if (dates.length > 0) {
				toast.success("Datas atualizadas com sucesso!");
				// Selecionar automaticamente a primeira data após o scraping
				const firstDate = dates[0]?.value;
				if (firstDate) {
					setSelectedDate(firstDate);
					setStep("movies");
				}
			} else {
				toast.warning("Nenhuma data encontrada para este cinema.");
			}
		},
		onError: (error) => {
			console.error("Erro ao buscar datas:", error);
			toast.error("Erro ao buscar datas atualizadas.");
		},
	});

	// Mutation para buscar datas disponíveis
	const fetchAvailableDates = useMutation({
		mutationFn: async (cinemaCode: string) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/dates/${cinemaCode}`,
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

			if (dates.length === 0 && selectedCinema) {
				// Se não houver datas, tentar fazer scraping
				toast.info("Buscando datas atualizadas...");
				scrapeDates.mutate(selectedCinema.code);
				return;
			}

			// Verificar se a primeira data é diferente de hoje
			const today = new Date().toISOString().split("T")[0];
			const firstDate = dates[0]?.value;

			if (firstDate && firstDate !== today && selectedCinema) {
				// Fazer scraping de datas se a primeira data não for hoje
				// Mas não bloquear o usuário, deixar ele ver as datas antigas enquanto atualiza
				toast.info("Verificando novas datas...");
				scrapeDates.mutate(selectedCinema.code);
			}

			if (firstDate) {
				// Selecionar automaticamente a primeira data
				setSelectedDate(firstDate);
				setStep("movies");
			}
		},
		onError: (error) => {
			console.error("Erro ao buscar datas:", error);
			toast.error("Erro ao buscar datas disponíveis.");
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
				`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${cinemaCode}/${date}`,
				{
					method: "POST",
				},
			);
			if (!response.ok && response.status !== 202)
				throw new Error("Failed to scrape sessions");
			return response.json();
		},
	});

	const { data: moviesData, isLoading: moviesLoading } = useQuery({
		queryKey: ["movies", selectedCinema?.code, selectedDate],
		queryFn: async () => {
			if (!selectedCinema || !selectedDate) return null;
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${selectedCinema.code}/${selectedDate}`,
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

			// Se estiver fazendo scraping, retornar dados para polling
			if (
				data.scrapingJob &&
				(data.scrapingJob.status === "PENDING" ||
					data.scrapingJob.status === "RUNNING")
			) {
				return data;
			}

			// Se retornar mas não houver filmes e não estiver fazendo scraping, fazer scraping
			if ((!data.movies || data.movies.length === 0) && !data.scrapingJob) {
				const scrapeResponse = await scrapeSessions.mutateAsync({
					cinemaCode: selectedCinema.code,
					date: selectedDate,
				});
				return scrapeResponse;
			}

			return data;
		},
		enabled: !!selectedCinema && !!selectedDate && step === "movies",
		refetchInterval: (query) => {
			const data = query.state.data;
			const status = data?.scrapingJob?.status || data?.job?.status;
			if (status === "PENDING" || status === "RUNNING") {
				return 5000;
			}
			return false;
		},
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
				`${process.env.NEXT_PUBLIC_API_URL}/api/schedules/generate`,
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
			toast.error("Erro ao gerar cronogramas.");
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

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/schedules/save`,
				{
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
			toast.success("Cronograma salvo com sucesso!");
			router.push(`/${session?.user?.id}/dashboard`);
		},
		onError: (error) => {
			console.error("Erro ao salvar cronograma:", error);
			toast.error("Erro ao salvar cronograma.");
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
				toast.warning(
					"Não foi possível gerar cronogramas com as opções selecionadas.",
				);
			}
		} catch (error) {
			console.error("Error generating schedules:", error);
		}
	};

	const handleSelectSchedule = (schedule: Schedule) => {
		setSelectedSchedule(schedule);
		setScheduleName("");
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

	// Deduplicate movies by ID to prevent duplicates
	const rawMovies: Movie[] = moviesData?.movies || [];
	const moviesMap = new Map<string, Movie>();
	rawMovies.forEach((movie) => {
		if (!moviesMap.has(movie.id)) {
			moviesMap.set(movie.id, movie);
		}
	});
	const movies: Movie[] = Array.from(moviesMap.values());

	// A API retorna 'recommendations' em vez de 'schedules'
	const schedules: Schedule[] =
		generateSchedules.data?.recommendations ||
		generateSchedules.data?.schedules ||
		[];

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
				<StepsIndicator currentStep={step} />

				{/* Step: Selecionar Cinema */}
				{step === "cinema" && (
					<CinemaSelectionStep
						cinemas={cinemas}
						isLoading={cinemasLoading}
						onSelect={handleSelectCinema}
					/>
				)}

				{/* Step: Selecionar Filmes */}
				{step === "movies" && (
					<MovieSelectionStep
						movies={movies}
						isLoading={moviesLoading}
						selectedMovieIds={selectedMovieIds}
						onToggleMovie={handleToggleMovie}
						onGenerate={handleGenerateSchedules}
						isGenerating={generateSchedules.isPending}
						availableDates={availableDates}
						selectedDate={selectedDate}
						onSelectDate={handleSelectDate}
						flexibilityOptions={flexibilityOptions}
						setFlexibilityOptions={setFlexibilityOptions}
						onBack={() => {
							setStep("cinema");
							setSelectedCinema(null);
							setSelectedDate("");
							setSelectedMovieIds([]);
						}}
						cinemaName={selectedCinema?.name}
						isLoadingDates={
							fetchAvailableDates.isPending || scrapeDates.isPending
						}
						isScraping={
							moviesData?.scrapingJob?.status === "PENDING" ||
							moviesData?.scrapingJob?.status === "RUNNING" ||
							moviesData?.job?.status === "PENDING" ||
							moviesData?.job?.status === "RUNNING"
						}
					/>
				)}

				{/* Step: Selecionar Cronograma */}
				{step === "schedules" && (
					<ScheduleSelectionStep
						schedules={schedules}
						onSelect={handleSelectSchedule}
						onBack={() => setStep("movies")}
					/>
				)}

				{/* Step: Nomear e Salvar */}
				{step === "name" && (
					<ScheduleNameStep
						scheduleName={scheduleName}
						setScheduleName={setScheduleName}
						onSave={handleSaveSchedule}
						isSaving={saveSchedule.isPending}
						onBack={() => setStep("schedules")}
					/>
				)}
			</main>
		</div>
	);
}
