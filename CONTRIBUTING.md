# Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and changelog generation via [release-please](https://github.com/googleapis/release-please).

## Commit Message Format

```
type(scope): description

optional body

optional footer
```

- **type** -- required, one of the recognized types below
- **scope** -- optional, indicates the area of change (e.g., `hooks`, `installer`)
- **description** -- required, imperative mood, lowercase, no period at end

## Commit Types

| Type | Changelog Section | Visible | Version Bump |
|------|-------------------|---------|--------------|
| `feat` | Features | Yes | MINOR |
| `fix` | Bug Fixes | Yes | PATCH |
| `perf` | Performance | Yes | PATCH |
| `docs` | Documentation | Yes | PATCH |
| `chore` | Miscellaneous | No | PATCH |
| `ci` | CI | No | PATCH |
| `test` | Tests | No | PATCH |
| `refactor` | Refactoring | No | PATCH |
| `style` | Styles | No | PATCH |
| `build` | Build | No | PATCH |

**Hidden types** still follow the conventional commit format and are tracked by release-please, but they do not appear in the generated changelog or release notes.

## Version Bumps

Release-please determines the next version based on commit types since the last release:

- **MINOR** (1.x.0) -- any `feat:` commit triggers a minor version bump
- **PATCH** (1.0.x) -- `fix:`, `perf:`, `docs:`, and all other types trigger a patch bump
- **MAJOR** (x.0.0) -- a `BREAKING CHANGE:` footer or `!` after the type triggers a major bump

The highest bump wins. If a release includes both `feat:` and `fix:` commits, the version gets a MINOR bump.

## Examples

A simple feature:

```
feat: add dc:validate skill
```

A fix with scope:

```
fix(hooks): handle missing stdin gracefully
```

A breaking change:

```
feat!: rename dc:init to dc:setup

BREAKING CHANGE: The dc:init command has been renamed to dc:setup.
Update any scripts or documentation that reference dc:init.
```

A hidden type (won't appear in changelog):

```
chore: update dev dependencies
```

## Other Guidelines

For build commands, project structure, and development setup, see [AGENTS.md](AGENTS.md).
