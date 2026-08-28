import { describe, expect, it } from "vitest"
import { countTitleWords } from "@/lib/filters/countTitleWords"

describe("countTitleWords", () => {
	it("counts the example from the brief as five words", () => {
		expect(countTitleWords("This is - a self-explained example")).toBe(5)
	})

	it("keeps a hyphenated word whole", () => {
		expect(countTitleWords("self-explained")).toBe(1)
	})

	it("ignores tokens made only of symbols", () => {
		expect(countTitleWords("- – — | / +")).toBe(0)
	})

	it("ignores an em dash between words", () => {
		expect(countTitleWords("Restoredrill – proves backups restore")).toBe(4)
	})

	it("counts a token that mixes symbols with letters or digits", () => {
		expect(countTitleWords("Show HN: Voronoi Go")).toBe(4)
		expect(countTitleWords("Nvidia acquires $13B")).toBe(3)
		expect(countTitleWords("Trade (and Tariffs)")).toBe(3)
		expect(countTitleWords("Robert's laptop")).toBe(2)
	})

	it("counts a bare number as a word", () => {
		expect(countTitleWords("507 Mechanical Movements")).toBe(3)
	})

	it("counts letters outside the Latin alphabet", () => {
		expect(countTitleWords("Café ünïcode 日本語")).toBe(3)
	})

	it("is unaffected by repeated or surrounding whitespace", () => {
		expect(countTitleWords("  a   b  ")).toBe(2)
	})

	it("counts an empty or whitespace-only title as zero", () => {
		expect(countTitleWords("")).toBe(0)
		expect(countTitleWords("   ")).toBe(0)
	})
})
