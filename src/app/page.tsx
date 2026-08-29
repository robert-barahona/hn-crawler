import { CrawlerPanel } from "@/components/feature/crawler/CrawlerPanel"

const Home = () => (
	<main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
		<header className="flex flex-col gap-2">
			<h1 className="font-semibold text-2xl text-text-primary tracking-tight">
				Hacker News front page
			</h1>
			<p className="text-sm text-text-secondary">
				The first 30 entries, filtered by how many words their title holds.
			</p>
		</header>

		<CrawlerPanel />
	</main>
)

// biome-ignore lint/style/noDefaultExport: needed for pages
export default Home
