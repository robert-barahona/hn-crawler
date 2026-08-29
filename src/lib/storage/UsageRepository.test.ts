import type { Database } from "better-sqlite3"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createConnection } from "@/lib/storage/db"
import { UsageRepository } from "@/lib/storage/UsageRepository"

describe("UsageRepository", () => {
	let db: Database
	let repository: UsageRepository

	beforeEach(() => {
		db = createConnection(":memory:")
		repository = new UsageRepository(db)
	})

	afterEach(() => {
		db.close()
	})

	describe("save", () => {
		it("records a successful crawl with no filter type", () => {
			const log = repository.save({
				operation: "crawl",
				status: "success",
				entryCount: 30,
				durationMs: 412,
			})

			expect(log).toMatchObject({
				operation: "crawl",
				filterType: null,
				errorMessage: null,
			})
		})

		it("records a filter run together with the filter applied", () => {
			const log = repository.save({
				operation: "filter",
				filterType: "more-than-five-words-by-comments",
				status: "success",
				entryCount: 18,
				durationMs: 1,
			})

			expect(log).toMatchObject({
				operation: "filter",
				filterType: "more-than-five-words-by-comments",
			})
		})

		it("records a failure with the reason it failed", () => {
			const log = repository.save({
				operation: "crawl",
				status: "error",
				errorMessage: "https://news.ycombinator.com/ responded with 503.",
				entryCount: 0,
				durationMs: 88,
			})

			expect(log).toMatchObject({
				status: "error",
				errorMessage: "https://news.ycombinator.com/ responded with 503.",
			})
		})

		it("returns the id SQLite generated", () => {
			const first = repository.save({
				operation: "crawl",
				status: "success",
				entryCount: 30,
				durationMs: 1,
			})
			const second = repository.save({
				operation: "crawl",
				status: "success",
				entryCount: 30,
				durationMs: 1,
			})

			expect(first.id).toBeGreaterThan(0)
			expect(second.id).toBeGreaterThan(first.id)
		})

		it("stamps the timestamp in UTC", () => {
			const before = new Date().toISOString()

			const log = repository.save({
				operation: "crawl",
				status: "success",
				entryCount: 30,
				durationMs: 1,
			})

			// Round-tripping only succeeds on a canonical ISO string
			expect(new Date(log.createdAt).toISOString()).toBe(log.createdAt)
			expect(log.createdAt >= before).toBe(true)
		})

		it("persists the log rather than only returning it", () => {
			repository.save({
				operation: "crawl",
				status: "success",
				entryCount: 30,
				durationMs: 1,
			})

			expect(new UsageRepository(db).findRecent()).toHaveLength(1)
		})
	})

	describe("findRecent", () => {
		it("returns nothing when no operation has run yet", () => {
			expect(repository.findRecent()).toEqual([])
		})

		it("returns the most recent logs first", () => {
			for (const entryCount of [1, 2, 3]) {
				repository.save({
					operation: "crawl",
					status: "success",
					entryCount,
					durationMs: 1,
				})
			}

			expect(repository.findRecent().map((log) => log.entryCount)).toEqual([
				3, 2, 1,
			])
		})

		it("keeps the newest when more logs exist than the limit asks for", () => {
			for (const entryCount of [1, 2, 3, 4]) {
				repository.save({
					operation: "crawl",
					status: "success",
					entryCount,
					durationMs: 1,
				})
			}

			expect(repository.findRecent(2).map((log) => log.entryCount)).toEqual([
				4, 3,
			])
		})

		it("reads every column back into its domain name", () => {
			repository.save({
				operation: "filter",
				filterType: "five-words-or-fewer-by-points",
				status: "error",
				errorMessage: "boom",
				entryCount: 7,
				durationMs: 23,
			})

			const [log] = repository.findRecent()

			expect(log).toEqual({
				id: expect.any(Number),
				createdAt: expect.any(String),
				operation: "filter",
				filterType: "five-words-or-fewer-by-points",
				entryCount: 7,
				durationMs: 23,
				status: "error",
				errorMessage: "boom",
			})
		})
	})
})
