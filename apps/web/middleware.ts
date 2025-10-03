import { type NextRequest, NextResponse } from "next/server";

const _API_URL = process.env.API_URL || "http://localhost:3001";

export async function middleware(request: NextRequest) {
	// Proxy auth requests to backend
	if (request.nextUrl.pathname.startsWith("/api/auth/")) {
		const url = request.nextUrl.clone();
		url.hostname = "localhost";
		url.port = "3001";
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

	return NextResponse.next();
}

export const config = {
	matcher: "/api/auth/:path*",
};
