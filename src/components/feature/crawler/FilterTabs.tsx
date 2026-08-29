import type { FC } from "react"
import { FILTER_TYPES, type FilterType } from "@/lib/types/filterTypes"
import { cn } from "@/utils/cn"

const LABELS: Record<FilterType, string> = {
	"more-than-five-words-by-comments": "More than 5 words · by comments",
	"five-words-or-fewer-by-points": "5 words or fewer · by points",
}

// Derived from FILTER_TYPES, so a new filter reaches the UI without being listed twice
const TABS = [
	{ filterType: null, label: "All entries" },
	...FILTER_TYPES.map((filterType) => ({
		filterType,
		label: LABELS[filterType],
	})),
] as const

interface FilterTabsProps {
	readonly active: FilterType | null
	readonly disabled: boolean
	readonly onSelect: (filterType: FilterType | null) => void
}

export const FilterTabs: FC<FilterTabsProps> = ({
	active,
	disabled,
	onSelect,
}) => (
	<nav aria-label="Filters" className="flex flex-wrap gap-2">
		{TABS.map(({ filterType, label }) => {
			const isActive = filterType === active

			return (
				<button
					aria-pressed={isActive}
					className={cn(
						"rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-50",
						isActive
							? "border-accent bg-accent text-accent-text"
							: "border-border bg-surface-secondary text-text-secondary hover:border-accent-hover hover:text-text-primary",
					)}
					disabled={disabled}
					key={label}
					onClick={() => onSelect(filterType)}
					type="button"
				>
					{label}
				</button>
			)
		})}
	</nav>
)
