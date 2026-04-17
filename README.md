# qrstorage_forgeflow

Mobile-friendly web app for managing physical storage boxes with QR labels. Users create boxes, print labels, scan QR codes to access box contents, and search inventory across boxes.

App created entirely using [forgeflow](https://github.com/CallumVass/forgeflow).

```text
idea -> /init -> optional bootstrap issue -> /implement -> /continue -> /implement-all
```

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Vercel account (free tier available, for deployment)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project settings > API.

## Running the App

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm start
```

## Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# Type check + tests
npm run check
```

## Deployment

### Supabase Setup (Free Tier)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Navigate to project settings > API
4. Copy `Project URL` and `anon public` key
5. Go to SQL Editor and run database schema migrations (if provided)
6. Configure authentication:
   - Settings > Authentication > Providers
   - Enable Email provider with magic link

### Vercel Deployment (Free Tier)

1. Create account at [vercel.com](https://vercel.com)
2. Install Vercel CLI (optional):

```bash
npm i -g vercel
```

#### Deploy via CLI:

```bash
vercel
```

#### Deploy via Dashboard:

1. Import Git repository
2. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Your app will be live at `your-project.vercel.app`

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Supabase (auth & database)
- TypeScript
- Vitest (unit tests)
- Playwright (E2E tests)
