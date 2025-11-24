/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: ignore */
import "dotenv/config";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { authRoutes } from "@/routes/auth";
import { cinemaRoutes } from "@/routes/cinemas";
import { cronRoutes } from "@/routes/cron";
import { datesRoutes } from "@/routes/dates";
import { scheduleRoutes } from "@/routes/schedules";
import { sessionsRoutes } from "@/routes/sessions";
import { CronService } from "@/services/cron.service";
import { StartupService } from "@/services/startup.service";

// Validator and Serializer Compilers ZOD
const app = Fastify().withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Cors Config
const baseCorsConfig = {
	origin: process.env.CORS_ORIGIN || "",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86400,
};

// Swagger Config
app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "CineVip API",
			version: "1.0.0",
			description: "API documentation for CineVip API",
		},
		components: {
			securitySchemes: {
				apiKey: {
					type: "apiKey",
					name: "apiKey",
					in: "header",
				},
			},
		},
	},
});

// Scalar Config
app.register(ScalarApiReference, {
	routePrefix: `/${process.env.API_VERSION}/docs`,
	configuration: {
		title: "CineVip API",
		theme: "moon",
	},
});

app.register(fastifyCors, baseCorsConfig);

// Registrar rotas da API
app.get("/api/health", async () => {
	return {
		success: true,
		timestamp: new Date().toISOString(),
		message: "Cinema API is running",
	};
});

app.register(authRoutes);
app.register(sessionsRoutes);
app.register(datesRoutes);
app.register(cinemaRoutes);
app.register(scheduleRoutes);
app.register(cronRoutes);

// Iniciar servidor
async function start() {
	try {
		await app.listen({ port: Number(process.env.PORT), host: "0.0.0.0" });
		console.log(`🚀 Server is running at http://localhost:${process.env.PORT}`);
		console.log(
			`📚 Documentation available at http://localhost:${process.env.PORT}/${process.env.API_VERSION}/docs`,
		);
		console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

		// Inicializar Cron Jobs após o servidor estar rodando
		const cronService = CronService.getInstance();
		cronService.initializeJobs();
		console.log("Sistema de Cron Jobs inicializado com sucesso!");

		// Inicializar Scraping Inicial em Background (Fire and Forget)
		console.log(
			"🔄 Iniciando scraping em background (não bloqueia o servidor)...",
		);
		const startupService = StartupService.getInstance();
		startupService.performInitialScraping().catch((err) => {
			console.error("❌ Erro no scraping inicial em background:", err);
		});
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

// Graceful shutdown para parar os Cron Jobs
process.on("SIGINT", () => {
	console.log("\nRecebido sinal de parada (SIGINT)...");

	const cronService = CronService.getInstance();
	cronService.stopAllJobs();

	app.close(() => {
		console.log("Servidor e Cron Jobs finalizados com sucesso");
		process.exit(0);
	});
});

process.on("SIGTERM", () => {
	console.log("\nRecebido sinal de parada (SIGTERM)...");

	const cronService = CronService.getInstance();
	cronService.stopAllJobs();

	app.close(() => {
		console.log("Servidor e Cron Jobs finalizados com sucesso");
		process.exit(0);
	});
});

start();
