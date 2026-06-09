# Coding Rules

## TypeScript
- Strict mode enforced — zero `any`, zero unnarrowed `unknown`
- Always declare return types on public methods
- Interfaces over type aliases for object shapes
- `readonly` on properties not mutated after construction
- No `!` non-null assertions — handle nullability explicitly
- No type casting with `as` to silence a type error — fix the root type

## Angular
- Reactive forms only — fully typed: `FormGroup<T>` / `FormControl<T>` / `FormArray<T>`
- Define form types as interfaces in same `.ts` file above @Component
- No `UntypedFormGroup/Control/Builder` — these are legacy
- No `ngModel`, no template-driven forms
- Services are `providedIn: 'root'` unless feature-scoped
- Presentational components: `ChangeDetectionStrategy.OnPush`
- Smart components own data; presentational receive via @Input()
- Use `subscribe({ next, error })` object syntax, never two-callback form
- Unsubscribe on destroy: use `takeUntil` with `destroy$` subject or `DestroyRef`
- Chain operators in `.pipe()` — no logic inside `subscribe` beyond assigning/calling single method
- RxJS chains: break before every `.pipe()` and `.subscribe()` on own indented line
- Private functions after public functions

## HTML / Templates
- `aria-label` required on all interactive elements with no visible text
- Use `aria-labelledby` or `aria-describedby` for label associations
- Prefer semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`) over `<div>` with roles
- Dynamic content changes need `aria-live="polite"` (non-urgent) or `aria-live="assertive"` (errors)
- Never convey meaning through colour alone
- Don't suppress focus outline without visible custom replacement
- Images/icons with meaning need `alt` text or `aria-label`; decorative use `alt=""`
- Form fields must have visible `<label>` or `aria-label` — placeholder not sufficient
- Keyboard navigation follows reading order; no positive `tabindex` values
- One structural directive per element — `*ngIf` and `*ngFor` must not share
- No complex logic in templates — push to component class
- `trackBy` required on every `*ngFor`
- Use named `ng-template` blocks for loading, empty, reusable display
- Attribute order: structural > property binding > event binding > template ref

## SCSS
- Flat, descriptive class names — no BEM
- Every component file opens with `:host { display: block }`
- State variants nested: `&.active`, `&.disabled` — never re-declared at root
- CSS custom properties for all colours — no hardcoded hex/rgb values
- Variables in shared `_variables.scss` — no magic values inline
- CSS Grid for page/section layouts — Flexbox only for inline icon+text alignment
- Max nesting: 3 levels
- No inline styles in templates

## General
- One component/service/pipe per file
- Filename matches class name in kebab-case
- Barrel exports (`index.ts`) per feature folder
- Import order: Angular core > third-party > project absolute > project relative
- Multi-property object literals expand across lines (one property per indented line)

## Git Safety
- NEVER commit, stage, or push code unless explicitly instructed
- NEVER run with `--no-verify` or bypass any git hook
- NEVER modify CI/CD pipelines without explicit instruction
- NEVER delete files or branches without explicit confirmation
- Ask before running any destructive operation (delete, overwrite, reset)
