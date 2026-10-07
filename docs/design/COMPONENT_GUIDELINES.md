# Component guidelines

Live reference: `/design-system` (dev only). Rules here are binding (see also CLAUDE.md "Team rules").

## Buttons (`components/ui/button.tsx`)
- `default` (aurora + light-sweep sheen) = the **one** primary action per view. Never two aurora buttons side by side.
- `premium` = upgrade/premium only. `secondary` for important non-primary, `ghost` for toolbars, `glass` on imagery, `destructive` for delete (always behind a confirmation).
- Use `loading` instead of hand-rolled spinners; icon-only buttons need `aria-label`.
- Labels are verbs that match the result ("Delete upload" → toast "Upload deleted").

## Forms (`components/form/*`)
- Always `<Form form={useForm(...)} onSubmit>` + `Form*` controls + `<FormSubmit>`. Server errors → `form.setError("root" | field)` → `<FormRootError/>`.
- Pick the control: free text `FormInput` · long text `FormTextarea` · password `FormPassword` (`showRules` on create/change) · ≤10 fixed options `FormSelect` · searchable/long/multi `FormCombobox` · 2–5 visible options `FormRadioGroup` · boolean consent `FormCheckbox` · instant preference `FormSwitch` · numeric range `FormSlider`.
- Validation messages are specific and actionable ("Enter a non-zero whole number"), never "Invalid".

## Cards & surfaces
- Don't nest cards. Don't box everything — use whitespace and headings first.
- Tool tiles / template cards: `liftHover`; asset cards: overlay action bar that is also keyboard-reachable.

## States (every list, grid and async section)
- **Loading:** skeleton matching the final layout (`Skeleton` / `shimmer` for AI/processing).
- **Empty:** `EmptyState` — what's missing, why, one action.
- **Error:** what happened + what to do + retry.
- **Paywall:** `premium` badge + waitlist CTA until billing ships.

## Motion
- Use `lib/motion.ts` presets and `m.*` only. One orchestrated entrance per page; everything else user-triggered.
- Lists: `AnimatePresence` + `layout` + `listItem`. Dialogs/sheets/popovers: built-in Radix animations or `scaleIn`.
- Never animate width/height/top/left on hot paths; never delay interaction behind an animation.

## Imagery
- `next/image` for static/remote images (Unsplash allowed in `next.config.ts`); plain `<img>` only for presigned/blob URLs, with a `biome-ignore` reason.
- No third-party logos, no fake social proof, no Picsart/Canva assets (see `ASSETS.md`).
