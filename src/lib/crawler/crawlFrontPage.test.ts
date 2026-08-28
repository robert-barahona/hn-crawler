import { afterEach, describe, expect, it, vi } from "vitest"
import { CrawlerError } from "@/lib/crawler/CrawlerError"
import { crawlFrontPage } from "@/lib/crawler/crawlFrontPage"
import { FRONT_PAGE_HTML } from "@/lib/crawler/frontPageFixture"

const stubFetch = (implementation: () => Promise<Response>): void => {
	vi.stubGlobal("fetch", vi.fn(implementation))
}

describe("crawlFrontPage", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("returns the parsed entries when Hacker News answers", async () => {
		stubFetch(async () => new Response(FRONT_PAGE_HTML, { status: 200 }))

		const entries = await crawlFrontPage()

		expect(entries).toHaveLength(30)
		expect(entries[0]?.number).toBe(1)
	})

	it("requests the Hacker News front page with an identifying user agent", async () => {
		stubFetch(async () => new Response(FRONT_PAGE_HTML, { status: 200 }))

		await crawlFrontPage()

		expect(fetch).toHaveBeenCalledWith(
			"https://news.ycombinator.com/",
			expect.objectContaining({
				headers: expect.objectContaining({
					"user-agent": expect.stringContaining("hn-crawler"),
				}),
			}),
		)
	})

	it("throws request-failed when the request never completes", async () => {
		stubFetch(async () => {
			throw new TypeError("fetch failed")
		})

		await expect(crawlFrontPage()).rejects.toMatchObject({
			name: "CrawlerError",
			code: "request-failed",
		})
	})

	it("names the failing URL in the message, so a log line is enough to debug", async () => {
		stubFetch(async () => new Response("", { status: 503 }))

		await expect(crawlFrontPage()).rejects.toThrow(
			/https:\/\/news\.ycombinator\.com\//,
		)
	})

	it("puts the underlying reason in the message", async () => {
		stubFetch(async () => {
			throw new TypeError("getaddrinfo ENOTFOUND news.ycombinator.com")
		})

		await expect(crawlFrontPage()).rejects.toThrow(
			/failed: getaddrinfo ENOTFOUND news\.ycombinator\.com\.$/,
		)
	})

	it("describes a thrown non-Error without crashing", async () => {
		stubFetch(async () => {
			throw "socket hang up"
		})

		await expect(crawlFrontPage()).rejects.toThrow(/failed: socket hang up\.$/)
	})

	it("keeps the original network failure as the error cause", async () => {
		const cause = new TypeError("fetch failed")
		stubFetch(async () => {
			throw cause
		})

		await expect(crawlFrontPage()).rejects.toMatchObject({ cause })
	})

	it("throws unexpected-status with the status code on a non-2xx answer", async () => {
		stubFetch(async () => new Response("Rate limited", { status: 503 }))

		await expect(crawlFrontPage()).rejects.toMatchObject({
			code: "unexpected-status",
			status: 503,
		})
	})

	it("stamps every failure with the time it happened", async () => {
		stubFetch(async () => new Response("", { status: 500 }))

		const error = await crawlFrontPage().catch((thrown: unknown) => thrown)

		expect(error).toBeInstanceOf(CrawlerError)
		expect(new Date((error as CrawlerError).occurredAt).toISOString()).toBe(
			(error as CrawlerError).occurredAt,
		)
	})

	it("propagates a markup failure rather than returning an empty list", async () => {
		stubFetch(async () => new Response("<html></html>", { status: 200 }))

		await expect(crawlFrontPage()).rejects.toMatchObject({
			code: "unexpected-markup",
		})
	})
})
