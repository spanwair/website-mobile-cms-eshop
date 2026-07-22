# Nové, zánovní a použité iPhony za skvělé ceny

## Mission
Create implementation-ready, token-driven UI guidance for Nové, zánovní a použité iPhony za skvělé ceny that is optimized for consistency, accessibility, and fast delivery across e-commerce storefront.

## Brand
- Product/brand: Nové, zánovní a použité iPhony za skvělé ceny
- URL: https://www.jabkolevne.cz/
- Audience: online shoppers and consumers
- Product surface: e-commerce storefront

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=Lexend`, `font.family.stack=Lexend, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=24px`
- Typography scale: `font.size.xs=0px`, `font.size.sm=13px`, `font.size.md=14px`, `font.size.lg=15px`, `font.size.xl=16px`, `font.size.2xl=18px`, `font.size.3xl=20px`, `font.size.4xl=22px`
- Color palette: `color.text.primary=#89b744`, `color.text.secondary=#4d4d4d`, `color.text.tertiary=#ffffff`, `color.text.inverse=#838689`, `color.surface.base=#000000`, `color.surface.raised=#7eba28`, `color.surface.strong=#f7f7f7`
- Spacing scale: `space.1=4px`, `space.2=10px`, `space.3=12px`, `space.4=16px`, `space.5=19.5px`, `space.6=20px`, `space.7=23.24px`, `space.8=24px`
- Radius/shadow/motion tokens: `radius.xs=12px`, `radius.sm=200px` | `motion.duration.instant=300ms`, `motion.duration.fast=400ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (1198), buttons (277), lists (136), cards (102), inputs (11), navigation (2).


## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
