# NostaLink

A nostalgic social network combining classic Friendster and old Facebook features.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Supabase** (Auth, Database, Realtime, Storage)
- **Tailwind CSS v4**
- **Vercel** (Deployment)

## Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```