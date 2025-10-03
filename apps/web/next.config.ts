import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	images: {
		domains: ["images.unsplash.com", "www.themoviedb.org"],
	},
};

export default nextConfig;
