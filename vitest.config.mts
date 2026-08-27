import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const config = defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
})

// biome-ignore lint/style/noDefaultExport: required by vitest
export default config
