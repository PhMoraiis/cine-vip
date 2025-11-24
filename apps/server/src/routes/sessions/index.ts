import type { FastifyInstance } from "fastify";
import Prisma from "@/db";
import { DateScraper } from "@/scrapers/cineflix-dates";
import { MoviesScraper } from "@/scrapers/cineflix-sessions";

export async function sessionsRoutes(app: FastifyInstance) {
	// Rota para buscar filmes e sessões no banco de dados
	app.get<{
		Params: { cinemaCode: string; date?: string };
	}>(
		"/api/sessions/:cinemaCode/:date?",
		{
			schema: {
				description:
					"Buscar filmes e sessões de um cinema em uma data específica do banco de dados",
				tags: ["Sessões"],
				summary: "GET Movies",
			},
		},
		async (request, reply) => {
			try {
				const { cinemaCode, date } = request.params;

				// Se data não for fornecida, usa a data atual
				const targetDate = date || new Date().toISOString().split("T")[0];

				// Buscar cinema com suas datas disponíveis
				const cinema = await Prisma.cinema.findUnique({
					where: { code: cinemaCode },
					include: {
						availableDates: {
							select: {
								value: true,
								displayText: true,
								dayOfWeek: true,
							},
							orderBy: { value: "asc" },
						},
					},
				});

				if (!cinema) {
					return reply.status(404).send({
						success: false,
						error: "Cinema não encontrado",
					});
				}

				// Verificar se a data está disponível
				const isDateAvailable = cinema.availableDates.some(
					(d) => d.value === targetDate,
				);

				if (!isDateAvailable && cinema.availableDates.length > 0) {
					return reply.status(400).send({
						success: false,
						error: "Data não disponível para este cinema",
						availableDates: cinema.availableDates,
					});
				}

				// Buscar filmes e sessões no banco de dados
				const movies = await Prisma.movie.findMany({
					where: {
						cinemaId: cinema.id,
						date: targetDate,
					},
					include: {
						sessions: true,
					},
					distinct: ["id"],
					orderBy: { title: "asc" },
				});

				return reply.send({
					success: true,
					cinema: {
						id: cinema.id,
						code: cinema.code,
						name: cinema.name,
						state: cinema.state,
						optgroupLabel: cinema.optgroupLabel,
					},
					selectedDate: targetDate,
					movies,
					totalMovies: movies.length,
					hasMovies: movies.length > 0,
					message: `Filmes e sessões carregados com sucesso para ${targetDate}`,
				});
			} catch (error) {
				console.error("❌ Erro ao buscar sessões no banco:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);

	// Selecionar cinema e data para ver filmes e sessões disponíveis e realiza o scraping dos filmes e sessões.
	// A data é opcional, se não for fornecida, usa a data atual.
	app.post<{
		Params: { cinemaCode: string; date?: string };
	}>(
		"/api/sessions/:cinemaCode/:date?",
		{
			schema: {
				description:
					"Seleciona um cinema e uma data para ver os filmes e sessões disponíveis",
				tags: ["Sessões"],
				summary: "SCRAPING Movies",
			},
		},
		async (request, reply) => {
			try {
				const { cinemaCode, date } = request.params;

				// Se data não for fornecida, usa a data atual
				const targetDate = date || new Date().toISOString().split("T")[0];

				// Buscar cinema com suas datas disponíveis
				const cinema = await Prisma.cinema.findUnique({
					where: { code: cinemaCode },
					include: {
						availableDates: {
							select: {
								value: true,
								displayText: true,
								dayOfWeek: true,
							},
							orderBy: { value: "asc" },
						},
					},
				});

				if (!cinema) {
					return reply.status(404).send({
						success: false,
						error: "Cinema não encontrado",
					});
				}

				// 🔄 SCRAPING DE DATAS SOB DEMANDA
				console.log(
					`Atualizando datas disponíveis para o cinema ${cinema.name}...`,
				);
				const dateScraper = new DateScraper();

				try {
					const datesResult = await dateScraper.getAvailableDates(cinemaCode);

					if (datesResult.success) {
						// Atualizar/inserir datas disponíveis
						for (const dateOption of datesResult.availableDates) {
							await Prisma.availableDate.upsert({
								where: {
									cinemaCode_value: {
										cinemaCode: cinema.code,
										value: dateOption.value,
									},
								},
								update: {
									displayText: dateOption.displayText,
									dayOfWeek: dateOption.dayOfWeek,
									dayNumber: dateOption.dayNumber,
									updatedAt: new Date(),
								},
								create: {
									cinemaCode: cinema.code,
									value: dateOption.value,
									displayText: dateOption.displayText,
									dayOfWeek: dateOption.dayOfWeek,
									dayNumber: dateOption.dayNumber,
								},
							});
						}

						console.log(
							`${datesResult.availableDates.length} datas atualizadas para ${cinema.name}`,
						);
					} else {
						console.warn(
							`Falha no scraping de datas para ${cinema.name}:`,
							datesResult.error,
						);
					}
				} catch (dateError) {
					console.error(
						`Erro no scraping de datas para ${cinema.name}:`,
						dateError,
					);
					// Não interromper o fluxo por erro no scraping de datas
				}

				// Recarregar cinema com datas atualizadas
				const updatedCinema = await Prisma.cinema.findUnique({
					where: { code: cinemaCode },
					include: {
						availableDates: {
							select: {
								value: true,
								displayText: true,
								dayOfWeek: true,
							},
							orderBy: { value: "asc" },
						},
					},
				});

				// Verificar se a data está disponível (agora com dados atualizados)
				const isDateAvailable = updatedCinema?.availableDates.some(
					(d) => d.value === targetDate,
				);

				if (
					!isDateAvailable &&
					updatedCinema?.availableDates.length &&
					updatedCinema.availableDates.length > 0
				) {
					return reply.status(400).send({
						success: false,
						error: "Data não disponível para este cinema",
						availableDates: updatedCinema.availableDates,
					});
				}

				// Realizar scraping dos filmes e sessões
				const moviesScraper = new MoviesScraper();
				const moviesResult = await moviesScraper.getMoviesSessions(
					cinemaCode,
					targetDate,
				);

				const processedMovies = [];

				if (moviesResult && moviesResult.length > 0) {
					// Processar cada filme com upsert
					for (const movieData of moviesResult) {
						try {
							// Validar se o ID existe (deve sempre existir com CUID)
							if (!movieData.id) {
								console.error(`Filme sem ID: ${movieData.title}`);
								continue;
							}

							// Upsert do filme
							const movie = await Prisma.movie.upsert({
								where: {
									externalId_cinemaId_date: {
										externalId: movieData.id,
										cinemaId: cinema.id,
										date: targetDate,
									},
								},
								update: {
									title: movieData.title,
									genre: movieData.genre,
									duration: movieData.duration,
									rating: movieData.rating,
									synopsis: movieData.synopsis,
									posterUrl: movieData.posterUrl,
								},
								create: {
									externalId: movieData.id,
									cinemaId: cinema.id,
									date: targetDate,
									title: movieData.title,
									genre: movieData.genre,
									duration: movieData.duration,
									rating: movieData.rating,
									synopsis: movieData.synopsis,
									posterUrl: movieData.posterUrl,
								},
							});

							// Processar sessões do filme
							const movieSessions = [];
							if (movieData.sessions && movieData.sessions.length > 0) {
								// Limpar sessões antigas para este filme
								await Prisma.movieSession.deleteMany({
									where: { movieId: movie.id },
								});

								// Processar cada sessão (cada sessão tem múltiplos horários)
								for (const sessionData of movieData.sessions) {
									// Criar uma sessão para cada horário
									if (sessionData.times && sessionData.times.length > 0) {
										for (const timeSlot of sessionData.times) {
											const session = await Prisma.movieSession.create({
												data: {
													movieId: movie.id,
													time: timeSlot.time,
													sessionType: timeSlot.sessionType || null,
												},
											});
											movieSessions.push(session);
										}
									}
								}
							}

							processedMovies.push({
								...movie,
								sessions: movieSessions,
							});
						} catch (error) {
							console.error(
								`Erro ao processar filme ${movieData.title}:`,
								error,
							);
						}
					}
				}

				return reply.send({
					success: true,
					cinema: {
						id: cinema.id,
						code: cinema.code,
						name: cinema.name,
						state: cinema.state,
						optgroupLabel: cinema.optgroupLabel,
					},
					selectedDate: targetDate,
					availableDates: cinema.availableDates,
					movies: processedMovies,
					totalMovies: processedMovies.length,
					hasMovies: processedMovies.length > 0,
					message: `Filmes e sessões carregados com sucesso para ${targetDate}`,
				});
			} catch (error) {
				console.error("❌ Erro ao processar sessões:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);
}
