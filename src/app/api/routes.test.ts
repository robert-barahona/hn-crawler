import type { Database } from "better-sqlite3"
import type { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GET as GET_CRAWL } from "@/app/api/crawl/route"
import { POST as POST_FILTER } from "@/app/api/filter/route"
import { FRONT_PAGE_HTML } from "@/lib/crawler/frontPageFixture"
import { parseFrontPage } from "@/lib/crawler/parseFrontPage"
import { createConnection } from "@/lib/storage/db"
import { UsageRepository } from "@/lib/storage/UsageRepository"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import type { UsageLog } from "@/lib/types/usageTypes"

// Routes call getDb() for the shared connection — this swaps that export for an in-memory one in tests
const db: Database = createConnection(":memory:")
vi.mock("@/lib/storage/db", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/storage/db")>()),
	getDb: () => db,
}))

// The app-wide crawl cache would outlive each test and hide the stubbed fetch,
// so the routes get an uncached crawl here; the cache has its own tests
vi.mock("@/app/api/_helpers/cachedCrawl", async () => ({
	cachedCrawl: (await import("@/lib/crawler/crawlFrontPage")).crawlFrontPage,
}))

// Fakes a request carrying the given JSON body, so the route can be called directly
const filterRequest = (body: unknown): NextRequest =>
	({ json: async () => body }) as NextRequest

// The 30 entries a caller would have crawled before asking for a filter
const crawledEntries = (): HackerNewsEntry[] => parseFrontPage(FRONT_PAGE_HTML)

// Replaces global `fetch` with the given answer, so no test reaches Hacker News for real
const stubFetch = (implementation: () => Promise<Response>): void => {
	vi.stubGlobal("fetch", vi.fn(implementation))
}

const answerWithFrontPage = (): void => {
	stubFetch(async () => new Response(FRONT_PAGE_HTML, { status: 200 }))
}

const lastLog = (): UsageLog | undefined =>
	new UsageRepository(db).findRecent(1)[0]

describe("API routes", () => {
	beforeEach(() => {
		db.exec("DELETE FROM usage_logs")
	})

	// Puts the real `fetch` back, so a stub never leaks into the next test
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	describe("GET /api/crawl", () => {
		it("answers with the 30 entries", async () => {
			answerWithFrontPage()

			const response = await GET_CRAWL()

			expect(response.status).toBe(200)
			await expect(response.json()).resolves.toHaveLength(30)
		})

		// A cached response would skip the server, and with it the usage log
		it("forbids caching, so every call reaches the server", async () => {
			answerWithFrontPage()

			const response = await GET_CRAWL()

			expect(response.headers.get("cache-control")).toBe("no-store")
		})

		it("records the crawl", async () => {
			answerWithFrontPage()

			await GET_CRAWL()

			expect(lastLog()).toMatchObject({
				operation: "crawl",
				filterType: null,
				status: "success",
				entryCount: 30,
			})
		})

		it("answers 502 when Hacker News cannot be reached, and records the failure", async () => {
			stubFetch(async () => {
				throw new TypeError("fetch failed")
			})

			const response = await GET_CRAWL()

			expect(response.status).toBe(502)
			expect(lastLog()).toMatchObject({ operation: "crawl", status: "error" })
		})

		it("answers 500 when the markup no longer parses", async () => {
			stubFetch(async () => new Response("<html></html>", { status: 200 }))

			const response = await GET_CRAWL()

			expect(response.status).toBe(500)
		})
	})

	describe("POST /api/filter", () => {
		it("answers with the entries the filter kept", async () => {
			const response = await POST_FILTER(
				filterRequest({
					type: "five-words-or-fewer-by-points",
					entries: crawledEntries(),
				}),
			)

			expect(response.status).toBe(200)
			await expect(response.json()).resolves.toHaveLength(12)
		})

		it("filters exactly the entries it was given, without crawling", async () => {
			// A trap rather than a stub: nothing here should ever call it
			stubFetch(async () => {
				throw new Error("the filter route must not reach Hacker News")
			})

			const response = await POST_FILTER(
				filterRequest({
					type: "more-than-five-words-by-comments",
					entries: crawledEntries(),
				}),
			)

			// The 200 proves it did the work; without it a crash would also pass
			expect(response.status).toBe(200)
			expect(fetch).not.toHaveBeenCalled()
		})

		it("records the filter run together with the filter applied", async () => {
			await POST_FILTER(
				filterRequest({
					type: "more-than-five-words-by-comments",
					entries: crawledEntries(),
				}),
			)

			expect(lastLog()).toMatchObject({
				operation: "filter",
				filterType: "more-than-five-words-by-comments",
				status: "success",
				entryCount: 18,
			})
		})

		it("answers 400 for an unknown filter, without recording a run", async () => {
			const response = await POST_FILTER(
				filterRequest({ type: "by-vibes", entries: [] }),
			)

			expect(response.status).toBe(400)
			expect(lastLog()).toBeUndefined()
		})

		it("answers 400 when the entries are missing", async () => {
			const response = await POST_FILTER(
				filterRequest({ type: "five-words-or-fewer-by-points" }),
			)

			expect(response.status).toBe(400)
		})

		it("answers 400 when an entry is not shaped like one", async () => {
			const response = await POST_FILTER(
				filterRequest({
					type: "five-words-or-fewer-by-points",
					entries: [{ test: "this is not correct" }],
				}),
			)

			expect(response.status).toBe(400)
		})

		it("answers 400 for JSON that is not an object", async () => {
			expect((await POST_FILTER(filterRequest(null))).status).toBe(400)
		})

		it("answers 400 for a body that is not JSON", async () => {
			const request = {
				json: async (): Promise<unknown> => {
					throw new SyntaxError("Unexpected token")
				},
			} as NextRequest

			expect((await POST_FILTER(request)).status).toBe(400)
		})

		it("answers 400 for more entries than a front page holds", async () => {
			const entries = Array.from({ length: 31 }, (_, index) => ({
				number: index + 1,
				title: "Title",
				points: 0,
				comments: 0,
			}))

			const response = await POST_FILTER(
				filterRequest({ type: "five-words-or-fewer-by-points", entries }),
			)

			expect(response.status).toBe(400)
		})
	})
})
