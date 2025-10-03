"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut, useSession } from "@/lib/auth-client";

export default function DashboardPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
		queryKey: ["schedules", session?.user?.id],
		queryFn: async () => {
			if (!session?.user?.id) return null;
			const response = await fetch(`http://localhost:3000/api/users/${session.user.id}/schedules`);
			if (!response.ok) throw new Error("Failed to fetch schedules");
			return response.json();
		},
		enabled: !!session?.user?.id,
	});

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/auth");
		}
	}, [session, isPending, router]);

	const handleLogout = async () => {
		await signOut();
		router.push("/auth");
	};

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="mx-auto h-8 w-8 animate-spin rounded-full border-red-600 border-b-2" />
					<p className="mt-4 text-gray-600">Carregando...</p>
				</div>
			</div>
		);
	}

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
		return hours > 0 ? `${hours}h${mins > 0 ? mins : ""}` : `${mins}min`;
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between py-6">
						<div>
							<h1 className="font-bold text-2xl text-red-600">🎬 CineVip</h1>
							<p className="text-gray-600">
								Olá, {session.user.name || session.user.email}
							</p>
						</div>
						<button
							type="button"
							onClick={handleLogout}
							className="text-gray-500 text-sm hover:text-gray-700"
						>
							Sair
						</button>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Actions */}
				<div className="mb-8">
					<Link
						href="/create-schedule"
						className="inline-flex items-center rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700"
					>
						<span className="mr-2">🎯</span>
						Criar Novo Cronograma
					</Link>
				</div>

				{/* Schedules Section */}
				<div>
					<h2 className="mb-6 font-semibold text-gray-900 text-xl">
						Meus Cronogramas
					</h2>

					{schedulesLoading ? (
						<div className="py-12 text-center">
							<div className="mx-auto h-8 w-8 animate-spin rounded-full border-red-600 border-b-2" />
							<p className="mt-4 text-gray-600">Carregando cronogramas...</p>
						</div>
					) : schedules.length === 0 ? (
						<div className="rounded-lg bg-white py-12 text-center shadow">
							<div className="mb-4 text-6xl">🎬</div>
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								Nenhum cronograma ainda
							</h3>
							<p className="mb-6 text-gray-600">
								Crie seu primeiro cronograma de filmes personalizado
							</p>
							<Link
								href="/create-schedule"
								className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
							>
								Começar Agora
							</Link>
						</div>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{schedules.map((schedule) => (
								<div
									key={schedule.id}
									className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
								>
									<div className="mb-4 flex items-start justify-between">
										<h3 className="font-semibold text-gray-900">
											{schedule.cinemaName}
										</h3>
										<button
											type="button"
											className="text-gray-400 hover:text-gray-600"
											title="Opções"
										>
											⋯
										</button>
									</div>

									<div className="mb-4 space-y-2">
										<div className="flex items-center text-gray-600 text-sm">
											<span className="mr-2">📅</span>
											<span>{formatDate(schedule.date)}</span>
										</div>

										<div className="flex items-center text-gray-600 text-sm">
											<span className="mr-2">🎬</span>
											<span>
												{schedule.totalMovies || schedule.sessions?.length || 0}{" "}
												filme(s)
											</span>
										</div>

										{schedule.totalDuration && (
											<div className="flex items-center text-gray-600 text-sm">
												<span className="mr-2">⏱️</span>
												<span>{formatDuration(schedule.totalDuration)}</span>
											</div>
										)}

										{schedule.totalCost && (
											<div className="flex items-center text-gray-600 text-sm">
												<span className="mr-2">💰</span>
												<span>R$ {schedule.totalCost.toFixed(2)}</span>
											</div>
										)}
									</div>

									<div className="flex space-x-2">
										<Link
											href={`/schedule/${schedule.id}`}
											className="flex-1 rounded bg-blue-600 px-4 py-2 text-center font-medium text-sm text-white transition-colors hover:bg-blue-700"
										>
											Ver Detalhes
										</Link>
										<Link
											href={"/create-schedule"}
											className="flex-1 rounded border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 text-sm transition-colors hover:bg-gray-50"
										>
											Novo
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
