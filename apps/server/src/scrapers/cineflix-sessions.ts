/** biome-ignore-all lint/suspicious/noExplicitAny: ignore */
import { chromium } from "@playwright/test";

export interface DetailedMovieData {
	id: string;
	title: string;
	genre?: string;
	duration?: string;
	rating?: string;
	synopsis?: string;
	posterUrl?: string;
	trailerUrl?: string;
	sessions: DetailedSessionData[];
}

export interface DetailedSessionData {
	cinema: string;
	cinemaCode: string;
	date: string;
	times: DetailedTimeSlot[];
}

export interface DetailedTimeSlot {
	time: string;
	sessionType?: string; // 2D, 3D, etc.
	audioType?: string; // DUB, LEG
	roomNumber?: string;
	availableSeats?: number;
	occupancyPercent?: number;
}

export class CineflixScraper {
	async scrapeWithAngularJS(
		cinemaCode = "BSB",
		targetDate?: string,
	): Promise<DetailedMovieData[]> {
		console.log(
			`🚀 Iniciando scraping avançado - Cinema: ${cinemaCode}, Data: ${targetDate || "hoje"}`,
		);

		const browser = await chromium.launch({
			headless: false,
			slowMo: 100,
		});

		const context = await browser.newContext({
			viewport: { width: 1280, height: 720 },
		});

		const page = await context.newPage();
		const movies: DetailedMovieData[] = [];

		try {
			const date = targetDate || new Date().toISOString().split("T")[0];
			const targetUrl = `https://www.cineflix.com.br/fullSchedule/${cinemaCode}/${date}`;

			console.log(`🌐 Acessando: ${targetUrl}`);

			await page.goto(targetUrl, {
				waitUntil: "domcontentloaded",
				timeout: 45000,
			});

			// Aceitar cookies
			try {
				await page.click('button:has-text("Continuar")', { timeout: 5000 });
				console.log("✅ Cookies aceitos");
				await page.waitForTimeout(2000);
			} catch {
				console.log("ℹ️ Sem cookies para aceitar");
			}

			// Aguardar AngularJS carregar completamente
			console.log("⏳ Aguardando AngularJS carregar...");

			// Aguardar elementos específicos do AngularJS aparecerem
			await page.waitForFunction(
				() => {
					const angularElements = document.querySelectorAll(
						'[ng-repeat*="filmeObj"]',
					);
					return angularElements.length > 0;
				},
				{ timeout: 30000 },
			);

			console.log("✅ AngularJS carregado, aguardando dados dos filmes...");

			// Aguardar um pouco mais para garantir que os dados foram populados
			await page.waitForTimeout(5000);

			// Extrair dados usando JavaScript no contexto da página
			const moviesData = await page.evaluate(() => {
				const movies: any[] = [];

				// Buscar elementos de filmes gerados pelo AngularJS
				const movieElements = document.querySelectorAll(
					'[ng-repeat*="filmeObj"]',
				);

				console.log(`Encontrados ${movieElements.length} elementos de filmes`);

				movieElements.forEach((movieEl, index) => {
					try {
						// Extrair título do filme
						let title = "";

						// Tentar extrair do atributo alt da imagem
						const img = movieEl.querySelector(
							'img[alt*="filme"], img[alt*="Banner"]',
						) as HTMLImageElement;
						if (img?.alt) {
							title = img.alt.replace("Banner do filme ", "").trim();
						}

						// Se não encontrou, tentar por outros meios
						if (!title) {
							const titleElement = movieEl.querySelector(
								"h1, h2, h3, h4, .movie-title, [data-title]",
							);
							if (titleElement) {
								title = titleElement.textContent?.trim() || "";
							}
						}

						if (!title) {
							title = `Filme ${index + 1}`;
						}

						// Extrair poster
						let posterUrl = "";
						if (img?.src) {
							posterUrl = img.src;
						} else {
							const posterImg = movieEl.querySelector(
								"img[ng-src], img[src]",
							) as HTMLImageElement;
							if (posterImg) {
								posterUrl =
									posterImg.src || posterImg.getAttribute("ng-src") || "";
							}
						}

						// Extrair duração
						let duration = "";
						const durationElements = movieEl.querySelectorAll("span");
						for (const spanEl of durationElements) {
							const text = spanEl.textContent || "";
							if (text.match(/\d{1,2}h\d{2}/) || text.match(/\d{2}:\d{2}/)) {
								duration = text.trim();
								break;
							}
						}

						// Extrair gênero - focando na captura exata como no site
						let genre = "";

						// Primeiro: tentar encontrar elementos com gênero puro (como na API)
						const genreElements = movieEl.querySelectorAll("span, div, p");
						for (const el of genreElements) {
							const text = el.textContent?.trim();

							// Verificar se é exatamente um gênero (como vem da API)
							if (text && text.length >= 4 && text.length <= 30) {
								const cleanText = text.toUpperCase().trim();
								const exactGenreMatch = cleanText.match(
									/^(AÇÃO|COMÉDIA|DRAMA|TERROR|AVENTURA|ANIMAÇÃO|FICÇÃO|BIOGRAFIA|INFANTIL|SUSPENSE|ROMANCE|MUSICAL|DOCUMENTÁRIO|CRIME|FANTASIA|GUERRA|WESTERN|THRILLER|POLICIAL|COMÉDIA DRAMÁTICA)$/,
								);

								if (exactGenreMatch) {
									genre = exactGenreMatch[0];
									break;
								}
							}
						}

						// Se não encontrou gênero exato, buscar dentro de texto maior
						if (!genre) {
							for (const el of genreElements) {
								const text = el.textContent?.trim();
								if (text) {
									const genreMatch = text.match(
										/\b(AÇÃO|COMÉDIA|DRAMA|TERROR|AVENTURA|ANIMAÇÃO|FICÇÃO|BIOGRAFIA|INFANTIL|SUSPENSE|ROMANCE|MUSICAL|DOCUMENTÁRIO|CRIME|FANTASIA|GUERRA|WESTERN|THRILLER|POLICIAL|COMÉDIA DRAMÁTICA)\b/i,
									);

									if (genreMatch) {
										genre = genreMatch[0].trim().toUpperCase();
										break;
									}
								}
							}
						}

						// Extrair classificação etária
						let rating = "";
						const ratingImg = movieEl.querySelector(
							'img[ng-src*="classificacao"]',
						) as HTMLImageElement;
						if (ratingImg) {
							const src =
								ratingImg.src || ratingImg.getAttribute("ng-src") || "";
							const match = src.match(/classificacao(\d+)/);
							if (match) {
								rating = match[1];
							}
						}

						// Extrair sinopse do filme
						let synopsis = "";

						// Procurar por elementos que podem conter sinopse
						const synopsisSelectors = [
							".sinopse",
							".synopsis",
							".movie-description",
							".description",
							'[ng-bind*="sinopse"]',
							'[ng-bind*="descricao"]',
							"p:not(:empty)",
							".text",
							".content",
						];

						for (const selector of synopsisSelectors) {
							const synopsisEl = movieEl.querySelector(selector);
							if (synopsisEl) {
								const text = synopsisEl.textContent?.trim();
								// Verificar se é realmente uma sinopse (texto longo e descritivo)
								if (text && text.length > 30 && text.length < 800) {
									// Evitar capturar horários, durações ou outros dados
									if (
										!text.match(/^\d{1,2}:\d{2}/) &&
										!text.match(/^\d{1,2}h\d{2}/) &&
										!text.includes("Classificação") &&
										text.split(" ").length > 5
									) {
										synopsis = text;
										break;
									}
								}
							}
						}

						// Se não encontrou sinopse específica, tentar buscar em texto descritivo geral
						if (!synopsis) {
							const allTextElements = movieEl.querySelectorAll("p, div, span");
							for (const textEl of allTextElements) {
								const text = textEl.textContent?.trim();
								if (text && text.length > 50 && text.length < 600) {
									// Verificar se parece com sinopse
									const words = text.split(" ");
									if (
										words.length > 10 &&
										!text.match(/\d{1,2}:\d{2}/) &&
										!text.includes("Duração") &&
										!text.includes("Classificação") &&
										text.includes(".")
									) {
										synopsis = text;
										break;
									}
								}
							}
						}

						// Extrair horários de sessões
						const sessionTimes: any[] = [];
						const uniqueTimes = new Set<string>();

						// Primeiro: buscar elementos específicos de horários
						const sessionElements = movieEl.querySelectorAll(
							'.btn-hour, [ng-repeat*="horarioFilme"], .horario-sessao, .btn',
						);

						sessionElements.forEach((sessionEl) => {
							const timeText = sessionEl.textContent?.trim();
							if (timeText?.match(/\d{1,2}:\d{2}/)) {
								const timeMatch = timeText.match(/\d{1,2}:\d{2}/);
								if (timeMatch && !uniqueTimes.has(timeMatch[0])) {
									uniqueTimes.add(timeMatch[0]);
									sessionTimes.push({
										time: timeMatch[0],
										sessionType: timeText.includes("3D") ? "3D" : "2D",
										audioType: timeText.includes("LEG")
											? "LEG"
											: timeText.includes("DUB")
												? "DUB"
												: undefined,
									});
								}
							}
						});

						// Se não encontrou sessões específicas, buscar por horários gerais no elemento
						if (sessionTimes.length === 0) {
							const allText = movieEl.textContent || "";
							const timeMatches = allText.match(/\d{1,2}:\d{2}/g);
							if (timeMatches) {
								// Remover duplicatas usando Set
								const uniqueTextTimes = [...new Set(timeMatches)];
								uniqueTextTimes.forEach((time) => {
									if (!uniqueTimes.has(time)) {
										uniqueTimes.add(time);
										sessionTimes.push({ time: time });
									}
								});
							}
						}

						const movie = {
							title: title,
							duration: duration || undefined,
							genre: genre || undefined,
							rating: rating || undefined,
							synopsis: synopsis || undefined,
							posterUrl: posterUrl || undefined,
							sessionTimes: sessionTimes,
						};

						movies.push(movie);
					} catch (error) {
						console.log(`Erro ao processar filme ${index}:`, error);
					}
				});

				return movies;
			});

			console.log(`🎬 Dados extraídos: ${moviesData.length} filmes`);

			// Converter para o formato final
			moviesData.forEach((movieData, index) => {
				if (movieData.title && movieData.title !== `Filme ${index + 1}`) {
					// Remover duplicatas nos horários finais também
					const uniqueFinalTimes = new Map<string, any>();
					movieData.sessionTimes.forEach((st: any) => {
						if (!uniqueFinalTimes.has(st.time)) {
							uniqueFinalTimes.set(st.time, {
								time: st.time,
								sessionType: st.sessionType,
								audioType: st.audioType,
							});
						}
					});

					const movie: DetailedMovieData = {
						id: `cineflix-advanced-${cinemaCode}-${Date.now()}-${index}`,
						title: movieData.title,
						duration: movieData.duration,
						genre: movieData.genre,
						rating: movieData.rating,
						synopsis: movieData.synopsis,
						posterUrl: movieData.posterUrl,
						sessions: [
							{
								cinema: `Cineflix ${cinemaCode}`,
								cinemaCode: cinemaCode,
								date: date,
								times: Array.from(uniqueFinalTimes.values()),
							},
						],
					};

					movies.push(movie);
				}
			});

			// Se ainda não encontrou filmes, fazer uma última tentativa com método mais agressivo
			if (movies.length === 0) {
				console.log("🔍 Tentativa final: busca agressiva por dados...");

				const emergencyData = await page.evaluate(() => {
					// Procurar por qualquer texto que pareça com filme
					const allElements = Array.from(document.querySelectorAll("*"));
					const movieCandidates: any[] = [];

					allElements.forEach((el, _index) => {
						const text = el.textContent?.trim();
						if (text && text.length > 5 && text.length < 150) {
							// Verificar se contém padrões de filme
							const hasTime = /\d{1,2}:\d{2}/.test(text);
							const hasDuration = /\d{1,2}h\d{2}/.test(text);
							const hasGenre =
								/\b(AÇÃO|COMÉDIA|DRAMA|TERROR|AVENTURA|ANIMAÇÃO|FICÇÃO|BIOGRAFIA|INFANTIL)\b/.test(
									text,
								);

							if (hasTime || hasDuration || hasGenre) {
								movieCandidates.push({
									text: text,
									element: el.tagName,
									classes: el.className,
								});
							}
						}
					});

					return movieCandidates.slice(0, 20); // Limitar resultados
				});

				console.log("🔍 Dados de emergência:", emergencyData.slice(0, 5));

				// Processar dados de emergência se necessário
				if (emergencyData.length > 0) {
					// Criar um filme genérico com as informações encontradas
					const allTimes = emergencyData
						.map((item) => item.text.match(/\d{1,2}:\d{2}/g))
						.filter(Boolean)
						.flat();

					if (allTimes.length > 0) {
						movies.push({
							id: `cineflix-emergency-${cinemaCode}-${Date.now()}`,
							title: "Programação encontrada",
							sessions: [
								{
									cinema: `Cineflix ${cinemaCode}`,
									cinemaCode: cinemaCode,
									date: date,
									times: Array.from(new Set(allTimes))
										.slice(0, 15)
										.map((time) => ({ time })),
								},
							],
						});
					}
				}
			}

			// Screenshot final para debug
			await page.screenshot({
				path: `./cineflix-${cinemaCode}-${date}.png`,
				fullPage: true,
			});
		} catch (error) {
			console.error("❌ Erro durante scraping avançado:", error);
		} finally {
			await browser.close();
		}

		console.log(`🎉 Scraping concluído: ${movies.length} filmes encontrados`);
		return movies;
	}

	/**
	 * Método para scraping de múltiplos cinemas
	 */
	async scrapeMultipleCinemas(
		cinemaCodes: string[] = ["BSB", "SAL", "CGB"],
		targetDate?: string,
	): Promise<DetailedMovieData[]> {
		const allMovies: DetailedMovieData[] = [];

		for (const cinemaCode of cinemaCodes) {
			console.log(`\n🏛️ === Processando cinema: ${cinemaCode} ===`);
			try {
				const cinemaMovies = await this.scrapeWithAngularJS(
					cinemaCode,
					targetDate,
				);

				// Adicionar código do cinema no ID para evitar duplicatas
				cinemaMovies.forEach((movie) => {
					movie.id = `${movie.id}-${cinemaCode}`;
				});

				allMovies.push(...cinemaMovies);
				console.log(
					`✅ ${cinemaCode}: ${cinemaMovies.length} filmes adicionados`,
				);

				// Pequena pausa entre cinemas
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} catch (error) {
				console.log(`❌ Erro no cinema ${cinemaCode}:`, error);
			}
		}

		return allMovies;
	}
}
