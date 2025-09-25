/**
 * Serviço para otimização de cronogramas de cinema
 * Algoritmos para encontrar as melhores combinações de sessões
 */

interface MovieSession {
	id: string;
	movieId: string;
	movieTitle: string;
	time: string;
	duration: number; // em minutos
	sessionType?: string;
}

interface OptimizedSchedule {
	id: string;
	name: string;
	sessions: MovieSession[];
	startTime: string;
	endTime: string;
	totalDuration: number;
	breaks: BreakInfo[];
	feasibilityScore: number;
	conflicts: string[];
}

interface BreakInfo {
	afterMovie: string;
	duration: number; // em minutos
	type: "travel" | "meal" | "rest";
}

export class ScheduleOptimizerService {
	private readonly TRAILER_TIME = 5; // minutos de trailers
	private readonly CREDITS_TIME = 5; // minutos de créditos
	private readonly MIN_BREAK_TIME = 5; // minutos mínimos entre sessões
	private readonly MEAL_BREAK_TIME = 30; // pausa para refeição
	private readonly MAX_CONTINUOUS_TIME = 240; // máximo 4h sem pausa longa

	/**
	 * Gera cronogramas otimizados baseado em múltiplos critérios
	 */
	generateOptimizedSchedules(
		availableSessions: MovieSession[][],
		preferences: SchedulePreferences = {},
	): OptimizedSchedule[] {
		const allCombinations = this.generateAllCombinations(availableSessions);

		console.log(
			`🧮 Analisando ${allCombinations.length} combinações possíveis...`,
		);

		const optimizedSchedules = allCombinations
			.map((combo, index) => this.analyzeAndOptimize(combo, index, preferences))
			.filter((schedule) => schedule.feasibilityScore > 0)
			.sort((a, b) => b.feasibilityScore - a.feasibilityScore)
			.slice(0, 15); // Top 15 melhores opções

		return optimizedSchedules;
	}

	/**
	 * Analisa e otimiza uma combinação específica
	 */
	private analyzeAndOptimize(
		combination: MovieSession[],
		index: number,
		preferences: SchedulePreferences,
	): OptimizedSchedule {
		// Ordenar por horário
		const sortedSessions = combination.sort(
			(a, b) => this.timeToMinutes(a.time) - this.timeToMinutes(b.time),
		);

		const conflicts: string[] = [];
		const breaks: BreakInfo[] = [];
		let feasibilityScore = 100;

		// Calcular horários reais (com trailers e créditos)
		const enrichedSessions = sortedSessions.map((session) => ({
			...session,
			realStartTime: this.addMinutes(session.time, this.TRAILER_TIME),
			realEndTime: this.addMinutes(
				session.time,
				this.TRAILER_TIME + session.duration + this.CREDITS_TIME,
			),
		}));

		// Verificar conflitos e calcular pausas
		for (let i = 1; i < enrichedSessions.length; i++) {
			const prevSession = enrichedSessions[i - 1];
			const currentSession = enrichedSessions[i];

			const prevEndMinutes = this.timeToMinutes(prevSession.realEndTime);
			const currentStartMinutes = this.timeToMinutes(currentSession.time);
			const breakDuration = currentStartMinutes - prevEndMinutes;

			if (breakDuration < 0) {
				// Conflito - sessões se sobrepõem
				conflicts.push(
					`${prevSession.movieTitle} termina às ${prevSession.realEndTime}, mas ${currentSession.movieTitle} começa às ${currentSession.time}`,
				);
				feasibilityScore -= 50;
			} else if (breakDuration < this.MIN_BREAK_TIME) {
				// Pausa muito curta
				conflicts.push(
					`Pausa muito curta (${breakDuration}min) entre ${prevSession.movieTitle} e ${currentSession.movieTitle}`,
				);
				feasibilityScore -= 20;
			} else {
				// Pausa adequada
				const breakType = this.classifyBreak(breakDuration, prevEndMinutes);
				breaks.push({
					afterMovie: prevSession.movieTitle,
					duration: breakDuration,
					type: breakType,
				});

				// Bonificar pausas bem planejadas
				if (breakType === "meal" && breakDuration >= this.MEAL_BREAK_TIME) {
					feasibilityScore += 10;
				}
			}
		}

		// Verificar preferências de horário
		feasibilityScore += this.evaluateTimePreferences(
			sortedSessions,
			preferences,
		);

		// Verificar duração total
		const firstSession = enrichedSessions[0];
		const lastSession = enrichedSessions[enrichedSessions.length - 1];
		const totalDuration =
			this.timeToMinutes(lastSession.realEndTime) -
			this.timeToMinutes(firstSession.time);

		if (totalDuration > this.MAX_CONTINUOUS_TIME * 1.5) {
			feasibilityScore -= 30;
			conflicts.push("Cronograma muito longo - considere dividir em dois dias");
		}

		return {
			id: `optimized-${index}`,
			name: this.generateScheduleName(sortedSessions, breaks),
			sessions: sortedSessions,
			startTime: firstSession.time,
			endTime: lastSession.realEndTime,
			totalDuration,
			breaks,
			feasibilityScore: Math.max(0, feasibilityScore),
			conflicts,
		};
	}

	/**
	 * Classifica tipo de pausa baseado na duração e horário
	 */
	private classifyBreak(
		duration: number,
		timeInMinutes: number,
	): BreakInfo["type"] {
		const hour = Math.floor(timeInMinutes / 60);

		if (duration >= this.MEAL_BREAK_TIME) {
			// Horários de refeição
			if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) {
				return "meal";
			}
			return "rest";
		}

		return "travel";
	}

	/**
	 * Avalia preferências de horário do usuário
	 */
	private evaluateTimePreferences(
		sessions: MovieSession[],
		preferences: SchedulePreferences,
	): number {
		let score = 0;

		if (preferences.preferredStartTime) {
			const firstSessionTime = this.timeToMinutes(sessions[0].time);
			const preferredTime = this.timeToMinutes(preferences.preferredStartTime);
			const difference = Math.abs(firstSessionTime - preferredTime);

			// Bonificar se começar próximo ao horário preferido
			if (difference <= 30) score += 15;
			else if (difference <= 60) score += 5;
		}

		if (preferences.avoidLateNight) {
			const lastSession = sessions[sessions.length - 1];
			const endTime =
				this.timeToMinutes(lastSession.time) + lastSession.duration;

			if (endTime > 22 * 60) {
				// depois das 22h
				score -= 20;
			}
		}

		if (preferences.preferMatinee) {
			const firstSessionTime = this.timeToMinutes(sessions[0].time);
			if (firstSessionTime < 14 * 60) {
				// antes das 14h
				score += 10;
			}
		}

		return score;
	}

	/**
	 * Gera nome descritivo para o cronograma
	 */
	private generateScheduleName(
		sessions: MovieSession[],
		breaks: BreakInfo[],
	): string {
		const hasLongBreak = breaks.some((b) => b.duration >= this.MEAL_BREAK_TIME);
		const totalMovies = sessions.length;

		if (hasLongBreak) {
			return `Maratona ${totalMovies} filmes (com refeição)`;
		}
		if (totalMovies >= 3) {
			return `Maratona ${totalMovies} filmes (intensivo)`;
		}
		return `Sessão dupla ${totalMovies} filmes`;
	}

	/**
	 * Gera todas as combinações possíveis
	 */
	private generateAllCombinations(
		availableSessions: MovieSession[][],
	): MovieSession[][] {
		const combinations: MovieSession[][] = [];

		const generateRecursive = (
			movieIndex: number,
			currentCombination: MovieSession[],
		) => {
			if (movieIndex >= availableSessions.length) {
				combinations.push([...currentCombination]);
				return;
			}

			const movieSessions = availableSessions[movieIndex];
			for (const session of movieSessions) {
				generateRecursive(movieIndex + 1, [...currentCombination, session]);
			}
		};

		generateRecursive(0, []);
		return combinations;
	}

	/**
	 * Utilitários de tempo
	 */
	private timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(":").map(Number);
		return hours * 60 + minutes;
	}

	private addMinutes(time: string, minutes: number): string {
		const totalMinutes = this.timeToMinutes(time) + minutes;
		const hours = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;

		return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
	}
}

interface SchedulePreferences {
	preferredStartTime?: string;
	avoidLateNight?: boolean;
	preferMatinee?: boolean;
	maxTotalDuration?: number;
	allowMealBreaks?: boolean;
}
