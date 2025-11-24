export class StartupService {
	private static instance: StartupService;

	private constructor() {}

	public static getInstance(): StartupService {
		if (!StartupService.instance) {
			StartupService.instance = new StartupService();
		}
		return StartupService.instance;
	}
}