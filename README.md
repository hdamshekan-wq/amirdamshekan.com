This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Authentication configuration

Set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS origin of the environment
(for example, `https://your-preview.example.com`). Signup and password reset
email links use this configured origin; request Origin/Host headers are not
trusted. Missing or invalid configuration fails closed in production. Local
development defaults to `http://localhost:3000` and permits explicit local HTTP
origins. Configure the corresponding `/auth/callback` URL in Supabase's redirect
allow list. See https://supabase.com/docs/guides/auth/redirect-urls.

Run `npm run test:auth` with Node 22.18+ (Node 24 recommended). These tests cover
redirect validation and the actual auth actions/callback with mocked Supabase
calls. They do not send email or verify a live authentication session.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
