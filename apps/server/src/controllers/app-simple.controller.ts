import type { FastifyReply, FastifyRequest } from "fastify";
import db from "../db";
import { CineflixDatesScraper } from "../scrapers/cineflix-dates";
import { CineflixScraper } from "../scrapers/cineflix-sessions";
import { SchedulerService } from "../services/scheduler-simple.service";

interface CinemaParam {
	cinemaCode: string;
}

interface CinemaDateParam {
	cinemaCode: string;
	date: string;
}

interface JobParam {
	jobName: string;
}

export class AppController {
	/**
	 * Inicializar aplicação - retorna lista de cinemas
	 */
	async initializeApp(_request: FastifyRequest, reply: FastifyReply) {
		try {
			console.log("🚀 Inicializando aplicação...");

			// Buscar cinemas do banco
			const cinemas = await db.cinema.findMany({
				orderBy: [{ state: "asc" }, { name: "asc" }],
			});

			// Se não tem cinemas, tentar buscar
			if (cinemas.length === 0) {
				console.log(
					"  📊 Nenhum cinema encontrado, executando job de atualização...",
				);
				const scheduler = SchedulerService.getInstance();
				const success = await scheduler.runJobManually("update-cinemas");

				if (success) {
					const newCinemas = await db.cinema.findMany({
						orderBy: [{ state: "asc" }, { name: "asc" }],
					});

					return reply.send({
						success: true,
						firstTime: true,
						cinemas: newCinemas,
						currentDate: new Date().toISOString().split("T")[0],
						message: "Cinemas carregados pela primeira vez",
					});
				}

				return reply.status(500).send({
					success: false,
					error: "Não foi possível carregar os cinemas",
				});
			}

			return reply.send({
				success: true,
				firstTime: false,
				cinemas,
				currentDate: new Date().toISOString().split("T")[0],
				message: "Dados carregados do cache",
			});
		} catch (error) {
			console.error("❌ Erro na inicialização:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro interno do servidor",
			});
		}
	}

	/**
	 * Selecionar cinema - faz scraping das datas e filmes do dia atual
	 */
	async selectCinema(
		request: FastifyRequest<{ Params: CinemaParam }>,
		reply: FastifyReply,
	) {
		try {
			const { cinemaCode } = request.params;
			const today = new Date().toISOString().split("T")[0];

			console.log(`🎯 Usuário selecionou cinema: ${cinemaCode}`);

			// Buscar dados do cinema
			const cinema = await db.cinema.findUnique({
				where: { code: cinemaCode },
			});

			if (!cinema) {
				return reply.status(404).send({
					success: false,
					error: "Cinema não encontrado",
				});
			}

			// Fazer scraping das datas disponíveis
			console.log(`📅 Fazendo scraping das datas para ${cinemaCode}...`);
			const dateScraper = new CineflixDatesScraper();
			const datesResult = await dateScraper.getAvailableDates(cinemaCode);

			let availableDates: unknown[] = [];
			if (datesResult.success) {
				// Salvar datas no banco
				await db.availableDate.deleteMany({
					where: { cinemaCode },
				});

				for (const date of datesResult.availableDates) {
					await db.availableDate.create({
						data: {
							cinemaCode,
							value: date.value,
							displayText: date.displayText,
							dayOfWeek: date.dayOfWeek,
							dayNumber: date.dayNumber,
						},
					});
				}

				availableDates = datesResult.availableDates;
			}

			// Fazer scraping dos filmes do dia atual
			console.log(
				`🎬 Fazendo scraping dos filmes de hoje para ${cinemaCode}...`,
			);
			const moviesScraper = new CineflixScraper();
			const moviesResult = await moviesScraper.scrapeWithAngularJS(
				cinemaCode,
				today,
			);

			let todayMovies: unknown[] = [];
			if (moviesResult && moviesResult.length > 0) {
				// Salvar filmes no banco
				await db.movie.deleteMany({
					where: {
						cinemaId: cinema.id,
						date: today,
					},
				});

				for (const movie of moviesResult) {
					await db.movie.create({
						data: {
							externalId: movie.id || `${cinemaCode}-${movie.title}-${today}`,
							cinemaId: cinema.id,
							date: today,
							title: movie.title,
							genre: movie.genre,
							duration: movie.duration,
							rating: movie.rating,
							synopsis: movie.synopsis,
							posterUrl: movie.posterUrl,
						},
					});
				}

				todayMovies = moviesResult;
			}

			return reply.send({
				success: true,
				cinema: {
					code: cinema.code,
					name: cinema.name,
					state: cinema.state,
				},
				currentDate: today,
				availableDates,
				todayMovies,
				hasMoviesForToday: todayMovies.length > 0,
				message: "Dados atualizados com sucesso",
			});
		} catch (error) {
			console.error("❌ Erro ao selecionar cinema:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro ao processar cinema selecionado",
			});
		}
	}

	/**
	 * Selecionar data - faz scraping dos filmes para a data específica
	 */
	async selectDate(
		request: FastifyRequest<{ Params: CinemaDateParam }>,
		reply: FastifyReply,
	) {
		try {
			const { cinemaCode, date } = request.params;

			console.log(
				`📅 Usuário selecionou data: ${date} para cinema ${cinemaCode}`,
			);

			// Verificar se cinema existe
			const cinema = await db.cinema.findUnique({
				where: { code: cinemaCode },
			});

			if (!cinema) {
				return reply.status(404).send({
					success: false,
					error: "Cinema não encontrado",
				});
			}

			// Fazer scraping dos filmes para a data selecionada
			console.log(
				`🎬 Fazendo scraping dos filmes de ${date} para ${cinemaCode}...`,
			);
			const moviesScraper = new CineflixScraper();
			const moviesResult = await moviesScraper.scrapeWithAngularJS(
				cinemaCode,
				date,
			);

			let movies: unknown[] = [];
			if (moviesResult && moviesResult.length > 0) {
				// Salvar filmes no banco
				await db.movie.deleteMany({
					where: {
						cinemaId: cinema.id,
						date,
					},
				});

				for (const movie of moviesResult) {
					await db.movie.create({
						data: {
							externalId: movie.id || `${cinemaCode}-${movie.title}-${date}`,
							cinemaId: cinema.id,
							date,
							title: movie.title,
							genre: movie.genre,
							duration: movie.duration,
							rating: movie.rating,
							synopsis: movie.synopsis,
							posterUrl: movie.posterUrl,
						},
					});
				}

				movies = moviesResult;
			}

			return reply.send({
				success: true,
				cinema: {
					code: cinema.code,
					name: cinema.name,
					state: cinema.state,
				},
				date,
				movies,
				totalMovies: movies.length,
				message: `Filmes carregados para ${date}`,
			});
		} catch (error) {
			console.error("❌ Erro ao selecionar data:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro ao processar data selecionada",
			});
		}
	}

	/**
	 * Status do sistema
	 */
	async getSystemStatus(_request: FastifyRequest, reply: FastifyReply) {
		try {
			const cinemasCount = await db.cinema.count();
			const moviesCount = await db.movie.count();
			const datesCount = await db.availableDate.count();

			return reply.send({
				success: true,
				system: {
					status: "running",
					version: "2.0.0-ondemand",
					uptime: process.uptime(),
					timestamp: new Date().toISOString(),
				},
				database: {
					cinemas: cinemasCount,
					movies: moviesCount,
					availableDates: datesCount,
				},
				message: "Sistema funcionando com scraping sob demanda",
			});
		} catch (error) {
			console.error("❌ Erro ao obter status:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro ao obter status do sistema",
			});
		}
	}

	/**
	 * Executar job manualmente (manutenção)
	 */
	async runManualJob(
		request: FastifyRequest<{ Params: JobParam }>,
		reply: FastifyReply,
	) {
		try {
			const { jobName } = request.params;

			console.log(`🔧 Executando job manual: ${jobName}`);

			const scheduler = SchedulerService.getInstance();
			const success = await scheduler.runJobManually(jobName);

			if (success) {
				return reply.send({
					success: true,
					jobName,
					message: `Job '${jobName}' executado com sucesso`,
				});
			}

			return reply.status(400).send({
				success: false,
				error: `Job '${jobName}' não encontrado ou falhou`,
			});
		} catch (error) {
			console.error("❌ Erro ao executar job:", error);
			return reply.status(500).send({
				success: false,
				error: "Erro ao executar job",
			});
		}
	}
}
