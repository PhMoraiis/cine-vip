import type { FastifyInstance } from "fastify";
import Prisma from "@/db";
import { DateScraper } from "@/scrapers/cineflix-dates";

export async function datesRoutes(app: FastifyInstance) {
	// Listar todas as datas disponíveis de um cinema
	app.get<{
		Params: { cinemaCode: string };
	}>(
		"/api/dates/:cinemaCode",
		{
			schema: {
				description: "Listar todas as datas disponíveis de um cinema",
				tags: ["Datas"],
				summary: "GET Dates",
			},
		},
		async (request, reply) => {
			try {
				const { cinemaCode } = request.params;

				// Busca as datas disponíveis para o cinema especificado
				const availableDates = await Prisma.availableDate.findMany({
					where: { cinemaCode },
					orderBy: { value: "asc" },
				});

				return reply.send({
					success: true,
					availableDates,
					total: availableDates.length,
				});
			} catch (error) {
				console.error("Erro ao buscar datas:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);

	// Atualiza datas disponíveis via scraping
	app.post<{
		Params: { cinemaCode: string };
	}>(
		"/api/date/:cinemaCode",
		{
			schema: {
				description: "Atualiza as datas disponíveis de um cinema via scraping",
				tags: ["Datas"],
				summary: "SCRAPING Dates",
			},
		},
		async (request, reply) => {
			try {
				const { cinemaCode } = request.params;

				// Verifica se o cinema existe e busca suas datas atuais
				const cinema = await Prisma.cinema.findUnique({
					where: { code: cinemaCode },
					include: {
						availableDates: {
							select: { value: true },
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

				// Fazer scraping das datas disponíveis
				const dateScraper = new DateScraper();
				const datesResult = await dateScraper.getAvailableDates(cinemaCode);

				if (datesResult.success) {
					const availableDates = [];

					// Usar upsert para cada data - cria se não existir, atualiza se existir
					for (const date of datesResult.availableDates) {
						const upsertedDate = await Prisma.availableDate.upsert({
							where: {
								// Combinação única de cinemaCode + value
								cinemaCode_value: {
									cinemaCode,
									value: date.value,
								},
							},
							update: {
								displayText: date.displayText,
								dayOfWeek: date.dayOfWeek,
								dayNumber: date.dayNumber,
							},
							create: {
								cinemaCode,
								value: date.value,
								displayText: date.displayText,
								dayOfWeek: date.dayOfWeek,
								dayNumber: date.dayNumber,
							},
						});
						availableDates.push(upsertedDate);
					}

					// Opcional: Remover datas que não estão mais disponíveis
					// (datas que existem no banco mas não vieram do scraping)
					const scrapedValues = datesResult.availableDates.map((d) => d.value);
					await Prisma.availableDate.deleteMany({
						where: {
							cinemaCode,
							value: {
								notIn: scrapedValues,
							},
						},
					});

					return reply.send({
						success: true,
						message: "Datas atualizadas com sucesso",
						availableDates,
						total: availableDates.length,
					});
				}

				return reply.status(400).send({
					success: false,
					error: "Erro ao buscar datas disponíveis",
					details: datesResult.error || "Erro desconhecido",
				});
			} catch (error) {
				console.error("Erro ao atualizar datas:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);
}
