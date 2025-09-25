/** biome-ignore-all lint/suspicious/noExplicitAny: ignore */
import { chromium } from "playwright";

export interface DateOption {
	value: string;
	displayText: string;
	dayOfWeek?: string;
	dayNumber?: string;
	monthName?: string;
}

export interface DatesResponse {
	success: boolean;
	cinema: string;
	currentDate: string;
	totalDates: number;
	availableDates: DateOption[];
	error?: string;
}

export class CineflixDatesScraper {
	/**
	 * Obtém datas disponíveis para um cinema específico
	 */
	async getAvailableDates(cinemaCode = "SAL"): Promise<DatesResponse> {
		console.log(`📅 Iniciando scraping de datas para cinema: ${cinemaCode}...`);

		const browser = await chromium.launch({
			headless: true,
			slowMo: 50,
			timeout: 120000, // Timeout maior
		});

		const context = await browser.newContext({
			viewport: { width: 1280, height: 720 },
		});

		const page = await context.newPage();

		try {
			// Passo 1: Construir URL com cinema e data atual
			const today = new Date();
			const currentDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
			const targetUrl = `https://www.cineflix.com.br/fullSchedule/${cinemaCode}/${currentDate}`;

			console.log(`🌐 Acessando: ${targetUrl}`);
			await page.goto(targetUrl, {
				waitUntil: "domcontentloaded",
				timeout: 60000,
			});

			// Aguardar a página carregar completamente e cookies
			await page.waitForTimeout(2000);

			// Tentar aceitar cookies se aparecer
			try {
				await page.click('button:has-text("Continuar")', { timeout: 5000 });
				console.log("✅ Cookies aceitos");
				await page.waitForTimeout(1000);
			} catch {
				console.log("ℹ️ Sem cookies para aceitar ou já aceitos");
			}

			// Passo 2: Aguardar o seletor aparecer com múltiplas estratégias
			console.log("⏳ Aguardando seletor #data-desktop...");

			let selectorFound = false;
			const maxAttempts = 3;

			for (let attempt = 1; attempt <= maxAttempts; attempt++) {
				try {
					await page.waitForSelector("#data-desktop", { timeout: 15000 });
					selectorFound = true;
					break;
				} catch {
					console.log(
						`⚠️ Tentativa ${attempt}/${maxAttempts} falhou, aguardando mais um pouco...`,
					);

					if (attempt < maxAttempts) {
						// Tentar recarregar a página se necessário
						await page.reload({ waitUntil: "domcontentloaded" });
						await page.waitForTimeout(3000);
					}
				}
			}

			if (!selectorFound) {
				throw new Error(
					`Seletor #data-desktop não encontrado após ${maxAttempts} tentativas`,
				);
			}

			// Passo 3: Extrair todas as opções de data disponíveis
			console.log("📅 Extraindo opções de datas disponíveis...");

			const datesData = await page.evaluate(() => {
				const select = document.querySelector(
					"#data-desktop",
				) as HTMLSelectElement;
				if (!select) {
					throw new Error("Seletor #data-desktop não encontrado");
				}

				const availableDates: any[] = [];

				// Iterar por todas as opções de data
				const options = select.querySelectorAll("option");

				options.forEach((option) => {
					const value = option.value;
					const displayText = option.textContent?.trim() || "";

					if (value && displayText && value !== "") {
						// Tentar extrair informações da data do texto
						let dayOfWeek = "";
						let dayNumber = "";
						let monthName = "";

						// Padrões comuns: "Qua 25/09" ou "Quinta-feira, 26 de Setembro"
						const dayWeekMatch = displayText.match(/^(\w+)/);
						if (dayWeekMatch) {
							dayOfWeek = dayWeekMatch[1];
						}

						const dayNumberMatch = displayText.match(/(\d{1,2})/);
						if (dayNumberMatch) {
							dayNumber = dayNumberMatch[1];
						}

						const monthMatch = displayText.match(/(\w+)$/);
						if (monthMatch && !monthMatch[1].match(/^\d/)) {
							monthName = monthMatch[1];
						}

						const dateOption = {
							value: value,
							displayText: displayText,
							dayOfWeek: dayOfWeek || undefined,
							dayNumber: dayNumber || undefined,
							monthName: monthName || undefined,
						};

						availableDates.push(dateOption);
					}
				});

				return {
					availableDates,
					totalOptions: options.length,
				};
			});

			console.log(
				`✅ Scraping concluído: ${datesData.availableDates.length} datas encontradas para ${cinemaCode}`,
			);

			// Log das primeiras datas encontradas
			datesData.availableDates.slice(0, 5).forEach((date, index) => {
				console.log(`   ${index + 1}. ${date.displayText} (${date.value})`);
			});

			if (datesData.availableDates.length > 5) {
				console.log(
					`   ... e mais ${datesData.availableDates.length - 5} datas`,
				);
			}

			return {
				success: true,
				cinema: cinemaCode,
				currentDate: currentDate,
				totalDates: datesData.availableDates.length,
				availableDates: datesData.availableDates,
			};
		} catch (error) {
			console.error("❌ Erro durante scraping de datas:", error);

			return {
				success: false,
				cinema: cinemaCode,
				currentDate: new Date().toISOString().split("T")[0],
				totalDates: 0,
				availableDates: [],
				error: error instanceof Error ? error.message : "Erro desconhecido",
			};
		} finally {
			// Garantir que context seja fechado
			try {
				await context.close();
			} catch (closeError) {
				console.warn("⚠️ Erro ao fechar context:", closeError);
			}

			// Browser será fechado pelo ResourceManager
			try {
				await browser.close();
			} catch (closeError) {
				console.warn("⚠️ Erro ao fechar browser:", closeError);
			}
		}
	}

	/**
	 * Obtém datas disponíveis para múltiplos cinemas
	 */
	async getAvailableDatesForMultipleCinemas(
		cinemaCodes: string[] = ["SAL", "BSB", "CGB"],
	): Promise<Record<string, DatesResponse>> {
		console.log(
			`📅 Obtendo datas para múltiplos cinemas: ${cinemaCodes.join(", ")}...`,
		);

		const results: Record<string, DatesResponse> = {};

		for (const cinemaCode of cinemaCodes) {
			console.log(`\n🏛️ === Processando cinema: ${cinemaCode} ===`);
			try {
				const datesResponse = await this.getAvailableDates(cinemaCode);
				results[cinemaCode] = datesResponse;

				if (datesResponse.success) {
					console.log(
						`✅ ${cinemaCode}: ${datesResponse.totalDates} datas encontradas`,
					);
				} else {
					console.log(`❌ ${cinemaCode}: ${datesResponse.error}`);
				}

				// Pequena pausa entre cinemas
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} catch (error) {
				console.log(`❌ Erro no cinema ${cinemaCode}:`, error);
				results[cinemaCode] = {
					success: false,
					cinema: cinemaCode,
					currentDate: new Date().toISOString().split("T")[0],
					totalDates: 0,
					availableDates: [],
					error: error instanceof Error ? error.message : "Erro desconhecido",
				};
			}
		}

		return results;
	}

	/**
	 * Verifica se uma data específica está disponível para um cinema
	 */
	async isDateAvailable(
		cinemaCode: string,
		targetDate: string,
	): Promise<boolean> {
		console.log(
			`🔍 Verificando se data ${targetDate} está disponível para ${cinemaCode}...`,
		);

		const response = await this.getAvailableDates(cinemaCode);

		if (!response.success) {
			console.error("❌ Erro ao obter datas");
			return false;
		}

		const isAvailable = response.availableDates.some(
			(date) => date.value === targetDate,
		);

		console.log(
			`${isAvailable ? "✅" : "❌"} Data ${targetDate} ${isAvailable ? "disponível" : "não disponível"} para ${cinemaCode}`,
		);

		return isAvailable;
	}

	/**
	 * Obtém próximas N datas disponíveis para um cinema
	 */
	async getNextAvailableDates(
		cinemaCode: string,
		count = 7,
	): Promise<DateOption[]> {
		console.log(`📅 Obtendo próximas ${count} datas para ${cinemaCode}...`);

		const response = await this.getAvailableDates(cinemaCode);

		if (!response.success) {
			console.error("❌ Erro ao obter datas");
			return [];
		}

		const nextDates = response.availableDates.slice(0, count);
		console.log(
			`✅ Encontradas ${nextDates.length} próximas datas para ${cinemaCode}`,
		);

		return nextDates;
	}
}
