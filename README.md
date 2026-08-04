# DevMatch

**Live Demo:** [DevMatch](https://devmatch-1-hj4i.onrender.com/)

## The Problem

Developer-matching and networking platforms almost universally rely on a self-written bio to represent who someone is. That's a weak signal:

- Bios are aspirational, not evidence-based — anyone can claim "full-stack, 5 years, loves Python"
- Writing a good one is its own skill, unrelated to being a good developer
- Blank-form onboarding is friction before the product has proven any value
- Two people can look identical on paper and be nothing alike in what they've actually shipped

The result is a matching layer built on marketing copy instead of on what people have actually built.

## What DevMatch Is

DevMatch is a developer matching platform where connections form around **verified work, not a written bio.** Instead of asking a new user to describe themselves, it pulls the description from evidence that already exists: their GitHub account and their CV.

## System Flow

```
 1. SIGNUP
    user submits GitHub username + CV
                │
                ▼
 2. AUTO-PROFILE (via DevVerify)
    DevMatch's frontend calls DevVerify's
    POST /analyze directly with those two inputs
                │
                ▼
    DevVerify scans GitHub (projects, languages,
    working signal) + parses the CV (education,
    certifications) and returns structured JSON
                │
                ▼
 3. PRE-FILLED PROFILE
    skills, projects, education, and certifications
    are already populated — user reviews/confirms
    and adds personal info, goals, and preferences
                │
                ▼
 4. DISCOVER
    swipe-style feed of other evidence-backed profiles
    like / pass actions recorded per user
                │
                ▼
 5. MATCH
    mutual like → confirmed match created server-side
                │
                ▼
 6. MESSAGE
    DMs unlock only after a confirmed match
    (enforced server-side against the matches table)
```

Because the profile is generated rather than typed, the friction point that normally sits between "sign up" and "start discovering" is mostly removed — the user is confirming pre-extracted facts, not filling a blank form.

## Features

- **Authentication** — signup, login, and a forgot/reset password flow with emailed reset links
- **DevVerify-powered onboarding** — GitHub + CV scan pre-fills skills, projects, education, and certifications before the user touches a form field
- **Matching system** — swipe-style discover feed, like/pass actions, pending likes (incoming and sent), and confirmed matches
- **Matched-only DMs** — messaging unlocks only after a mutual match (enforced server-side: a message can only be sent against an existing `matches` row that the sender belongs to)
- **Explore page** — surfaces DevMatch's two sibling systems, DevVerify and RepoRecommender, as part of the same ecosystem
- **Profiles** — user info, goals, preferences, CV data, and avatar upload/removal

## Part of a Larger System

DevMatch is the front-facing app in a small ecosystem of three connected services, each doing one job:

- **DevMatch** (this repo) — the matching platform and product surface
- **[DevVerify](https://devverify-system-1.onrender.com/)** — scans a user's GitHub profile and CV during onboarding and returns structured data (projects, languages, education, certifications). DevMatch's frontend calls DevVerify's `/analyze` endpoint directly with the GitHub username and CV file — this call bypasses DevMatch's own backend entirely.
- **[RepoRecommender](https://github-repository-recommender.onrender.com/)** — uses K-Means clustering on repository metadata to recommend repos similar to what a user has built. Linked from DevMatch's Explore page as a related system rather than embedded into the matching flow.

Keeping credential verification (DevVerify) and discovery-by-similarity (RepoRecommender) as separate services means DevMatch's own backend stays focused on identity, matching, and messaging — it doesn't need to know how a profile got built, only that it did.

## API Overview

> Onboarding calls an external endpoint directly from the frontend: `POST https://devverify-system.onrender.com/analyze`, sending the GitHub username and CV file to extract profile data before the form is shown. This goes to DevVerify, not this repo's backend.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Create a new account |
| POST | `/auth/login` | Authenticate a user |
| POST | `/auth/forgot-password` | Send a password reset email via Resend |
| POST | `/auth/reset-password` | Reset password using a reset token |
| GET | `/users/` | List users |
| POST | `/users/profile` | Create a user profile |
| POST | `/users/save-cv` | Save CV data |
| POST | `/users/save-goals` | Save user goals |
| POST | `/users/save-preferences` | Save user preferences |
| POST | `/users/upload-avatar` | Upload a profile avatar |
| POST | `/users/remove-avatar` | Remove a profile avatar |
| GET | `/profile/user-info/:userid` | Fetch a user's profile |
| PUT | `/profile/update-user-info/:userid` | Update a user's profile |
| GET | `/profile/get-user-goals/:userid` | Fetch a user's goals |
| GET | `/profile/get-user-preferences/:userid` | Fetch a user's preferences |
| GET | `/profile/get-cv-data/:userid` | Fetch a user's CV data |
| GET | `/matches/discover-matches/:userid` | Get the discover feed for a user |
| POST | `/matches/like-pass` | Record a like or pass action |
| GET | `/matches/pending-likes/:userid` | Get likes a user has received |
| GET | `/matches/sent-pending-likes/:userid` | Get likes a user has sent |
| GET | `/matches/matches/:userid` | Get a user's confirmed matches |
| POST | `/messages/send-message` | Send a message |
| GET | `/messages/get-messages/:match_id` | Get message history for a match |
| GET | `/messages/conversations/:userid` | Get a user's conversation list |
| POST | `/messages/mark-read` | Mark messages as read |

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router for routing
- Tailwind CSS for styling
- Framer Motion for animation
- Axios for API calls
- Supabase JS client (auth/session + direct data access from the client)

**Backend**
- Node.js + Express 5 (ESM)
- Supabase (Postgres + Auth) as the primary data store
- Multer for in-memory file upload handling (avatars)
- Resend for transactional email (password reset)
- CORS + dotenv

**Infra**
- Dockerfile for the backend (Node 20 Alpine, production install, port 3000)

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (Postgres database + Auth)
- A [Resend](https://resend.com) account/API key (for password reset emails)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
FRONTEND_URL=http://localhost:5173
```

Run the server:

```bash
npm run dev    # nodemon, auto-reload
npm start      # plain node
```

The API runs on `http://localhost:5000` by default (`GET /` returns `API running...`).

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the dev server:

```bash
npm run dev
```

Vite will start the app, typically on `http://localhost:5173`.

### Docker (Backend)

```bash
cd backend
docker build -t devmatch-backend .
docker run -p 3000:3000 --env-file .env devmatch-backend
```

> Note: the Dockerfile exposes port `3000`; align `PORT` in your `.env` (or the Express listen port) accordingly when running in a container.

## Project Structure

```
DevMatch/
├── backend/
│   ├── config/
│   │   └── supabaseClient.js     # Supabase client init (service role)
│   ├── controllers/               # Route handler logic
│   ├── middleware/
│   │   └── upload.js              # Multer in-memory storage config
│   ├── routes/
│   │   ├── authRoutes.js          # /auth
│   │   ├── userRoutes.js          # /users
│   │   ├── profileRoutes.js       # /profile
│   │   ├── matchesRoutes.js       # /matches
│   │   └── messagesRoutes.js      # /messages
│   ├── dockerfile
│   ├── index.js                   # Express app entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/                 # Route-level views (Login, Discover, Matches, Messages, etc.)
    │   ├── components/
    │   ├── context/
    │   │   └── UserContext.jsx    # App-wide user/session state
    │   └── supabase/
    │       └── supabaseClient.js  # Supabase client init (anon key)
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Environment Variables Summary

| Variable | Used in | Description |
|---|---|---|
| `PORT` | backend | Port the Express server listens on (defaults to 5000) |
| `SUPABASE_URL` | backend | Supabase project URL |
| `SUPABASE_KEY` | backend | Supabase service role key (server-side) |
| `RESEND_API_KEY` | backend | Resend API key for sending password reset emails |
| `FRONTEND_URL` | backend | Base URL used to build the password reset link |
| `VITE_SUPABASE_URL` | frontend | Supabase project URL (client-side) |
| `VITE_SUPABASE_ANON_KEY` | frontend | Supabase anon/public key (client-side) |

## License

No license file is currently included in this repository.
