@AGENTS.md

# HN Crawler Exercise — Claude Code Guidelines

## Project Overview

This is a technical exercise for an interview process. It involves building a web
crawler that extracts data from Hacker News (https://news.ycombinator.com/) and allows
filtering that data in two different ways. Built with Next.js, TypeScript, and SQLite
(via better-sqlite3, no ORM).

### Functional requirements
- Extract the first 30 entries from the Hacker News front page: number, title,
  points, and number of comments
- Two filtering operations on those 30 entries:
  1. Entries with MORE than 5 words in the title, ordered by number of comments (desc)
  2. Entries with 5 words OR FEWER in the title, ordered by points (desc)
- Word counting: only space-separated words count, symbols are excluded.
  Example: "This is - a self-explained example" = 5 words
- Every time a crawl or a filter is executed, a usage log must be saved with at
  least: timestamp and the applied filter

### Evaluation criteria (what the interviewer will review)
- Good OO/functional code, no repetition, consistent organization
- Good use of version control: incremental commits with clear messages
- Automated testing of the filtering and crawling operations
- Clear README explaining design decisions

## Business Logic Architecture
- Pure business logic in `/lib`, with no dependency on Next.js
- `/lib/crawler`: fetch + HTML parsing for HN (using cheerio)
- `/lib/filters`: filtering and sorting logic
- `/lib/storage`: better-sqlite3 connection + usage log repository (raw SQL, no ORM)
- `/lib/types`: all shared and feature-specific types (e.g. `crawlerTypes.ts`, `filterTypes.ts`).
- `/app/api` is only a thin orchestration layer, no business logic

## Stack
- Next.js with App Router, TypeScript
- better-sqlite3 for persistence (no ORM, raw SQL)
- Cheerio for scraping/HTML parsing
- Vitest for testing

## React

- Avoid `useEffect` except to sync with external systems (DOM APIs, timers, storage, subscriptions) — never to derive state.
- Exports: always `export const`, never `export default` (except where the framework requires it, e.g. `page.tsx`/`layout.tsx` in the App Router).
- Type components with `FC`, imported as `import type { FC } from "react"`.
- Props: define an `interface` named `<ComponentName>Props`, with every property `readonly`. Destructure props directly in the function parameters.
- Use an implicit return (no `return`, no `{ }`) whenever the component body is a single JSX expression.

## Functions

- Always use arrow functions, never `function` declarations, expressions, or object method shorthand — utilities, hooks, event handlers, API route handlers, object literal callbacks (e.g. `ReadableStream({ start: async (controller) => {...} })`), etc.

## Frontend Structure

- `/components/ui`: base, reusable components with no business logic (Button, Input, Card, Badge, Modal).
- `/components/layout`: structural wrappers with no domain content (Header, Footer, Sidebar, PageWrapper, Grid). If a structural component has domain-specific content or logic, it belongs in `feature/<name>` instead.
- `/components/feature/<name>`: components tied to a domain/feature, including page-specific components (CrawlerResults, FilterTabs, UsageStats). Example: for `/app/page.tsx`, create `/components/feature/crawler/CrawlerResults.tsx`.
- `/hooks/shared`: generic, reusable hooks with no business logic (useDebounce, useLocalStorage, useMediaQuery).
- `/hooks/feature/<name>`: hooks tied to a domain/feature (useCrawl, useFilter).
- `/types`: all shared and feature-specific types (e.g. `crawlerTypes.ts`, `filterTypes.ts`).
- `/utils`: framework-agnostic helpers and integrations. No subfolder split required unless a domain-specific group emerges — then mirror the `feature/<name>` pattern.
- Naming: components in PascalCase matching their export (`CrawlerResults.tsx`); hooks in camelCase prefixed with `use` (`useCrawl.ts`).

## TypeScript

- Use `interface` to define object shapes (component props, API payloads, etc.); use `type` for primitives, unions (`|`), intersections (`&`), or complex mapped types.
- Always use `const` over `let`; only use `let` when a variable must be reassigned.
- Never use `any`; prefer `unknown` and narrow it before use.

## Environment Variables

- API keys must always be read from environment variables, never hardcoded.

## Error Handling

- The crawler must fail gracefully if HN's HTML structure changes or the request fails (throw a typed error, do not silently return an empty array or fake data).
- Log errors with enough context to debug (URL, status code, timestamp).

## Dates

- Store all timestamps in UTC (ISO 8601).
- Use `new Date()` at the point of the event, never format/parse dates manually.

## Scope Discipline

- Only implement what's explicitly requested in each phase.
- If you think something extra would add value (auth, pagination, caching, etc.),
  mention it as a suggestion, don't implement it without approval.

## Testing

- Every module in `/lib` must have unit tests alongside it (`*.test.ts`).
- Do not make real fetch calls in tests, use mocked HTML fixtures.
- Use an in-memory SQLite DB (`:memory:`) for repository tests, never hit the real dev DB file.

## Workflow

- NEVER commit automatically, I review and commit manually.
- Work in small, incremental phases, and notify me when each one is done.
- Make de changes with “Write” or “Edit” so the claude hooks can run after your changes.
