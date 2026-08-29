import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cacheFor } from "@/utils/cacheFor"

const TTL_MS = 1_000

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

	it("propagates a failure to the caller", async () => {
		const failure = new Error("boom")
		const cached = cacheFor(async () => {
			throw failure
		}, TTL_MS)

		await expect(cached()).rejects.toBe(failure)
	})

	// The value is only remembered after a successful await, so this comes free
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
})
