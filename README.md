# Cognity — AI Compliance Training

**Track: AI Enterprise Solutions.** One workflow, end to end:

> HR uploads a company policy → AI drafts a compliance assessment → employees take it → AI grades every answer against a rubric → the manager sees compliance coverage and hours saved.

**Adoption metric:** hours of L&D work saved per compliance cycle (question authoring + open-answer grading), with compliance coverage % as the adoption signal. Both are computed live on the manager dashboard.

## The workflow

1. **Upload** — Manager uploads a PDF/TXT/Markdown policy or pastes the text.
2. **Generate** — DeepSeek drafts 6 grounded questions (multiple choice, true/false, written) with model answers, grading rubrics, and a rationale citing the policy section.
3. **Publish & assign** — One click publishes the assessment and assigns it to every employee, with a due date.
4. **Take** — Employees answer in a clean assessment UI. Multiple choice is checked instantly.
5. **Grade** — Written answers are graded by AI against the rubric, with per-answer feedback and a confidence level for audit review.
6. **Report** — Managers see coverage, pass rate, average score, pending employees, and hours saved. Every AI grade keeps its feedback and confidence so an auditor can review any decision.

## Stack

- **Next.js 16** (App Router, Server Actions) — no separate backend
- **Neon Postgres** + **Drizzle ORM** (`pg` driver, works locally and on Neon)
- **DeepSeek** via **Vercel AI SDK** (`generateObject` + Zod schemas)
- **shadcn/ui** + Tailwind CSS v4
- Session auth: bcrypt + signed JWT (`jose`) in an httpOnly cookie

## Getting started

### 1. Environment

Create `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.<region>.aws.neon.tech/cognity?sslmode=require"
DEEPSEEK_API_KEY="sk-..."
AUTH_SECRET="$(openssl rand -base64 32)"
```

- `DATABASE_URL` — Neon connection string (pooled endpoint works).
- `DEEPSEEK_API_KEY` — from https://platform.deepseek.com.
- `AUTH_SECRET` — any random 32-byte base64 string.

### 2. Database

```bash
npm install
npm run db:push   # create tables
npm run db:seed   # demo accounts, policy, published assessment, graded attempts
npm run dev
```

Open http://localhost:3000.

### 3. Demo accounts

| Role | Email | Password |
|---|---|---|
| Manager | `manager@cognity.demo` | `demo1234` |
| Employee | `employee@cognity.demo` | `demo1234` (pending assignment) |

The login page has one-click demo buttons. The seed also includes 5 more employees, 4 graded attempts (incl. one failing), and one published assessment so dashboards look real before the live demo.

## Demo script (~4 minutes)

1. Sign in as **Manager** → dashboard: coverage, pass rate, average score, **hours saved**, AI audit trail.
2. **Policy documents** → *Use sample policy* → **Generate assessment** (~30–60 s).
3. Review questions, rubrics, and AI rationale → **Publish** → **Assign to all employees**.
4. Sign in as **Employee** → **Start assessment** → answer → **Submit for grading**.
5. Result page shows score, pass/fail, per-answer AI feedback and confidence.
6. Back on the manager dashboard: coverage and hours saved have moved.

If the live AI call is slow on stage, the seeded assessment and results are the fallback — the full review and reporting flow works without generating anything.

## Neon CLI and object storage

The repo is linked to a Neon project via the Neon CLI (`.neon`, gitignored). The object-storage policy — a private `uploads` bucket for future attachments and certificates — is declared as code in `neon.ts` and applied with:

```bash
neon deploy
```

`neon link` pulls `DATABASE_URL`, the unpooled URL, and S3-compatible storage credentials into `.env.local` automatically. The app currently stores only extracted document text in Postgres, so uploads are optional.

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repo at https://vercel.com/new.
3. Add the three environment variables from `.env.local`.
4. Deploy. Run `npm run db:push` + `npm run db:seed` locally against the Neon database (or point `DATABASE_URL` at Neon) before the demo.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run typecheck  # Next typegen + tsc
npm run lint       # eslint
npm run db:push    # sync Drizzle schema to DATABASE_URL
npm run db:seed    # reset + seed demo data
```

## Project structure

```
src/
  app/
    (app)/             # authenticated shell (sidebar, header)
      manager/         # dashboard, assessments review, policy documents
      employee/        # my training, take assessment
      results/         # AI-graded answer review
    login/             # credentials + one-click demo login
  components/          # shared UI (design-system primitives + app shell)
  db/                  # Drizzle schema, client, seed
  lib/
    ai/                # DeepSeek question generation and grading
    queries.ts         # server-side data access
    metrics.ts         # hours-saved and coverage calculations
    session.ts         # JWT session helpers
```

## Notes

- Files are parsed with `unpdf` (PDF) or plain text; extracted text is stored in Postgres. Object storage is intentionally not required.
- If the AI grader is unavailable, written answers fall back to keyword-based scoring marked **low confidence** instead of failing the submission.
- Scoring: objective answers are graded deterministically against the answer key; written answers by AI with partial credit against the rubric.
