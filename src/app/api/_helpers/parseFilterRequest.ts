import type { NextRequest } from "next/server"
import { isHackerNewsEntry } from "@/lib/crawler/isHackerNewsEntry"
import { MAX_ENTRIES } from "@/lib/crawler/parseFrontPage"
import { isFilterType } from "@/lib/filters/isFilterType"
import type { HackerNewsEntry } from "@/lib/types/crawlerTypes"
import { FILTER_TYPES, type FilterType } from "@/lib/types/filterTypes"

interface ValidBody {
	readonly ok: true
	readonly filterType: FilterType
	readonly entries: HackerNewsEntry[]
}

interface InvalidBody {
	readonly ok: false
	readonly error: string
}

// `ok` tells the two apart, so reading `entries` is only possible once it is true
type ParsedBody = ValidBody | InvalidBody

// The body arrives as `unknown`, so every field is proven before it is used
export const parseFilterRequest = async (
	request: NextRequest,
): Promise<ParsedBody> => {
	let body: unknown

	try {
		body = await request.json()
	} catch {
		return { ok: false, error: "The request body must be valid JSON." }
	}

	if (typeof body !== "object" || !body) {
		return { ok: false, error: "The request body must be a JSON object." }
	}

	const { type, entries } = body as Record<string, unknown>

	if (!isFilterType(type)) {
		return {
			ok: false,
			error: `\`type\` must be one of: ${FILTER_TYPES.join(", ")}.`,
		}
	}

	if (!Array.isArray(entries) || !entries.every(isHackerNewsEntry)) {
		return {
			ok: false,
			error:
				"`entries` must be an array of { number, title, points, comments }.",
		}
	}

	if (entries.length > MAX_ENTRIES) {
		return {
			ok: false,
			error: `\`entries\` must hold at most ${MAX_ENTRIES} items.`,
		}
	}

	return { ok: true, filterType: type, entries }
}
