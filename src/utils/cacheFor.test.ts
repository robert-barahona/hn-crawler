import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cacheFor } from "@/utils/cacheFor"

const TTL_MS = 1_000

// A promise plus the handles to settle it later, so a test can hold a run in
// flight and decide when, and in which order, each one ends
const deferred = <T>() => {
	let settle!: {
		resolve: (value: T) => void
		reject: (reason: unknown) => void
	}
	const promise = new Promise<T>((resolve, reject) => {
		settle = { resolve, reject }
	})

	return { promise, ...settle }
}

describe("cacheFor", () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it("reuses the value instead of producing it again within the ttl", async () => {
		const produce = vi.fn(async () => "value")
		const cached = cacheFor(produce, TTL_MS)

		await cached()
		vi.advanceTimersByTime(TTL_MS - 1)

		await expect(cached()).resolves.toBe("value")
		expect(produce).toHaveBeenCalledTimes(1)
	})

	it("produces again once the ttl has passed", async () => {
		const produce = vi.fn(async () => "value")
		const cached = cacheFor(produce, TTL_MS)

		await cached()
		vi.advanceTimersByTime(TTL_MS)
		await cached()

		expect(produce).toHaveBeenCalledTimes(2)
	})

	// The reason the promise is what gets cached: without it, the second call
	// would start its own run because the first has not stored anything yet
	it("runs once for callers that arrive before the first run finishes", async () => {
		const produce = vi.fn(async () => "value")
		const cached = cacheFor(produce, TTL_MS)

		const [first, second] = await Promise.all([cached(), cached()])

		expect(produce).toHaveBeenCalledTimes(1)
		expect(first).toBe(second)
	})

	it("propagates a failure to the caller", async () => {
		const failure = new Error("boom")
		const cached = cacheFor(async () => {
			throw failure
		}, TTL_MS)

		await expect(cached()).rejects.toBe(failure)
	})

	it("does not keep a failed run, so the next call tries again", async () => {
		const produce = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error("boom"))
			.mockResolvedValueOnce("value")
		const cached = cacheFor(produce, TTL_MS)

		await expect(cached()).rejects.toThrow("boom")

		await expect(cached()).resolves.toBe("value")
		expect(produce).toHaveBeenCalledTimes(2)
	})

	// Without the reference check in the catch, the failure below would clear the
	// run that replaced it and a third call would crawl again for nothing
	it("forgets only the run that failed, not the newer one that replaced it", async () => {
		const first = deferred<string>()
		const second = deferred<string>()
		const produce = vi
			.fn<() => Promise<string>>()
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise)
		const cached = cacheFor(produce, TTL_MS)

		const firstCall = cached()
		// The first run is still in flight when its own entry goes stale
		vi.advanceTimersByTime(TTL_MS)
		const secondCall = cached()

		first.reject(new Error("boom"))
		await expect(firstCall).rejects.toThrow("boom")
		second.resolve("value")
		await expect(secondCall).resolves.toBe("value")

		await expect(cached()).resolves.toBe("value")
		expect(produce).toHaveBeenCalledTimes(2)
	})
})
