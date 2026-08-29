import { cachedCrawl } from "@/app/api/_helpers/cachedCrawl"
import { runAndRespond } from "@/app/api/_helpers/runAndRespond"

// Returns the 30 entries currently on the Hacker News front page
export const GET = async (): Promise<Response> =>
	runAndRespond({ operation: "crawl" }, cachedCrawl)
