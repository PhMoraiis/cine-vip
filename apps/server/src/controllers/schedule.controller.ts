import type { FastifyReply, FastifyRequest } from "fastify";
import db from "../db";
import { ScheduleOptimizerService } from "../services/schedule-optimizer.service";

interface ScheduleRequest {
	userId: string;
	cinemaCode: string;
	date: string;
	movieIds: string[];
}

interface UpdateScheduleRequest {
	scheduleId: string;
	userId: string;
	movieIds: string[];
}

interface ScheduleItem {
	movieId: string;
	sessionId: string;
	order: number;
	startTime: string;
	endTime: string;
	travelTime: number;
}

interface ScheduleCombination {
	id: string;
	name: string;
	totalDuration: number;
	startTime: string;
	endTime: string;
	items: ScheduleItem[];
	conflicts: string[];
	feasible: boolean;
}

interface MovieWithSessions {
	id: string;
	title: string;
	duration: string | null;
	sessions: SessionData[];
	cinema: CinemaData;
}

interface SessionData {
	id: string;
	time: string;
	sessionType?: string | null;
}

interface CinemaData {
	code: string;
	name: string;
}

interface CombinationItem {
	movie: MovieWithSessions;
	session: SessionData;
}

export class ScheduleController {
	private optimizerService = new ScheduleOptimizerService();

	/**
	 * Gerar combinações de cronogramas baseado nos filmes selecionados
	 */
	async generateSchedules(
		request: FastifyRequest<{ Body: ScheduleRequest }>,
		reply: FastifyReply,
	) {
		try {
			console.log(
				"📝 Recebido body no generateSchedules:",
				JSON.stringify(request.body, null, 2),
			);

			const { cinemaCode, date, movieIds } = request.body;

			if (!movieIds || !Array.isArray(movieIds)) {
				return reply.status(400).send({
					success: false,
					error: "movieIds é obrigatório e deve ser um array",
				});
			}

			console.log(`🎬 Gerando cronogramas para ${movieIds.length} filmes...`);

			// Buscar filmes com suas sessões
			const movies = await db.movie.findMany({
				where: {
					id: { in: movieIds },
					cinema: { code: cinemaCode },
					date: date,
				},
				include: {
					sessions: true,
					cinema: true,
				},
			});

			if (movies.length === 0) {
				return reply.status(404).send({
					success: false,
					error: "Nenhum filme encontrado para os critérios especificados",
				});
			}

			// Converter para formato do optimizer
			const availableSessions = movies.map((movie) =>
				movie.sessions.map((session) => ({
					id: session.id,
					movieId: movie.id,
					movieTitle: movie.title,
					time: session.time,
					duration: this.parseDuration(movie.duration),
					sessionType: session.sessionType || undefined,
				})),
			);

			// Gerar cronogramas otimizados
			const optimizedSchedules =
				this.optimizerService.generateOptimizedSchedules(availableSessions, {
					preferMatinee: true,
					avoidLateNight: true,
					allowMealBreaks: true,
				});

			return reply.send({
				success: true,
				cinema: {
					code: cinemaCode,
					name: movies[0].cinema.name,
				},
				date,
				totalMovies: movieIds.length,
				totalCombinations: optimizedSchedules.length,
				recommendations: optimizedSchedules,
			});
		} catch (error) {
			console.error("❌ Erro ao gerar cronogramas:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro interno do servidor",
			});
		}
	}

	/**
	 * Salvar cronograma selecionado pelo usuário
	 */
	async saveSchedule(
		request: FastifyRequest<{
			Body: {
				userId: string;
				cinemaCode: string;
				date: string;
				selectedSchedule?: ScheduleCombination;
				schedule?: ScheduleCombination;
				name?: string;
				description?: string;
			};
		}>,
		reply: FastifyReply,
	) {
		try {
			const body = request.body;
			console.log("📝 Recebido body:", JSON.stringify(body, null, 2));

			// Aceitar tanto o formato antigo quanto o novo
			const userId = body.userId;
			const cinemaCode = body.cinemaCode;
			const date = body.date;
			const selectedSchedule = body.selectedSchedule || body.schedule;
			const name = body.name || selectedSchedule?.name || "Cronograma sem nome";

			if (!selectedSchedule) {
				return reply.status(400).send({
					success: false,
					error: "selectedSchedule ou schedule é obrigatório",
				});
			}

			console.log(`💾 Salvando cronograma: ${name}`);

			// Criar usuário se não existir
			await db.user.upsert({
				where: { id: userId },
				update: {},
				create: {
					id: userId,
					email: `${userId}@test.com`,
					name: `User ${userId}`,
					emailVerified: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Criar o cronograma no banco
			const schedule = await db.schedule.create({
				data: {
					userId,
					cinemaCode,
					date,
					name,
					totalDuration: selectedSchedule.totalDuration || 0,
					startTime: selectedSchedule.startTime || "00:00",
					endTime: selectedSchedule.endTime || "00:00",
					items: {
						create: (selectedSchedule.items || []).map(
							// biome-ignore lint/suspicious/noExplicitAny: ignore
							(item: any, index: number) => ({
								movieId: item.movieId,
								sessionId: item.sessionId || `session-${index}`,
								order: item.order || index + 1,
								startTime: item.startTime || "00:00",
								endTime: item.endTime || "00:00",
								travelTime: item.travelTime || 0,
							}),
						),
					},
				},
				include: {
					items: {
						include: {
							movie: true,
							session: true,
						},
					},
				},
			});

			return reply.send({
				success: true,
				schedule,
				message: "Cronograma salvo com sucesso!",
			});
		} catch (error) {
			console.error("❌ Erro ao salvar cronograma:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro interno do servidor",
			});
		}
	}

	/**
	 * Listar cronogramas do usuário
	 */
	async getUserSchedules(
		request: FastifyRequest<{ Params: { userId: string } }>,
		reply: FastifyReply,
	) {
		try {
			const { userId } = request.params;

			const schedules = await db.schedule.findMany({
				where: { userId },
				include: {
					items: {
						include: {
							movie: true,
							session: true,
						},
						orderBy: { order: "asc" },
					},
				},
				orderBy: { createdAt: "desc" },
			});

			return reply.send({
				success: true,
				schedules,
			});
		} catch (error) {
			console.error("❌ Erro ao buscar cronogramas:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro interno do servidor",
			});
		}
	}

	/**
	 * Atualizar cronograma existente (adicionar/remover filmes)
	 */
	async updateSchedule(
		request: FastifyRequest<{ Body: UpdateScheduleRequest }>,
		reply: FastifyReply,
	) {
		try {
			const { scheduleId, userId, movieIds } = request.body;

			// Buscar cronograma existente
			const existingSchedule = await db.schedule.findFirst({
				where: { id: scheduleId, userId },
				include: {
					items: {
						include: {
							movie: true,
							session: true,
						},
					},
				},
			});

			if (!existingSchedule) {
				return reply.status(404).send({
					success: false,
					error: "Cronograma não encontrado",
				});
			}

			// Buscar novos filmes
			const movies = await db.movie.findMany({
				where: {
					id: { in: movieIds },
					cinema: { code: existingSchedule.cinemaCode },
					date: existingSchedule.date,
				},
				include: {
					sessions: true,
					cinema: true,
				},
			});

			// Gerar novas combinações
			const combinations = this.generateAllCombinations(movies);
			const analyzedCombinations = combinations.map((combo, index) =>
				this.analyzeScheduleCombination(combo, index),
			);

			const sortedCombinations = analyzedCombinations
				.sort((a, b) => {
					if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
					return a.totalDuration - b.totalDuration;
				})
				.slice(0, 10);

			return reply.send({
				success: true,
				existingSchedule,
				newRecommendations: sortedCombinations,
				message: "Novas combinações geradas com sucesso!",
			});
		} catch (error) {
			console.error("❌ Erro ao atualizar cronograma:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro interno do servidor",
			});
		}
	}

	/**
	 * Gera todas as combinações possíveis de sessões para os filmes
	 */
	private generateAllCombinations(
		movies: MovieWithSessions[],
	): CombinationItem[][] {
		const combinations: CombinationItem[][] = [];

		// Função recursiva para gerar combinações
		const generateRecursive = (
			movieIndex: number,
			currentCombination: CombinationItem[],
		) => {
			if (movieIndex >= movies.length) {
				combinations.push([...currentCombination]);
				return;
			}

			const movie = movies[movieIndex];
			for (const session of movie.sessions) {
				generateRecursive(movieIndex + 1, [
					...currentCombination,
					{ movie, session },
				]);
			}
		};

		generateRecursive(0, []);
		return combinations;
	}

	/**
	 * Analisa uma combinação de sessões e calcula viabilidade
	 */
	private analyzeScheduleCombination(
		combination: CombinationItem[],
		index: number,
	): ScheduleCombination {
		const conflicts: string[] = [];
		let feasible = true;

		// Ordenar por horário de início
		const sortedItems = combination
			.map((item, i) => {
				const startTime = item.session.time;
				const duration = this.parseDuration(item.movie.duration);
				const endTime = this.addMinutes(startTime, duration + 10); // +5min trailers +5min créditos

				return {
					movieId: item.movie.id,
					sessionId: item.session.id,
					order: i,
					startTime,
					endTime,
					travelTime: i > 0 ? 5 : 0, // 5 minutos entre sessões
					movie: item.movie,
					session: item.session,
					duration,
				};
			})
			.sort(
				(a, b) =>
					this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
			);

		// Verificar conflitos de horário
		for (let i = 1; i < sortedItems.length; i++) {
			const prevItem = sortedItems[i - 1];
			const currentItem = sortedItems[i];

			const prevEndWithTravel = this.addMinutes(
				prevItem.endTime,
				prevItem.travelTime,
			);

			if (
				this.timeToMinutes(currentItem.startTime) <
				this.timeToMinutes(prevEndWithTravel)
			) {
				conflicts.push(
					`Conflito: ${prevItem.movie.title} termina às ${prevEndWithTravel} e ${currentItem.movie.title} começa às ${currentItem.startTime}`,
				);
				feasible = false;
			}
		}

		const firstItem = sortedItems[0];
		const lastItem = sortedItems[sortedItems.length - 1];
		const totalDuration =
			this.timeToMinutes(lastItem.endTime) -
			this.timeToMinutes(firstItem.startTime);

		return {
			id: `combo-${index}`,
			name: `Cronograma ${index + 1}`,
			totalDuration,
			startTime: firstItem.startTime,
			endTime: lastItem.endTime,
			items: sortedItems.map((item, i) => ({
				movieId: item.movieId,
				sessionId: item.sessionId,
				order: i,
				startTime: item.startTime,
				endTime: item.endTime,
				travelTime: item.travelTime,
			})),
			conflicts,
			feasible,
		};
	}

	/**
	 * Converte duração string para minutos
	 */
	private parseDuration(duration: string | null): number {
		if (!duration) return 120; // default 2h

		const match = duration.match(/(\d+)(?:h|:)?\s*(\d+)?/);
		if (!match) return 120;

		const hours = Number.parseInt(match[1], 10) || 0;
		const minutes = Number.parseInt(match[2], 10) || 0;

		return hours * 60 + minutes;
	}

	/**
	 * Converte horário string para minutos
	 */
	private timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(":").map(Number);
		return hours * 60 + minutes;
	}

	/**
	 * Adiciona minutos a um horário
	 */
	private addMinutes(time: string, minutes: number): string {
		const totalMinutes = this.timeToMinutes(time) + minutes;
		const hours = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;

		return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
	}
}
