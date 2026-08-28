import {
	requestFailedError,
	unexpectedStatusError,
} from "@/lib/crawler/CrawlerError"
import { parseFrontPage } from "@/lib/crawler/parseFrontPage"
import type { HackerNewsEntry } from "@/lib/types"

const FRONT_PAGE_URL = "https://news.ycombinator.com/"
const USER_AGENT = "hn-crawler/0.1 (technical exercise)" // Hacker News asks crawlers to identify themselves

export const crawlFrontPage = async (): Promise<HackerNewsEntry[]> => {
	let response: Response

	try {
		response = await fetch(FRONT_PAGE_URL, {
			headers: { "user-agent": USER_AGENT },
		})
	} catch (cause) {
		throw requestFailedError(FRONT_PAGE_URL, cause)
	}

	if (!response.ok) {
		throw unexpectedStatusError(
			FRONT_PAGE_URL,
			response.status,
			response.statusText,
		)
	}

	return parseFrontPage(await response.text())
}
