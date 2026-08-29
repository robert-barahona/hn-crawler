// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react"
import { StrictMode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useCrawl } from "@/hooks/feature/crawler/useCrawl"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import { flush } from "@/test-helpers/flush"
import { stubFetch, untilAborted } from "@/test-helpers/stubFetch"

const ENTRY: HackerNewsEntry = {
	number: 1,
	title: "Title",
	points: 258,
	comments: 72,
}

describe("useCrawl", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("starts loading, with nothing to show yet", () => {
		stubFetch(async () => Response.json([ENTRY]))

		const { result } = renderHook(() => useCrawl())

		expect(result.current).toEqual({
			entries: [],
			isLoading: true,
			error: null,
		})
	})

	it("asks the crawl endpoint and exposes what it answered", async () => {
		stubFetch(async () => Response.json([ENTRY]))

		const { result } = renderHook(() => useCrawl())

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})
		expect(result.current.entries).toEqual([ENTRY])
		expect(result.current.error).toBeNull()
		expect(fetch).toHaveBeenCalledWith("/api/crawl", expect.anything())
	})

	it("exposes the message the server wrote when the crawl fails", async () => {
		stubFetch(async () =>
			Response.json({ error: "Hacker News is unreachable." }, { status: 502 }),
		)

		const { result } = renderHook(() => useCrawl())

		await waitFor(() => {
			expect(result.current.error).toBe("Hacker News is unreachable.")
		})
		expect(result.current.isLoading).toBe(false)
		expect(result.current.entries).toEqual([])
	})

	// StrictMode mounts the effect twice on purpose, so the first run is aborted
	// while its replacement is still going — the state has to follow the second
	it("keeps loading when a run is abandoned and replaced", async () => {
		stubFetch(untilAborted)

		const { result } = renderHook(() => useCrawl(), { wrapper: StrictMode })

		await flush()

		expect(result.current.isLoading).toBe(true)
		expect(result.current.error).toBeNull()
	})

	it("abandons the request when the component goes away", async () => {
		const { signals } = stubFetch(untilAborted)

		const { unmount } = renderHook(() => useCrawl())

		expect(signals()[0]?.aborted).toBe(false)

		unmount()

		expect(signals()[0]?.aborted).toBe(true)
	})
})
