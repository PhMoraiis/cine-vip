/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: ignore */
/** biome-ignore-all lint/suspicious/noExplicitAny: ignore */
import type { FastifyInstance } from "fastify";
import { auth } from "@/lib/auth";

export async function authRoutes(app: FastifyInstance) {
	app.route({
		schema: {
			description: "Proxy para o serviço de autenticação externa",
			tags: ["Auth"],
			summary: "AUTH Proxy",
		},
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
				response.headers.forEach(
					(value: any, key: string | (string & Record<never, never>)) =>
						reply.header(key, value),
				);
				reply.send(response.body ? await response.text() : null);
			} catch (error) {
				app.log.error({ err: error }, "Authentication Error:");
				reply.status(500).send({
					error: "Internal authentication error",
					code: "AUTH_FAILURE",
				});
			}
		},
	});
}
