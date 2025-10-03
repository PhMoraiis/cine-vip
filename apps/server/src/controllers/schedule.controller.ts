import { createId } from "@paralleldrive/cuid2";
import type { FastifyReply, FastifyRequest } from "fastify";
import db from "../db";

// Cache temporário para cronogramas gerados (backup para alta performance)
const scheduleCache = new Map<string, ScheduleCombination>();

// TTL para cronogramas gerados: 2 horas
const _SCHEDULE_TTL_HOURS = 2;

interface ScheduleRequest {
	userId: string;
	cinemaCode: string;
	date: string;
	movieIds: string[];
	flexibilityOptions?: {
		allowLateEntry?: number; // minutos de atraso permitidos (padrão: 5)
		allowEarlyExit?: number; // minutos de saída antecipada (padrão: 5)
		breakTime?: number; // intervalo entre filmes em minutos (padrão: 5)
	};
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
	/**
	 * Gerar combinações de cronogramas baseado nos filmes selecionados
	 */
	async generateSchedules(
		request: FastifyRequest<{ Body: ScheduleRequest }>,
		reply: FastifyReply,
	) {
		try {
			console.log(
				"Recebido body no generateSchedules:",
				JSON.stringify(request.body, null, 2),
			);

			const { cinemaCode, date, movieIds, flexibilityOptions } = request.body;

			// Configurações padrão de flexibilidade
			const flexibility = {
				allowLateEntry: flexibilityOptions?.allowLateEntry ?? 5,
				allowEarlyExit: flexibilityOptions?.allowEarlyExit ?? 5,
				breakTime: flexibilityOptions?.breakTime ?? 5,
			};

			if (!movieIds || !Array.isArray(movieIds)) {
				return reply.status(400).send({
					success: false,
					error: "movieIds é obrigatório e deve ser um array",
				});
			}
			console.log(`Gerando cronogramas para ${movieIds.length} filmes...`);

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

			// Verificar se pelo menos um filme tem sessões
			const moviesWithSessions = movies.filter(movie => 
				movie.sessions && movie.sessions.length > 0
			);
			
			if (moviesWithSessions.length === 0) {
				return reply.status(404).send({
					success: false,
					error: "Nenhuma sessão encontrada para os filmes especificados",
				});
			}

			// Gerar todas as combinações possíveis
			const combinations = this.generateAllCombinations(movies);
			
			if (combinations.length === 0) {
				return reply.status(404).send({
					success: false,
					error: "Não foi possível gerar combinações válidas de cronograma",
				});
			}

			// Analisar e otimizar as combinações com configurações de flexibilidade
			const analyzedCombinations = combinations.map((combo, index) => {
				const scheduleId = createId(); // Gerar CUID único
				return this.analyzeScheduleCombination(
					combo,
					index,
					flexibility,
					scheduleId,
				);
			});

			// Ordenar por viabilidade e duração
			const optimizedSchedules = analyzedCombinations
				.sort((a, b) => {
					if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
					return a.totalDuration - b.totalDuration;
				})
				.slice(0, 10); // Retornar apenas as 10 melhores

			// 🎯 ESTRATÉGIA HÍBRIDA IMPLEMENTADA GRADUALMENTE
			// Por enquanto, usar cache otimizado + persistência manual

			const scheduleStorage = new Map<
				string,
				ScheduleCombination & {
					userId: string;
					cinemaCode: string;
					date: string;
					flexibility: typeof flexibility;
					createdAt: Date;
					expiresAt: Date;
				}
			>();

			// Armazenar cronogramas no cache otimizado (2 horas)
			optimizedSchedules.forEach((schedule) => {
				// Cache principal para performance
				scheduleCache.set(schedule.id, schedule);

				// Storage alternativo com dados completos para backup
				scheduleStorage.set(schedule.id, {
					...schedule,
					userId: request.body.userId,
					cinemaCode,
					date,
					flexibility,
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
				});
			});

			// Auto-limpeza após 2 horas
			setTimeout(
				() => {
					optimizedSchedules.forEach((schedule) => {
						scheduleCache.delete(schedule.id);
						scheduleStorage.delete(schedule.id);
					});
				},
				2 * 60 * 60 * 1000,
			);

			return reply.send({
				success: true,
				cinema: {
					code: cinemaCode,
					name: movies[0].cinema.name,
				},
				date,
				totalMovies: movieIds.length,
				totalCombinations: optimizedSchedules.length,
				flexibilitySettings: {
					allowLateEntry: `${flexibility.allowLateEntry} minutos`,
					allowEarlyExit: `${flexibility.allowEarlyExit} minutos`,
					breakTime: `${flexibility.breakTime} minutos`,
					description: `Você pode chegar até ${flexibility.allowLateEntry}min atrasado e sair ${flexibility.allowEarlyExit}min antes do fim. Intervalo entre filmes: ${flexibility.breakTime}min.`,
				},
				recommendations: optimizedSchedules,
				storageStrategy: {
					type: "hybrid",
					location: "database + memory_cache",
					ttl: "2 horas",
					cleanup: "automática",
				},
			});
		} catch (error) {
			console.error("Erro ao gerar cronogramas:", error);
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
				name: string;
				scheduleId: string; // Apenas o ID do cronograma
			};
		}>,
		reply: FastifyReply,
	) {
		try {
			const { userId, name, scheduleId } = request.body;
			console.log("Recebido body:", JSON.stringify(request.body, null, 2));

			// Validações
			if (!scheduleId) {
				return reply.status(400).send({
					success: false,
					error: "O campo 'scheduleId' é obrigatório",
				});
			}

			// 🎯 BUSCA HÍBRIDA: Cache primeiro, depois banco (quando implementado)
			let schedule = scheduleCache.get(scheduleId);

			if (!schedule) {
				const dbSchedule = await db.generatedSchedule.findUnique({
					where: { id: scheduleId, expiresAt: { gte: new Date() } },
				});
				if (dbSchedule) {
					schedule = JSON.parse(dbSchedule.items as string);
					if (schedule) {
						scheduleCache.set(scheduleId, schedule);
					}
				}
			}

			if (!schedule) {
				return reply.status(404).send({
					success: false,
					error:
						"Cronograma não encontrado ou expirado (TTL: 2 horas). Gere novamente as recomendações.",
					hint: "Use POST /api/schedules/generate para criar novos cronogramas",
				});
			}
			if (
				!schedule.items ||
				!Array.isArray(schedule.items) ||
				schedule.items.length === 0
			) {
				return reply.status(400).send({
					success: false,
					error: "O cronograma não possui items válidos",
				});
			}

			console.log(`Salvando cronograma: ${name}`);

			// Buscar dados do primeiro filme para obter cinema e data
			const firstMovieId = schedule.items[0].movieId;
			const movieInfo = await db.movie.findFirst({
				where: { id: firstMovieId },
				include: { cinema: true },
			});

			if (!movieInfo) {
				return reply.status(404).send({
					success: false,
					error: "Filme não encontrado no banco de dados",
				});
			}

			// Criar usuário se não existir
			await db.user.upsert({
				where: { id: userId },
				update: {},
				create: {
					id: userId,
					email: `${userId}@temp.com`,
					name: `User ${userId}`,
					emailVerified: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Criar o cronograma no banco
			const savedSchedule = await db.schedule.create({
				data: {
					userId,
					cinemaCode: movieInfo.cinema.code,
					date: movieInfo.date,
					name,
					totalDuration: schedule.totalDuration,
					startTime: schedule.startTime,
					endTime: schedule.endTime,
					items: {
						create: schedule.items.map((item, index) => ({
							movieId: item.movieId,
							sessionId: item.sessionId,
							order: item.order || index + 1,
							startTime: item.startTime,
							endTime: item.endTime,
							travelTime: item.travelTime,
						})),
					},
				},
				include: {
					items: {
						include: {
							movie: {
								select: {
									id: true,
									title: true,
									duration: true,
									genre: true,
									posterUrl: true,
								},
							},
							session: {
								select: {
									id: true,
									time: true,
									sessionType: true,
								},
							},
						},
						orderBy: { order: "asc" },
					},
				},
			});
			return reply.send({
				success: true,
				schedule: savedSchedule,
				message: "Cronograma salvo com sucesso!",
				scheduleSummary: {
					id: savedSchedule.id,
					name: savedSchedule.name,
					totalMovies: savedSchedule.items.length,
					startTime: savedSchedule.startTime,
					endTime: savedSchedule.endTime,
					totalDuration: `${Math.floor(savedSchedule.totalDuration / 60)}h ${savedSchedule.totalDuration % 60}m`,
				},
			});
		} catch (error) {
			console.error("Erro ao salvar cronograma:", error);
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
			console.error("Erro ao buscar cronogramas:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro interno do servidor",
			});
		}
	}



	/**
	 * Gera todas as combinações possíveis de sessões para os filmes
	 */
	public generateAllCombinations(
		movies: MovieWithSessions[],
	): CombinationItem[][] {
		const combinations: CombinationItem[][] = [];

		// Função recursiva para gerar combinações
		const generateRecursive = (
			movieIndex: number,
			currentCombination: CombinationItem[],
		) => {
			if (movieIndex >= movies.length) {
				// Só adicionar combinações que tenham pelo menos um item
				if (currentCombination.length > 0) {
					combinations.push([...currentCombination]);
				}
				return;
			}

			const movie = movies[movieIndex];
			
			// Se o filme não tem sessões, pular para o próximo filme
			if (!movie.sessions || movie.sessions.length === 0) {
				generateRecursive(movieIndex + 1, currentCombination);
				return;
			}

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
	public analyzeScheduleCombination(
		combination: CombinationItem[],
		index: number,
		flexibility?: {
			allowLateEntry: number;
			allowEarlyExit: number;
			breakTime: number;
		},
		scheduleId?: string,
	): ScheduleCombination {
		const conflicts: string[] = [];
		let feasible = true;

		// Validar se a combinação não está vazia
		if (!combination || combination.length === 0) {
			return {
				id: scheduleId || createId(),
				name: `Cronograma ${index + 1} (Vazio)`,
				totalDuration: 0,
				startTime: "00:00",
				endTime: "00:00",
				items: [],
				conflicts: ["Nenhum filme na combinação"],
				feasible: false,
			};
		}

		// Configurações padrão se não fornecidas
		const flex = flexibility || {
			allowLateEntry: 5,
			allowEarlyExit: 5,
			breakTime: 5,
		};

		// Ordenar por horário de início
		const sortedItems = combination
			.map((item, i) => {
				const sessionStart = item.session.time;
				const movieDuration = this.parseDuration(item.movie.duration);

				// Horário efetivo de entrada (pode atrasar até allowLateEntry minutos)
				const effectiveStart = this.addMinutes(
					sessionStart,
					flex.allowLateEntry,
				);

				// Horário efetivo de saída (pode sair allowEarlyExit minutos antes)
				const effectiveEnd = this.addMinutes(
					sessionStart,
					movieDuration - flex.allowEarlyExit,
				);

				// Tempo total necessário (do início da sessão até saída efetiva)
				const totalTimeNeeded = movieDuration - flex.allowEarlyExit;

				return {
					movieId: item.movie.id,
					sessionId: item.session.id,
					order: i,
					startTime: sessionStart, // Horário oficial da sessão
					effectiveStart, // Horário limite de entrada
					endTime: this.addMinutes(sessionStart, movieDuration), // Fim oficial
					effectiveEnd, // Saída efetiva (com margem)
					travelTime: i > 0 ? flex.breakTime : 0, // Intervalo personalizável
					movie: item.movie,
					session: item.session,
					duration: movieDuration,
					totalTimeNeeded,
				};
			})
			.sort(
				(a, b) =>
					this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
			);

		// Verificar conflitos de horário usando margens de flexibilidade
		for (let i = 1; i < sortedItems.length; i++) {
			const prevItem = sortedItems[i - 1];
			const currentItem = sortedItems[i];

			// Horário mínimo para próximo filme: saída efetiva + intervalo + tempo de deslocamento
			const minNextStart = this.addMinutes(
				prevItem.effectiveEnd,
				prevItem.travelTime,
			);

			// Horário máximo de entrada: início da sessão + margem de atraso
			const maxEntryTime = currentItem.effectiveStart;

			// Verifica se há conflito
			if (this.timeToMinutes(maxEntryTime) < this.timeToMinutes(minNextStart)) {
				const timeDiff =
					this.timeToMinutes(minNextStart) - this.timeToMinutes(maxEntryTime);
				conflicts.push(
					`Conflito: ${prevItem.movie.title} (sai às ${prevItem.effectiveEnd}) + intervalo ${prevItem.travelTime}min = ${minNextStart}, mas ${currentItem.movie.title} permite entrada só até ${maxEntryTime} (${timeDiff}min de diferença)`,
				);
				feasible = false;
			} else {
				// Adiciona informação de folga disponível
				const extraTime =
					this.timeToMinutes(maxEntryTime) - this.timeToMinutes(minNextStart);
				if (extraTime > 0) {
					conflicts.push(
						`✅ Folga de ${extraTime} minutos entre ${prevItem.movie.title} e ${currentItem.movie.title}`,
					);
				}
			}
		}

		// Validar se há itens após processamento
		if (sortedItems.length === 0) {
			return {
				id: scheduleId || createId(),
				name: `Cronograma ${index + 1} (Sem itens válidos)`,
				totalDuration: 0,
				startTime: "00:00",
				endTime: "00:00",
				items: [],
				conflicts: ["Nenhum item válido após processamento"],
				feasible: false,
			};
		}

		const firstItem = sortedItems[0];
		const lastItem = sortedItems[sortedItems.length - 1];
		const totalDuration =
			this.timeToMinutes(lastItem.endTime) -
			this.timeToMinutes(firstItem.startTime);

		return {
			id: scheduleId || createId(),
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
	public parseDuration(duration: string | null): number {
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
	public timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(":").map(Number);
		return hours * 60 + minutes;
	}

	/**
	 * Adiciona minutos a um horário
	 */
	public addMinutes(time: string, minutes: number): string {
		const totalMinutes = this.timeToMinutes(time) + minutes;
		const hours = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;

		return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
	}
}
