# PRD: qr_noprd

## Product Summary
qr_noprd is a mobile-friendly web app for managing physical storage boxes with QR labels. Users create boxes, print a label for each one, scan labels to open the correct box page, update contents quickly from a phone, and search the shared inventory without browsing box by box.

## Problem & Users
The product serves a household or small team that needs a simple way to track what is stored in physical boxes. It reduces the friction of finding, identifying, and updating stored items by linking each box to a scannable QR label and a dedicated box page.

## Goals
The MVP must support the full core journey from box creation to label printing, scanning, viewing, editing, and search. It must feel fast and simple on mobile, stable enough for daily use, and polished enough for regular household or small-team use.

Success means users can create a box, receive a unique box ID and QR-backed box page, print a clean label suitable for attaching to the box, scan the label and open the correct box page, view and edit box contents immediately, and search inventory across box and item information.

## Non-Goals
The MVP excludes a native mobile app, offline support, photos, AI features, import or export, enterprise account management, subscriptions, archiving, soft-delete recovery, bulk edits, specialist print tooling, PDF label generation, typo-tolerant search, and item history.

## MVP User Journey
A user creates a box in the web app. The system assigns a unique box ID within the shared workspace and generates a QR label for that box. The user prints the label and attaches it to the physical box. Later, they scan the label on a phone, open the box page in the browser, review the contents, and make updates straight away.

## Functional Requirements
The MVP must support the primary journey end to end and keep validation, success states, empty states, and access states clear.

### Boxes
Users can create boxes, edit box details, rename boxes, and delete boxes when no longer needed. Each box must have a fixed, user-visible ID in the BOX-0001 format, unique within its shared workspace. IDs must remain unique and must not be reassigned after deletion.

Each box stores the information needed to identify and manage it, including its ID, name, location, notes, label target, and item list.

If a previously valid box URL is opened after that box has been deleted, the app must show a specific deleted-box message rather than a generic access-denied state. The message must make clear that the box no longer exists, that its ID will not be reused, and must offer a path back to search or the box list.

### Items
Within a box, users can add item entries, edit item details, adjust quantities, and remove items. Item data must support quick identification of what is stored in the box.

### QR Labels and Printing
The app must generate a scannable QR label for every box. The QR code must resolve to that box's URL. Users must be able to open a dedicated, print-friendly label view from the box page and print a clean label suitable for attaching to a physical box.

The printed label must include the QR code, the box ID, and the box name when one has been set. The MVP supports one standard printable label layout, optimised for common home or office printer paper. If a user cannot print immediately, the box is still saved and they can return later to the print view.

Printing for MVP is browser-native. The product uses a dedicated print-friendly route and standard browser printing so users can print directly from the label view without extra export steps or specialist print workflows.

### Search
Search must return both matching boxes and matching items within boxes. Searchable information must include box ID, box name, location, box notes, item name, item category, item notes, and quantity where useful for matching.

MVP search uses simple full-text matching across those fields. It does not need typo tolerance for MVP. Results must rank stronger box-level matches above weaker item-level matches while still surfacing item matches clearly. Each result must show the box name, box ID, location, and the specific matched item or field, and allow the user to open the box page in one tap. Where relevance is otherwise similar, results should be ordered predictably by best match first and then by box ID.

### Shared Workspace and Access
The MVP supports one shared workspace per household or small team. One user creates the workspace and can invite other members by email. Invited users join through the sign-in flow and, once accepted, can view, create, and edit all boxes and items in that shared inventory.

Invitations must be bound to the invited email address. If the signed-in account does not match the invited email, the app must explain the mismatch and require the user to switch accounts or sign in with the invited email before joining. If an invite has already been accepted, or the invited person already belongs to the workspace, the invite link should show a simple confirmation state and route the user into the workspace rather than failing. If an invite has expired, the app must show a clear expired-invite screen and tell the user they need a fresh invitation from the workspace owner.

Users can leave a workspace themselves. The workspace owner can remove members. Once a user leaves or is removed, access to that workspace, its inventory, and its box URLs is denied.

### Authentication and QR Scan Access
Authentication must favour low login friction. When a signed-out user opens a box URL from a QR scan, the app must prompt for sign-in immediately and return them to that box page after successful authentication.

If the user is already signed into an account with access, the box page opens directly. If the user is signed into the wrong account or an account without access, the app must show an access-denied screen for that box, provide a clear path to switch account or sign in again, and grant access only after authentication with an authorised workspace member account. Access-denied is reserved for users who lack permission to an existing box.

### Performance and Reliability
On a typical household connection, opening a box page and returning search results should normally feel near-instant, with a target of a few seconds at most. The service must be stable enough for everyday use, with failed loads and lost edits remaining rare exceptions.

## Technical Direction
Project type: Hosted web app with a mobile-friendly browser experience.

App framework and hosting: Next.js App Router deployed on Vercel Hobby.

Persistence approach: Supabase Postgres stores boxes, items, workspace membership, and related persistent data.

Authentication and session approach: Supabase Auth with email magic-link sign-in.

Access control: Supabase Row Level Security enforces workspace-level access to boxes, items, and box URLs.

Search approach: Postgres full-text search through Supabase is the MVP search mechanism across the defined box and item fields.

QR generation approach: QR labels are generated client-side with qrcode.react v4.2.0 and rendered as SVG for the box URL.

Print delivery approach: Printing uses a dedicated print-friendly route and browser-native print styling for standard home or office printers.

Testing baseline: Vitest and Testing Library for unit and component coverage, Playwright for end-to-end coverage, and integration testing where needed around data and access boundaries.

## Alternatives Considered
Authentication alternatives considered: heavier account-management approaches were rejected in favour of lower-friction magic-link sign-in.

Search alternatives considered: a separate search service was rejected for MVP in favour of the hosted database search already available in the chosen stack.

QR and print alternatives considered: server-generated QR images, PDF generation, and specialist print tooling were rejected because they add complexity without improving the core household MVP.

Delivery alternatives considered: self-hosted, native mobile, and offline-first approaches were rejected for MVP in favour of a lower-ops hosted web app.

## Delivery Constraints
The product is web-only, cloud-hosted, and intended for mobile browser use. Internet access is required. QR labels must open box URLs rather than store embedded box data or images.