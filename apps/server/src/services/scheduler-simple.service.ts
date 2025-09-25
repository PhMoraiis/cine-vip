import * as cron from "node-cron";
import db from "../db";
import { CineflixCinemasScraper } from "../scrapers/cineflix-cinemas";

export class SchedulerService {
	private static instance: SchedulerService;
	private jobs: Map<string, cron.ScheduledTask> = new Map();

	static getInstance(): SchedulerService {
		if (!SchedulerService.instance) {
			SchedulerService.instance = new SchedulerService();
		}
		return SchedulerService.instance;
	}

	/**
	 * Inicia o sistema de agendamento
	 */
	async startScheduler() {
		console.log("🚀 Iniciando sistema de agendamento...");

		// Job para atualizar cinemas - todo dia às 2h da manhã
		this.scheduleJob(
			"update-cinemas",
			"0 2 * * *",
			this.updateCinemas.bind(this),
		);

		// Job para limpar dados antigos - todo dia às 1h da manhã
		this.scheduleJob(
			"cleanup-old-data",
			"0 1 * * *",
			this.cleanupOldData.bind(this),
		);

		console.log("✅ Todos os jobs foram agendados com sucesso!");
	}

	/**
	 * Para todos os jobs
	 */
	stopAllJobs() {
		console.log("🛑 Parando todos os jobs...");

		for (const [name, job] of this.jobs) {
			job.stop();
			console.log(`  ❌ Job '${name}' parado`);
		}

		this.jobs.clear();
	}

	/**
	 * Agenda um job
	 */
	private scheduleJob(
		name: string,
		schedule: string,
		task: () => Promise<void>,
	) {
		const job = cron.schedule(
			schedule,
			async () => {
				console.log(`🔧 Executando job '${name}'...`);
				try {
					await task();
				} catch (error) {
					console.error(`❌ Erro no job '${name}':`, error);
				}
			},
			{
				timezone: "America/Sao_Paulo",
			},
		);

		this.jobs.set(name, job);
		console.log(`  📅 Job '${name}' agendado: ${schedule}`);
	}

	/**
	 * Atualiza lista de cinemas disponíveis
	 */
	private async updateCinemas() {
		console.log("🏛️ Atualizando lista de cinemas...");

		try {
			const scraper = new CineflixCinemasScraper();
			const result = await scraper.getAvailableCinemas();

			if (result.success) {
				console.log(`  📊 ${result.totalCinemas} cinemas encontrados`);

				// Salvar ou atualizar cinemas no banco
				for (const cinema of result.allCinemas) {
					try {
						await db.cinema.upsert({
							where: { code: cinema.code },
							update: {
								name: cinema.name,
								state: cinema.state,
								optgroupLabel: cinema.optgroupLabel,
							},
							create: {
								code: cinema.code,
								name: cinema.name,
								state: cinema.state,
								optgroupLabel: cinema.optgroupLabel,
							},
						});
					} catch (dbError) {
						console.error(
							`  ⚠️  Erro ao salvar cinema ${cinema.code}:`,
							dbError,
						);
					}
				}

				console.log("  ✅ Cinemas atualizados com sucesso");
			} else {
				console.error("  ❌ Falha no scraping de cinemas:", result.error);
			}
		} catch (error) {
			console.error("  ❌ Erro ao atualizar cinemas:", error);
		}
	}

	/**
	 * Remove dados antigos
	 */
	private async cleanupOldData() {
		console.log("🧹 Limpando dados antigos...");

		try {
			const today = new Date().toISOString().split("T")[0];

			// Remover filmes e sessões de dias passados
			const deletedMovies = await db.movie.deleteMany({
				where: {
					date: {
						lt: today,
					},
				},
			});

			// Remover datas disponíveis antigas
			const deletedDates = await db.availableDate.deleteMany({
				where: {
					value: {
						lt: today,
					},
				},
			});

			// Remover jobs antigos se existir tabela
			try {
				const deletedJobs = await db.scrapingJob.deleteMany({
					where: {
						createdAt: {
							lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
						},
					},
				});
				console.log(`    🔧 ${deletedJobs.count} jobs antigos removidos`);
			} catch {
				// Ignora se tabela não existir
			}

			console.log("  ✅ Limpeza concluída:");
			console.log(`    🎬 ${deletedMovies.count} filmes removidos`);
			console.log(`    📅 ${deletedDates.count} datas removidas`);
		} catch (error) {
			console.error("  ❌ Erro na limpeza:", error);
		}
	}

	/**
	 * Executar job manualmente (para manutenção)
	 */
	async runJobManually(jobName: string): Promise<boolean> {
		console.log(`🔧 Executando job '${jobName}' manualmente...`);

		try {
			switch (jobName) {
				case "update-cinemas":
					await this.updateCinemas();
					return true;
				case "cleanup-old-data":
					await this.cleanupOldData();
					return true;
				default:
					console.error(`❌ Job '${jobName}' não encontrado`);
					return false;
			}
		} catch (error) {
			console.error(`❌ Erro ao executar job '${jobName}':`, error);
			return false;
		}
	}
}
