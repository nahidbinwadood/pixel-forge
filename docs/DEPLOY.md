# Deploying to Vercel

PixelForge runs on Vercel as a single Next.js app. It has no separate worker and no Redis (ASSUMPTIONS D-V1):
- **Uploads and AI jobs** run after the response, inside the same function, using `after()` (`lib/jobs/run.ts`).
- **Crons** are Vercel Cron Jobs that call `/api/cron/*` (`apps/web/vercel.json`).
- **Rate limits** are stored in Postgres (`lib/rate-limit.ts`).

## What you need
| Service | Used for | Free option |
|---|---|---|
| Vercel | web app, functions, crons | Hobby |
| Postgres | everything | **Neon**, via Vercel → Storage → Neon, which sets `DATABASE_URL` + `DATABASE_URL_UNPOOLED` |
| S3-compatible storage | uploads, AI outputs, thumbnails | **Cloudflare R2** (10 GB free, no egress fees) |
| Gemini key | AI tools | Google AI Studio |
| SMTP | email | Gmail app password, Brevo, Resend SMTP, … |

## One-time setup
1. **Push the repo to GitHub**, then go to Vercel → *Add New Project* and import it.
2. **Set the Root Directory to `apps/web`.** Leave "Include files outside the root directory" on, which is the default, because the workspace packages live in `packages/`. Vercel reads `apps/web/vercel.json` for the install and build commands and the crons.
3. **Create the database.** In the project, go to *Storage → Create → Neon* and connect it to all environments.
4. **Set up R2.** Create two buckets, `pixelforge-uploads` and `pixelforge-public`, plus an API token with Object Read & Write. Add a CORS rule on `pixelforge-uploads` so the browser can upload directly:
   ```json
   [{ "AllowedOrigins": ["https://<your-app>.vercel.app"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```
5. **Add the environment variables** under *Settings → Environment Variables* (the full list with comments is in `.env.example`):
   | Variable | Value |
   |---|---|
   | `APP_URL` | `https://<your-app>.vercel.app` |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `CRON_SECRET` | `openssl rand -hex 32` |
   | `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
   | `S3_REGION` | `auto` |
   | `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | R2 token |
   | `S3_BUCKET_UPLOADS` / `S3_BUCKET_PUBLIC` | bucket names |
   | `PUBLIC_ASSET_BASE_URL` | R2 public bucket URL (r2.dev or custom domain) |
   | `AI_PROVIDER` / `GEMINI_API_KEY` | `gemini` / your key |
   | `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASS` `EMAIL_FROM` | your SMTP creds |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1` (makes Vercel use the repo's pinned pnpm 11) |

   Everything else (Stripe, Google OAuth, Sentry, PostHog, Unsplash) is optional. Leave it unset and that feature degrades honestly.
6. **Deploy.** Production builds run `prisma migrate deploy` on the unpooled URL before `next build`. Preview builds skip migrations, so a branch can never change the production schema.
7. **Seed the starter data once,** from your machine: `DATABASE_URL=<neon unpooled url> pnpm db:seed`.
8. **Make yourself an admin:** sign up, then run `UPDATE "User" SET role = 'admin' WHERE email = '<you>';` in the Neon SQL editor.

## After deploy: check
- `https://<app>/api/v1/health` returns `{"status":"ok"}`.
- As an admin, `/admin/health` shows Postgres, storage and background jobs as up.
- Upload an image: it should show a thumbnail within a few seconds. If it fails, the R2 CORS rule is the usual cause.
- Run one AI tool. With `AI_PROVIDER=gemini`, this is the first live Gemini run.
- Vercel → *Settings → Cron Jobs* lists 3 jobs. Use *Run* on `cleanup` to test it.

## Limits to know
- **Hobby plan:** functions run up to 300 s, so an AI job must finish within that or it is refunded automatically. Crons run at most once a day, which is why `cleanup` is daily and not hourly. Hobby is also non-commercial; use Pro to charge money.
- A function that dies mid-job is not retried by a queue. The job is failed and refunded on the next status poll, or by the daily cleanup. Move to a real queue (Vercel Queues or Inngest) if jobs get longer.
- The request body limit is 4.5 MB. User uploads go straight to R2 through presigned URLs, so they are not affected.

## Local development
Unchanged apart from the worker: `pnpm db:up && pnpm db:migrate && pnpm dev`. Docker now runs only Postgres and SeaweedFS. To test a cron locally:
```
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/cleanup
```
