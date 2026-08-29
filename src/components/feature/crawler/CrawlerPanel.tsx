"use client"

import type { FC } from "react"
import { EntryTable } from "@/components/feature/crawler/EntryTable"
import { FilterTabs } from "@/components/feature/crawler/FilterTabs"
import { Panel } from "@/components/ui/Panel"
import { useCrawl } from "@/hooks/feature/crawler/useCrawl"
import { useFilter } from "@/hooks/feature/crawler/useFilter"

export const CrawlerPanel: FC = () => {
	const { entries: crawled, isLoading, error: crawlError } = useCrawl()
	const {
		filterType,
		entries,
		isFiltering,
		error: filterError,
		handleChangeFilter,
	} = useFilter(crawled)

	if (crawlError) {
		return (
			<Panel className="flex flex-col gap-2 text-left" role="alert">
				<h2 className="font-medium text-text-primary">
					The crawl could not be completed
				</h2>
				<p className="font-mono text-text-secondary text-xs">{crawlError}</p>
			</Panel>
		)
	}

	return (
		<section className="flex min-h-0 flex-1 flex-col gap-6">
			<FilterTabs
				active={filterType}
				disabled={isLoading || isFiltering}
				onSelect={handleChangeFilter}
			/>

			{filterError ? (
				<p className="font-mono text-accent-hover text-xs" role="alert">
					{filterError}
				</p>
			) : null}

			{isLoading ? (
				<Panel>Crawling the Hacker News front page…</Panel>
			) : (
				<div className="flex min-h-0 flex-1 flex-col gap-3">
					<p className="text-sm text-text-muted">
						Showing {entries.length} of {crawled.length} entries
					</p>
					{entries.length > 0 ? (
						<EntryTable entries={entries} />
					) : (
						<Panel>No entry matches this filter.</Panel>
					)}
				</div>
			)}
		</section>
	)
}
