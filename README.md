# JobPortal — MERN Stack Job Portal with AI Resume Matcher

A full-stack job portal built as a portfolio project. Candidates can browse and search jobs, apply with a cover letter, and track application status. Recruiters can post and manage jobs, review applicants, and move them through a hiring pipeline. JWT authentication, role-based access control, validation, pagination, and production hardening are included.

Stage 7 adds resume upload, automatic skill extraction, explainable match scores, personalised job recommendations, and ranked applicants. Matching works offline by default; an OpenAI provider can be enabled with one environment variable.

Stage 8 adds an automated test suite: Jest + Supertest exercise the Express API against an isolated MongoDB database, and Vitest + React Testing Library verify the frontend helpers, components, and route guards.

The UI also has a persisted light/dark theme (system preference is the default), and resumes can be uploaded as PDF, Word, JPG/PNG/WebP or plain text — images and scanned PDFs are read with on-device OCR.

---

## Features

| Area | What works |
|---|---|
| Auth | Register, login, `/auth/me`, JWT in `localStorage`, bcrypt password hashing, session restore on refresh |
| Roles | `candidate` and `recruiter`, enforced on the backend with `restrictTo()` and on the frontend with `ProtectedRoute` |
| Jobs | Full CRUD, ownership checks, `?keyword=` text search with weights, filters (location, skills, type, work mode, experience, salary), whitelisted sort, pagination |
| Applications | Apply once per job (unique index), deadline check, "my applications", applicant list with status filter, status updates, delete cascade; once shortlisted/hired there is no apply action, and a rejected application can be reapplied |
| AI matching | Resume text upload/paste, 100+ skill aliases, weighted score (skills 60 / experience 20 / role 20), matched + missing skills, recommended jobs, ranked applicants, optional OpenAI provider with local fallback |
| UX | Role-aware navigation, loading states, empty states, inline + server validation errors, URL-based filters |
| Production | Helmet security headers, rate limiting, gzip compression, explicit index sync, graceful shutdown, Docker + nginx, health check |

---

## Tech stack

**Backend:** Node.js, Express 4, MongoDB, Mongoose 8, JWT, bcryptjs, express-validator, cors, helmet, express-rate-limit, compression, dotenv — ES Modules throughout.

**Frontend:** React 19, Vite 6, React Router 7, Axios, Tailwind CSS 4.

**Infrastructure:** Docker, nginx, docker-compose; MongoDB Atlas + Render + Vercel for cloud deployment.

---

## Architecture

The backend follows a simple layered structure so controllers stay small and business rules are reusable:

```
Request → route → validators → middleware (auth / role / ownership) → controller → model → MongoDB
                                                                          ↓
                                                          ApiError → central errorHandler
```

```text
jobportal/
├── docker-compose.yml              # Full local stack: Mongo + backend + frontend
├── package.json                    # single `npm test` command for both projects
├── README.md
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── jest.config.js              # native-ESM Jest config
│   ├── tests/                      # API tests against an isolated test DB
│   │   ├── setup.js                # forces test DB/secret before env.js loads
│   │   ├── helpers.js              # DB lifecycle + request factories
│   │   ├── auth.test.js
│   │   ├── jobs.test.js
│   │   └── applications.test.js
│   └── src/
│       ├── app.js                  # Middleware pipeline + route mounting
│       ├── server.js               # Listen, graceful shutdown
│       ├── constants.js            # Shared enums and whitelists
│       ├── config/
│       │   ├── env.js              # Env validation, single config object
│       │   └── db.js               # Mongo connection + production index sync
│       ├── controllers/            # Request handling; throw ApiError
│       │   ├── application.controller.js  # + ranked applicant listing
│       │   ├── job.controller.js          # + recommended jobs
│       │   └── resume.controller.js        # GET/PUT/DELETE + single-job match
│       ├── middleware/             # auth, ownership, validation, errors, rate limits
│       │   └── rateLimit.middleware.js     # includes matchLimiter (30 / 15 min)
│       ├── models/                 # Mongoose schemas + indexes
│       │   └── User.js                    # + embedded resume subdocument
│       ├── routes/                 # URL → middleware → controller
│       │   ├── application.routes.js      # + /job/:jobId/ranked
│       │   ├── job.routes.js              # + /recommended
│       │   ├── resume.routes.js            # /api/resume
│       │   └── index.js                    # mounts all four routers
│       ├── services/               # Reusable business logic
│       │   ├── matching.service.js         # profiles, recommendations, ranking
│       │   └── matching/                   # provider-based scoring engine
│       │       ├── index.js                # provider selection + fallback
│       │       ├── skillLexicon.js         # 100+ canonical skills and aliases
│       │       ├── localProvider.js        # deterministic weighted scorer
│       │       └── openaiProvider.js       # optional LLM scorer
│       ├── utils/                  # ApiError, asyncHandler, token, pagination, pick, etc.
│       └── validators/             # express-validator rules
│           └── resume.validator.js  # resume text, file name, limit/status filters
└── frontend/
    ├── Dockerfile
    ├── nginx.conf                  # SPA fallback + asset caching
    ├── .env.example
    ├── vite.config.js              # Vite build config
    ├── vitest.config.js            # jsdom test config (separate from build)
    ├── vercel.json                 # SPA rewrite for React Router
    └── src/
        ├── api/                    # axios client + service functions
        │   ├── client.test.js      # error-message helpers
        │   └── services.js         # + resumeService and matchService
        ├── components/             # Reusable UI + route guards
        │   ├── MatchScore.jsx      # coloured score badge
        │   ├── MatchDetails.jsx    # explanation + breakdown + skill lists
        │   ├── ApplyButton.jsx     # quick-apply action on job cards
        │   ├── ApplyButton.test.jsx
        │   ├── MatchScore.test.jsx
        │   ├── ProtectedRoute.test.jsx
        │   ├── ThemeToggle.jsx     # light/dark switch in the navbar
        │   ├── ThemeToggle.test.jsx
        │   ├── JobCard.jsx         # now shows optional match badge
        │   └── Layout.jsx          # nav + theme toggle
        ├── context/                # AuthContext + ThemeContext
        ├── hooks/                  # useApplicationStatuses (job-card apply state)
        ├── pages/                  # Route screens
        │   ├── HomePage.jsx             # minimal responsive landing page
        │   ├── ResumePage.jsx           # upload / paste / save / delete
        │   ├── ResumePage.test.jsx
        │   ├── RecommendedJobsPage.jsx  # ranked job list
        │   ├── JobDetailPage.jsx        # candidate match panel
        │   └── ApplicantsPage.jsx       # "Best match" recruiter view
        ├── test/setup.js           # jest-dom matchers + per-test cleanup
        ├── utils/                  # Formatting + validation helpers
        │   ├── format.test.js
        │   ├── resumeFile.js       # file validation, extraction + OCR routing
        │   ├── resumeFile.test.js
        │   ├── pdfReader.js        # pdfjs text + scanned-PDF OCR fallback
        │   ├── docxReader.js       # mammoth .docx reader
        │   ├── imageReader.js      # tesseract.js image OCR
        │   └── ocr.js              # shared OCR worker
        ├── App.jsx                 # Route table (+3 candidate routes)
        └── main.jsx                # Bootstrap
```

---

## Quick start (local, without Docker)

Requirements: Node.js 18+, npm, and MongoDB running locally on `127.0.0.1:27017`.

```bash
# 1. Backend
cd backend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5001/api/health

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Open <http://localhost:5173> and register two accounts — one `candidate`, one `recruiter`.

> On macOS, port 5000 is sometimes used by AirPlay/Control Center. The project defaults to **5001** to avoid this.

---

## Testing

Requirements: MongoDB running locally on `127.0.0.1:27017`. The API tests use a throwaway `jobportal_test` database and drop it when they finish.

```bash
# From the repository root — runs both suites
npm test

# Or individually
cd backend && npm test       # Jest + Supertest API tests
cd frontend && npm test      # Vitest + Testing Library component tests
```

| Suite | Tooling | What it covers |
|---|---|---|
| Backend (26 tests) | Jest + Supertest | register/login/me, password hashing, identical 401 for bad credentials, malformed/expired JWT, live role lookup; job CRUD, ownership, mass-assignment guard, text search, filters, sort, pagination, route order, delete cascade; apply-once, deadline, status RBAC, reject-only reapply, status map, resume lifecycle, single match, recommendations, ranked applicants |
| Frontend (44 tests) | Vitest + React Testing Library | salary/date/skill helpers, API error normalisation, match badge bands and clamping, candidate quick-apply (success, duplicate, expired, error, shortlisted/hired/rejected states), status map hook, `ProtectedRoute` role/redirect/loading, resume file routing + upload/auto-save, theme persistence and toggle |

**Isolation rules:**
- `backend/tests/setup.js` is imported before the app and forces `MONGODB_URI` to `jobportal_test`, a test-only JWT secret, and an empty `OPENAI_API_KEY`. `dotenv.config()` never overrides existing values, so a developer's `.env` cannot redirect tests to real data.
- Each backend test clears all collections; the database is dropped and the connection closed at the end of every suite.
- Jest uses native ESM (`node --experimental-vm-modules`) because the backend declares `"type": "module"` — no Babel transform is involved.
- Frontend tests run in jsdom with `jest-dom` matchers; the DOM and `localStorage` are cleaned between tests.

To point the API tests at a different MongoDB instance, set `TEST_MONGODB_URI` before running `npm test`.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `5001` | Backend listen port |
| `NODE_ENV` | `development` | `production` enables security headers, rate limits, and index sync |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/jobportal` | Use `mongodb+srv://…` for Atlas |
| `CORS_ORIGIN` | `http://localhost:5173` | Must be explicit in production — `*` is rejected |
| `JWT_SECRET` | 32+ random chars | Required, minimum 16 characters |
| `JWT_EXPIRES_IN` | `7d` | Any value accepted by `jsonwebtoken` |
| `OPENAI_API_KEY` | *(empty)* | Optional. Empty = free local matcher; set = LLM scores single job matches |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model used when the key above is set |

### Frontend (`frontend/.env`)

| Variable | Example | Notes |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5001/api` | Baked into the bundle at **build time** — rebuild after changing it |

Neither `.env` file is committed. Only `.env.example` files are tracked, and they contain
placeholders only — never put real credentials in a tracked example file. If a real connection
string was ever committed, rotate that database user's password.

---

## API reference

Base URL: `http://localhost:5001/api`. All `/jobs` and `/applications` routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Health + DB status |
| `POST` | `/auth/register` | Public | Create account (`name`, `email`, `password`, `role`) |
| `POST` | `/auth/login` | Public | Returns `{ token, user }` |
| `GET` | `/auth/me` | Token | Current user |
| `GET` | `/jobs` | Token | Search/filter/paginate jobs |
| `POST` | `/jobs` | Recruiter | Post a job |
| `GET` | `/jobs/mine` | Recruiter | Own posted jobs |
| `GET` | `/jobs/recommended` | Candidate | Jobs ranked by resume match (`?limit=`, max 20) |
| `GET` | `/jobs/:id` | Token | Job detail |
| `PATCH` | `/jobs/:id` | Recruiter (owner) | Edit job |
| `DELETE` | `/jobs/:id` | Recruiter (owner) | Delete job + its applications |
| `POST` | `/applications/job/:jobId` | Candidate | Apply (optional `coverLetter`; reapply allowed only when the existing application is `rejected`) |
| `GET` | `/applications/statuses` | Candidate | `{ jobId: status }` map for job cards |
| `GET` | `/applications/mine` | Candidate | My applications |
| `GET` | `/applications/job/:jobId` | Recruiter (owner) | Applicants, `?status=` filter |
| `GET` | `/applications/job/:jobId/ranked` | Recruiter (owner) | Applicants sorted by match score + summary |
| `PATCH` | `/applications/:id/status` | Recruiter (owner) | Update hiring status |
| `GET` | `/resume` | Candidate | Saved resume + extracted skills |
| `PUT` | `/resume` | Candidate | Save extracted resume text / file name (50–20,000 chars; pdf, docx, jpg, png, webp, txt, md) |
| `DELETE` | `/resume` | Candidate | Remove resume |
| `GET` | `/resume/match/:jobId` | Candidate | Match score + explanation for one job |

**Query params for `GET /jobs`:** `keyword`, `location`, `skills` (comma-separated), `jobType`, `workMode`, `experienceLevel`, `minSalary`, `maxSalary`, `sort`, `page`, `limit` (max 50).

**Standard error shape:** `{ "success": false, "status": 400, "message": "...", "details": [{ "field": "...", "message": "..." }] }`

---

## How resume matching works

```
Resume text → normalise → skill lexicon (100+ aliases) → canonical skills + years
                                        ↓
     Job skills (60) + experience (20) + title relevance (20) = score 0–100
```

- **Offline by default.** `skillLexicon.js` maps spellings like `reactjs`, `node-js` and `k8s` to canonical skills. `localProvider.js` handles the weighted scoring and writes a plain-English explanation. No API key, no cost, fully testable.
- **Optional LLM.** Set `OPENAI_API_KEY` and a single candidate-facing `GET /resume/match/:jobId` is scored by the model. If the provider times out or fails, the response falls back to local scoring and includes `fallbackReason`.
- **Bulk operations stay local.** Recommendations and applicant ranking always use the deterministic scorer — one page must not trigger dozens of paid calls.
- **Explainable output.** Every result contains `score`, `matchedSkills`, `missingSkills`, `extractedSkills`, a `breakdown` array and an `explanation`, so a recruiter can see *why* a candidate scored highly.
- **Privacy.** Resume text uses `select: false` on the User model and is only loaded by resume/matching endpoints. Bulk ranking uses the stored extracted skills, never the raw text.

---

## Run the whole stack with Docker

```bash
# From the repository root
JWT_SECRET=replace_with_a_long_random_string docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (nginx) | <http://localhost:3000> |
| Backend API | <http://localhost:5001/api/health> |
| MongoDB | `localhost:27017` (data in the `mongo-data` volume) |

The compose file waits for MongoDB to be healthy before starting the backend. Set `JWT_SECRET` in your shell (or a root `.env`) before running.

---

## Deploy to the cloud (free tiers)

**1. Database — MongoDB Atlas**
- Create a free M0 cluster, allow access from `0.0.0.0/0` (or specific IPs), create a database user.
- Copy the `mongodb+srv://…` connection string.

**2. Backend — Render / Railway / Vercel**
- Render/Railway: build command `npm install`, start command `npm start`, `PORT` provided by the host.
- Vercel: create a project with **Root Directory = `backend`**. Leave Build Command and Output Directory blank. Vercel's zero-config Express detection finds `src/app.js` (it imports `express` and default-exports the app); `src/app.js` connects MongoDB lazily, so `server.js` is not used on serverless. No `backend/vercel.json` is required.
- Set env vars: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN=<frontend URL>`. `PORT` is only needed outside Vercel.
- `CORS_ORIGIN` is required in production; the app fails fast with a clear message if it is missing. Optional `ALLOW_VERCEL_PREVIEWS=true` also allows `*.vercel.app` origins; `CORS_ORIGIN` accepts a comma-separated list.
- On the first request in each serverless instance the app connects to MongoDB and synchronizes indexes, so text search and unique constraints are ready before queries run.

**3. Frontend — Vercel / Netlify**
- Framework preset: Vite. Build command `npm run build`, output directory `dist`.
- Set `VITE_API_URL=https://<your-backend>/api` **before** building (it is baked at build time).
- `frontend/vercel.json` already rewrites every path to `index.html` for React Router direct links; on Netlify use `/* /index.html 200`.
- `vite.config.js` and `vitest.config.js` are separate, so production builds do not need Vitest installed.
- Update the backend's `CORS_ORIGIN` to the frontend URL and redeploy the backend.

Both parts can live on Vercel as two projects (`backend` and `frontend` root directories). MongoDB Atlas must allow `0.0.0.0/0` because Vercel Functions have rotating outbound IPs.

Alternatively, deploy the two Docker images from `backend/Dockerfile` and `frontend/Dockerfile` to any container platform.

---

## Production notes

- `helmet()` sets security headers; HSTS is only meaningful over HTTPS (the host terminates TLS).
- `express-rate-limit` allows 10 auth attempts / 15 min and 200 API requests / 15 min. It is **disabled when `NODE_ENV !== production`** so local testing is not throttled.
- `app.set('trust proxy', 1)` in production ensures the client IP behind a proxy is used for rate limiting.
- `compression()` gzips JSON responses.
- Indexes are synchronized explicitly at startup only in production; in development Mongoose builds them lazily.
- `server.js` handles `SIGINT`, `SIGTERM`, and unhandled rejections with graceful shutdown.
- Passwords use bcrypt cost 12 and are never serialized (`select: false` + `toJSON()` cleanup).
- JWTs contain only the user `id`; roles are read from MongoDB on every request so role changes take effect immediately.

---

## Suggested interview talking points

1. **Mass assignment:** `postedBy` is always set from `req.user._id`, never from the request body.
2. **Duplicate prevention:** a unique index `{ job: 1, candidate: 1 }` is the real guard; the pre-check is only for a friendly 409.
3. **Search:** a weighted MongoDB text index beats a regex scan; `escapeRegex()` protects the location filter.
4. **RBAC:** `restrictTo` checks the live user from Mongo, not a stale role inside the JWT.
5. **Pagination:** `skip((page-1)*limit)` with a capped `limit` and whitelisted `sort` fields.
6. **Frontend:** filters live in the URL, requests are aborted on rapid changes, and route guards hide *and* protect.
7. **Matching:** a provider interface keeps the LLM optional, bulk scoring stays deterministic, and every score ships with its reasoning.
8. **Testing:** tests override env before importing the app so they never touch real data; Supertest exercises the real middleware chain, and UI tests mock only the network/auth boundary.
9. **Theming:** CSS custom properties drive both palettes. Switching theme only toggles a class on `<html>`, so existing pages follow along without per-component `dark:` rules. The choice is saved and applied before React renders.
10. **Uploads stay on the device:** PDF, DOCX and image text is extracted in the browser (OCR with a bundled English model), so the server only ever stores the resulting text.

---

## Roadmap

- [x] Stage 1 — backend setup, models, error handling
- [x] Stage 2 — JWT auth and RBAC
- [x] Stage 3 — job CRUD, search, apply flow
- [x] Stage 4 — React auth, routing, protected routes
- [x] Stage 5 — candidate and recruiter screens
- [x] Stage 6 — production hardening, Docker, documentation
- [x] Stage 7 — AI resume matching (skill extraction + match score + ranked applicants)
- [x] Stage 8 — automated tests (Jest + Supertest, Vitest + React Testing Library)
