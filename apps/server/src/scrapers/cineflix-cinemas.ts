/** biome-ignore-all lint/suspicious/noExplicitAny: ignore */
import { chromium } from "@playwright/test";

export interface CinemaOption {
	code: string;
	name: string;
	state: string;
	optgroupLabel: string;
}

export interface CinemasResponse {
	success: boolean;
	totalCinemas: number;
	cinemasByState: Record<string, CinemaOption[]>;
	allCinemas: CinemaOption[];
	error?: string;
}

export class CineflixCinemasScraper {
	/**
	 * Obtém lista completa de cinemas disponíveis organizados por UF
	 */
	async getAvailableCinemas(): Promise<CinemasResponse> {
		console.log("🏛️ Iniciando scraping de cinemas disponíveis...");

		const browser = await chromium.launch({
			headless: true,
			slowMo: 50,
		});

		const context = await browser.newContext({
			viewport: { width: 1280, height: 720 },
		});

		const page = await context.newPage();

		try {
			// Passo 1: Entrar em https://www.cineflix.com.br/fullSchedule
			console.log("🌐 Acessando página fullSchedule...");
			await page.goto("https://www.cineflix.com.br/fullSchedule", {
				waitUntil: "domcontentloaded",
				timeout: 60000,
			});

			// Aguardar a página carregar completamente
			await page.waitForTimeout(3000);

			// Passo 2: Aguardar o seletor #cinema aparecer
			console.log("⏳ Aguardando seletor #cinema...");
			await page.waitForSelector("#cinema", { timeout: 30000 });

			// Passo 3 e 4: Extrair dados dos cinemas organizados por optgroups
			console.log("🎯 Extraindo dados dos cinemas...");

			const cinemasData = await page.evaluate(() => {
				const select = document.querySelector("#cinema") as HTMLSelectElement;
				if (!select) {
					throw new Error("Seletor #cinema não encontrado");
				}

				const cinemasByState: Record<string, any[]> = {};
				const allCinemas: any[] = [];

				// Iterar por todos os optgroups (UFs)
				const optgroups = select.querySelectorAll("optgroup");

				optgroups.forEach((optgroup) => {
					const stateLabel = optgroup.label || "Sem Estado";
					const stateCinemas: any[] = [];

					// Iterar pelas opções dentro do optgroup
					const options = optgroup.querySelectorAll("option");

					options.forEach((option) => {
						const code = option.value;
						const name = option.textContent?.trim() || "";

						if (code && name && code !== "") {
							const cinema = {
								code: code,
								name: name,
								state: stateLabel,
								optgroupLabel: stateLabel,
							};

							stateCinemas.push(cinema);
							allCinemas.push(cinema);
						}
					});

					if (stateCinemas.length > 0) {
						cinemasByState[stateLabel] = stateCinemas;
					}
				});

				// Também verificar opções diretas no select (fora de optgroups)
				const directOptions = select.querySelectorAll(
					"option:not(optgroup option)",
				);
				if (directOptions.length > 0) {
					const directCinemas: any[] = [];

					directOptions.forEach((optionEl) => {
						const option = optionEl as HTMLOptionElement;
						const code = option.value;
						const name = option.textContent?.trim() || "";

						if (code && name && code !== "") {
							const cinema = {
								code: code,
								name: name,
								state: "Geral",
								optgroupLabel: "Geral",
							};

							directCinemas.push(cinema);
							allCinemas.push(cinema);
						}
					});

					if (directCinemas.length > 0) {
						cinemasByState.Geral = directCinemas;
					}
				}

				return {
					cinemasByState,
					allCinemas,
					totalOptgroups: optgroups.length,
				};
			});

			console.log(
				`✅ Scraping concluído: ${cinemasData.allCinemas.length} cinemas encontrados`,
			);
			console.log(
				`📊 Estados encontrados: ${Object.keys(cinemasData.cinemasByState).join(", ")}`,
			);

			// Log detalhado dos cinemas por estado
			Object.entries(cinemasData.cinemasByState).forEach(([state, cinemas]) => {
				console.log(`   ${state}: ${cinemas.length} cinemas`);
			});

			await browser.close();

			return {
				success: true,
				totalCinemas: cinemasData.allCinemas.length,
				cinemasByState: cinemasData.cinemasByState,
				allCinemas: cinemasData.allCinemas,
			};
		} catch (error) {
			console.error("❌ Erro durante scraping de cinemas:", error);

			await browser.close();

			return {
				success: false,
				totalCinemas: 0,
				cinemasByState: {},
				allCinemas: [],
				error: error instanceof Error ? error.message : "Erro desconhecido",
			};
		}
	}

	/**
	 * Obtém apenas cinemas de um estado específico
	 */
	async getCinemasByState(targetState: string): Promise<CinemaOption[]> {
		console.log(`🏛️ Obtendo cinemas do estado: ${targetState}...`);

		const response = await this.getAvailableCinemas();

		if (!response.success) {
			console.error("❌ Erro ao obter cinemas");
			return [];
		}

		const stateCinemas = response.cinemasByState[targetState] || [];
		console.log(
			`✅ Encontrados ${stateCinemas.length} cinemas em ${targetState}`,
		);

		return stateCinemas;
	}

	/**
	 * Busca cinemas por nome ou código
	 */
	async searchCinemas(searchTerm: string): Promise<CinemaOption[]> {
		console.log(`🔍 Buscando cinemas com termo: "${searchTerm}"...`);

		const response = await this.getAvailableCinemas();

		if (!response.success) {
			console.error("❌ Erro ao obter cinemas");
			return [];
		}

		const filteredCinemas = response.allCinemas.filter(
			(cinema) =>
				cinema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				cinema.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
				cinema.state.toLowerCase().includes(searchTerm.toLowerCase()),
		);

		console.log(
			`✅ Encontrados ${filteredCinemas.length} cinemas com o termo "${searchTerm}"`,
		);

		return filteredCinemas;
	}
}
