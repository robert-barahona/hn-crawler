# HN Crawler

Reads the first 30 entries from the [Hacker News](https://news.ycombinator.com/) front
page — number, title, points and comments — and applies two filters:

1. Titles with **more than five words**, sorted by comments (desc).
2. Titles with **five words or fewer**, sorted by points (desc).

Every crawl and every filter run is saved to a usage log with its timestamp, the filter
used, how many entries it returned, how long it took, and whether it failed.

Built with Next.js (App Router), TypeScript, `better-sqlite3` (plain SQL), Cheerio
and Vitest.

## Requirements

- **Node.js >= 22.13.0** (use the version in [`.nvmrc`](.nvmrc): `nvm use` / `fnm use`)
- **pnpm 11.24.0** — run `corepack enable` and it is installed from the
  `packageManager` field in `package.json`

The Node floor comes from pnpm 11 (`>=22.13`), which is stricter than Next 16
(`>=20.9`). It is enforced by `engines` plus `engineStrict: true`, so `pnpm install`
fails early with a clear message on an older Node.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

The SQLite file is created on first use at `./data/hn-crawler.db`. There is no setup
step and no environment variables. The path is local by design; a read-only filesystem.

```bash
pnpm test                      # unit tests, no network access
pnpm ts:check                  # tsc --noEmit
pnpm lint-and-format:check     # biome
pnpm knip                      # unused files, exports and dependencies
pnpm build

pnpm db                     # open the database with the sqlite3 CLI
pnpm db:last-five           # the five most recent usage logs
```

### HTTP API

| Endpoint | Method | Body | Returns |
| --- | --- | --- | --- |
| `/api/crawl` | `GET` | — | The 30 entries |
| `/api/filter` | `POST` | `{ type, entries }` | The entries the filter kept |

`type` is `more-than-five-words-by-comments` or `five-words-or-fewer-by-points`.
On failure both return `{ error }` with a `4xx` or `5xx` status.

## Project structure

```md
src/
├── lib/            business logic — no imports from Next
│   ├── crawler/    fetch and HTML parsing, typed errors
│   ├── filters/    word counting, filtering and sorting
│   ├── storage/    SQLite connection, schema, usage log repository
│   └── types/      shared types and the constants they come from
├── app/
│   ├── api/        route handlers — a thin layer over /lib
│   └── page.tsx    page shell
├── components/     ui/ (reusable) and feature/crawler/ (domain)
├── hooks/          useCrawl, useFilter
├── styles/         Tailwind entry point and the color palette
├── utils/          generic helpers
└── test-helpers/   stubs shared by the tests, never shipped
```

Tests sit next to the module they cover, as `*.test.ts`.

## Design decisions

### Business logic is independent from Next

Nothing in `/lib` imports Next, so the crawler, the filters and the repository can be
tested and reused without a server. The route handlers only read the request, call
`/lib`, and build the response.

### Counting words

The brief counts words separated by spaces and ignores symbols: `"This is - a
self-explained example"` is 5 words, not the 6 that `split(" ")` returns. So a token
counts only if it has at least one letter or digit:

```ts
const WORD_PATTERN = /[\p{L}\p{N}]/u
```

`\p{L}` and `\p{N}` instead of `[a-z0-9]` because HN titles have accents and non-Latin
scripts (`Café ünïcode 日本語` is three words). This keeps `self-explained` as one word,
drops a lone `-`, and counts `Show HN:` and `$13B` as one word each.

### The crawler never hides a problem

If Hacker News is unreachable, returns a non-2xx status, or changes its HTML, the
crawler throws a typed `CrawlerError` with a `code`, the HTTP status when there is one,
and the time it happened. It never returns an empty list or made-up data, because an
empty list would look the same as a front page with no stories.

The route turns that code into a status: `502` when Hacker News is the problem, `500`
when the parser is.

A job posting really has no score and no comment link, so it is read as zeros. But a
score that is there and cannot be read, or a subtext with neither a comment count nor
`discuss`, throws. Otherwise a wording change on HN would silently report zero for
every entry.

### The schema is built from TypeScript constants

One table and a handful of queries, so an ORM would be more setup than the code it
would replace. Every statement is prepared with bound parameters.

`OPERATIONS`, `STATUSES` and `FILTER_TYPES` generate the `CHECK` constraints, so adding
a filter cannot leave the database rejecting rows the code treats as valid. Two more
checks keep every row consistent:

```sql
CHECK ((operation = 'filter') = (filter_type IS NOT NULL))
CHECK ((status = 'error')     = (error_message IS NOT NULL))
```

There are no indexes. The table gets one row per operation and the only query is
`ORDER BY created_at DESC LIMIT n`. At this size an index would slow writes and help
nothing. Timestamps are ISO 8601 UTC strings, which sort correctly as text.

### The log is always written

`recordUsage` runs the operation, writes a log either way, and re-throws. A failure is
saved with its reason and `entry_count = 0`, so the log shows what was attempted and
not only what worked.

Every response sets `Cache-Control: no-store`. A cached `GET` is returned without
running the handler, so the crawl behind it would never be logged.

### `/api/filter` is a POST

The brief filters *those 30 entries*, so the client sends the entries it is showing.
A `GET` does not work for two reasons:

- **The set could change.** The crawl cache expires after 30 seconds, so a filter sent
  later would run over a different set than the one on screen.
- **The size.** Those 30 entries are 2,818 bytes of JSON, 4,394 once URL-encoded — over
  the ~2 KB that is safe in a URL.

Sending data for the server to process is what POST is for, and POST responses are not
cached, which is what we want here.

### The crawl cache respects `Crawl-delay: 30`

HN's `robots.txt` asks for 30 seconds between requests, so `cachedCrawl` reuses the last
result for that long.

`cacheFor` stores the **promise**, not the value. Storing the value leaves a gap between
reading the cache and filling it, so requests that arrive together each start their own
crawl. With the promise they share one: three simultaneous calls to `/api/crawl` made a
single request to Hacker News. A failed run is not kept, so the next call tries again.

### The UI uses the HTTP API

The page is a shell, and one client component (`CrawlerPanel`) calls `/api/crawl` on
mount and posts to `/api/filter` on each tab. It uses the same endpoints any other
client would, which is also what keeps them exercised end to end.

`apiRequest` exists because `fetch` does not throw on `4xx` or `5xx`. It turns those
into an error carrying the message the server wrote, so the UI can show *"Request to
<https://news.ycombinator.com/> failed"* instead of only a status code.

## Testing

No test opens a network connection. The crawler runs against a saved copy of the front
page (`src/lib/crawler/fixtures/frontPage.html`, taken on 2026-08-27 and left unedited,
so it still contains a job posting, a singular `1 comment` and a four-digit score).
Repository tests use an in-memory SQLite database, never the development file.

Test value was checked with mutation testing: change the source on purpose, run the
suite, and confirm a test fails. That is how the boundary cases were chosen — for
example `Nvidia acquires $13B` and `Show HN: Voronoi Go` look alike but are the only
cases that catch a symbol at the start and at the end of a word.
