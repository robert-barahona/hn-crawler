// The single source of truth for filters
export const FILTER_TYPES = [
	"more-than-five-words-by-comments",
	"five-words-or-fewer-by-points",
] as const

export type FilterType = (typeof FILTER_TYPES)[number]
