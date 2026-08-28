import { countTitleWords } from "@/lib/filters/countTitleWords"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import type { FilterType } from "@/lib/types/filterTypes"

const WORD_COUNT_THRESHOLD = 5

interface FilterDefinition {
	readonly matches: (entry: HackerNewsEntry) => boolean
	readonly orderBy: (entry: HackerNewsEntry) => number
}

const FILTERS: Record<FilterType, FilterDefinition> = {
	"more-than-five-words-by-comments": {
		matches: (entry) => countTitleWords(entry.title) > WORD_COUNT_THRESHOLD,
		orderBy: (entry) => entry.comments,
	},
	"five-words-or-fewer-by-points": {
		matches: (entry) => countTitleWords(entry.title) <= WORD_COUNT_THRESHOLD,
		orderBy: (entry) => entry.points,
	},
}

export const applyFilter = (
	entries: readonly HackerNewsEntry[],
	filterType: FilterType,
): HackerNewsEntry[] => {
	const { matches, orderBy } = FILTERS[filterType]

	return entries.filter(matches).sort((a, b) => orderBy(b) - orderBy(a))
}
