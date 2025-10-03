import type { FastifyInstance } from "fastify";
import { CronService } from "@/services/cron.service";

export async function cronRoutes(app: FastifyInstance) {
	const cronService = CronService.getInstance();

	// GET: Status de todos os Cron Jobs
	app.get(
		"/api/cron/status",
		{
			schema: {
				description: "Obter status de todos os Cron Jobs",
				tags: ["Cron Jobs"],
				summary: "GET Cron Jobs Status",
			},
		},
		async (_request, reply) => {
			try {
				const status = cronService.getJobsStatus();

				return reply.send({
					success: true,
					jobs: {
						"cinemas-scraping": {
							name: "Scraping de Cinemas",
							schedule: "Domingos às 02:00",
							description: "Atualiza lista de cinemas disponíveis semanalmente",
							active: status["cinemas-scraping"] || false,
						},
						"schedule-cleanup": {
							name: "Limpeza de Cronogramas Temporários",
							schedule: "A cada 6 horas",
							description:
								"Remove cronogramas temporários expirados do cache e banco",
							active: status["schedule-cleanup"] || false,
						},
						"expired-schedules-by-date": {
							name: "Limpeza por Data",
							schedule: "Diariamente às 00:15",
							description: "Remove cronogramas cuja data já passou",
							active: status["expired-schedules-by-date"] || false,
						},
					},
					totalJobs: Object.keys(status).length,
					activeJobs: Object.values(status).filter(Boolean).length,
				});
			} catch (error) {
				console.error("Erro ao obter status dos Cron Jobs:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);

	// POST: Executar um job manualmente
	app.post<{
		Params: { jobName: string };
	}>(
		"/api/cron/run/:jobName",
		{
			schema: {
				description: "Executar um Cron Job manualmente para teste",
				tags: ["Cron Jobs"],
				summary: "RUN Cron Job Manually",
			},
		},
		async (request, reply) => {
			try {
				const { jobName } = request.params;

				const validJobs = [
					"cinemas-scraping",
					"schedule-cleanup",
					"expired-schedules-by-date",
				];

				if (!validJobs.includes(jobName)) {
					return reply.status(400).send({
						success: false,
						error: `Job inválido. Jobs disponíveis: ${validJobs.join(", ")}`,
					});
				}

				console.log(`Executando job "${jobName}" manualmente via API...`);
				await cronService.runJobManually(jobName);

				return reply.send({
					success: true,
					message: `Job "${jobName}" executado com sucesso`,
					executedAt: new Date().toISOString(),
				});
			} catch (error) {
				console.error("Erro ao executar job manualmente:", error);
				return reply.status(500).send({
					success: false,
					error:
						error instanceof Error ? error.message : "Erro interno do servidor",
				});
			}
		},
	);
}
