"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, Film, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

interface Movie {
	id: string;
	title: string;
	posterUrl?: string;
	duration?: string;
	genre?: string;
}

interface Session {
	id: string;
	time: string;
	sessionType?: string;
}

interface ScheduleItem {
	id: string;
	movieId: string;
	sessionId: string;
	order: number;
	startTime: string;
	endTime: string;
	travelTime: number;
	movie?: Movie;
	session?: Session;
}

interface Schedule {
	id: string;
	userId: string;
	cinemaCode: string;
	date: string;
	name: string;
	totalDuration: number;
	startTime: string;
	endTime: string;
	createdAt: string;
	updatedAt: string;
	items?: ScheduleItem[];
}

interface ScheduleResponse {
	success: boolean;
	schedule: Schedule;
}

export default function ScheduleDetailsPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const params = useParams();
	const userId = params.userId as string;
	const scheduleId = params.scheduleId as string;

	const { data: scheduleData, isLoading } = useQuery<ScheduleResponse>({
		queryKey: ["schedule", scheduleId],
		queryFn: async () => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_SERVER_URL}/api/schedules/${userId}/${scheduleId}`,
			);
			if (!response.ok) throw new Error("Failed to fetch schedule");
			return response.json();
		},
		enabled: !!userId && !!scheduleId,
	});

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/auth");
		}
	}, [session, isPending, router]);

	const handleDelete = async () => {
		if (!confirm("Tem certeza que deseja excluir este cronograma?")) return;

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_SERVER_URL}/api/schedules/${userId}/${scheduleId}`,
				{ method: "DELETE" },
			);

			if (response.ok) {
				router.push(`/${userId}/dashboard`);
			}
		} catch (error) {
			console.error("Error deleting schedule:", error);
		}
	};

	if (!session || isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
					<p className="text-white/60">Carregando cronograma...</p>
				</div>
			</div>
		);
	}

	const schedule = scheduleData?.schedule;

	if (!schedule) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="text-center">
					<h2 className="mb-2 font-bold text-2xl text-white">
						Cronograma não encontrado
					</h2>
					<Link href={`/${userId}/dashboard`}>
						<Button>Voltar ao Dashboard</Button>
					</Link>
				</div>
			</div>
		);
	}

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("pt-BR", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	const formatDuration = (minutes?: number) => {
		if (!minutes) return "";
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0
			? `${hours}h${mins > 0 ? ` ${mins}min` : ""}`
			: `${mins}min`;
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="relative border-white/10 border-b">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
					<Link href={`/${userId}/dashboard`}>
						<Button
							variant="outline"
							className="border-white/10 bg-white/5 text-white hover:bg-white/10"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar
						</Button>
					</Link>

					<Button
						variant="outline"
						onClick={handleDelete}
						className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Excluir
					</Button>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
				{/* Schedule Header */}
				<div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-8">
					<h1 className="mb-6 font-bold text-4xl text-white tracking-tight">
						{schedule.name}
					</h1>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<MapPin className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="text-white/40 text-xs uppercase tracking-wider">
									Cinema
								</p>
								<p className="font-medium text-white">{schedule.cinemaCode}</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<Calendar className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="text-white/40 text-xs uppercase tracking-wider">
									Data
								</p>
								<p className="font-medium text-white">
									{formatDate(schedule.date)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<Clock className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="text-white/40 text-xs uppercase tracking-wider">
									Horário
								</p>
								<p className="font-medium text-white">
									{schedule.startTime} - {schedule.endTime}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<Film className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="text-white/40 text-xs uppercase tracking-wider">
									Duração Total
								</p>
								<p className="font-medium text-white">
									{formatDuration(schedule.totalDuration)}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Movies Timeline */}
				<div className="space-y-6">
					<h2 className="font-bold text-2xl text-white tracking-tight">
						Filmes do Cronograma
					</h2>

					{schedule.items && schedule.items.length > 0 ? (
						<div className="space-y-4">
							{schedule.items
								.sort((a, b) => a.order - b.order)
								.map((item, index) => (
									<div
										key={item.id}
										className="group relative flex gap-6 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
									>
										{/* Order Badge */}
										<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-lg text-primary">
											{index + 1}
										</div>

										{/* Movie Poster */}
										{item.movie?.posterUrl && (
											<div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg">
												<Image
													src={item.movie.posterUrl}
													alt={item.movie.title || "Movie"}
													fill
													className="object-cover"
													sizes="96px"
												/>
											</div>
										)}

										{/* Movie Info */}
										<div className="flex-1">
											<h3 className="mb-2 font-bold text-white text-xl">
												{item.movie?.title || "Filme"}
											</h3>

											<div className="mb-4 flex flex-wrap gap-4 text-sm text-white/60">
												{item.movie?.genre && (
													<span className="flex items-center gap-1">
														<span className="text-white/40">•</span>
														{item.movie.genre}
													</span>
												)}
												{item.movie?.duration && (
													<span className="flex items-center gap-1">
														<span className="text-white/40">•</span>
														{item.movie.duration}
													</span>
												)}
											</div>

											<div className="flex flex-wrap gap-4">
												<div className="rounded-lg bg-black/20 px-4 py-2">
													<p className="mb-1 text-white/40 text-xs uppercase tracking-wider">
														Sessão
													</p>
													<p className="font-medium text-white">
														{item.session?.time || item.startTime}
													</p>
												</div>

												<div className="rounded-lg bg-black/20 px-4 py-2">
													<p className="mb-1 text-white/40 text-xs uppercase tracking-wider">
														Início
													</p>
													<p className="font-medium text-white">
														{item.startTime}
													</p>
												</div>

												<div className="rounded-lg bg-black/20 px-4 py-2">
													<p className="mb-1 text-white/40 text-xs uppercase tracking-wider">
														Término
													</p>
													<p className="font-medium text-white">
														{item.endTime}
													</p>
												</div>

												{item.travelTime > 0 && (
													<div className="rounded-lg bg-primary/10 px-4 py-2">
														<p className="mb-1 text-primary/60 text-xs uppercase tracking-wider">
															Intervalo
														</p>
														<p className="font-medium text-primary">
															{item.travelTime} min
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								))}
						</div>
					) : (
						<div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
							<p className="text-white/60">Nenhum filme neste cronograma</p>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
