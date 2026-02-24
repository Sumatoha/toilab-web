# ToiLab Web - Project Documentation

## Overview

ToiLab is a wedding and event planning platform for Central Asian market. The name comes from "Toi" (той) meaning celebration/wedding in Kazakh.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Data Fetching**: @tanstack/react-query
- **Icons**: lucide-react
- **Notifications**: react-hot-toast
- **Dates**: date-fns
- **PDF Export**: jspdf + html2canvas

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/              # Auth pages
│   ├── dashboard/          # Main app
│   │   ├── events/
│   │   │   ├── [id]/       # Event pages
│   │   │   │   ├── budget/
│   │   │   │   ├── calendar/
│   │   │   │   ├── checklist/
│   │   │   │   ├── gifts/
│   │   │   │   ├── guests/
│   │   │   │   ├── invitation/
│   │   │   │   ├── program/
│   │   │   │   ├── seating/
│   │   │   │   ├── settings/
│   │   │   │   └── vendors/
│   │   │   └── new/
│   │   └── settings/
│   └── share/[token]/      # Public share pages
├── components/
│   ├── layout/             # Header, EventSidebar
│   ├── providers.tsx       # React Query provider
│   └── ui/                 # Reusable components
├── hooks/
│   └── use-auth.ts
└── lib/
    ├── api.ts              # API client
    ├── store.ts            # Zustand store
    ├── types.ts            # TypeScript types
    └── utils.ts            # Helper functions
```

## Backend API

Backend is a separate Go project at `/Users/a1/Desktop/merei/toilab-api`

- **Framework**: Gin
- **Database**: MongoDB
- **Auth**: JWT tokens
- **Deployment**: AWS Lambda

API base URL is set in `.env.local` / `.env.production`

## Key Concepts

### Event Types
- `wedding` - Свадьба (with templates for Bata, Betashar for Central Asia)
- `sundet` - Сүндет той
- `tusau` - Тұсау кесу
- `birthday` - День рождения
- `anniversary` - Юбилей
- `corporate` - Корпоратив

### Countries & Localization
```typescript
type Country = "kz" | "ru" | "kg" | "uz" | "other";
```

Central Asian countries (kz, kg, uz) get:
- Kazakh traditions in wedding templates (Bata, Betashar)
- көрімдік (korіmdіk) gift tradition
- Local example names (Айдар и Дана)
- Local cities (Алматы, Бишкек, Ташкент)

Russia/other get:
- Universal wedding templates
- Example names (Иван и Мария)
- Moscow as default city

### Currencies
| Country | Symbol | Name |
|---------|--------|------|
| kz | ₸ | Тенге |
| ru | ₽ | Рубль |
| kg | сом | Сом |
| uz | сум | Сум |
| other | $ | Доллар |

## Code Conventions

### File Naming
- Components: PascalCase (`StatCard.tsx`)
- Pages: `page.tsx` (Next.js convention)
- Utils/libs: camelCase (`utils.ts`)

### CSS Classes
- Use Tailwind utility classes
- Custom component classes: `.card`, `.btn-primary`, `.btn-outline`, `.input`
- Size modifiers: `.btn-sm`, `.btn-md`, `.btn-lg`

### State Management
- Auth state in Zustand (`useAuthStore`)
- Server state with React Query
- Local component state with useState

### API Pattern
```typescript
// lib/api.ts exports API functions
import { events, guests, expenses } from "@/lib/api";

// Usage
const event = await events.get(id);
const guests = await guests.list(eventId);
```

### Currency Formatting
```typescript
import { formatCurrency } from "@/lib/utils";

// Pass user's country for correct currency
formatCurrency(amount, user.country);
```

### Country-aware UI
```typescript
import { isCentralAsian, getExampleNames, getDefaultCity } from "@/lib/utils";

if (isCentralAsian(user.country)) {
  // Show Kazakh traditions
}
```

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Environment Variables

```env
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8080

# .env.production
NEXT_PUBLIC_API_URL=https://api.toilab.kz
```

## Common Patterns

### Page with Data Loading
```typescript
"use client";

import { useState, useEffect } from "react";
import { events } from "@/lib/api";
import { Spinner } from "@/components/ui";

export default function Page({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    events.get(params.id)
      .then(setEvent)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) return <Spinner />;
  if (!event) return <div>Not found</div>;

  return <div>...</div>;
}
```

### Modal Pattern
```typescript
const [showModal, setShowModal] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);

// Open for create
<button onClick={() => setShowModal(true)}>Add</button>

// Open for edit
<button onClick={() => { setEditingItem(item); setShowModal(true); }}>Edit</button>

// Modal
{showModal && (
  <Modal onClose={() => { setShowModal(false); setEditingItem(null); }}>
    <Form item={editingItem} />
  </Modal>
)}
```

### Toast Notifications
```typescript
import toast from "react-hot-toast";

toast.success("Сохранено!");
toast.error("Ошибка: " + err.message);
```

## Language

Primary UI language is Russian with Kazakh elements for Central Asian users.
All user-facing text should be in Russian unless specifically for Kazakh traditions.

## Code Quality Principles

**ALWAYS follow best practices. Avoid hacks and workarounds. Write clean, extensible code.**

### Do's:
- Use React Portals for tooltips/modals that need to escape parent z-index/overflow
- Use proper TypeScript types, avoid `any`
- Use semantic HTML elements
- Extract reusable logic into custom hooks
- Keep components focused and single-purpose
- Use proper z-index scale (Tailwind's z-10, z-20, z-50) instead of arbitrary numbers
- Handle loading/error states properly

### Don'ts:
- No magic numbers like `z-index: 99999`
- No inline styles unless dynamic values are required
- No `!important` in CSS
- No suppressing TypeScript errors with `@ts-ignore`
- No deeply nested ternaries - extract to variables or components
- No copy-pasting code - extract to reusable functions/components

### Patterns to Use:
```typescript
// Portal for overlays (tooltips, modals, dropdowns)
import { createPortal } from "react-dom";

{showTooltip && createPortal(
  <Tooltip />,
  document.body
)}

// Compound components for complex UI
<Select>
  <Select.Trigger />
  <Select.Content>
    <Select.Item />
  </Select.Content>
</Select>

// Custom hooks for reusable logic
function useEventData(eventId: string) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // ...
  return { data, isLoading, refetch };
}
```

---

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to tasks/todo.md with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to tasks/todo.md
6. **Capture Lessons**: Update tasks/lessons.md after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
