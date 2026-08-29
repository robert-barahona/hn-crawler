// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useFilter } from "@/hooks/feature/crawler/useFilter"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import { flush } from "@/test-helpers/flush"
import { stubFetch, untilAborted } from "@/test-helpers/stubFetch"

const LONG_TITLE: HackerNewsEntry = {
	number: 1,
	title: "one two three four five six",
	points: 10,
	comments: 90,
}

const SHORT_TITLE: HackerNewsEntry = {
	number: 2,
	title: "one two three",
	points: 80,
	comments: 5,
}

const CRAWLED = [LONG_TITLE, SHORT_TITLE]

describe("useFilter", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("shows the crawled entries while no filter is picked", () => {
		const { result } = renderHook(() => useFilter(CRAWLED))

		expect(result.current.filterType).toBeNull()
		expect(result.current.entries).toBe(CRAWLED)
		expect(result.current.isFiltering).toBe(false)
	})

	it("asks the API for the picked filter and shows what came back", async () => {
		stubFetch(async () => Response.json([SHORT_TITLE]))

		const { result } = renderHook(() => useFilter(CRAWLED))

		await act(async () => {
			await result.current.handleChangeFilter("five-words-or-fewer-by-points")
		})

		expect(result.current.filterType).toBe("five-words-or-fewer-by-points")
		expect(result.current.entries).toEqual([SHORT_TITLE])
		expect(result.current.isFiltering).toBe(false)
	})

	// The brief filters those 30 entries, so the ones on screen have to travel
	it("posts the filter together with the entries it was given", async () => {
		stubFetch(async () => Response.json([]))

		const { result } = renderHook(() => useFilter(CRAWLED))

		await act(async () => {
			await result.current.handleChangeFilter(
				"more-than-five-words-by-comments",
			)
		})

		expect(fetch).toHaveBeenCalledWith(
			"/api/filter",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({
					type: "more-than-five-words-by-comments",
					entries: CRAWLED,
				}),
			}),
		)
	})

	it("gives the crawled entries back when the filter is cleared, without asking", async () => {
		stubFetch(async () => Response.json([SHORT_TITLE]))

		const { result } = renderHook(() => useFilter(CRAWLED))

		await act(async () => {
			await result.current.handleChangeFilter("five-words-or-fewer-by-points")
		})
		await act(async () => {
			await result.current.handleChangeFilter(null)
		})

		expect(result.current.entries).toBe(CRAWLED)
		expect(fetch).toHaveBeenCalledTimes(1)
	})

	// Clearing abandons the run in flight, and an abandoned run reports nothing on
	// its way out, so without the hook lowering the flag the tabs stay disabled for good
	it("stops loading when the filter is cleared while a run is in flight", async () => {
		const { signals } = stubFetch(untilAborted)

		const { result } = renderHook(() => useFilter(CRAWLED))

		await act(async () => {
			void result.current.handleChangeFilter("five-words-or-fewer-by-points")
		})
		await act(async () => {
			void result.current.handleChangeFilter(null)
		})
		await flush()

		expect(signals()[0]?.aborted).toBe(true)
		expect(result.current.isFiltering).toBe(false)
		expect(result.current.entries).toBe(CRAWLED)
		expect(result.current.error).toBeNull()
	})

	it("exposes the message the server wrote when the filter fails", async () => {
		stubFetch(async () =>
			Response.json({ error: "`type` must be one of: ..." }, { status: 400 }),
		)

		const { result } = renderHook(() => useFilter(CRAWLED))

		await act(async () => {
			await result.current.handleChangeFilter("five-words-or-fewer-by-points")
		})

		expect(result.current.error).toBe("`type` must be one of: ...")
		expect(result.current.isFiltering).toBe(false)
		// A failed filter falls back to everything rather than showing nothing
		expect(result.current.entries).toBe(CRAWLED)
	})

	it("abandons the run in flight when another filter is picked", async () => {
		const { signals } = stubFetch(untilAborted)

		const { result } = renderHook(() => useFilter(CRAWLED))

		await act(async () => {
			void result.current.handleChangeFilter("more-than-five-words-by-comments")
		})
		await act(async () => {
			void result.current.handleChangeFilter("five-words-or-fewer-by-points")
		})
		await flush()

		expect(signals()[0]?.aborted).toBe(true)
		expect(signals()[1]?.aborted).toBe(false)
		// The abandoned run reports nothing at all, so the newer pick still reads
		// as loading and its abort never surfaces as an error
		expect(result.current.error).toBeNull()
		expect(result.current.isFiltering).toBe(true)
	})

	it("abandons the run in flight when the component goes away", async () => {
		const { signals } = stubFetch(untilAborted)

		const { result, unmount } = renderHook(() => useFilter(CRAWLED))

		await act(async () => {
			void result.current.handleChangeFilter("five-words-or-fewer-by-points")
		})

		expect(signals()[0]?.aborted).toBe(false)

		unmount()

		expect(signals()[0]?.aborted).toBe(true)
	})
})
