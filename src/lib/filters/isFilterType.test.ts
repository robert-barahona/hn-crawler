import { describe, expect, it } from "vitest"
import { isFilterType } from "@/lib/filters/isFilterType"
import { FILTER_TYPES } from "@/lib/types/filterTypes"

describe("isFilterType", () => {
	it("accepts every filter the app offers", () => {
		for (const filterType of FILTER_TYPES) {
			expect(isFilterType(filterType)).toBe(true)
		}
	})

	it("rejects a name no filter answers to", () => {
		expect(isFilterType("by-vibes")).toBe(false)
	})

	// A request body can carry anything, so the guard has to survive non-strings
	it("rejects values that are not strings", () => {
		for (const value of [undefined, null, 0, {}, FILTER_TYPES]) {
			expect(isFilterType(value)).toBe(false)
		}
	})
})
