# Testing Conventions

## Unit Tests

- Spec files co-located with source: `foo.component.spec.ts`
- Structure: Arrange / Act / Assert with blank lines between sections
- One top-level `describe` per class, nested `describe` per method/scenario
- No magic strings or numbers — use constants or builders
- Descriptive names: `'should return empty array when input is null'`
- Mock external dependencies only (HTTP, third-party, browser APIs)
- Test real logic — avoid mocking the thing being tested
- No `any` in test files
- Test public methods with non-trivial logic, boundary/edge cases, @Input/@Output, conditional templates
- Don't test framework internals, simple assignments, or private methods directly

## E2E Tests

- Spec files organised by domain/feature
- One `describe` per domain (top level); nested `describe` per scenario
- `beforeEach` at top level for shared setup; nested for scenario-specific
- Every `it` independently meaningful — don't rely on sibling state

## Test Data

- Separate generation from creation
- Generators use `Partial<T>` overrides merged last
- Always reload and re-assert after create/update to verify persistence

## General

- Set up intercepts before the actions that trigger them
- Wait on intercept aliases before asserting resulting UI
- Use scoped selectors (`.within()` or equivalent) over global queries
