import { FILTER_TYPES, type FilterType } from "@/lib/types/filterTypes"

export const isFilterType = (value: unknown): value is FilterType =>
	FILTER_TYPES.some((filterType) => filterType === value)
