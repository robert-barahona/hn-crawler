import * as cheerio from "cheerio"
import { markupError } from "@/lib/crawler/CrawlerError"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import { normalizeWhitespace } from "@/utils/text"

const MAX_ENTRIES = 30

const ENTRY_NUMBER_PATTERN = /^(\d+)\.$/ // "13."
const POINTS_PATTERN = /^(\d+) points?$/ // "258 points", "1 point"
const COMMENTS_PATTERN = /^(\d+) comments?$/ // "72 comments", "1 comment"
const DISCUSS_LABEL = "discuss" // What HN links to instead of a count when nobody replied

// Parses the front page entries from raw HTML. Kept pure so every parsing rule can be tested offline
export const parseFrontPage = (html: string): HackerNewsEntry[] => {
	const $ = cheerio.load(html)
	const rows = $("tr.athing").toArray()

	// An empty result is the signature of a markup change
	if (!rows.length) {
		throw markupError("no `tr.athing` rows were found")
	}

	return rows.slice(0, MAX_ENTRIES).map((row, index) => {
		const position = index + 1
		const entry = $(row)
		// Points and comments live in the sibling row, not in the entry itself
		const subtext = entry.next().find("td.subtext")

		const numberMatch = ENTRY_NUMBER_PATTERN.exec(
			normalizeWhitespace(entry.find("span.rank").text()),
		)
		if (!numberMatch?.[1]) {
			throw markupError(`the entry at position ${position} has no number`)
		}

		const title = normalizeWhitespace(
			entry.find("span.titleline > a").first().text(),
		)
		if (!title) {
			throw markupError(`the entry at position ${position} has no title`)
		}

		// Job postings carry no score at all, so a missing `span.score` is valid and means zero
		const score = subtext.find("span.score")
		const scoreText = normalizeWhitespace(score.text())
		const pointsMatch = POINTS_PATTERN.exec(scoreText)
		if (score.length && !pointsMatch?.[1]) {
			throw markupError(
				`the entry at position ${position} has an unreadable score "${scoreText}"`,
			)
		}

		// Four anchors here — user, age, hide, comments — and nothing marks which is which, so each is tested
		const subline = subtext.find("span.subline")
		const labels = subline
			.find("a")
			.toArray()
			.map((link) => normalizeWhitespace($(link).text()))
		const commentsMatch = labels
			.map((label) => COMMENTS_PATTERN.exec(label))
			.find((match) => !!match)

		// Same rule as the score: job postings have no subline and mean zero, but a
		// subline offering neither a count nor "discuss" is a wording change
		if (subline.length && !commentsMatch && !labels.includes(DISCUSS_LABEL)) {
			throw markupError(
				`the entry at position ${position} has no readable comment count`,
			)
		}

		return {
			number: Number(numberMatch[1]),
			title,
			points: Number(pointsMatch?.[1] ?? 0),
			comments: Number(commentsMatch?.[1] ?? 0),
		}
	})
}
