import type { NextRequest } from "next/server"
import { jsonResponse } from "@/app/api/_helpers/jsonResponse"
import { parseFilterRequest } from "@/app/api/_helpers/parseFilterRequest"
import { runAndRespond } from "@/app/api/_helpers/runAndRespond"
import { applyFilter } from "@/lib/filters/applyFilter"

// Filters and sorts the entries it is given
export const POST = async (request: NextRequest): Promise<Response> => {
	const parsed = await parseFilterRequest(request)

	if (!parsed.ok) {
		return jsonResponse({ error: parsed.error }, 400)
	}

	const { filterType, entries } = parsed

	return runAndRespond({ operation: "filter", filterType }, async () =>
		applyFilter(entries, filterType),
	)
}
