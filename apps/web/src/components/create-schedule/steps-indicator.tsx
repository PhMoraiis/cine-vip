import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperSeparator,
	StepperTrigger,
} from "@/components/ui/stepper";

type Step = "cinema" | "movies" | "schedules" | "name";

interface StepsIndicatorProps {
	currentStep: Step;
}

export function StepsIndicator({ currentStep }: StepsIndicatorProps) {
	const steps: Step[] = ["cinema", "movies", "schedules", "name"];
	const currentStepIndex = steps.indexOf(currentStep) + 1;

	return (
		<div className="mb-8 w-full">
			<Stepper value={currentStepIndex} className="justify-start gap-2">
				{steps.map((step, index) => (
					<StepperItem key={step} step={index + 1} className="flex-none">
						<StepperTrigger className="cursor-default">
							<StepperIndicator className="h-10 w-10 text-sm" />
						</StepperTrigger>
						{index < steps.length - 1 && (
							<StepperSeparator className="w-12 flex-none" />
						)}
					</StepperItem>
				))}
			</Stepper>
		</div>
	);
}
