import { afterEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "@/utils/apiRequest"

// Replaces global `fetch` with the given answer, so no test opens a socket
const stubFetch = (respond: () => Response): void => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => respond()),
	)
}

describe("apiRequest", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("returns the body a successful answer carried", async () => {
		stubFetch(() => Response.json([{ number: 1 }]))

		await expect(apiRequest("/api/crawl")).resolves.toEqual([{ number: 1 }])
	})

	it("hands the request options to fetch, so a POST keeps its body", async () => {
		stubFetch(() => Response.json([]))

		await apiRequest("/api/filter", { method: "POST", body: "{}" })

		expect(fetch).toHaveBeenCalledWith(
			"/api/filter",
			expect.objectContaining({ method: "POST", body: "{}" }),
		)
	})

	it("raises the message the server wrote, not the status code", async () => {
		stubFetch(() =>
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
		stubFetch(() => new Response("<html>Bad Gateway</html>", { status: 502 }))

		await expect(apiRequest("/api/crawl")).rejects.toThrow(
			"/api/crawl answered 502.",
		)
	})
})
