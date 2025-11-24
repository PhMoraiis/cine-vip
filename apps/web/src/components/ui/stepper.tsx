"use client";

import { CheckIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
	defaultValue?: number;
	value?: number;
	onValueChange?: (value: number) => void;
}

const StepperContext = React.createContext<{
	activeStep: number;
	setActiveStep: (step: number) => void;
} | null>(null);

function useStepper() {
	const context = React.useContext(StepperContext);
	if (!context) {
		throw new Error("useStepper must be used within a Stepper");
	}
	return context;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
	(
		{ defaultValue = 0, value, onValueChange, className, children, ...props },
		ref,
	) => {
		const [activeStep, setActiveStep] = React.useState(defaultValue);

		const currentStep = value !== undefined ? value : activeStep;

		const handleStepChange = React.useCallback(
			(step: number) => {
				if (value === undefined) {
					setActiveStep(step);
				}
				onValueChange?.(step);
			},
			[value, onValueChange],
		);

		return (
			<StepperContext.Provider
				value={{
					activeStep: currentStep,
					setActiveStep: handleStepChange,
				}}
			>
				<div
					ref={ref}
					className={cn("flex w-full items-center gap-2", className)}
					{...props}
				>
					{children}
				</div>
			</StepperContext.Provider>
		);
	},
);
Stepper.displayName = "Stepper";

interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
	step: number;
	completed?: boolean;
	disabled?: boolean;
	loading?: boolean;
}

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
	(
		{ step, completed, disabled, loading, className, children, ...props },
		ref,
	) => {
		const { activeStep } = useStepper();

		const isActive = activeStep === step;
		const isCompleted = completed || activeStep > step;

		return (
			<div
				ref={ref}
				data-state={
					isActive ? "active" : isCompleted ? "completed" : "inactive"
				}
				className={cn(
					"group flex items-center gap-2 data-[state=active]:flex-none data-[state=completed]:flex-none data-[state=inactive]:flex-none",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		);
	},
);
StepperItem.displayName = "StepperItem";

const StepperTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
	return (
		<button
			ref={ref}
			className={cn("flex items-center gap-2 outline-none", className)}
			{...props}
		>
			{children}
		</button>
	);
});
StepperTrigger.displayName = "StepperTrigger";

const StepperIndicator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	// This component needs to know its parent's step, but we can't easily access it without another context or passing it down.
	// For simplicity in this implementation, we'll assume the indicator is used inside a StepperItem and we can infer state from CSS classes or parent data attributes if we were using CSS modules.
	// However, with Tailwind, we might need to pass the step explicitly or rely on the parent's state.
	// Let's try to find the step from the parent StepperItem context if we created one, but we didn't.
	// A better approach for this specific component structure requested by the user:

	// Since we can't easily get the 'step' prop from the parent StepperItem here without context,
	// we will rely on the user passing the visual state or just render a generic indicator that gets styled by the parent's data-state.

	return (
		<div
			ref={ref}
			className={cn(
				"flex h-8 w-8 items-center justify-center rounded-full border-2 font-medium text-xs transition-colors",
				// Inactive
				"border-muted text-muted-foreground group-data-[state=inactive]:bg-background",
				// Active
				"group-data-[state=active]:border-emerald-300/90 group-data-[state=active]:bg-emerald-300/90 group-data-[state=active]:text-primary",
				// Completed
				"group-data-[state=completed]:border-emerald-300/90 group-data-[state=completed]:bg-emerald-300/90 group-data-[state=completed]:text-primary",
				className,
			)}
			{...props}
		>
			<CheckIcon className="hidden h-4 w-4 group-data-[state=completed]:block" />
			<span className="group-data-[state=completed]:hidden">
				{/* We need the step number here. The user's example usage implies StepperItem has the step. 
				    We can use CSS counters or just render children if passed. 
					But the user example is <StepperIndicator /> without children.
					Let's assume we want to render the step number. 
					We need a context for StepperItem.
				*/}
				<StepperItemStepNumber />
			</span>
		</div>
	);
});
StepperIndicator.displayName = "StepperIndicator";

// Helper to get the step number from a new context
const StepperItemContext = React.createContext<{ step: number } | null>(null);

const StepperItemWrapper = React.forwardRef<HTMLDivElement, StepperItemProps>(
	({ step, ...props }, ref) => {
		return (
			<StepperItemContext.Provider value={{ step }}>
				<StepperItem ref={ref} step={step} {...props} />
			</StepperItemContext.Provider>
		);
	},
);
StepperItemWrapper.displayName = "StepperItem";

function StepperItemStepNumber() {
	const context = React.useContext(StepperItemContext);
	return context ? context.step : null;
}

const StepperSeparator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				"h-[2px] min-w-[2rem] flex-1 bg-muted transition-colors group-data-[state=completed]:bg-emerald-300/90",
				className,
			)}
			{...props}
		/>
	);
});
StepperSeparator.displayName = "StepperSeparator";

export {
	Stepper,
	StepperItemWrapper as StepperItem,
	StepperTrigger,
	StepperIndicator,
	StepperSeparator,
};
