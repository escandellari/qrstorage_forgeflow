# qrstorage — Design Brief

## What this app is

**qrstorage** is a mobile-first web app for managing physical storage boxes with QR labels.
Core journey: create a box → print a QR label → stick it on the box → scan it later from a phone → see and edit what's inside.

Target users: households and small teams. The app lives in storage rooms and hallways, opened mostly from a phone camera.

---

## Current tech stack

- Next.js App Router (React, TypeScript)
- No component library — all styling is inline styles + a small `globals.css`
- No Tailwind, no CSS modules, no design tokens yet

---

## Existing colour palette (keep all of these)

| Token name      | Hex       | Used for                        |
|-----------------|-----------|---------------------------------|
| Brand purple    | `#6a4bb6` | Primary buttons, links, accents |
| Purple border   | `#e9e2ff` | Card borders, dividers          |
| Purple input    | `#cfc5eb` | Input borders                   |
| Purple tint bg  | `#f7f5ff` | Page background gradient start  |
| Text dark       | `#1c1330` | Body text, headings             |
| Text muted      | `#4f4565` | Secondary / supporting text     |
| Error red       | `#b42318` | Error messages                  |
| White           | `#ffffff` | Card backgrounds                |

Background: `linear-gradient(180deg, #f7f5ff 0%, #ffffff 100%)` on `<body>`.

---

## Existing patterns (keep and extend these)

**White card** — used on sign-in and workspace-home:
```
background: #fff
border: 1px solid #e9e2ff
border-radius: 24px
padding: 32px 24px
box-shadow: 0 20px 45px rgba(108, 74, 182, 0.12)
max-width: 640px
```

**Primary button** — pill shape:
```
border-radius: 999px
background: #6a4bb6
color: #fff
font-weight: 700
min-height: 48px
width: 100%
```

**Text input**:
```
border-radius: 16px
border: 1px solid #cfc5eb
min-height: 48px
padding: 0 16px
width: 100%
```

**Eyebrow label** (small uppercase label above headings):
```
font-size: 0.875rem
font-weight: 700
letter-spacing: 0.08em
text-transform: uppercase
color: #6a4bb6
```

**Page heading**: `clamp(2rem, 8vw, 3.5rem)`, bold.

---

## Screens to design

Design all screens at **390 × 844 px** (iPhone 14 / standard mobile viewport).
Each screen should also work on desktop — cards centre at max-width 640px.

---

### 1. Sign-in (`/`)

**States:** default (email form) · submitting · sent (check your email)

Elements:
- Eyebrow: "Sign in"
- Heading: "qrstorage"
- Body: "Email yourself a magic link to get into your shared storage workspace."
- Email input + "Email me a sign-in link" button
- Error state inline below input
- Sent state: "Check your email" heading + confirmation message

---

### 2. Auth callback — loading / error

**States:** loading ("Completing sign-in…") · error (message + "Back to home" pill button)

Simple centred card, minimal content.

---

### 3. Workspace creation (`/auth/callback` — first-time user)

Elements:
- Heading: "Name your shared workspace"
- Supporting text
- "Workspace name" text input
- "Create workspace" pill button
- Inline error

---

### 4. Workspace home (post-login landing)

Elements:
- Eyebrow: "Workspace ready"
- Heading: "You are inside [workspace name]"
- Supporting text
- **"Go to dashboard"** primary CTA button → `/inventory`

---

### 5. Inventory / Dashboard (`/inventory`)

**Currently completely unstyled — needs the most design work.**

Elements:
- Page heading: "Inventory"
- Nav link: "Search inventory" → `/search`
- Invite member input + send button (inline form, `InviteSender`)
- "Create box" form: text input (box name, optional) + "Create box" button
- Box list: each item shows `boxId` (e.g. BOX-0001) + name — tappable, navigates to `/boxes/[boxId]`
- Empty state: "No boxes yet. Create your first box to get started."
- Error state: inline alert

Design notes:
- Box list items should be card rows or list rows — large tap target, box ID prominent, name as supporting text
- The create-box form could be a floating bottom bar or a top-of-list card
- Consider a sticky header with the workspace name and a search icon

---

### 6. Box details (`/boxes/[boxId]`)

**Currently unstyled — needs clear visual hierarchy.**

Elements:
- Heading: box ID (e.g. BOX-0001)
- **Nav**: "Back to inventory" link + "Open label view" link + "Delete box" button
- **Saved details section**: name, location, notes, label target — displayed as a summary card (not a form)
- **Edit form**: same four fields as inputs + "Save box details" button
- **Items panel** (below): see screen 7
- Error state: inline alert

Design notes:
- Split saved details (read view) and edit form visually — e.g. summary card collapses or sits above the form
- "Delete box" should be destructive-red or at minimum visually de-emphasised
- "Back to inventory" should feel like a back button (← arrow, top-left)

---

### 7. Box items panel (embedded in box details)

Elements:
- Section heading: "Box items"
- Item list rows: item name (bold, prominent) + quantity badge + category + notes
- Per-item: "Edit [name]" + "Remove [name]" actions (small, secondary)
- Add / edit item form: name (required), quantity, category, notes inputs + "Add item" / "Save item" button
- Empty state: "No items yet."
- Loading state: "Loading items…"
- Error state: inline alert

Design notes:
- Item rows should be compact — optimised for scanning a list quickly on mobile
- Quantity should be a small badge (pill, purple tint) on the right side of the row
- Edit and remove should be accessible but visually quiet (text links or icon buttons)

---

### 8. Search (`/search`)

**Currently completely unstyled.**

Elements:
- Page heading: "Search"
- Search input + "Search" button
- Results list: each result is a card with box ID + name (title), location (subtitle), matched context snippet (body text), tappable → `/boxes/[boxId]`
- Empty state: "No search results found."
- Error state: inline alert

Design notes:
- Search input should be prominent — full-width, large, top of page
- Results should feel like a list of scannable cards, not a table
- The matched context snippet (what field matched) should be visually distinct — e.g. slightly muted, italic, or with a highlight

---

### 9. QR label / print view (`/boxes/[boxId]/label`)

**This screen is already styled — preserve it, just refine if needed.**

Elements:
- "Print label" button (top-right, outline pill — hidden on print)
- Label card: QR code + box ID + box name
- Print styles already strip all chrome — just the label card on paper

Design notes:
- The label card should look good both on screen and printed
- QR code: 280px max-width
- Keep it centred, minimal, black-and-white print safe

---

### 10. Deleted box (`/boxes/[boxId]` — retired box)

**Currently completely unstyled.**

Elements:
- Heading: "[boxId] was deleted"
- Body: "This box no longer exists. Its box ID will not be reused."
- Nav: "Back to inventory" + "Search inventory"

Design notes: should feel like a clear dead-end state, not an error. Calm, informative.

---

### 11. Invite acceptance / error states

Various states for the invite flow (wrong account, already accepted, expired). Each is a centred card with a heading, body copy, and one CTA button. Follow the same card pattern as sign-in.

---

## Component library to define

Define reusable components for all of the above:

| Component | Notes |
|---|---|
| `Card` | White, purple border, 24px radius, shadow — the base container |
| `PageShell` | Centred layout, gradient bg, padding |
| `Eyebrow` | Uppercase purple label |
| `PrimaryButton` | Pill, purple fill, full-width or auto |
| `SecondaryButton` | Pill, purple outline, white fill |
| `DestructiveButton` | Pill, red — for delete actions |
| `TextInput` | Rounded, purple border |
| `TextArea` | Same as TextInput, multiline |
| `InlineError` | Red alert text |
| `BackLink` | ← arrow + label, top-left nav |
| `SectionHeading` | h2 style within cards |
| `ItemRow` | Compact list row with quantity badge |
| `BoxRow` | Tappable list row for inventory |
| `SearchResultCard` | Box name + location + context snippet |
| `EmptyState` | Centred message, optional icon/illustration |
| `LoadingSkeleton` | Placeholder rows while loading |
| `Badge` | Small pill — quantity, status |

---

## Spacing scale

Use multiples of 4px:

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`

---

## Typography

Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`

| Role | Size | Weight |
|---|---|---|
| Page heading | `clamp(2rem, 8vw, 3.5rem)` | 700 |
| Section heading | `1.5rem` | 700 |
| Body | `1rem / 1.6` | 400 |
| Supporting | `1rem / 1.6` | 400, muted `#4f4565` |
| Label / eyebrow | `0.875rem` | 700, uppercase, tracked |
| Small / meta | `0.875rem` | 400 |
| Error | `0.95rem` | 400, red `#b42318` |

---

## Mobile-first rules

- All tap targets min 48px tall
- Inputs full-width on mobile
- Primary actions at the bottom of forms (thumb reach)
- No hover-only interactions
- Touch-friendly spacing between interactive elements (min 8px gap)

---

## What NOT to add

- Dark mode
- Complex animations or transitions
- Modal dialogs or bottom sheets requiring JS
- Any new brand colours outside the palette above
- Native mobile app patterns (tabs, native nav bars)
- PDF export or specialist print tooling
