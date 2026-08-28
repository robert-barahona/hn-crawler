import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import Database from "better-sqlite3"
import { FILTER_TYPES } from "@/lib/filters/filterTypes"

const IN_MEMORY_DATABASE = ":memory:"
const DATABASE_PATH = "./data/hn-crawler.db"

// Only the storage layer names these two, so they stay here until something else needs them
const OPERATIONS = ["crawl", "filter"] as const
const STATUSES = ["success", "error"] as const

// Every value passed here is a compile-time constant, never runtime input
const sqlValueList = (values: readonly string[]): string =>
	values.map((value) => `'${value}'`).join(", ")

// Schema is plain SQL and safe to re-run on every connection — simple enough for one table
const SCHEMA_SQL = `
	CREATE TABLE IF NOT EXISTS usage_logs (
		id            INTEGER PRIMARY KEY AUTOINCREMENT,
		created_at    TEXT    NOT NULL,
		operation     TEXT    NOT NULL CHECK (operation IN (${sqlValueList(OPERATIONS)})),
		filter_type   TEXT    CHECK (filter_type IN (${sqlValueList(FILTER_TYPES)})),
		entry_count   INTEGER NOT NULL,
		duration_ms   INTEGER NOT NULL,
		status        TEXT    NOT NULL CHECK (status IN (${sqlValueList(STATUSES)})),
		error_message TEXT,

		-- A filter run always names its filter type; a crawl never does.
		CHECK ((operation = 'filter') = (filter_type IS NOT NULL)),
		-- A failed run always explains itself; a successful one never does.
		CHECK ((status = 'error') = (error_message IS NOT NULL))
	);
`

// Opens a connection and guarantees the schema exists
export const createConnection = (filename: string): Database.Database => {
	if (filename !== IN_MEMORY_DATABASE) {
		// Tests pass `:memory:` so they never touch the development database file
		mkdirSync(dirname(filename), { recursive: true })
	}

	const db = new Database(filename)
	// WAL keeps readers from blocking the writer; ignored by in-memory databases
	db.pragma("journal_mode = WAL")
	db.exec(SCHEMA_SQL)

	return db
}

let connection: Database.Database | null = null

// One shared connection for the app (better-sqlite3 is synchronous, so this is safe)
/** @lintignore wired up by the API routes in a later phase */
export const getDb = (): Database.Database => {
	connection ??= createConnection(DATABASE_PATH)

	return connection
}
