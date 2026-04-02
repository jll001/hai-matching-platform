# Matching Platform Backend

Production-ready backend for the mentor-junior matching platform, built with Express.js and Supabase.

## Features
- ✅ Magic link authentication with JWT
- ✅ User profile management (junior/senior roles)
- ✅ Dynamic weighted matching algorithm
- ✅ Match management and status tracking
- ✅ Session scheduling
- ✅ Messaging system
- ✅ PostgreSQL database with proper constraints
- ✅ Dockerized for easy deployment

## Tech Stack
- Node.js + Express.js
- Supabase (PostgreSQL + Auth)
- JWT for authentication
- Nodemailer for email delivery
- Docker for containerization

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `POST /auth/magic-link` - Send magic login link

### Protected Endpoints (require Bearer token)
- `GET /users` - Get all users
- `GET /users/:id/profile` - Get user profile
- `POST /users/:id/profile` - Update user profile
- `POST /api/match` - Get matching seniors for a junior
- `POST /api/matches` - Create a new match
- `GET /api/matches/:userId` - Get user's matches
- `PATCH /api/matches/:id` - Update match status

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret-key
```

### 3. Database Setup
Run the migrations in `supabase/migrations/` on your Supabase database.

### 4. Run Locally
```bash
npm run dev
```

## Deployment

### Fly.io
1. Install Fly CLI
2. Run `fly launch`
3. Set environment variables with `fly secrets set KEY=VALUE`
4. Run `fly deploy`

### Docker
```bash
docker build -t matching-platform-backend .
docker run -p 3001:3001 --env-file .env matching-platform-backend
```

## Matching Algorithm
The matching algorithm uses weighted scoring:
- 30% Industry match
- 25% Experience level match
- 30% Problem/Expertise keyword match
- 15% Availability match

Scores are normalized to 0-100 and top 5 matches are returned.

## License
MIT
