import { describe, expect, it } from "vitest"
import { CrawlerError } from "@/lib/crawler/CrawlerError"
import { FRONT_PAGE_HTML } from "@/lib/crawler/frontPageFixture"
import { parseFrontPage } from "@/lib/crawler/parseFrontPage"

// Minimal stand-in for one entry, used to exercise the markup-change paths.
const buildRow = (title: string, subtext: string, number = "1."): string => `
	<table>
		<tr class="athing submission" id="1">
			<td class="title"><span class="rank">${number}</span></td>
			<td class="title"><span class="titleline"><a href="x">${title}</a></span></td>
		</tr>
		<tr><td colspan="2"></td><td class="subtext"><span class="subline">${subtext}</span></td></tr>
	</table>
`

describe("parseFrontPage", () => {
	it("extracts the 30 front page entries", () => {
		expect(parseFrontPage(FRONT_PAGE_HTML)).toHaveLength(30)
	})

	it("reads number, title, points and comments from a normal entry", () => {
		expect(parseFrontPage(FRONT_PAGE_HTML)[0]).toEqual({
			number: 1,
			title: "Saving 100 terabytes of memory by optimizing 1.1.1.1's DNS cache",
			points: 258,
			comments: 72,
		})
	})

	// On the front page HN's numbering equals the array index + 1, so only a
	// number that disagrees with the position proves where it was read from
	it("takes the number from Hacker News, not from the array index", () => {
		const [entry] = parseFrontPage(
			buildRow(
				"Title",
				'<span class="score">1 point</span> | <a href="item?id=1">3 comments</a>',
				"7.",
			),
		)

		expect(entry?.number).toBe(7)
	})

	it("reports a job posting, which has no score and no comment link, as zeroes", () => {
		expect(parseFrontPage(FRONT_PAGE_HTML)[12]).toEqual({
			number: 13,
			title: "Bild AI (YC W25) is hiring product and AI engineers",
			points: 0,
			comments: 0,
		})
	})

	it('reads the singular "1 comment" wording', () => {
		expect(parseFrontPage(FRONT_PAGE_HTML)[25]).toMatchObject({
			number: 26,
			points: 34,
			comments: 1,
		})
	})

	it("reads counts written with a non-breaking space", () => {
		const [entry] = parseFrontPage(
			buildRow(
				"Title",
				'<span class="score">10 points</span> | <a href="item?id=1">5&nbsp;comments</a>',
			),
		)

		expect(entry).toMatchObject({ points: 10, comments: 5 })
	})

	it("treats an entry with no discussion yet as zero comments", () => {
		const [entry] = parseFrontPage(
			buildRow(
				"Title",
				'<span class="score">1 point</span> | <a href="item?id=1">discuss</a>',
			),
		)

		expect(entry).toMatchObject({ points: 1, comments: 0 })
	})

	describe("when the markup no longer matches", () => {
		it("throws unexpected-markup instead of returning an empty array", () => {
			expect(() =>
				parseFrontPage("<html><body>Nothing here</body></html>"),
			).toThrow(
				expect.objectContaining({
					constructor: CrawlerError,
					code: "unexpected-markup",
				}),
			)
		})

		it("throws when an entry has no number", () => {
			expect(() =>
				parseFrontPage(
					buildRow("Title", '<span class="score">1 point</span>', ""),
				),
			).toThrow(/has no number/)
		})

		it("throws when an entry has no title", () => {
			expect(() =>
				parseFrontPage(buildRow("", '<span class="score">1 point</span>')),
			).toThrow(/has no title/)
		})

		it("throws when a score is present but unreadable", () => {
			expect(() =>
				parseFrontPage(
					buildRow("Title", '<span class="score">many points</span>'),
				),
			).toThrow(/unreadable score/)
		})

		// Without this, renamed wording would silently report zero for every entry
		it('throws when a subline offers neither a comment count nor "discuss"', () => {
			expect(() =>
				parseFrontPage(
					buildRow(
						"Title",
						'<span class="score">1 point</span> | <a href="item?id=1">72 replies</a>',
					),
				),
			).toThrow(/no readable comment count/)
		})
	})
})
