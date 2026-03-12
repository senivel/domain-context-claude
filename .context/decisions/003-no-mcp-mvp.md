# ADR-003: No MCP Server for MVP

<!-- verified: 2026-03-11 -->

## Status

Accepted

## Context

MCP (Model Context Protocol) servers can provide structured tool access to domain context, enabling features like centralized context serving, cross-repo context sharing, and programmatic queries. The question was whether to include an MCP server in the initial release.

## Decision

The MVP uses a file-based approach only. No MCP server.

## Rationale

- The Domain Context spec's core principle is framework-agnostic, file-based knowledge. An MCP server would add a runtime dependency and infrastructure requirement that contradicts this.
- The file-based approach (skills reading markdown files) is simpler to install, debug, and understand. Users run `npx domain-context-cc` and get working skills immediately.
- MCP adds value primarily for centralized/remote context serving (e.g., a company-wide domain context server). This is a future use case, not an MVP requirement.
- Skills and hooks can accomplish everything needed for single-repo domain context management without MCP.

## Consequences

- Cross-repo context sharing requires manual file copying or git submodules rather than a centralized server.
- Programmatic queries against domain context (e.g., "find all business rules related to billing") must be done via Grep/Glob rather than structured MCP tool calls.
- An MCP server can be added later as a complementary distribution channel without changing the file-based core.

## Affected Modules

- This decision affects what is NOT built. No MCP-related modules exist.
