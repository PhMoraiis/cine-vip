"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Hourglass, MapPin, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

interface ScheduleItem {
	id: string;
	movieId: string;
	sessionId: string;
	order: number;
	startTime: string;
	endTime: string;
	travelTime: number;
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

interface SchedulesResponse {
	success: boolean;
	schedules: Schedule[];
}

export default function DashboardPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const params = useParams();
	const userIdFromUrl = params.userId as string;

	const { data: schedulesData, isLoading: schedulesLoading } =
		useQuery<SchedulesResponse>({
			queryKey: ["schedules", session?.user?.id],
			queryFn: async () => {
				if (!session?.user?.id) return { success: false, schedules: [] };
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_SERVER_URL}/api/schedules/${session.user.id}`,
				);
				if (!response.ok) throw new Error("Failed to fetch schedules");
				return response.json();
			},
			enabled: !!session?.user?.id,
		});

	// Validar se o userId da URL corresponde ao usuário logado
	useEffect(() => {
		if (!isPending && session) {
			if (userIdFromUrl !== session.user.id) {
				// Redirecionar para a URL correta do usuário ou página de erro
				router.push(`/${session.user.id}/dashboard`);
			}
		}
	}, [session, isPending, userIdFromUrl, router]);

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/auth");
		}
	}, [session, isPending, router]);

	const handleLogout = async () => {
		await signOut();
		router.push("/auth");
	};

	if (!session) {
		return null; // Redirecionando...
	}

	const schedules = schedulesData?.schedules || [];

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("pt-BR");
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
			<header className="relative">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
					<Link href="/" className="group inline-flex items-center gap-3">
						<Image src="/switch.png" alt="Logo" width={24} height={24} />
						<div className="flex flex-col leading-none">
							<span className="font-normal text-[15px] text-white/90 tracking-tight">
								OnCine
							</span>
							<span className="font-normal text-[11px] text-white/50">
								Agendas de filmes inteligentes
							</span>
						</div>
					</Link>

					<nav className="hidden items-center gap-7 md:flex">
						<a
							href="/em-cartaz"
							className="font-normal text-[14px] text-white/70 transition-colors hover:text-white"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							Em Cartaz
						</a>
						<a
							href="/em-breve"
							className="font-normal text-[14px] text-white/70 transition-colors hover:text-white"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							Em breve
						</a>
						<a
							href="/cinemas"
							className="font-normal text-[14px] text-white/70 transition-colors hover:text-white"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							Cinemas
						</a>
					</nav>

					<div className="flex items-center gap-3">
						<Button
							className="cursor-pointer rounded-md bg-white/10 px-3.5 py-2 font-normal text-[14px] text-white shadow-md ring-1 ring-white/15 transition-all hover:bg-white/20 hover:shadow-lg hover:ring-white/25 active:scale-[0.99]"
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
				<div className="mb-8 flex items-center justify-between">
					<h1 className="font-bold text-3xl text-white tracking-tight">
						Meus Cronogramas
					</h1>
					<Link href={`/${session.user.id}/create-schedule`}>
						<Button className="bg-emerald-300/90 text-primary shadow-emerald-300/20 shadow-lg transition-all hover:scale-105 hover:bg-emerald-300/90">
							<Plus className="mr-2 h-4 w-4" />
							Novo Cronograma
						</Button>
					</Link>
				</div>

				{schedulesLoading ? (
					<div className="flex min-h-[400px] items-center justify-center">
						<div className="text-center">
							<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
							<p className="text-white/60">Carregando cronogramas...</p>
						</div>
					</div>
				) : schedules.length === 0 ? (
					<div className="fade-in zoom-in-95 flex animate-in flex-col items-center justify-center rounded-3xl border border-white/10 border-dashed bg-white/5 p-12 text-center duration-500">
						<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
							<Calendar className="h-10 w-10 text-emerald-300/90" />
						</div>
						<h3 className="mb-2 font-semibold text-white text-xl">
							Nenhum cronograma encontrado
						</h3>
						<p className="mb-8 max-w-md text-white/60">
							Você ainda não criou nenhum cronograma. Comece agora mesmo e
							organize sua maratona de filmes!
						</p>
						<Link href={`/${session.user.id}/create-schedule`}>
							<Button
								size="lg"
								className="bg-emerald-300/90 text-primary shadow-lg shadow-primary/20 hover:bg-emerald-500/90"
							>
								Criar meu primeiro cronograma
							</Button>
						</Link>
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{schedules.map((schedule: Schedule) => (
							<a
								key={schedule.id}
								href={`/${session.user.id}/schedule/${schedule.id}`}
								className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
							>
								<div className="mb-4 flex items-start justify-between">
									<h3 className="font-semibold text-white group-hover:text-emerald-300/90">
										{schedule.name}
									</h3>
									<span className="rounded-full bg-emerald-300/20 px-4 py-1 font-medium text-emerald-300/90 text-xs">
										{schedule.items?.length || 0} filmes
									</span>
								</div>
								<div className="space-y-2 text-sm text-white/60">
									<p className="flex items-center">
										<MapPin className="mr-2 h-4 w-4 text-emerald-300/90" />{" "}
										{schedule.cinemaCode}
									</p>
									<p className="flex items-center">
										<Calendar className="mr-2 h-4 w-4 text-emerald-300/90" />{" "}
										{formatDate(schedule.date)}
									</p>
									<p className="flex items-center">
										<Clock className="mr-2 h-4 w-4 text-emerald-300/90" />{" "}
										{schedule.startTime} - {schedule.endTime}
									</p>
									<p className="flex items-center">
										<Hourglass className="mr-2 h-4 w-4 text-emerald-300/90" />{" "}
										{formatDuration(schedule.totalDuration)}
									</p>
								</div>
							</a>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
