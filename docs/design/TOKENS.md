# Design tokens — Aurora Studio

Source of truth: `apps/web/app/globals.css` (CSS variables + Tailwind v4 `@theme`). Never hard-code values in components; add a token here first.

## Color
| Token (Tailwind) | Dark | Light (default) | Use |
|---|---|---|---|
| `bg-background` | `#07070D` | `#FBFBFD` | page |
| `bg-surface-1` | `#0D0D18` | `#FFFFFF` | panels, inputs |
| `bg-surface-2` / `bg-card` | `#14142A` | `#FFFFFF` | cards |
| `bg-surface-3` | `#1C1C38` | `#EEEEF8` | hover / raised |
| `text-foreground` | `#F5F6FF` | `#10112A` | primary text |
| `text-text-2` | `#A7A9C7` | `#3C3F5C` | secondary text |
| `text-muted-foreground` | `#7E81A3` | `#5E6180` | muted (AA ≥ 4.5 on page bg) |
| `primary` | `#9B85FF` | `#5B3FE0` | links, rings, selected states |
| `border` / `input` | white 8% / 12% | ink 10% / 14% | hairlines |
| `success` · `warning` · `destructive` · `info` | `#2EE59D` · `#FFC24D` · `#FF5C7A` · `#4DB8FF` | darker variants | semantic |

### Gradients
| Utility | Value | Rule |
|---|---|---|
| `bg-aurora`, `text-aurora` | `#7C5CFF → #2DA8FF → #2EF2C9` | **Transformation only**: primary CTA, AI actions, before/after, generating states. Text on aurora = `text-aurora-ink` (`#07070D`). |
| `bg-premium` | `#FF5CA8 → #FFB35C` | **Premium only** (badges, upsell). Never adjacent to aurora. |
| `bg-mesh` | three radial blobs | `AuroraBackdrop` behind hero + final CTA only. |
| `shadow-glow` | `0 0 40px -10px rgb(124 92 255/.55)` | aurora elements only |

## Type
| Utility | Face | Size |
|---|---|---|
| `font-display` (h1–h3 default, 700, wdth 92) | Bricolage Grotesque (opsz+wdth axes) | `text-hero` clamp(44→92px, lh .96, −4.5%) · `text-display` clamp(36→60, −4%) · `text-h1` clamp(32→48) · `text-h2` clamp(24→32) |
| `font-sans` (body/UI) | Geist | 15–16px body, 13px small, line-height ~1.55 |
| `font-mono` | Geist Mono | prompts, credits, shortcuts, numbers (`tabular-nums`) |

## Shape & depth
| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 8px | inputs |
| `rounded-lg` | 12px | buttons |
| `rounded-2xl` | 20px | cards |
| `rounded-3xl` | 28px | hero / feature panels |
| `surface-highlight` | 1px inner top highlight + card shadow | raised surfaces |
| `glass` | translucent surface + 20px blur + hairline | floating UI only (nav, popovers, ⌘K, floating toolbars) |
| `shadow-float` | large soft shadow | popovers, hero canvas |

## Motion (`apps/web/lib/motion.ts`)
| Preset | Value | Use |
|---|---|---|
| `spring.ui` | stiffness 300, damping 30 | default UI |
| `spring.snappy` | 500 / 32 | press, chips |
| `spring.soft` | 180 / 26 | panels, hero |
| `ease.out` | `cubic-bezier(.22,1,.36,1)` | entrances |
| `duration` | micro .15s · panel .28s · page .6s | |
| Variants | `fadeUp`, `fadeIn`, `scaleIn`, `listItem`, `stagger()` | |
| Interaction | `liftHover` (cards), `pressable` (buttons) | |
| CSS keyframes | `animate-sweep`, `animate-aurora-drift`, `animate-shimmer` | GPU-only, reduced-motion safe |

## Buttons
All pills (`rounded-full`). `default` solid `--primary-solid` #5B3FE0 + white (AA both themes) · `aurora` transformation/AI only · `contrast` ink pill · `premium` flare, upsell only · `secondary`/`outline`/`ghost`/`glass`/`destructive`/`link`.
