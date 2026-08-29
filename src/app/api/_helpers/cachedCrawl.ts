import { crawlFrontPage } from "@/lib/crawler/crawlFrontPage"
import { cacheFor } from "@/utils/cacheFor"

const CRAWL_DELAY_MS = 30_000 // The 30 seconds between requests Hacker News asks for in its robots.txt

// One cache for the whole app, wired here for the same reason as `getDb()`:
// `/lib` stays free of shared state so its tests can build their own
export const cachedCrawl = cacheFor(crawlFrontPage, CRAWL_DELAY_MS)
