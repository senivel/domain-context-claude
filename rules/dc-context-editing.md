---
globs: .context/**, **/CONTEXT.md
---

# Domain Context Formatting

Authoritative spec: ~/code/domain-context/SPEC.md

## General

- Filenames: kebab-case, lowercase
- Verified date in files: `<!-- verified: YYYY-MM-DD -->` (HTML comment after H1)
- Verified date in MANIFEST.md entries: `[verified: YYYY-MM-DD]` (inline)
- Token budget: ~500-1000 tokens per file, max 1500
- One concept per file; split if >2000 tokens

## MANIFEST.md

- One-line blockquote description (`> ...`) immediately after H1
- Required sections: Access Levels, Domain Concepts, Architecture Decisions, Constraints, Module Context Files
- Domain entry format: `- [Name](domain/slug.md) -- description [access-level] [verified: YYYY-MM-DD]`
- ADR entry format: `- [NNN: Title](decisions/NNN-slug.md) -- description [verified: YYYY-MM-DD]`
- Always update MANIFEST.md when adding or modifying any context file

## Domain Concepts (.context/domain/)

- Required sections: What This Is, Key Attributes, Business Rules, Invariants, Related Concepts
- Optional section: Lifecycle
- Business rules as numbered testable statements

## Decisions (.context/decisions/)

- Filename: `{NNN}-{slug}.md` (NNN = zero-padded three digits)
- Title: `ADR-{NNN}: {Title}`
- Required sections: Status, Context, Decision, Rationale, Consequences, Affected Modules
- Status values: accepted | superseded | deprecated

## Constraints (.context/constraints/)

- Required sections: Source, Requirements, Impact on Code, Verification

## Module CONTEXT.md

- Required sections: What This Module Does, Domain Concepts Owned, Business Rules, Non-Obvious Decisions, What This Module Does NOT Do, Dependencies
