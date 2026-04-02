# 🤝 MentorMatch - AI-Powered Mentorship Platform
Connect juniors with industry experts through intelligent matching, real-time messaging, and crisis detection.

---

## 🏗️ Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│ →  │  Express Backend│ →  │  Supabase DB    │
│  (Vercel)       │ ←  │  (Fly.io)       │ ←  │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          ↓                    ↓                    ↓
    Tailwind CSS        Matching Algorithm      All tables:
    TypeScript          Crisis Detection      users, profiles,
    React Router        JWT Authentication    matches, messages
```

---

## ✅ Features
### 🎯 Core Functionality
- **Magic Link Authentication**: No passwords, login via email link
- **Dual Profiles**: Separate onboarding for juniors and seniors
- **Intelligent Matching Engine**: Weighted algorithm considering:
  - 30% Problem/Expertise match
  - 20% Industry match
  - 15% Language/Timezone match
  - 15% Mentor success rate
  - 10% Experience level match
  - 10% Preferences match
  - Availability multiplier: 1.0 (<24h), 0.7 (<72h), 0.3 (>72h)
- **Real-time Messaging**: End-to-end messaging with crisis detection
- **Crisis Detection**: Automatic scanning of high-risk content for mental health concerns
- **Admin Dashboard**: User management, match monitoring, crisis alert review

### 🛡️ Security & Compliance
- JWT-based authentication
- CORS configured for production domains
- Input validation and sanitization
- Crisis content scanning and flagging
- Data encryption at rest and in transit

---

## 🚀 Deployment

### Backend Deployment (Fly.io)
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch --name hai-matching-platform --region hkg
fly secrets set \
  SUPABASE_URL="your-supabase-url" \
  SUPABASE_KEY="your-supabase-key" \
  JWT_SECRET="your-jwt-secret"
fly deploy
```

### Frontend Deployment (Vercel)
```bash
# Go to frontend repo
cd hai-matching-frontend

# Install dependencies
npm install

# Build
npm run build

# Deploy to Vercel
npx vercel deploy --prod
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-production-jwt-secret
SMTP_HOST=smtp.gmail.com (optional)
SMTP_PORT=587 (optional)
SMTP_USER=your-email@gmail.com (optional)
SMTP_PASS=your-app-password (optional)
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 📦 Local Development
### Backend Setup
```bash
# Clone repo
git clone https://github.com/jll001/hai-matching-platform.git
cd hai-matching-platform

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations (in Supabase SQL editor)
# Run supabase/migrations/20260324_init_tables.sql

# Seed test data
node seed.js

# Start server
npm run dev
```

### Frontend Setup
```bash
# Clone repo
git clone https://github.com/jll001/hai-matching-frontend.git
cd hai-matching-frontend

# Install dependencies
npm install

# Configure API URL
echo "VITE_API_URL=http://localhost:3001" > .env.local

# Start development server
npm run dev
```

---

## 📡 API Reference
### Authentication
- `POST /auth/magic-link` - Send magic login link
- `GET /users/me` - Get current user

### Profiles
- `POST /users/:id/profile` - Update user profile (junior/senior)
- `GET /users/:id/profile` - Get user profile

### Matching
- `POST /api/match` - Get matches for a junior
- `POST /api/matches` - Create a new match
- `PATCH /api/matches/:id` - Update match status (accept/reject)
- `GET /api/matches/:userId` - Get user's matches

### Messaging
- `POST /messages` - Send a message (runs crisis detection)
- `GET /messages/:matchId` - Get messages for a match

### Admin
- `GET /users` - Get all users
- `GET /api/matches` - Get all matches
- `GET /messages/crisis` - Get crisis-flagged messages

---

## 🧪 Testing
### End-to-end Test Flow
1. Login with junior email → Complete onboarding → Get matches → Accept match → Send message
2. Verify matching relevance, message delivery, and crisis detection
3. Login with senior email → Complete onboarding → View matches

### Test Data
The `seed.js` script inserts:
- 5 juniors with realistic profiles and challenges
- 5 seniors with diverse expertise and backgrounds
- All data aligned with industry demographics

---

## 📊 Matching Algorithm Details
The algorithm calculates a raw score based on weighted factors, then applies an availability multiplier.
Scores are normalized 0-100, and top 5 matches are returned.

### Fallback Logic
- **Score < 70**: Return top 3 seniors with `fallback: "low_confidence"` flag
- **No seniors in DB**: Return `fallback: "no_matches"` + waitlist message
- **2+ rejected matches**: Return `fallback: "admin_escalation"` for manual review

---

## 🚨 Crisis Detection
Messages are scanned for high-risk content related to self-harm, suicide, and other crisis situations.
- High severity messages are flagged and sent to admin review
- Users are connected to resources if needed
- All flagged content is logged for compliance

---

## 📄 Documentation
- [Demo Guide](./DEMO.md) - Step-by-step demo walkthrough for BOD
- [API Docs](./docs/API.md) - Full API reference
- [Database Schema](./docs/SCHEMA.md) - Database table structure

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License
MIT License - see [LICENSE](./LICENSE) for details.

---

## 🔗 Links
- **Live Demo**: https://dist-one-liard-69.vercel.app
- **Backend Repo**: https://github.com/jll001/hai-matching-platform
- **Frontend Repo**: https://github.com/jll001/hai-matching-frontend
- **API URL**: https://hai-matching-platform.fly.dev (after deployment)
