# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There is no test runner configured yet.

## Architecture

**4Play Arena — Hora Carteira** is a tennis lesson hour-credit management system. Students hold an hour balance that is consumed when attending classes. Consumption is calculated from three factors: professor, student plan, and time of day.

### Business Rules

- Each professor has a base consumption rate (e.g., Paulinho: 0.90h, Marília: 1.35h)
- Off-peak discount: ×0.95 for classes before 6 pm or after 8 pm
- Rounding: Marília always rounds **up** (ceiling); all other professors use standard rounding
- Level gate: student level must be ≥ class level to check in
- Check-in window: T−24h for enrolled students; T−6h open to any eligible student

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) — see AGENTS.md note |
| Database / Auth | Supabase (PostgreSQL + JWT + RLS) |
| Styling | Tailwind CSS v4 + shadcn/ui (radix-nova style, zinc base) |
| Validation | Zod |
| Forms | React Hook Form |
| Server state | TanStack Query |
| Icons | lucide-react |

### Planned Directory Layout

```
app/
  (auth)/          # Login, password recovery (unauthenticated routes)
  (dashboard)/     # Protected student area
  api/             # API routes (check-in, debit, wallet)
components/
  ui/              # shadcn/ui components (add via: npx shadcn add <component>)
  shared/          # Header, sidebar, lesson cards
core/
  math/            # Hour consumption calculators (pure, testable)
  constants/       # Professor pricing tables
  entities/        # Zod schemas — Wallet, Lesson, Professor
features/
  wallet/          # Consumption history, plan purchases
  booking/         # Check-in logic, level filtering
  profile/         # Student level management
lib/
  supabase/        # Supabase client (browser + server configurations)
types/             # Global TypeScript types
utils/             # Date, currency formatters
```

Business logic must live in `core/math/` — isolated from React and Next.js so it stays pure and testable.

### Key Utilities

- `lib/utils.ts` — exports `cn()` (clsx + tailwind-merge) for safe class composition
- `components/ui/button.tsx` — CVA-based Button with variant/size props; use `asChild` for polymorphism

### Tailwind CSS v4 Notes

- No `tailwind.config.*` file — configuration is done inside `app/globals.css` via `@theme {}` blocks
- Design tokens use OKLch color space; dark mode via `.dark` class
- Import new components with `@import` syntax, not `@tailwind` directives
