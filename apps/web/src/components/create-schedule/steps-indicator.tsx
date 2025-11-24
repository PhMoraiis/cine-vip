type Step = "cinema" | "movies" | "schedules" | "name";

interface StepsIndicatorProps {
	currentStep: Step;
}

export function StepsIndicator({ currentStep }: StepsIndicatorProps) {
	const steps: Step[] = ["cinema", "movies", "schedules", "name"];

	return (
		<div className="mb-8 flex items-center gap-4">
			{steps.map((s, index) => (
				<div key={s} className="flex items-center gap-2">
					<div
						className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm ${
							currentStep === s
								? "bg-blue-600 text-white"
								: index < steps.indexOf(currentStep)
									? "bg-green-600 text-white"
									: "bg-white/10 text-white/40"
						}`}
					>
						{index + 1}
					</div>
					{index < 3 && <div className="h-px w-12 bg-white/10" />}
				</div>
			))}
		</div>
	);
}
