import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	output: "standalone", // Para Docker builds
	images: {
		domains: [
			"images.unsplash.com",
			"www.themoviedb.org",
			"cdn.cineflix.com.br",
		],
	},
};

export default nextConfig;
