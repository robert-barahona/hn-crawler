import { describeError } from "@/utils/errors"

export type CrawlerErrorCode =
	| "request-failed" // The request never completed (DNS, TLS, socket, offline)
	| "unexpected-status" // Hacker News answered, but not with a 2xx
	| "unexpected-markup" // Hacker News answered fine, but the HTML no longer looks like we expect

interface CrawlerErrorContext {
	readonly code: CrawlerErrorCode
	readonly status?: number
	readonly cause?: unknown
}

// What broke, where, the HTTP status, and when it happened
export class CrawlerError extends Error {
	readonly code: CrawlerErrorCode
	readonly status: number | undefined
	readonly occurredAt: string

	constructor(message: string, context: CrawlerErrorContext) {
		super(message, { cause: context.cause })

		this.name = "CrawlerError"
		this.code = context.code
		this.status = context.status
		this.occurredAt = new Date().toISOString()
	}
}

// Every crawler failure is built through one of these, so the wording of each
// kind lives in one place and callers only supply the specifics

export const requestFailedError = (url: string, cause: unknown): CrawlerError =>
	new CrawlerError(`Request to ${url} failed: ${describeError(cause)}.`, {
		code: "request-failed",
		cause,
	})

export const unexpectedStatusError = (
	url: string,
	status: number,
	statusText: string,
): CrawlerError =>
	new CrawlerError(`${url} responded with ${status} ${statusText}.`, {
		code: "unexpected-status",
		status,
	})

export const markupError = (detail: string): CrawlerError =>
	new CrawlerError(
		`Hacker News markup no longer matches what the crawler expects: ${detail}.`,
		{ code: "unexpected-markup" },
	)
