// A cached GET is served without running the handler, so the crawl behind it
// would go unlogged. POST is not cacheable anyway, but every answer sets it so
// the guarantee does not depend on remembering which method needs it
const NO_STORE = { "cache-control": "no-store" }

export const jsonResponse = (body: unknown, status = 200): Response =>
	Response.json(body, { status, headers: NO_STORE })
