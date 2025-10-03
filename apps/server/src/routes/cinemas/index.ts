import type { FastifyInstance } from "fastify";
import Prisma from "@/db";
import { CinemaScraper } from "@/scrapers/cineflix-cinemas";

export async function cinemaRoutes(app: FastifyInstance) {
	// Listar todos os cinemas
	app.get(
		"/api/cinemas",
		{
			schema: {
				description: "Listar todos os cinemas",
				tags: ["Cinemas"],
				summary: "GET Cinemas",
			},
		},
		async (_request, reply) => {
			try {
				const cinemas = await Prisma.cinema.findMany({
					orderBy: [{ state: "asc" }, { name: "asc" }],
					select: {
						id: true,
						code: true,
						name: true,
						state: true,
						optgroupLabel: true,
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

				return reply.send({
					success: true,
					cinemas,
					total: cinemas.length,
					message: "Lista de cinemas carregada com sucesso",
				});
			} catch (error) {
				console.error("Erro ao buscar cinemas:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);

	// Atualiza cinemas via scraping
	app.post(
		"/api/cinemas",
		{
			schema: {
				description: "Atualiza a lista de cinemas via scraping",
				tags: ["Cinemas"],
				summary: "SCRAPING Cinemas",
			},
		},
		async (_request, reply) => {
			try {
				const scraper = new CinemaScraper();
				const result = await scraper.getAvailableCinemas();

				if (!result.success) {
					return reply.status(400).send({
						success: false,
						error: "Falha no scraping de cinemas",
						details: result.error,
					});
				}

				const updatedCinemas = [];
				const errors: Array<{ cinemaCode: string; error: string }> = [];

				// Processa todos os cinemas com upsert
				for (const cinema of result.allCinemas) {
					try {
						const upsertedCinema = await Prisma.cinema.upsert({
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
						updatedCinemas.push(upsertedCinema);
					} catch (error) {
						console.error(`Erro ao salvar cinema ${cinema.code}:`, error);
						errors.push({
							cinemaCode: cinema.code,
							error: error instanceof Error ? error.message : String(error),
						});
					}
				}

				return reply.send({
					success: true,
					message: `Cinemas atualizados com sucesso. Total: ${updatedCinemas.length}`,
					updatedCinemas: updatedCinemas.length,
					totalFromScraper: result.totalCinemas,
					errors: errors.length > 0 ? errors : undefined,
				});
			} catch (error) {
				console.error("Erro ao atualizar cinemas:", error);
				return reply.status(500).send({
					success: false,
					error: "Erro interno do servidor",
				});
			}
		},
	);
}
