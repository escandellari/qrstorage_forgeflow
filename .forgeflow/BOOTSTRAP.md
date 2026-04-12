# Bootstrap Constraints

These inputs came directly from the user during /init.
Treat them as binding unless the user explicitly changes them later.

## Locked Inputs Captured During /init
- Product name: qr_noprd
- Preferred stack/ecosystem: Current stack decision:- Frontend: Next.js App Router- Hosting: Vercel Hobby- Database: Supabase Postgres- Auth: Supabase Auth magic link email- Security: Supabase RLS- Search: Postgres full-text search via .textSearch()- QR generation: qrcode.react with <QRCodeSVG>- Printing: window.print() plus @media print on a dedicated print route
- Preferred app/runtime framework, starter, or delivery approach: Preferred framework and delivery approach:- App/runtime framework: Next.js with App Router- Delivery: hosted web app- Hosting/deployment: Vercel Hobby- Backend/data/auth: Supabase for Postgres, Auth, and RLSThis is a one-stop hosted stack intended to deliver a polished, household-scale MVP with low setup and low operational overhead.
- Exact bootstrap/tooling inputs to preserve: Yes. These exact tooling inputs should be preserved:- Next.js with App Router- Supabase Postgres- Supabase Auth using magic link email- Supabase RLS- Vercel Hobby for hosting- Postgres full-text search via Supabase .textSearch()- qrcode.react v4.2.0 using <QRCodeSVG> client-side- window.print() with @media print CSS on a dedicated print routeAlso preserve these delivery constraints from the PRD:- web app only- mobile-friendly browser experience- cloud-hosted- no native mobile app- no offline support- no AI features in MVP- low login friction
- Testing baseline: Recommended baseline:- Vitest + Testing Library for unit/component tests- Playwright for end-to-end tests- Supabase integration tests at the DB/API boundary where needed
- Hosting/deployment target: Hosting/deployment target:- Vercel Hobby for the Next.js app- Supabase for hosted database, auth, and RLSThis is a hosted web app deployment, not self-hosted and not a native mobile app.
- Preferred libraries/providers to use or avoid: Preferred to use:- Next.js App Router- Supabase for Postgres, Auth, and RLS- Vercel for hosting- Postgres full-text search via Supabase .textSearch()- qrcode.react v4.2.0 with <QRCodeSVG>- window.print() with @media print CSS for printingPreferred to avoid, based on PRD and stack decisions:- native mobile frameworks- offline-first tooling- AI/ML libraries- photo upload/storage libraries for MVP- heavy enterprise auth/account-management systems- subscription/billing providers
- Integrations/constraints: External integrations:- Supabase for database, auth, and RLS- Vercel for hosting/deployment- email delivery for Supabase Auth magic links- no other required external integrations are definedHard constraints:- web app only- mobile-friendly browser experience- no native mobile app- internet required; no offline support- cloud database- no photos in MVP- no AI features in MVP- no import/export in MVP- no subscriptions- low login friction- QR code must contain a URL to the box page, not images or embedded box data

## Rules For Later Pipelines
- PRD.md may summarise these choices in prose, but must not silently remove, weaken, or replace them.
- Issue creation must carry relevant locked inputs into the initial scaffold/bootstrap issue and any later setup-sensitive issues.
- If the user provided an exact starter/template identifier, package manager choice, scaffold command, versioned tooling choice, or explicit use/avoid constraint, preserve it exactly where relevant.
