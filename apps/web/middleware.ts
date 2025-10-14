import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	// Proxy auth requests to backend
	if (pathname.startsWith("/api/auth/")) {
		const url = request.nextUrl.clone();
		url.hostname = "localhost";
		url.port = "3000";
		url.protocol = "http:";

		const proxyRequest = new Request(url.toString(), {
			method: request.method,
			headers: request.headers,
			body:
				request.method !== "GET" && request.method !== "HEAD"
					? await request.text()
					: undefined,
		});

		try {
			const response = await fetch(proxyRequest);

			const responseHeaders = new Headers();
			response.headers.forEach((value, key) => {
				responseHeaders.set(key, value);
			});

			return new NextResponse(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders,
			});
		} catch (error) {
			console.error("Proxy error:", error);
			return new NextResponse("Service Unavailable", { status: 503 });
		}
	}

	// Proteger rotas dinâmicas com [userId]
	const userIdPattern = /^\/([^\/]+)\/(dashboard|schedule|create-schedule)/;
	const match = pathname.match(userIdPattern);

	if (match) {
		const userIdFromUrl = match[1];
		
		// Buscar sessão do cookie
		const sessionToken = request.cookies.get("better-auth.session_token");
		
		if (!sessionToken) {
			// Sem sessão, redirecionar para login
			const url = request.nextUrl.clone();
			url.pathname = "/auth";
			return NextResponse.redirect(url);
		}

		// Validar sessão e userId no backend
		try {
			const sessionResponse = await fetch(`${API_URL}/api/auth/get-session`, {
				headers: {
					Cookie: `better-auth.session_token=${sessionToken.value}`,
				},
			});

			if (!sessionResponse.ok) {
				// Sessão inválida, redirecionar para login
				const url = request.nextUrl.clone();
				url.pathname = "/auth";
				return NextResponse.redirect(url);
			}

			const sessionData = await sessionResponse.json();
			const actualUserId = sessionData?.user?.id;

			// Validar se o userId da URL corresponde ao usuário logado
			if (actualUserId && actualUserId !== userIdFromUrl) {
				// userId incorreto, redirecionar para a rota correta
				const url = request.nextUrl.clone();
				url.pathname = pathname.replace(`/${userIdFromUrl}/`, `/${actualUserId}/`);
				return NextResponse.redirect(url);
			}
		} catch (error) {
			console.error("Session validation error:", error);
			// Em caso de erro, permitir que o componente cliente lide com isso
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/api/auth/:path*",
		"/:userId((?!_next|api|auth|favicon.ico|.*\\..*).*)/dashboard:path*",
		"/:userId((?!_next|api|auth|favicon.ico|.*\\..*).*)/schedule:path*",
		"/:userId((?!_next|api|auth|favicon.ico|.*\\..*).*)/create-schedule:path*",
	],
};
