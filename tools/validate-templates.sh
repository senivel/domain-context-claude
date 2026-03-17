#!/usr/bin/env bash
# validate-templates.sh — Verify template files match Domain Context spec requirements
# Checks: file existence (TMPL-01), required sections (TMPL-02), placeholder patterns (TMPL-03)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/../templates"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  echo -e "  ${GREEN}PASS${RESET} $1"
  ((PASS_COUNT++))
}

fail() {
  echo -e "  ${RED}FAIL${RESET} $1"
  ((FAIL_COUNT++))
}

check_heading() {
  local file="$1"
  local heading="$2"
  if grep -qF "$heading" "$file"; then
    pass "$heading"
  else
    fail "$heading"
  fi
}

# ── 1. File existence (TMPL-01) ──────────────────────────────────────────────

echo -e "\n${BOLD}=== File Existence (TMPL-01) ===${RESET}\n"

FILES=(manifest.md context.md domain-concept.md decision.md constraint.md agents-snippet.md architecture.md claude.md gsd-agents-snippet.md)

for f in "${FILES[@]}"; do
  if [ -f "${TEMPLATES_DIR}/${f}" ]; then
    pass "${f} exists"
  else
    fail "${f} missing"
  fi
done

# ── 2. Required sections per file (TMPL-02) ─────────────────────────────────

echo -e "\n${BOLD}=== Required Sections (TMPL-02) ===${RESET}"

echo -e "\n${BOLD}manifest.md${RESET}"
check_heading "${TEMPLATES_DIR}/manifest.md" "# Context Manifest"
check_heading "${TEMPLATES_DIR}/manifest.md" "## Access Levels"
check_heading "${TEMPLATES_DIR}/manifest.md" "## Domain Concepts"
check_heading "${TEMPLATES_DIR}/manifest.md" "## Architecture Decisions"
check_heading "${TEMPLATES_DIR}/manifest.md" "## Constraints"
check_heading "${TEMPLATES_DIR}/manifest.md" "## Module Context Files"
check_heading "${TEMPLATES_DIR}/manifest.md" "## If Restricted Context Is Unavailable"

echo -e "\n${BOLD}context.md${RESET}"
check_heading "${TEMPLATES_DIR}/context.md" "## What This Module Does"
check_heading "${TEMPLATES_DIR}/context.md" "## Domain Concepts Owned"
check_heading "${TEMPLATES_DIR}/context.md" "## Business Rules"
check_heading "${TEMPLATES_DIR}/context.md" "## Non-Obvious Decisions"
check_heading "${TEMPLATES_DIR}/context.md" "## What This Module Does NOT Do"
check_heading "${TEMPLATES_DIR}/context.md" "## Dependencies"

echo -e "\n${BOLD}domain-concept.md${RESET}"
check_heading "${TEMPLATES_DIR}/domain-concept.md" "## What This Is"
check_heading "${TEMPLATES_DIR}/domain-concept.md" "## Lifecycle"
check_heading "${TEMPLATES_DIR}/domain-concept.md" "## Key Attributes"
check_heading "${TEMPLATES_DIR}/domain-concept.md" "## Business Rules"
check_heading "${TEMPLATES_DIR}/domain-concept.md" "## Invariants"
check_heading "${TEMPLATES_DIR}/domain-concept.md" "## Related Concepts"

echo -e "\n${BOLD}decision.md${RESET}"
check_heading "${TEMPLATES_DIR}/decision.md" "## Status"
check_heading "${TEMPLATES_DIR}/decision.md" "## Context"
check_heading "${TEMPLATES_DIR}/decision.md" "## Decision"
check_heading "${TEMPLATES_DIR}/decision.md" "## Rationale"
check_heading "${TEMPLATES_DIR}/decision.md" "## Consequences"
check_heading "${TEMPLATES_DIR}/decision.md" "## Affected Modules"

echo -e "\n${BOLD}constraint.md${RESET}"
check_heading "${TEMPLATES_DIR}/constraint.md" "## Source"
check_heading "${TEMPLATES_DIR}/constraint.md" "## Requirements"
check_heading "${TEMPLATES_DIR}/constraint.md" "## Impact on Code"
check_heading "${TEMPLATES_DIR}/constraint.md" "## Verification"

echo -e "\n${BOLD}agents-snippet.md${RESET}"
check_heading "${TEMPLATES_DIR}/agents-snippet.md" "<!-- domain-context:start -->"
check_heading "${TEMPLATES_DIR}/agents-snippet.md" "## Project Context"
check_heading "${TEMPLATES_DIR}/agents-snippet.md" "## Confidential Context"
check_heading "${TEMPLATES_DIR}/agents-snippet.md" "<!-- domain-context:end -->"

echo -e "\n${BOLD}gsd-agents-snippet.md${RESET}"
check_heading "${TEMPLATES_DIR}/gsd-agents-snippet.md" "<!-- gsd-bridge:start -->"
check_heading "${TEMPLATES_DIR}/gsd-agents-snippet.md" "## GSD Integration"
check_heading "${TEMPLATES_DIR}/gsd-agents-snippet.md" "<!-- gsd-bridge:end -->"

echo -e "\n${BOLD}architecture.md${RESET}"
check_heading "${TEMPLATES_DIR}/architecture.md" "## System Purpose"
check_heading "${TEMPLATES_DIR}/architecture.md" "## Module Map"
check_heading "${TEMPLATES_DIR}/architecture.md" "## Data Flow"
check_heading "${TEMPLATES_DIR}/architecture.md" "## Key Boundaries"
check_heading "${TEMPLATES_DIR}/architecture.md" "## Technology Decisions"

echo -e "\n${BOLD}claude.md${RESET}"
check_heading "${TEMPLATES_DIR}/claude.md" "@AGENTS.md"

# ── 3. Placeholder pattern (TMPL-03) ────────────────────────────────────────

echo -e "\n${BOLD}=== Placeholder Pattern (TMPL-03) ===${RESET}\n"

# Files that SHOULD have {snake_case} placeholders
PLACEHOLDER_FILES=(manifest.md context.md domain-concept.md decision.md constraint.md architecture.md)
for f in "${PLACEHOLDER_FILES[@]}"; do
  if grep -qE '\{[a-z][a-z0-9_]*\}' "${TEMPLATES_DIR}/${f}"; then
    pass "${f} has {snake_case} placeholders"
  else
    fail "${f} missing {snake_case} placeholders"
  fi
done

# Files that should NOT have {…} placeholders
NO_PLACEHOLDER_FILES=(agents-snippet.md claude.md gsd-agents-snippet.md)
for f in "${NO_PLACEHOLDER_FILES[@]}"; do
  if grep -qE '\{[a-z][a-z0-9_]*\}' "${TEMPLATES_DIR}/${f}"; then
    fail "${f} should not have {…} placeholders"
  else
    pass "${f} has no {…} placeholders"
  fi
done

# ── 4. Verified date pattern ────────────────────────────────────────────────

echo -e "\n${BOLD}=== Verified Date Comment ===${RESET}\n"

VERIFIED_FILES=(context.md domain-concept.md decision.md constraint.md)
for f in "${VERIFIED_FILES[@]}"; do
  if grep -qF '<!-- verified: {verified_date} -->' "${TEMPLATES_DIR}/${f}"; then
    pass "${f} has verified date comment"
  else
    fail "${f} missing <!-- verified: {verified_date} --> comment"
  fi
done

# ── 5. No double curly braces ───────────────────────────────────────────────

echo -e "\n${BOLD}=== No Double Curly Braces ===${RESET}\n"

for f in "${FILES[@]}"; do
  if grep -qE '\{\{' "${TEMPLATES_DIR}/${f}"; then
    fail "${f} contains {{…}} double curly braces"
  else
    pass "${f} no double curly braces"
  fi
done

# ── Summary ──────────────────────────────────────────────────────────────────

echo -e "\n${BOLD}=== Summary ===${RESET}\n"
echo -e "  ${GREEN}PASS${RESET}: ${PASS_COUNT}"
echo -e "  ${RED}FAIL${RESET}: ${FAIL_COUNT}"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "${RED}VALIDATION FAILED${RESET} — ${FAIL_COUNT} check(s) failed"
  exit 1
else
  echo -e "${GREEN}ALL CHECKS PASSED${RESET}"
  exit 0
fi
