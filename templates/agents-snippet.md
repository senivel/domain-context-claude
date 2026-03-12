<!-- domain-context:start -->
## Project Context

This project uses [Domain Context](https://github.com/senivel/domain-context) for domain knowledge documentation.

- Architecture overview: @ARCHITECTURE.md
- Domain & business context: @.context/MANIFEST.md
- Per-module context: CONTEXT.md files in each source directory

When working in a module, read its CONTEXT.md first. When a task involves
business rules, consult the relevant .context/domain/ files via the manifest.

## Confidential Context

If `.context.local/` exists, read its contents alongside `.context/`.
If unavailable, do not infer business rules from code. Ask the developer.
<!-- domain-context:end -->
