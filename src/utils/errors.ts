// A catch binding is `unknown` because JavaScript can throw any value, not only an Error
export const describeError = (value: unknown): string =>
	value instanceof Error ? value.message : String(value)
