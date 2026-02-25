import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import Prisma, { JobStatus } from "@/db";
import { DateScraper } from "@/scrapers/cineflix-dates";
import { MoviesScraper } from "@/scrapers/cineflix-sessions";

const SCRAPING_STALE_MINUTES = Number(
	process.env.SCRAPING_STALE_MINUTES ?? 30,
);

const normalizeTitle = (title: string) =>
	title
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim()
		.replace(/\s+/g, " ");

const buildExternalId = (cinemaCode: string, date: string, title: string) =>
	createHash("sha1")
		.update(`${cinemaCode}|${date}|${normalizeTitle(title)}`)
		.digest("hex");

const isJobStale = (job: { completedAt?: Date | null } | null) => {
	if (!job?.completedAt) return true;
	const ageMs = Date.now() - job.completedAt.getTime();
	return ageMs > SCRAPING_STALE_MINUTES * 60 * 1000;
};

const toScrapingJobPayload = (job: {
	id: string;
	status: JobStatus;
	startedAt: Date | null;
	completedAt: Date | null;
	error: string | null;
	moviesFound: number;
}) => ({
	id: job.id,
	status: job.status,
	startedAt: job.startedAt,
	completedAt: job.completedAt,
	error: job.error,
	moviesFound: job.moviesFound,
});

const startScrapingJob = async (
	cinemaCode: string,
	date: string,
	force = false,
) => {
	const existingJob = await Prisma.scrapingJob.findUnique({
		where: { cinemaCode_date: { cinemaCode, date } },
	});

	if (!force && existingJob) {
		if (
			existingJob.status === JobStatus.RUNNING ||
			existingJob.status === JobStatus.PENDING
		) {
			return existingJob;
		}
	}

	const job = await Prisma.scrapingJob.upsert({
		where: { cinemaCode_date: { cinemaCode, date } },
		update: {
			status: JobStatus.PENDING,
			error: null,
			updatedAt: new Date(),
		},
		create: {
			cinemaCode,
			date,
			status: JobStatus.PENDING,
		},
	});

	setTimeout(() => {
		void runScrapingJob(job.id, cinemaCode, date);
	}, 0);

	return job;
};

const runScrapingJob = async (
	jobId: string,
	cinemaCode: string,
	date: string,
) => {
	try {
		await Prisma.scrapingJob.update({
			where: { id: jobId },
			data: {
				status: JobStatus.RUNNING,
				startedAt: new Date(),
				error: null,
			},
		});

		const cinema = await Prisma.cinema.findUnique({
			where: { code: cinemaCode },
			select: { id: true, code: true, name: true },
		});

		if (!cinema) {
			await Prisma.scrapingJob.update({
				where: { id: jobId },
				data: {
					status: JobStatus.FAILED,
					error: "Cinema nao encontrado",
					completedAt: new Date(),
				},
			});
			return;
		}

		const dateScraper = new DateScraper();
		try {
			const datesResult = await dateScraper.getAvailableDates(cinemaCode);
			if (datesResult.success) {
				for (const dateOption of datesResult.availableDates) {
					await Prisma.availableDate.upsert({
						where: {
							cinemaCode_value: {
								cinemaCode,
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
							cinemaCode,
							value: dateOption.value,
							displayText: dateOption.displayText,
							dayOfWeek: dateOption.dayOfWeek,
							dayNumber: dateOption.dayNumber,
						},
					});
				}
			}
		} catch (dateError) {
			console.error(
				`Erro no scraping de datas para ${cinemaCode}:`,
				dateError,
			);
		}

		const moviesScraper = new MoviesScraper();
		const moviesResult = await moviesScraper.getMoviesSessions(
			cinemaCode,
			date,
		);

		let moviesFound = 0;
		for (const movieData of moviesResult) {
			if (!movieData.title) continue;

			const externalId = buildExternalId(
				cinemaCode,
				date,
				movieData.title,
			);

			const movie = await Prisma.movie.upsert({
				where: {
					externalId_cinemaId_date: {
						externalId,
						cinemaId: cinema.id,
						date,
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
					externalId,
					cinemaId: cinema.id,
					date,
					title: movieData.title,
					genre: movieData.genre,
					duration: movieData.duration,
					rating: movieData.rating,
					synopsis: movieData.synopsis,
					posterUrl: movieData.posterUrl,
				},
			});

			const timeSlots = movieData.sessions
				.flatMap((session) => session.times || [])
				.filter((slot) => slot?.time)
				.map((slot) => ({
					movieId: movie.id,
					time: slot.time,
					sessionType: slot.sessionType || null,
				}));

			if (timeSlots.length > 0) {
				await Prisma.movieSession.deleteMany({
					where: { movieId: movie.id },
				});
				await Prisma.movieSession.createMany({
					data: timeSlots,
				});
			}

			moviesFound += 1;
		}

		await Prisma.scrapingJob.update({
			where: { id: jobId },
			data: {
				status: JobStatus.COMPLETED,
				completedAt: new Date(),
				moviesFound,
			},
		});
	} catch (error) {
		console.error("Erro durante scraping em background:", error);
		await Prisma.scrapingJob.update({
			where: { id: jobId },
			data: {
				status: JobStatus.FAILED,
				error: error instanceof Error ? error.message : String(error),
				completedAt: new Date(),
			},
		});
	}
};

export async function sessionsRoutes(app: FastifyInstance) {
	// Rota para buscar filmes e sessões no banco de dados (cached-data-first)
	app.get<{
		Params: { cinemaCode: string; date?: string };
	}>(
		"/api/sessions/:cinemaCode/:date?",
		{},
		async (request, reply) => {
			try {
				const { cinemaCode, date } = request.params;
				const targetDate = date || new Date().toISOString().split("T")[0];

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

				const job = await Prisma.scrapingJob.findUnique({
					where: { cinemaCode_date: { cinemaCode, date: targetDate } },
				});

				const needsRefresh = isJobStale(job);

				if (needsRefresh && (!job || job.status !== JobStatus.RUNNING)) {
					void startScrapingJob(cinemaCode, targetDate, false);
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
					movies,
					totalMovies: movies.length,
					hasMovies: movies.length > 0,
					scrapingJob: job ? toScrapingJobPayload(job) : null,
					refreshingInBackground: needsRefresh,
					message: movies.length
						? `${movies.length} filmes carregados do cache`
						: "Nenhum filme em cache, atualizando agora",
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

	// Trigger scraping job manually (force refresh)
	app.post<{
		Params: { cinemaCode: string; date?: string };
	}>(
		"/api/sessions/:cinemaCode/:date?",
		{},
		async (request, reply) => {
			try {
				const { cinemaCode, date } = request.params;
				const targetDate = date || new Date().toISOString().split("T")[0];

				const cinema = await Prisma.cinema.findUnique({
					where: { code: cinemaCode },
					select: { id: true, code: true, name: true },
				});

				if (!cinema) {
					return reply.status(404).send({
						success: false,
						error: "Cinema não encontrado",
					});
				}

				const job = await startScrapingJob(cinemaCode, targetDate, true);

				return reply.status(202).send({
					success: true,
					message: "Scraping iniciado em background",
					scrapingJob: toScrapingJobPayload(job),
					cinema: {
						code: cinema.code,
						name: cinema.name,
					},
					selectedDate: targetDate,
				});
			} catch (error) {
				console.error("❌ Erro ao iniciar scraping:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);
}
