import { jsonResponse } from "@/app/api/_helpers/jsonResponse"
import { CrawlerError, type CrawlerErrorCode } from "@/lib/crawler/CrawlerError"
import { describeError } from "@/utils/errors"

// 502 when Hacker News is the problem, 500 when we are
const STATUS_BY_CODE: Record<CrawlerErrorCode, number> = {
	"request-failed": 502,
	"unexpected-status": 502,
	"unexpected-markup": 500,
}

export const toErrorResponse = (error: unknown): Response =>
	jsonResponse(
		{ error: describeError(error) },
		error instanceof CrawlerError ? STATUS_BY_CODE[error.code] : 500,
	)
