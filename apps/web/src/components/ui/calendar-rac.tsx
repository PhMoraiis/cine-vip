"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	Button,
	CalendarCell,
	CalendarGrid,
	CalendarGridBody,
	CalendarGridHeader,
	type DateValue,
	Heading,
	RangeCalendar as RACRangeCalendar,
	type RangeCalendarProps as RACRangeCalendarProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

export interface RangeCalendarProps<T extends DateValue>
	extends RACRangeCalendarProps<T> {
	className?: string;
}

export function RangeCalendar<T extends DateValue>({
	className,
	...props
}: RangeCalendarProps<T>) {
	return (
		<RACRangeCalendar
			className={twMerge("w-fit font-sans", className)}
			{...props}
		>
			<header className="flex items-center justify-between pb-4">
				<Button
					slot="previous"
					className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent text-popover-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<Heading className="font-medium text-sm" />
				<Button
					slot="next"
					className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent text-popover-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</header>
			<CalendarGrid className="border-collapse">
				<CalendarGridHeader>
					{(day) => (
						<th className="w-9 rounded-md py-0.5 font-normal text-[0.8rem] text-muted-foreground">
							{day}
						</th>
					)}
				</CalendarGridHeader>
				<CalendarGridBody>
					{(date) => (
						<CalendarCell
							date={date}
							className={({
								isSelected,
								isSelectionStart,
								isSelectionEnd,
								isFocusVisible,
								isHovered,
								isDisabled,
								isUnavailable,
							}) =>
								twMerge(
									"flex h-9 w-9 items-center justify-center rounded-md border-transparent text-center text-sm focus-visible:outline-none",
									isSelected &&
										"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary",
									(isSelectionStart || isSelectionEnd) &&
										"rounded-md bg-primary text-primary-foreground",
									isSelected &&
										!isSelectionStart &&
										!isSelectionEnd &&
										"rounded-none bg-accent text-accent-foreground",
									isSelectionStart && "rounded-r-none rounded-l-md",
									isSelectionEnd && "rounded-r-md rounded-l-none",
									isHovered &&
										!isSelected &&
										"bg-accent text-accent-foreground",
									isDisabled && "text-muted-foreground opacity-50",
									isUnavailable &&
										"text-destructive-foreground line-through decoration-destructive",
									isFocusVisible && "ring-1 ring-ring",
								)
							}
						/>
					)}
				</CalendarGridBody>
			</CalendarGrid>
		</RACRangeCalendar>
	);
}
