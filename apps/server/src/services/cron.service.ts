import * as cron from "node-cron";
// import { ScheduleCleanupService } from "@/services/schedule-cleanup.service";
import Prisma from "@/db";
import { CinemaScraper } from "@/scrapers/cineflix-cinemas";

export class CronService {
	private static instance: CronService;
	private cinemaScraper: CinemaScraper;
	private jobs: Map<string, cron.ScheduledTask> = new Map();

	private constructor() {
		this.cinemaScraper = new CinemaScraper();
	}

	public static getInstance(): CronService {
		if (!CronService.instance) {
			CronService.instance = new CronService();
		}
		return CronService.instance;
	}

	/**
	 * Inicializar todos os cron jobs
	 */
	public initializeJobs(): void {
		console.log("🕐 Iniciializando Cron Jobs...");

		// 1. Scraping de Cinemas - Semanalmente (Domingo às 02:00)
		this.scheduleCinemasScraping();

		// 2. Atualização Diária de Datas - Todo dia às 06:00
		this.scheduleDailyDatesUpdate();

		// 5. Limpeza de Filmes Passados - Diariamente às 01:00
		this.schedulePastMoviesCleanup();

		// 3. Limpeza de Cronogramas Expirados - A cada 6 horas
		this.scheduleScheduleCleanup();

		// 4. Limpeza de Cronogramas por Data - Diariamente (Todo dia às 00:15)
		this.scheduleExpiredSchedulesByDate();

		console.log("✅ Todos os Cron Jobs foram inicializados com sucesso!");
	}

	/**
	 * Scraping de Cinemas - Semanalmente aos Domingos às 02:00
	 */
	private scheduleCinemasScraping(): void {
		const job = cron.schedule(
			"0 2 * * 0", // Domingo às 02:00
			async () => {
				console.log("Iniciando scraping semanal de cinemas...");
				try {
					const result = await this.cinemaScraper.getAvailableCinemas();

					if (result.success) {
						// Atualizar/inserir cinemas no banco
						for (const cinema of result.allCinemas) {
							await Prisma.cinema.upsert({
								where: { code: cinema.code },
								update: {
									name: cinema.name,
									state: cinema.state,
									optgroupLabel: cinema.optgroupLabel,
									updatedAt: new Date(),
								},
								create: {
									code: cinema.code,
									name: cinema.name,
									state: cinema.state,
									optgroupLabel: cinema.optgroupLabel,
								},
							});
						}

						console.log(
							`Scraping de cinemas concluído: ${result.totalCinemas} cinemas processados`,
						);
					} else {
						console.error("Falha no scraping de cinemas:", result.error);
					}
				} catch (error) {
					console.error("Erro durante scraping de cinemas:", error);
				}
			},
			{
				timezone: "America/Sao_Paulo",
			},
		);

		this.jobs.set("cinemas-scraping", job);
		job.start();
		console.log("Cron Job de Cinemas agendado: Domingos às 02:00");
	}

	/**
	 * Atualização Diária de Datas - Todo dia às 06:00
	 */
	private scheduleDailyDatesUpdate(): void {
		const job = cron.schedule(
			"0 6 * * *", // Todo dia às 06:00
			async () => {
				console.log("📅 Iniciando atualização diária de datas...");
				try {
					const { DateScraper } = await import("@/scrapers/cineflix-dates");
					const dateScraper = new DateScraper();

					// Buscar TODOS os cinemas do banco de dados
					const cinemas = await Prisma.cinema.findMany({
						select: { code: true, name: true },
					});

					if (cinemas.length === 0) {
						console.warn("⚠️ Nenhum cinema encontrado no banco de dados");
						return;
					}

					console.log(`📋 ${cinemas.length} cinemas para atualizar datas`);

					for (const cinema of cinemas) {
						console.log(`🏛️ Atualizando datas para: ${cinema.code}`);

						try {
							// Buscar datas disponíveis
							const datesResponse = await dateScraper.getAvailableDates(
								cinema.code,
							);

							if (
								!datesResponse.success ||
								datesResponse.availableDates.length === 0
							) {
								console.log(`⚠️ Nenhuma data disponível para ${cinema.code}`);
								continue;
							}

							// Salvar/atualizar datas no banco
							for (const dateOption of datesResponse.availableDates) {
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
								`✅ ${datesResponse.availableDates.length} datas atualizadas para ${cinema.code}`,
							);
						} catch (error) {
							console.error(
								`❌ Erro ao atualizar datas para ${cinema.code}:`,
								error,
							);
						}

						// Pausa entre cinemas
						await new Promise((resolve) => setTimeout(resolve, 2000));
					}

					console.log("✅ Atualização diária de datas concluída!");
				} catch (error) {
					console.error("❌ Erro durante atualização diária de datas:", error);
				}
			},
			{
				timezone: "America/Sao_Paulo",
			},
		);

		this.jobs.set("daily-dates-update", job);
		job.start();
		console.log(
			"Cron Job de Atualização de Datas agendado: Diariamente às 06:00",
		);
	}

	/**
	 * Limpeza de Filmes Passados - Diariamente às 01:00
	 */
	private schedulePastMoviesCleanup(): void {
		const job = cron.schedule(
			"0 1 * * *", // Todo dia às 01:00
			async () => {
				console.log("🗑️ Iniciando limpeza de filmes passados...");
				try {
					// Calcular data de ontem
					const yesterday = new Date();
					yesterday.setDate(yesterday.getDate() - 1);
					const yesterdayStr = yesterday.toISOString().split("T")[0];

					// Buscar filmes de datas passadas
					const pastMovies = await Prisma.movie.findMany({
						where: {
							date: {
								lt: yesterdayStr,
							},
						},
						select: {
							id: true,
							date: true,
							title: true,
						},
					});

					if (pastMovies.length > 0) {
						const movieIds = pastMovies.map((m) => m.id);

						// Deletar sessões primeiro (foreign key)
						const sessionsDeleted = await Prisma.movieSession.deleteMany({
							where: {
								movieId: {
									in: movieIds,
								},
							},
						});

						// Deletar filmes
						const moviesDeleted = await Prisma.movie.deleteMany({
							where: {
								id: {
									in: movieIds,
								},
							},
						});

						console.log(
							`✅ Limpeza concluída: ${moviesDeleted.count} filmes e ${sessionsDeleted.count} sessões removidos (data < ${yesterdayStr})`,
						);
					} else {
						console.log("ℹ️ Nenhum filme passado encontrado para remover");
					}
				} catch (error) {
					console.error("❌ Erro durante limpeza de filmes passados:", error);
				}
			},
			{
				timezone: "America/Sao_Paulo",
			},
		);

		this.jobs.set("past-movies-cleanup", job);
		job.start();
		console.log(
			"Cron Job de Limpeza de Filmes Passados agendado: Diariamente às 01:00",
		);
	}

	/**
	 * Limpeza de Cronogramas Temporários Expirados - A cada 6 horas
	 */
	private scheduleScheduleCleanup(): void {
		const job = cron.schedule(
			"0 */6 * * *", // A cada 6 horas
			async () => {
				console.log("Iniciando limpeza de cronogramas temporários...");
				try {
					// Limpeza manual de cronogramas expirados
					const deleteResult = await Prisma.generatedSchedule.deleteMany({
						where: { expiresAt: { lt: new Date() } },
					});

					console.log(
						`Limpeza concluída: ${deleteResult.count} cronogramas temporários removidos`,
					);
				} catch (error) {
					console.error("Erro durante limpeza de cronogramas:", error);
				}
			},
			{
				timezone: "America/Sao_Paulo",
			},
		);

		this.jobs.set("schedule-cleanup", job);
		job.start();
		console.log("Cron Job de Limpeza agendado: A cada 6 horas");
	}

	/**
	 * Limpeza de Cronogramas por Data Vencida - Diariamente às 00:15
	 */
	private scheduleExpiredSchedulesByDate(): void {
		const job = cron.schedule(
			"15 0 * * *", // Todo dia às 00:15
			async () => {
				console.log("Iniciando limpeza de cronogramas por data vencida...");
				try {
					// Buscar cronogramas cuja data já passou (ontem ou antes)
					const yesterday = new Date();
					yesterday.setDate(yesterday.getDate() - 1);
					yesterday.setHours(23, 59, 59, 999); // Fim do dia anterior

					const expiredSchedules = await Prisma.schedule.findMany({
						where: {
							date: {
								lt: yesterday.toISOString().split("T")[0], // Data no formato YYYY-MM-DD
							},
						},
						select: {
							id: true,
							name: true,
							date: true,
							userId: true,
						},
					});

					if (expiredSchedules.length > 0) {
						// Remover cronogramas expirados
						const scheduleIds = expiredSchedules.map((schedule) => schedule.id);

						const deleteResult = await Prisma.schedule.deleteMany({
							where: {
								id: {
									in: scheduleIds,
								},
							},
						});

						console.log(
							`Limpeza por data concluída: ${deleteResult.count} cronogramas removidos (data < ${yesterday.toISOString().split("T")[0]})`,
						);

						// Log dos cronogramas removidos para auditoria
						expiredSchedules.forEach((schedule) => {
							console.log(
								`📋 Cronograma removido: ${schedule.name} (${schedule.date}) - Usuário: ${schedule.userId}`,
							);
						});
					} else {
						console.log("Nenhum cronograma expirado por data encontrado");
					}
				} catch (error) {
					console.error("Erro durante limpeza por data:", error);
				}
			},
			{
				timezone: "America/Sao_Paulo",
			},
		);

		this.jobs.set("expired-schedules-by-date", job);
		job.start();
		console.log("Cron Job de Limpeza por Data agendado: Diariamente às 00:15");
	}

	/**
	 * Executar job manualmente para teste
	 */
	public async runJobManually(jobName: string): Promise<void> {
		const job = this.jobs.get(jobName);
		if (!job) {
			throw new Error(`Job "${jobName}" não encontrado`);
		}

		console.log(`Executando job "${jobName}" manualmente...`);

		// Executar a função do job diretamente
		switch (jobName) {
			case "cinemas-scraping":
				await this.executeCinemasScraping();
				break;

			case "schedule-cleanup":
				await this.executeScheduleCleanup();
				break;
			case "expired-schedules-by-date":
				await this.executeExpiredSchedulesByDate();
				break;
			default:
				throw new Error(`Job "${jobName}" não implementado`);
		}
	}

	/**
	 * Obter status de todos os jobs
	 */
	public getJobsStatus(): Record<string, boolean> {
		const status: Record<string, boolean> = {};

		this.jobs.forEach((job, name) => {
			status[name] = job.getStatus() === "scheduled";
		});

		return status;
	}

	/**
	 * Parar todos os jobs
	 */
	public stopAllJobs(): void {
		console.log("Parando todos os Cron Jobs...");

		this.jobs.forEach((job, name) => {
			job.stop();
			console.log(`Job "${name}" parado`);
		});

		console.log("Todos os Cron Jobs foram parados");
	}

	// Métodos privados para execução individual dos jobs
	private async executeCinemasScraping(): Promise<void> {
		const result = await this.cinemaScraper.getAvailableCinemas();

		if (result.success) {
			for (const cinema of result.allCinemas) {
				await Prisma.cinema.upsert({
					where: { code: cinema.code },
					update: {
						name: cinema.name,
						state: cinema.state,
						optgroupLabel: cinema.optgroupLabel,
						updatedAt: new Date(),
					},
					create: {
						code: cinema.code,
						name: cinema.name,
						state: cinema.state,
						optgroupLabel: cinema.optgroupLabel,
					},
				});
			}
		}
	}

	private async executeScheduleCleanup(): Promise<void> {
		const deleteResult = await Prisma.generatedSchedule.deleteMany({
			where: { expiresAt: { lt: new Date() } },
		});
		console.log(
			`Limpeza manual: ${deleteResult.count} cronogramas temporários removidos`,
		);
	}

	private async executeExpiredSchedulesByDate(): Promise<void> {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		yesterday.setHours(23, 59, 59, 999);

		const expiredSchedules = await Prisma.schedule.findMany({
			where: {
				date: {
					lt: yesterday.toISOString().split("T")[0],
				},
			},
			select: {
				id: true,
				name: true,
				date: true,
				userId: true,
			},
		});

		if (expiredSchedules.length > 0) {
			const scheduleIds = expiredSchedules.map((schedule) => schedule.id);

			await Prisma.schedule.deleteMany({
				where: {
					id: {
						in: scheduleIds,
					},
				},
			});
		}
	}
}
