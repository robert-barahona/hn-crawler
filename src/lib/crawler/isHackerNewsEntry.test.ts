import { describe, expect, it } from "vitest"
import { isHackerNewsEntry } from "@/lib/crawler/isHackerNewsEntry"

const VALID = { number: 1, title: "Title", points: 258, comments: 72 }

describe("isHackerNewsEntry", () => {
	it("accepts a well-formed entry", () => {
		expect(isHackerNewsEntry(VALID)).toBe(true)
	})

	it("accepts the zeroes a job posting produces", () => {
		expect(isHackerNewsEntry({ ...VALID, points: 0, comments: 0 })).toBe(true)
	})

	it("ignores fields it does not know about", () => {
		expect(isHackerNewsEntry({ ...VALID, url: "https://example.com" })).toBe(
			true,
		)
	})

	it("rejects an entry missing a field", () => {
		for (const field of ["number", "title", "points", "comments"] as const) {
			const { [field]: _removed, ...rest } = VALID

			expect(isHackerNewsEntry(rest)).toBe(false)
		}
	})

	it("rejects a count that is not a number", () => {
		expect(isHackerNewsEntry({ ...VALID, points: "258" })).toBe(false)
		expect(isHackerNewsEntry({ ...VALID, comments: null })).toBe(false)
	})

	it("rejects counts that are numbers but not finite", () => {
		expect(isHackerNewsEntry({ ...VALID, points: Number.NaN })).toBe(false)
		expect(
			isHackerNewsEntry({ ...VALID, number: Number.POSITIVE_INFINITY }),
		).toBe(false)
	})

	it("rejects a title that is not a string", () => {
		expect(isHackerNewsEntry({ ...VALID, title: 42 })).toBe(false)
	})

	// `typeof null` is "object", which is the classic way this guard goes wrong
	it("rejects values that are not objects", () => {
		for (const value of [null, undefined, "entry", 1, true, []]) {
			expect(isHackerNewsEntry(value)).toBe(false)
		}
	})
})
