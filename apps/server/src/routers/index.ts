import type { FastifyInstance } from "fastify";
import { AppController } from "../controllers/app-simple.controller";
import { ScheduleController } from "../controllers/schedule.controller";

export async function appRoutes(fastify: FastifyInstance) {
	const appController = new AppController();
	const scheduleController = new ScheduleController();

	// === ROTAS DA APLICAÇÃO ===

	// Inicializar aplicação - primeira carga
	fastify.get("/api/init", appController.initializeApp.bind(appController));

	// Selecionar cinema - retorna dados instantâneos
	fastify.get(
		"/api/cinema/:cinemaCode",
		appController.selectCinema.bind(appController),
	);

	// Selecionar data - retorna filmes instantâneos
	fastify.get(
		"/api/cinema/:cinemaCode/date/:date",
		appController.selectDate.bind(appController),
	);

	// Status do sistema
	fastify.get("/api/status", appController.getSystemStatus.bind(appController));

	// Executar job manualmente (manutenção)
	fastify.post(
		"/api/jobs/:jobName/run",
		appController.runManualJob.bind(appController),
	);

	// === ROTAS DE CRONOGRAMAS ===

	// Gerar cronogramas para filmes selecionados
	fastify.post(
		"/api/schedules/generate",
		scheduleController.generateSchedules.bind(scheduleController),
	);

	// Salvar cronograma selecionado
	fastify.post(
		"/api/schedules/save",
		scheduleController.saveSchedule.bind(scheduleController),
	);

	// Listar cronogramas do usuário
	fastify.get(
		"/api/users/:userId/schedules",
		scheduleController.getUserSchedules.bind(scheduleController),
	);

	// Atualizar cronograma existente
	fastify.put(
		"/api/schedules/update",
		scheduleController.updateSchedule.bind(scheduleController),
	);

	// === ROTA DE HEALTH CHECK ===

	// Rota de health check específica da API
	fastify.get("/api/health", async () => {
		return {
			success: true,
			timestamp: new Date().toISOString(),
			message: "Cinema API is running",
		};
	});
}
