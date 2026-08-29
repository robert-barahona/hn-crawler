import type { Database } from "better-sqlite3"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createConnection } from "@/lib/storage/db"
import { UsageRepository } from "@/lib/storage/UsageRepository"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import { recordUsage } from "@/lib/usage/recordUsage"

const buildEntry = (number: number): HackerNewsEntry => ({
	number,
	title: "Title",
	points: 0,
	comments: 0,
})

describe("recordUsage", () => {
	let db: Database
	let repository: UsageRepository

	beforeEach(() => {
		db = createConnection(":memory:")
		repository = new UsageRepository(db)
	})

	afterEach(() => {
		db.close()
	})

	it("returns what the operation returned", async () => {
		const entries = [buildEntry(1), buildEntry(2)]

		await expect(
			recordUsage(repository, { operation: "crawl" }, async () => entries),
		).resolves.toBe(entries)
	})

	it("logs a successful crawl with how many entries it produced", async () => {
		await recordUsage(repository, { operation: "crawl" }, async () => [
			buildEntry(1),
			buildEntry(2),
			buildEntry(3),
		])

		expect(repository.findRecent()[0]).toMatchObject({
			operation: "crawl",
			filterType: null,
			status: "success",
			entryCount: 3,
			errorMessage: null,
		})
	})

	it("logs a successful filter run together with the filter applied", async () => {
		await recordUsage(
			repository,
			{ operation: "filter", filterType: "five-words-or-fewer-by-points" },
			async () => [buildEntry(1)],
		)

		expect(repository.findRecent()[0]).toMatchObject({
			operation: "filter",
			filterType: "five-words-or-fewer-by-points",
			status: "success",
			entryCount: 1,
		})
	})

	// The path that only runs when something is already going wrong, and so the
	// one most likely to be broken without anyone noticing
	it("logs a failed crawl with the reason it failed", async () => {
		await expect(
			recordUsage(repository, { operation: "crawl" }, async () => {
				throw new Error("Request to Hacker News failed.")
			}),
		).rejects.toThrow("Request to Hacker News failed.")

		expect(repository.findRecent()[0]).toMatchObject({
			operation: "crawl",
			status: "error",
			errorMessage: "Request to Hacker News failed.",
			entryCount: 0,
		})
	})

	it("logs a failed filter run together with the filter applied", async () => {
		await expect(
			recordUsage(
				repository,
				{ operation: "filter", filterType: "more-than-five-words-by-comments" },
				async () => {
					throw new Error("boom")
				},
			),
		).rejects.toThrow("boom")

		expect(repository.findRecent()[0]).toMatchObject({
			operation: "filter",
			filterType: "more-than-five-words-by-comments",
			status: "error",
			errorMessage: "boom",
		})
	})

	it("rethrows the original error rather than swallowing it", async () => {
		const failure = new TypeError("fetch failed")

		await expect(
			recordUsage(repository, { operation: "crawl" }, async () => {
				throw failure
			}),
		).rejects.toBe(failure)
	})

	it("describes a thrown non-Error without crashing the logging", async () => {
		await expect(
			recordUsage(repository, { operation: "crawl" }, async () => {
				throw "socket hang up"
			}),
		).rejects.toBe("socket hang up")

		expect(repository.findRecent()[0]?.errorMessage).toBe("socket hang up")
	})

	it("records exactly one log per run", async () => {
		await recordUsage(repository, { operation: "crawl" }, async () => [])
		await recordUsage(repository, { operation: "crawl" }, async () => {
			throw new Error("boom")
		}).catch(() => undefined)

		expect(repository.findRecent()).toHaveLength(2)
	})

	it("measures how long the operation took", async () => {
		await recordUsage(repository, { operation: "crawl" }, async () => {
			await new Promise((resolve) => setTimeout(resolve, 20))
			return []
		})

		expect(repository.findRecent()[0]?.durationMs).toBeGreaterThanOrEqual(15)
	})
})
