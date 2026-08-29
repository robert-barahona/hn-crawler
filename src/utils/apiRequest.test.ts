import { afterEach, describe, expect, it, vi } from "vitest"
import { stubFetch } from "@/test-helpers/stubFetch"
import { apiRequest } from "@/utils/apiRequest"

describe("apiRequest", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("returns the body a successful answer carried", async () => {
		stubFetch(async () => Response.json([{ number: 1 }]))

		await expect(apiRequest("/api/crawl")).resolves.toEqual([{ number: 1 }])
	})

	it("hands the request options to fetch, so a POST keeps its body", async () => {
		stubFetch(async () => Response.json([]))

		await apiRequest("/api/filter", { method: "POST", body: "{}" })

		expect(fetch).toHaveBeenCalledWith(
			"/api/filter",
			expect.objectContaining({ method: "POST", body: "{}" }),
		)
	})

	it("raises the message the server wrote, not the status code", async () => {
		stubFetch(async () =>
			Response.json(
				{ error: "Request to Hacker News failed." },
				{ status: 502 },
			),
		)

		await expect(apiRequest("/api/crawl")).rejects.toThrow(
			"Request to Hacker News failed.",
		)
	})

	// What a proxy or a gateway answers when the request never reached the API
	it("names the status when the failure is not even JSON", async () => {
		stubFetch(
			async () => new Response("<html>Bad Gateway</html>", { status: 502 }),
		)

		await expect(apiRequest("/api/crawl")).rejects.toThrow(
			"/api/crawl answered 502.",
		)
	})
})
