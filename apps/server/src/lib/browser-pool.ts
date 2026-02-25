import * as playwright from "playwright";

class BrowserPool {
	private static instance: BrowserPool;
	private browser: playwright.Browser | null = null;
	private launching = false;

	private constructor() {}

	static getInstance(): BrowserPool {
		if (!BrowserPool.instance) {
			BrowserPool.instance = new BrowserPool();
		}
		return BrowserPool.instance;
	}

	async getBrowser(): Promise<playwright.Browser> {
		if (this.browser && this.browser.isConnected()) {
			return this.browser;
		}

		if (this.launching) {
			// Wait for existing launch to complete
			while (this.launching) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			if (this.browser && this.browser.isConnected()) {
				return this.browser;
			}
		}

		this.launching = true;
		try {
			const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";
			const slowMo = Number(process.env.PLAYWRIGHT_SLOW_MO ?? 0);

			this.browser = await playwright.chromium.launch({
				headless,
				slowMo,
				timeout: 120000,
			});

			console.log("🌐 Browser launched (singleton)");
			return this.browser;
		} finally {
			this.launching = false;
		}
	}

	async closeBrowser(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
			console.log("🌐 Browser closed");
		}
	}
}

export const browserPool = BrowserPool.getInstance();
