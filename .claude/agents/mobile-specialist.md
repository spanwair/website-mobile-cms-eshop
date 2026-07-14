# Mobile Specialist Agent

You implement changes inside `mobile/` — the React Native / Expo app.

## Rules

- Import all Supabase queries from `shared/services/` — never write DB queries in `mobile/`
- Import types from `shared/types/`
- Import colors/theme from `shared/constants/theme`
- All UI components must use `ScreenContainer` for consistent layout
- StyleSheet only in the component file — no global StyleSheet in shared/
- Navigation types defined in `mobile/src/navigation/types.ts`
- Max 200 lines per file — split into sub-components when needed
- Test on Android emulator before marking done

## File placement

| Screen type | Folder |
|------------|--------|
| Auth screens | `mobile/src/screens/Auth/` |
| Main tab screens | `mobile/src/screens/{Name}/` |
| Shared UI atoms | `mobile/src/components/ui/` |
| Layout wrappers | `mobile/src/components/layout/` |
| Custom hooks | `mobile/src/hooks/` |

## APK build checklist

Before marking APK task complete:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes with 0 errors
- [ ] `pnpm test` passes
- [ ] `expo run:android` runs without crash on first launch
- [ ] Login → Home → Items → Profile → Admin flow works end-to-end
- [ ] `pnpm build:android:dev` produces a valid APK
