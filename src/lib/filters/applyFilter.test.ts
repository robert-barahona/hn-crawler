import { describe, expect, it } from "vitest"
import { FRONT_PAGE_HTML } from "@/lib/crawler/frontPageFixture"
import { parseFrontPage } from "@/lib/crawler/parseFrontPage"
import { applyFilter } from "@/lib/filters/applyFilter"
import { countTitleWords } from "@/lib/filters/countTitleWords"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"

const ENTRIES = parseFrontPage(FRONT_PAGE_HTML)

const buildEntry = (
	overrides: Partial<HackerNewsEntry> = {},
): HackerNewsEntry => ({
	number: 1,
	title: "one two three four five",
	points: 0,
	comments: 0,
	...overrides,
})

const isDescending = (values: readonly number[]): boolean =>
	values.every(
		(value, index) => index === 0 || value <= (values[index - 1] ?? 0),
	)

describe("applyFilter", () => {
	describe("more-than-five-words-by-comments", () => {
		const result = applyFilter(ENTRIES, "more-than-five-words-by-comments")

		it("keeps only entries whose title has more than five words", () => {
			expect(result).not.toHaveLength(0)
			expect(result.every((entry) => countTitleWords(entry.title) > 5)).toBe(
				true,
			)
		})

		it("orders them by number of comments, highest first", () => {
			expect(isDescending(result.map((entry) => entry.comments))).toBe(true)
		})
	})

	describe("five-words-or-fewer-by-points", () => {
		const result = applyFilter(ENTRIES, "five-words-or-fewer-by-points")

		it("keeps only entries whose title has five words or fewer", () => {
			expect(result).not.toHaveLength(0)
			expect(result.every((entry) => countTitleWords(entry.title) <= 5)).toBe(
				true,
			)
		})

		it("orders them by points, highest first", () => {
			expect(isDescending(result.map((entry) => entry.points))).toBe(true)
		})
	})

	it("splits the entries between the two filters with none left over", () => {
		const long = applyFilter(ENTRIES, "more-than-five-words-by-comments")
		const short = applyFilter(ENTRIES, "five-words-or-fewer-by-points")

		expect(long.length + short.length).toBe(ENTRIES.length)
		expect(
			long.some((entry) =>
				short.some((other) => other.number === entry.number),
			),
		).toBe(false)
	})

	it("puts a five-word title in the second filter and a six-word one in the first", () => {
		const five = buildEntry({ number: 1, title: "one two three four five" })
		const six = buildEntry({ number: 2, title: "one two three four five six" })
		const entries = [five, six]

		expect(
			applyFilter(entries, "five-words-or-fewer-by-points").map(
				(e) => e.number,
			),
		).toEqual([1])
		expect(
			applyFilter(entries, "more-than-five-words-by-comments").map(
				(e) => e.number,
			),
		).toEqual([2])
	})

	it("applies the word rule, not a plain space count", () => {
		const entry = buildEntry({ title: "This is - a self-explained example" })

		expect(applyFilter([entry], "five-words-or-fewer-by-points")).toHaveLength(
			1,
		)
		expect(
			applyFilter([entry], "more-than-five-words-by-comments"),
		).toHaveLength(0)
	})

	it("keeps Hacker News' order between entries tied on the sorted field", () => {
		const entries = [
			buildEntry({ number: 3, points: 10 }),
			buildEntry({ number: 1, points: 10 }),
			buildEntry({ number: 2, points: 10 }),
		]

		expect(
			applyFilter(entries, "five-words-or-fewer-by-points").map(
				(e) => e.number,
			),
		).toEqual([3, 1, 2])
	})
})
