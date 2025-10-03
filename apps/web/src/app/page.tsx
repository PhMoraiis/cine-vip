"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
	const router = useRouter();

	useEffect(() => {
		// In-view reveal: add final classes when observed
		const revealEls = document.querySelectorAll("[data-reveal]");
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const el = entry.target;
						el.classList.remove("translate-y-6", "blur-[2px]", "opacity-80");
						el.classList.add("translate-y-0", "blur-0", "opacity-100");
						io.unobserve(el);
					}
				}
			},
			{ rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
		);
		// biome-ignore lint/suspicious/useIterableCallbackReturn: ignore
		revealEls.forEach((el) => io.observe(el));

		// Parallax background layers (safe if hidden or missing)
		const layers = [
			{ el: document.getElementById("para-1"), factor: 0.15 },
			{ el: document.getElementById("para-2"), factor: 0.25 },
			{ el: document.getElementById("para-3"), factor: 0.12 },
		];
		let ticking = false;
		function onScroll() {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					const y = window.scrollY || window.pageYOffset;
					layers.forEach(({ el, factor }) => {
						if (!el) return;
						el.style.transform = `translateY(${y * factor}px)`;
					});
					ticking = false;
				});
				ticking = true;
			}
		}
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();

		return () => {
			window.removeEventListener("scroll", onScroll);
		};
	}, []);

	return (
		<div className="min-h-screen bg-[#0b0e13] text-white antialiased selection:bg-white/10 selection:text-white">
			{/* Background / Parallax Layers */}
			<div className="-z-10 pointer-events-none fixed inset-0 overflow-hidden">
				{/* Gradient background */}
				<div
					aria-hidden="true"
					className="absolute inset-0"
					style={{
						backgroundImage:
							"linear-gradient(180deg, #0b0e13 0%, #0c1118 45%, #0a0d14 100%)",
					}}
				/>

				{/* Parallax floating orbs (hidden) */}
				<div
					className="-left-32 absolute top-24 hidden h-80 w-80 rounded-full blur-3xl"
					style={{
						background:
							"radial-gradient(closest-side, rgba(99,102,241,0.25), rgba(99,102,241,0.05), transparent)",
						willChange: "transform",
						animationFillMode: "both",
					}}
				/>
				<div
					className="-right-28 absolute top-40 hidden h-[22rem] w-[22rem] rounded-full blur-3xl"
					style={{
						background:
							"radial-gradient(closest-side, rgba(16,185,129,0.18), rgba(16,185,129,0.06), transparent)",
						willChange: "transform",
						animationFillMode: "both",
					}}
				/>
				<div
					className="-translate-x-1/2 absolute bottom-[-6rem] left-1/2 hidden h-[26rem] w-[26rem] rounded-full blur-3xl"
					style={{
						background:
							"radial-gradient(closest-side, rgba(59,130,246,0.18), rgba(59,130,246,0.06), transparent)",
						willChange: "transform",
						animationFillMode: "both",
					}}
				/>

				{/* Soft grid overlay (hidden) */}
				<div
					className="absolute inset-0 hidden opacity-[0.08]"
					style={{
						backgroundImage:
							"linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
						backgroundSize: "40px 40px",
					}}
				/>
			</div>

			{/* Navbar */}
			<header className="relative">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
					<Link href="/" className="group inline-flex items-center gap-3">
						<Image src="/switch.png" alt="Logo" width={24} height={24} />
						<div className="flex flex-col leading-none">
							<span
								className="font-normal text-[15px] text-white/90 tracking-tight"
								style={{
									fontFamily:
										'"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto',
								}}
							>
								OnCine
							</span>
							<span
								className="font-normal text-[11px] text-white/50"
								style={{
									fontFamily:
										'"Manrope", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto',
								}}
							>
								Agendas de filmes inteligentes
							</span>
						</div>
					</Link>

					<nav className="hidden items-center gap-7 md:flex">
						<Link
							href="/em-cartaz"
							className="font-normal text-[14px] text-white/70 transition-colors hover:text-white"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							Em Cartaz
						</Link>
						<Link
							href="/em-breve"
							className="font-normal text-[14px] text-white/70 transition-colors hover:text-white"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							Em breve
						</Link>
						<Link
							href="/cinemas"
							className="font-normal text-[14px] text-white/70 transition-colors hover:text-white"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							Cinemas
						</Link>
					</nav>

					<div className="flex items-center gap-3">
						<Button
							className="hidden rounded-md bg-transparent px-3.5 py-2 font-normal text-[14px] text-white/80 ring-1 ring-white/10 transition-all hover:bg-transparent hover:ring-white/20 md:block"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
							onClick={() => {
								router.push("/auth");
							}}
						>
							Entrar
						</Button>
						<Button
							className="rounded-md bg-white/10 px-3.5 py-2 font-normal text-[14px] text-white shadow-md ring-1 ring-white/15 transition-all hover:bg-white/20 hover:shadow-lg hover:ring-white/25 active:scale-[0.99]"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							Download App
						</Button>
					</div>
				</div>
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="h-px w-full bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
				</div>
			</header>

			{/* Hero */}
			<main className="relative">
				<section className="mx-auto max-w-7xl px-6 pt-14 pb-20 sm:pt-16 lg:px-8 lg:pt-20 lg:pb-28">
					<div className="grid items-start gap-10 lg:grid-cols-12">
						{/* Left: Headline & CTA */}
						<div className="relative z-10 lg:col-span-7">
							<h1
								data-reveal
								className="mb-4 translate-y-6 text-[26px] text-white/95 uppercase tracking-tight opacity-80 blur-[2px] transition-all duration-700 ease-in-out [text-wrap:balance] sm:text-[28px] lg:text-[32px]"
								style={{
									fontFamily: '"Inter", ui-sans-serif, system-ui',
									lineHeight: 1.15,
									animationFillMode: "both",
								}}
							>
								Seu cinema, perfeitamente cronometrado.
							</h1>
							<p
								data-reveal
								className="translate-y-6 text-[16px] text-white/70 opacity-80 blur-[2px] transition-all delay-100 duration-700 ease-in-out sm:text-[18px] lg:text-[20px]"
								style={{
									fontFamily: '"Manrope", ui-sans-serif, system-ui',
									lineHeight: 1.6,
									animationFillMode: "both",
								}}
							>
								Descubra os horários de exibição em todos os cinemas, assista a
								sessões consecutivas e nunca mais perca uma cena de abertura.
							</p>

							{/* Search / Filters (glass) */}
							<div
								data-reveal
								className="mt-7 translate-y-6 opacity-80 blur-[2px] transition-all delay-200 duration-700 ease-in-out"
							>
								<div className="rounded-xl bg-white/5 p-3.5 shadow-md ring-1 ring-white/10 backdrop-blur-xl">
									<div className="flex flex-col gap-3 sm:flex-row">
										{/* City */}
										<label className="group flex flex-1 items-center gap-3 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 stroke-white/80 group-hover:stroke-white"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth="1.5"
											>
												<title>Location</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M12 21c4.97-4.582 7.455-8.19 7.5-11.25C19.5 6.53 16.59 3.75 12 3.75S4.5 6.53 4.5 9.75C4.545 12.81 7.03 16.418 12 21z"
												/>
												<circle cx="12" cy="10" r="2.25" />
											</svg>
											<input
												type="text"
												placeholder="Pesquisar cidade ou cinema"
												className="w-full bg-transparent text-[15px] placeholder-white/40 focus:outline-none"
												style={{
													fontFamily: '"Manrope", ui-sans-serif, system-ui',
												}}
											/>
										</label>

										{/* Date */}
										<label className="group flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 sm:w-40">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 stroke-white/80 group-hover:stroke-white"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth="1.5"
											>
												<title>Date</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M8 3.75v2.5M16 3.75v2.5M3.75 9.75h16.5M5.25 6.25h13.5A1.5 1.5 0 0 1 20.25 7.75v10A2.5 2.5 0 0 1 17.75 20.25H6.25A2.5 2.5 0 0 1 3.75 17.75v-10A1.5 1.5 0 0 1 5.25 6.25z"
												/>
											</svg>
											<input
												type="date"
												className="w-full bg-transparent text-[15px] text-white/90 [color-scheme:dark] focus:outline-none"
												style={{
													fontFamily: '"Manrope", ui-sans-serif, system-ui',
												}}
											/>
										</label>

										{/* Search Button */}
										<Button
											className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-normal text-[15px] text-white shadow-md ring-1 ring-white/15 transition-all hover:bg-white/20 hover:shadow-lg hover:ring-white/25 active:scale-[0.99]"
											style={{
												fontFamily: '"Manrope", ui-sans-serif, system-ui',
											}}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-[18px] w-[18px] stroke-white/90 group-hover:stroke-white"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth="1.5"
											>
												<title>Search</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
												/>
											</svg>
											Explorar Filmes
										</Button>
									</div>
									<div
										className="mt-3 flex items-center gap-3 text-[13px] text-white/60"
										style={{
											fontFamily: '"Manrope", ui-sans-serif, system-ui',
										}}
									>
										<span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 ring-1 ring-white/10">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-[14px] w-[14px] stroke-white/70"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth="1.5"
											>
												<title>Assentos e formatos</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M9 12.75h6m-8.25 6h10.5A2.25 2.25 0 0 0 19.5 16.5V7.5A2.25 2.25 0 0 0 17.25 5.25H6.75A2.25 2.25 0 0 0 4.5 7.5v9a2.25 2.25 0 0 0 2.25 2.25z"
												/>
											</svg>
											Sessões & Formatos
										</span>
										<span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 ring-1 ring-white/10">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-[14px] w-[14px] stroke-white/70"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth="1.5"
											>
												<title>Smart filters</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
												/>
											</svg>
											Filtros Inteligentes
										</span>
										<span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 ring-1 ring-white/10">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-[14px] w-[14px] stroke-white/70"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth="1.5"
											>
												<title>Gapless planning</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M12 6v6l4 2"
												/>
												<circle cx="12" cy="12" r="9" />
											</svg>
											Planejamento sem Lacunas
										</span>
									</div>
								</div>
							</div>

							{/* Secondary CTA */}
							<div
								data-reveal
								className="mt-6 flex translate-y-6 flex-col items-start gap-3 opacity-80 blur-[2px] transition-all delay-300 duration-700 ease-in-out sm:flex-row"
							>
								<Button
									className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-normal text-[#0b0e13] text-[15px] shadow-md ring-1 ring-white/80 transition-all hover:bg-white/90 hover:ring-white active:scale-[0.99]"
									style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
									onClick={() => {
										router.push("/em-cartaz");
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-[18px] w-[18px] stroke-[#0b0e13]"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth="1.5"
									>
										<title>Watch trailers</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M8 5v14l11-7-11-7z"
										/>
									</svg>
									Assistir trailers
								</Button>
								<Button
									className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 font-normal text-[15px] text-white shadow-md ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 active:scale-[0.99]"
									style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
									onClick={() => {
										router.push("/suporte");
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-[18px] w-[18px] stroke-white/90"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth="1.5"
									>
										<title>How it works</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M10.5 6.75 4.5 12l6 5.25M19.5 18.75h-6"
										/>
									</svg>
									Como Funciona
								</Button>
							</div>
						</div>

						{/* Right: Glass schedule preview */}
						<div className="relative z-10 lg:col-span-5">
							<div
								data-reveal
								className="translate-y-6 rounded-2xl bg-white/5 p-5 opacity-80 shadow-md ring-1 ring-white/10 blur-[2px] backdrop-blur-xl transition-all delay-200 duration-700 ease-in-out"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-[18px] w-[18px] stroke-white/85"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth="1.5"
										>
											<title>Theater location</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M3.5 5h17M7 5v14M17 5v14M3.5 19h17M10 9h4M10 13h4"
											/>
										</svg>
										<p
											className="text-[14px] text-white/70"
											style={{
												fontFamily: '"Manrope", ui-sans-serif, system-ui',
											}}
										>
											Hoje à noite no Cineflix JK Shopping
										</p>
									</div>
									<Button
										className="inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-[13px] text-white/80 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20"
										style={{
											fontFamily: '"Manrope", ui-sans-serif, system-ui',
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-[16px] w-[16px] stroke-white/80"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth="1.5"
										>
											<title>Add to plan</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M12 9v6m-3-3h6"
											/>
											<circle cx="12" cy="12" r="9" />
										</svg>
										Adicionar ao plano
									</Button>
								</div>

								<div className="my-4 h-px w-full bg-white/10" />

								{/* Movie Item */}
								<div className="space-y-4">
									{/* Card 1 */}
									<div
										data-reveal
										className="group flex translate-y-6 items-center gap-4 rounded-xl bg-white/5 p-3 opacity-80 shadow-md ring-1 ring-white/10 blur-[2px] transition-all delay-300 duration-700 ease-in-out hover:bg-white/10 hover:ring-white/20"
									>
										<Image
											src="/interstelar.webp"
											alt="Movie Poster"
											className="h-16 w-16 flex-none rounded-lg object-cover"
											width={64}
											height={64}
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between">
												<h3
													className="truncate text-[18px] text-white/95 tracking-tight"
													style={{
														fontFamily: '"Inter", ui-sans-serif, system-ui',
														fontWeight: 400,
													}}
												>
													Interstelar
												</h3>
												<span
													className="rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/70 ring-1 ring-white/10"
													style={{
														fontFamily: '"Manrope", ui-sans-serif, system-ui',
													}}
												>
													10
												</span>
											</div>
											<p
												className="mt-0.5 line-clamp-1 text-[14px] text-white/60"
												style={{
													fontFamily: '"Manrope", ui-sans-serif, system-ui',
												}}
											>
												Ficção Cientifíca • 2h 49m
											</p>
											<div className="mt-2 flex flex-wrap items-center gap-2">
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/80 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-white/80"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Watch later</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M12 6v6l4 2"
														/>
														<circle cx="12" cy="12" r="9" />
													</svg>
													19:00
												</span>
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/80 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-white/80"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Watch later</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M12 6v6l4 2"
														/>
														<circle cx="12" cy="12" r="9" />
													</svg>
													21:30
												</span>
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-emerald-300/90 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-emerald-300/90"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Gapless</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M3.75 12h16.5"
														/>
													</svg>
													Sem intervalos
												</span>
											</div>
										</div>
									</div>

									{/* Card 2 */}
									<div
										data-reveal
										className="group flex translate-y-6 items-center gap-4 rounded-xl bg-white/5 p-3 opacity-80 shadow-md ring-1 ring-white/10 blur-[2px] transition-all delay-400 duration-700 ease-in-out hover:bg-white/10 hover:ring-white/20"
									>
										<Image
											src="/f1.webp"
											alt="Movie Poster"
											className="h-16 w-16 flex-none rounded-lg object-cover"
											width={64}
											height={64}
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between">
												<h3
													className="truncate text-[18px] text-white/95 tracking-tight"
													style={{
														fontFamily: '"Inter", ui-sans-serif, system-ui',
													}}
												>
													F1
												</h3>
												<span
													className="rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/70 ring-1 ring-white/10"
													style={{
														fontFamily: '"Manrope", ui-sans-serif, system-ui',
													}}
												>
													12
												</span>
											</div>
											<p
												className="mt-0.5 line-clamp-1 text-[14px] text-white/60"
												style={{
													fontFamily: '"Manrope", ui-sans-serif, system-ui',
												}}
											>
												Ação/Esporte • 2h 35m
											</p>
											<div className="mt-2 flex flex-wrap items-center gap-2">
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/80 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-white/80"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Watch later</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M12 6v6l4 2"
														/>
														<circle cx="12" cy="12" r="9" />
													</svg>
													18:30
												</span>
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/80 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-white/80"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Watch later</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M12 6v6l4 2"
														/>
														<circle cx="12" cy="12" r="9" />
													</svg>
													20:20
												</span>
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-emerald-300/90 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-emerald-300/90"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Gapless</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M3.75 12h16.5"
														/>
													</svg>
													Sem intervalos
												</span>
											</div>
										</div>
									</div>

									{/* Card 3 */}
									<div
										data-reveal
										className="group flex translate-y-6 items-center gap-4 rounded-xl bg-white/5 p-3 opacity-80 shadow-md ring-1 ring-white/10 blur-[2px] transition-all delay-500 duration-700 ease-in-out hover:bg-white/10 hover:ring-white/20"
									>
										<Image
											src="/aranhaverso.webp"
											alt="Movie Poster"
											className="h-16 w-16 flex-none rounded-lg object-cover"
											width={64}
											height={64}
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between">
												<h3
													className="truncate text-[18px] text-white/95 tracking-tight"
													style={{
														fontFamily: '"Inter", ui-sans-serif, system-ui',
													}}
												>
													Homem-Aranha no Aranhaverso
												</h3>
												<span
													className="rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/70 ring-1 ring-white/10"
													style={{
														fontFamily: '"Manrope", ui-sans-serif, system-ui',
													}}
												>
													10
												</span>
											</div>
											<p
												className="mt-0.5 line-clamp-1 text-[14px] text-white/60"
												style={{
													fontFamily: '"Manrope", ui-sans-serif, system-ui',
												}}
											>
												Infantil/Ação • 1h 56m
											</p>
											<div className="mt-2 flex flex-wrap items-center gap-2">
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/80 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-white/80"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Watch later</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M12 6v6l4 2"
														/>
														<circle cx="12" cy="12" r="9" />
													</svg>
													15:00
												</span>
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-white/80 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-white/80"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Watch later</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M12 6v6l4 2"
														/>
														<circle cx="12" cy="12" r="9" />
													</svg>
													18:10
												</span>
												<span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-emerald-300/90 ring-1 ring-white/10">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-[14px] w-[14px] stroke-emerald-300/90"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth="1.5"
													>
														<title>Gapless</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M3.75 12h16.5"
														/>
													</svg>
													Sem intervalos
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Footer row */}
								<div className="mt-5 flex items-center justify-between">
									<div
										className="inline-flex items-center gap-2 text-[13px] text-white/60"
										style={{
											fontFamily: '"Manrope", ui-sans-serif, system-ui',
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-[16px] w-[16px] stroke-white/60"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth="1.5"
										>
											<title>Theater features</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M9.75 9.75h4.5M9.75 14.25h4.5M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25z"
											/>
										</svg>
										Poltronas Reclináveis ​​• Estacionamento
									</div>
									<a
										href="/"
										className="inline-flex items-center gap-1.5 text-[13px] text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
										style={{
											fontFamily: '"Manrope", ui-sans-serif, system-ui',
										}}
									>
										Programação Completa
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-[14px] w-[14px] stroke-white/80"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth="1.5"
										>
											<title>Programação completa</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</a>
								</div>
							</div>
						</div>
					</div>

					{/* Trust row / Badges */}
					<div className="relative mt-12">
						<div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-3">
							<div
								data-reveal
								className="flex translate-y-6 items-center gap-3 rounded-xl bg-white/5 p-4 opacity-80 shadow-md ring-1 ring-white/10 blur-[2px] backdrop-blur-xl transition-all duration-700 ease-in-out"
							>
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-[18px] w-[18px] stroke-white/90"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth="1.5"
									>
										<title>Real-time listings</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M3 5h18M8 5v14m8-14v14M3 19h18"
										/>
									</svg>
								</div>
								<div>
									<div
										className="text-[16px] text-white/90 tracking-tight"
										style={{
											fontFamily: '"Inter", ui-sans-serif, system-ui',
											fontWeight: 400,
										}}
									>
										Listagens em tempo real
									</div>
									<div
										className="text-[14px] text-white/60"
										style={{
											fontFamily: '"Manrope", ui-sans-serif, system-ui',
										}}
									>
										Sincronização ao vivo com cinemas
									</div>
								</div>
							</div>
							<div
								data-reveal
								className="flex translate-y-6 items-center gap-3 rounded-xl bg-white/5 p-4 opacity-80 shadow-md ring-1 ring-white/10 blur-[2px] backdrop-blur-xl transition-all delay-100 duration-700 ease-in-out"
							>
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-[18px] w-[18px] stroke-white/90"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth="1.5"
									>
										<title>Smarter planning</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M16.5 9.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M12 14.25v6"
										/>
									</svg>
								</div>
								<div>
									<div
										className="text-[16px] text-white/90 tracking-tight"
										style={{
											fontFamily: '"Inter", ui-sans-serif, system-ui',
											fontWeight: 400,
										}}
									>
										Planejamento mais inteligente
									</div>
									<div
										className="text-[14px] text-white/60"
										style={{
											fontFamily: '"Manrope", ui-sans-serif, system-ui',
										}}
									>
										Recomendações personalizadas
									</div>
								</div>
							</div>
							<div
								data-reveal
								className="flex translate-y-6 items-center gap-3 rounded-xl bg-white/5 p-4 opacity-80 shadow-md ring-1 ring-white/10 blur-[2px] backdrop-blur-xl transition-all delay-200 duration-700 ease-in-out"
							>
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-[18px] w-[18px] stroke-white/90"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth="1.5"
									>
										<title>One-tap checkout</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="m4.5 12 6 6 9-12"
										/>
									</svg>
								</div>
								<div>
									<div
										className="text-[16px] text-white/90 tracking-tight"
										style={{
											fontFamily: '"Inter", ui-sans-serif, system-ui',
											fontWeight: 400,
										}}
									>
										Mais organização
									</div>
									<div
										className="text-[14px] text-white/60"
										style={{
											fontFamily: '"Manrope", ui-sans-serif, system-ui',
										}}
									>
										Menos tempo perdido
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="relative">
				<div className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
					<div className="h-px w-full bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
					<div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
						<p
							className="text-[13px] text-white/50"
							style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
						>
							© 2025 OnCine Inc.
						</p>
						<div className="flex items-center gap-6">
							<a
								href="/"
								className="text-[13px] text-white/60 transition-colors hover:text-white"
								style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
							>
								Privacidade
							</a>
							<a
								href="/"
								className="text-[13px] text-white/60 transition-colors hover:text-white"
								style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
							>
								Termos
							</a>
							<a
								href="/"
								className="text-[13px] text-white/60 transition-colors hover:text-white"
								style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui' }}
							>
								Suporte
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
