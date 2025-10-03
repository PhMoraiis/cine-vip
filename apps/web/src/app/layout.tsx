import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "@/styles/globals.css";
import Providers from "@/components/providers";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["400", "500"],
});

const manrope = Manrope({
	variable: "--font-manrope",
	subsets: ["latin"],
	weight: ["400", "500"],
});

export const metadata: Metadata = {
	title: "OnCine — Horários de cinema reinventados",
	description:
		"Descubra os horários dos filmes em todos os cinemas, assista a sessões consecutivas e nunca mais perca uma cena de abertura.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${manrope.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
