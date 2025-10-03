import type { FastifyInstance } from "fastify";
import { ScheduleController } from "@/controllers/schedule.controller";
import Prisma from "@/db";

// Interfaces para tipagem
interface GenerateScheduleBody {
	userId: string;
	cinemaCode: string;
	date: string;
	movieIds: string[];
	name?: string;
	flexibilityOptions?: {
		allowLateEntry?: number; // minutos de atraso permitidos (padrão: 5)
		allowEarlyExit?: number; // minutos de saída antecipada (padrão: 5)
		breakTime?: number; // intervalo entre filmes em minutos (padrão: 5)
	};
}

export async function scheduleRoutes(app: FastifyInstance) {
	const controller = new ScheduleController();

	// GET: Buscar todos os cronogramas de um usuário
	app.get<{
		Params: { userId: string };
	}>(
		"/api/schedules/:userId",
		{
			schema: {
				description: "Buscar cronogramas salvos do usuário",
				tags: ["Cronogramas"],
				summary: "GET Schedules for User",
			},
		},
		(request, reply) => {
			return controller.getUserSchedules(request, reply);
		},
	);

	// GET: Buscar um cronograma específico
	app.get<{
		Params: { userId: string; scheduleId: string };
	}>(
		"/api/schedules/:userId/:scheduleId",
		{
			schema: {
				description: "Buscar um cronograma específico",
				tags: ["Cronogramas"],
				summary: "GET Schedule Details",
			},
		},
		async (request, reply) => {
			try {
				const { userId, scheduleId } = request.params;

				const schedule = await Prisma.schedule.findFirst({
					where: {
						id: scheduleId,
						userId,
					},
					include: {
						items: {
							include: {
								movie: {
									include: {
										cinema: {
											select: {
												code: true,
												name: true,
												state: true,
											},
										},
									},
								},
								session: true,
							},
							orderBy: { order: "asc" },
						},
					},
				});

				if (!schedule) {
					return reply.status(404).send({
						success: false,
						error: "Cronograma não encontrado",
					});
				}

				return reply.send({
					success: true,
					schedule,
				});
			} catch (error) {
				console.error("❌ Erro ao buscar cronograma:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);

	// POST: Gerar recomendações de cronogramas baseado em filmes selecionados e salvar o cronograma no banco
	app.post<{
		Body: GenerateScheduleBody;
	}>(
		"/api/schedules/generate",
		{
			schema: {
				description: "Gerar recomendações de cronogramas otimizados",
				tags: ["Cronogramas"],
				summary: "GENERATE Schedules",
			},
		},
		(request, reply) => {
			// Usar apenas o controller para gerar cronogramas
			return controller.generateSchedules(request, reply);
		},
	);

	// POST: Salvar um cronograma específico
	app.post<{
		Body: {
			userId: string;
			name: string;
			scheduleId: string; // Apenas o CUID do cronograma
		};
	}>(
		"/api/schedules/save",
		{
			schema: {
				description:
					"Salvar um cronograma específico selecionado pelo usuário. Envie apenas o ID (CUID) do cronograma gerado.",
				tags: ["Cronogramas"],
				summary: "CREATE Schedule",
			},
		},
		(request, reply) => {
			return controller.saveSchedule(request, reply);
		},
	);

	// DELETE: Remover cronograma
	app.delete<{
		Params: { userId: string; scheduleId: string };
	}>(
		"/api/schedules/:userId/:scheduleId",
		{
			schema: {
				description: "Remover um cronograma",
				tags: ["Cronogramas"],
				summary: "DELETE Schedule",
			},
		},
		async (request, reply) => {
			try {
				const { userId, scheduleId } = request.params;

				// Verificar se o cronograma existe e pertence ao usuário
				const existingSchedule = await Prisma.schedule.findFirst({
					where: {
						id: scheduleId,
						userId,
					},
				});

				if (!existingSchedule) {
					return reply.status(404).send({
						success: false,
						error: "Cronograma não encontrado",
					});
				}

				// Deletar cronograma (cascade deleta os items automaticamente)
				await Prisma.schedule.delete({
					where: {
						id: scheduleId,
					},
				});

				return reply.send({
					success: true,
					message: "Cronograma removido com sucesso",
					deletedSchedule: {
						id: scheduleId,
						name: existingSchedule.name,
					},
				});
			} catch (error) {
				console.error("Erro ao remover cronograma:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);
}
