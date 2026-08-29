import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "../styles/globals.css"
import type { FC, PropsWithChildren } from "react"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	title: "HN Crawler | Technical Exercise",
	description:
		"A Hacker News crawler built with Next.js and TypeScript that extracts and filters the top 30 stories by title word count, points, and comments.",
}

const RootLayout: FC<PropsWithChildren> = ({ children }) => (
	<html
		lang="en"
		className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
	>
		<body className="flex h-full flex-col bg-bg-primary text-text-primary">
			{children}
		</body>
	</html>
)

// biome-ignore lint/style/noDefaultExport: needed for layout
export default RootLayout
