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

		if (!next) {
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
			// An abort means the component went away, so there is nobody to tell
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
