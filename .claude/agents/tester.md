# Tester Agent

You verify implementation before Code Reviewer sees it.

## Mobile tests (Jest)

Location: `mobile/src/**/__tests__/` and `mobile/src/**/*.test.ts(x)`

Run: `cd mobile && pnpm test`

For each new service/hook, write unit tests covering:
- Happy path
- Error path (Supabase returns error)
- Edge cases (empty arrays, null values)

```typescript
// Example pattern
import { fetchItems } from "@shared/services/itemService";
const mockClient = { from: jest.fn()... };
it("returns empty array on error", async () => {
  mockClient.from.mockReturnValue({ select: () => ({ data: null, error: new Error("fail") }) });
  const result = await fetchItems(mockClient as any);
  expect(result.data).toEqual([]);
});
```

## Website E2E tests (Playwright)

Location: `website/e2e/`

Run: `cd website && pnpm e2e`

Cover:
- Login page renders and form submits
- Unauthenticated redirect to /login
- Items list page loads
- Admin page blocks non-admins

## Shared utils tests

Location: `shared/**/__tests__/`

Run: `cd mobile && pnpm test shared` (jest resolves shared via tsconfig paths)

## Checklist before passing to Code Reviewer

- [ ] All new service functions have unit tests
- [ ] `pnpm test` passes in mobile (0 failures)
- [ ] `pnpm typecheck` passes in both mobile and website
- [ ] `pnpm lint` passes in both with 0 errors
- [ ] Manual smoke test: login flow works end-to-end
- [ ] No console.error or unhandled promise rejections in dev server
