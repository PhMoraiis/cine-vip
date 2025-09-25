/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: ignore */
import "dotenv/config";
import fastifyCors from "@fastify/cors";
import Fastify from "fastify";
import { auth } from "./lib/auth";
import { appRoutes } from "./routers";
import { SchedulerService } from "./services/scheduler-simple.service";

const baseCorsConfig = {
	origin: process.env.CORS_ORIGIN || "",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86400,
};

const fastify = Fastify({
	logger: true,
});

fastify.register(fastifyCors, baseCorsConfig);

// Registrar rotas da API
fastify.register(appRoutes);

fastify.route({
	method: ["GET", "POST"],
	url: "/api/auth/*",
	async handler(request, reply) {
		try {
			const url = new URL(request.url, `http://${request.headers.host}`);
			const headers = new Headers();
			Object.entries(request.headers).forEach(([key, value]) => {
				if (value) headers.append(key, value.toString());
			});
			const req = new Request(url.toString(), {
				method: request.method,
				headers,
				body: request.body ? JSON.stringify(request.body) : undefined,
			});
			const response = await auth.handler(req);
			reply.status(response.status);
			// biome-ignore lint/suspicious/noExplicitAny: ignore
			response.headers.forEach((value: any, key: string | (string & Record<never, never>)) => reply.header(key, value));
			reply.send(response.body ? await response.text() : null);
		} catch (error) {
			fastify.log.error({ err: error }, "Authentication Error:");
			reply.status(500).send({
				error: "Internal authentication error",
				code: "AUTH_FAILURE",
			});
		}
	},
});

fastify.get("/", async () => {
	return "OK";
});

fastify.listen({ port: 3000 }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}

	console.log("🚀 Server running on port 3000");

	// Inicializar sistema de agendamento
	console.log("🔧 Inicializando sistema de agendamento...");
	const scheduler = SchedulerService.getInstance();
	scheduler.startScheduler();

	// Auto-inicialização em produção
	if (
		process.env.NODE_ENV === "production" &&
		process.env.AUTO_INIT === "true"
	) {
		console.log("🔄 Executando auto-inicialização de produção...");
		import("./scripts/init-production").then(({ initializeProduction }) => {
			initializeProduction().catch(console.error);
		});
	}

	console.log("✅ Servidor inicializado completamente!");

	// Graceful shutdown
	process.on("SIGINT", () => {
		console.log("\n🛑 Parando servidor...");
		scheduler.stopAllJobs();
		fastify.close(() => {
			console.log("✅ Servidor parado com segurança");
			process.exit(0);
		});
	});
});
