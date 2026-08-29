import { useEffect, useRef, useState } from "react"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import type { FilterType } from "@/lib/types/filterTypes"
import { apiRequest } from "@/utils/apiRequest"
import { describeError } from "@/utils/errors"

interface FilterState {
	readonly filterType: FilterType | null
	readonly entries: HackerNewsEntry[]
	readonly isFiltering: boolean
	readonly error: string | null
	readonly handleChangeFilter: (filterType: FilterType | null) => void
}

export const useFilter = (crawled: HackerNewsEntry[]): FilterState => {
	const [filterType, setFilterType] = useState<FilterType | null>(null)
	const [filtered, setFiltered] = useState<HackerNewsEntry[]>([])
	const [isFiltering, setIsFiltering] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const inFlight = useRef<AbortController | null>(null)

	// Drops the pending request when the component goes away
	useEffect(() => () => inFlight.current?.abort(), [])

	const handleChangeFilter = async (next: FilterType | null): Promise<void> => {
		// A newer pick replaces the previous one, so its answer is no longer wanted
		inFlight.current?.abort()

		setError(null)
		setFilterType(next)

		// Nothing to ask for, and the run just abandoned above reports nothing when
		// it ends, so clearing the flag here is what keeps the tabs from staying disabled
		if (!next) {
			inFlight.current = null
			setIsFiltering(false)

			return
		}

		const controller = new AbortController()
		inFlight.current = controller
		setIsFiltering(true)

		try {
			const filteredEntries = await apiRequest<HackerNewsEntry[]>(
				"/api/filter",
				{
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ type: next, entries: crawled }),
					signal: controller.signal,
				},
			)

			setFiltered(filteredEntries)
		} catch (cause) {
			// An aborted run reports nothing at all: whoever aborted it owns the
			// flag, whether that was a newer pick, a cleared filter or an unmount
			if (controller.signal.aborted) {
				return
			}

			setError(describeError(cause))
		}

		setIsFiltering(false)
	}

	return {
		filterType,
		entries: filterType && !error ? filtered : crawled,
		isFiltering,
		error,
		handleChangeFilter,
	}
}
