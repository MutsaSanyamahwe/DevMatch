# DevMatch

DevMatch is a developer matching platform; developers connect based on what they've actually built, not a self-written bio. The core idea: remove onboarding friction by auto-generating a developer's profile from real evidence instead of a blank form.

On signup, DevMatch hands a user's GitHub username and CV off to **[DevVerify](#part-of-a-larger-system)**, a sibling service that scans both sources and extracts:
- From **GitHub** - projects, languages, and a working signal of what the person has actually built
- From **CV** - education and certifications

That extracted data pre-fills the profile, so the user is mostly just confirming details and adding personal info — not typing a profile from scratch.

## Features

- **Authentication** - signup, login, and a forgot/reset password flow with emailed reset links
- **DevVerify-powered onboarding** — GitHub + CV scan pre-fills skills, projects, education, and certifications before the user touches a form field
- **Matching system** - swipe-style discover feed, like/pass actions, pending likes (incoming and sent), and confirmed matches
- **Matched-only DMs** - messaging unlocks only after a mutual match (enforced server-side: a message can only be sent against an existing `matches` row that the sender belongs to)
- **Explore page** - surfaces DevMatch's two sibling systems, DevVerify and RepoRecommender, as part of the same ecosystem
- **Profiles** - user info, goals, preferences, CV data, and avatar upload/removal

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

## API Overview

> Onboarding additionally calls an external endpoint directly from the frontend: `POST https://devverify-system.onrender.com/analyze`, sending the user's GitHub username and CV file to extract profile data before the form is shown. This call goes to DevVerify, not this repo's backend.

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

## Part of a Larger System

DevMatch isn't standalone — it's the front-facing app in a small ecosystem of three connected services:

- **DevMatch** (this repo) — the matching platform and product surface
- **DevVerify** — [Link](https://devverify-system-1.onrender.com/)scans a user's GitHub profile and CV during onboarding and returns structured data (projects, languages, education, certifications) that DevMatch uses to pre-fill the profile. DevMatch's onboarding flow calls DevVerify's `/analyze` endpoint directly with the GitHub username and CV file.
- **RepoRecommender** — [Link](https://github-repository-recommender.onrender.com/)uses K-Means clustering on repository metadata to recommend repos similar to what a user has built. Linked from DevMatch's Explore page as a related system rather than embedded directly into the matching flow.

This separation keeps identity/credential verification (DevVerify) and discovery (RepoRecommender) as independent services that DevMatch consumes, rather than building that logic into the matching platform itself.

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
