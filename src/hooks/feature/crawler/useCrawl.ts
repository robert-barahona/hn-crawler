import { useEffect, useState } from "react"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import { apiRequest } from "@/utils/apiRequest"
import { describeError } from "@/utils/errors"

interface CrawlState {
	readonly entries: HackerNewsEntry[]
	readonly isLoading: boolean
	readonly error: string | null
}

export const useCrawl = (): CrawlState => {
	const [entries, setEntries] = useState<HackerNewsEntry[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const controller = new AbortController()

		const getEntries = async (): Promise<void> => {
			try {
				const crawled = await apiRequest<HackerNewsEntry[]>("/api/crawl", {
					signal: controller.signal,
				})
				setEntries(crawled)
			} catch (cause) {
				// An abort means the component went away, so there is nobody to tell
				if (controller.signal.aborted) {
					return
				}
				setError(describeError(cause))
			}

			setIsLoading(false)
		}

		void getEntries()

		return () => controller.abort()
	}, [])

	return { entries, isLoading, error }
}
