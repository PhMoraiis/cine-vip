#!/usr/bin/env bun

import db from "../db";
import { SchedulerService } from "../services/scheduler-simple.service";

async function initializeProduction() {
	console.log("🚀 Inicializando servidor de produção...");

	try {
		// Verificar conexão com o banco
		console.log("📊 Verificando conexão com banco de dados...");
		await db.$connect();
		console.log("✅ Conexão com banco estabelecida");

		// Verificar se existem cinemas
		const cinemasCount = await db.cinema.count();
		console.log(`📍 Encontrados ${cinemasCount} cinemas no banco`);

		if (cinemasCount === 0) {
			console.log("🔄 Primeira execução detectada - carregando cinemas...");

			const scheduler = SchedulerService.getInstance();
			const success = await scheduler.runJobManually("update-cinemas");

			if (success) {
				const newCinemasCount = await db.cinema.count();
				console.log(`✅ ${newCinemasCount} cinemas carregados com sucesso!`);
			} else {
				console.error("❌ Falha ao carregar cinemas iniciais");
				process.exit(1);
			}
		} else {
			console.log(
				"✅ Cinemas já existem no banco - inicialização não necessária",
			);
		}

		// Verificar dados recentes
		const recentMovies = await db.movie.count({
			where: {
				updatedAt: {
					gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
				},
			},
		});

		console.log(`🎬 Filmes atualizados nas últimas 24h: ${recentMovies}`);

		// Se não há dados recentes, executar limpeza
		if (recentMovies === 0) {
			console.log("🧹 Executando limpeza de dados antigos...");
			const scheduler = SchedulerService.getInstance();
			await scheduler.runJobManually("cleanup-old-data");
		}

		console.log("🎉 Inicialização de produção concluída com sucesso!");
	} catch (error) {
		console.error("❌ Erro durante inicialização:", error);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
}

// Executar se chamado diretamente
if (import.meta.main) {
	initializeProduction();
}

export { initializeProduction };
