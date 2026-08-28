import { readFileSync } from "node:fs"

// A real, unmodified capture of https://news.ycombinator.com/
export const FRONT_PAGE_HTML = readFileSync(
	new URL("./fixtures/frontPage.html", import.meta.url),
	"utf8",
)
