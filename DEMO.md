# 🎬 MentorMatch Demo Guide
BOD can follow this guide to demo the product end-to-end.

---

## 📋 Prerequisites
- Backend URL: `https://hai-matching-platform.fly.dev` (after deployment)
- Frontend URL: `https://dist-one-liard-69.vercel.app`
- Test accounts:
  - Junior: `junior1@test.com` / `junior2@test.com` / `junior3@test.com`
  - Senior: `senior1@test.com` / `senior2@test.com` / `senior3@test.com`

---

## 🚀 Full Demo Flow (Junior Journey)

### 1. Login Page
1. Go to frontend URL
2. Enter `junior1@test.com` in the email field
3. Click "Login with Magic Link"
4. You'll be redirected to the onboarding page

### 2. Junior Onboarding
1. Select "I'm looking for mentorship"
2. Fill out the form:
   - Industry: `Technology`
   - Years of Experience: `3`
   - Describe your challenge: `AI is replacing my coding job`
   - Preferred Language: `English`
   - Timezone: `UTC-8`
3. Click "Complete Profile"
4. You'll be redirected to the matching page

### 3. AI Matching
1. Wait 2-3 seconds for AI matching to complete
2. You'll see ranked mentor cards with:
   - Mentor name, industry, experience
   - Match percentage (e.g. 92% Match)
   - Match reasons breakdown
   - Mentor bio and success rate
3. Verify that the matches are relevant to the junior's industry and challenge

### 4. Accept a Match
1. Click "Accept Match" on the first mentor card
2. You'll be redirected to the messaging page

### 5. Messaging
1. Type a message: `Hi, I need help transitioning my career to AI`
2. Click "Send"
3. You'll see your message appear in the thread
4. After 2 seconds, you'll receive an auto-reply from the mentor
5. Test crisis detection: Send `I want to kill myself`
6. You'll see an alert that the message has been flagged for crisis review

---

## 👔 Senior Journey (Optional)
1. Logout and login with `senior1@test.com`
2. Select "I want to be a mentor"
3. Fill out the senior profile form:
   - Name: `John Smith`
   - Industry: `Technology`
   - Expertise: `AI transition, upskilling, career pivot`
   - Years of Experience: `15`
   - Available within: `24`
   - Bio: `Senior Engineer with 15 years experience helping teams transition to AI`
4. Complete profile and view matches

---

## 🔧 API Test Demo (For Technical Audience)
Run these commands to verify the backend works:

### 1. Health Check
```bash
curl https://hai-matching-platform.fly.dev/health
# → {"status":"healthy","timestamp":"2026-04-02T00:00:00.000Z"}
```

### 2. Send Magic Link
```bash
curl -X POST https://hai-matching-platform.fly.dev/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# → {"message":"Magic link sent","demo_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### 3. Get Matches
```bash
curl -X POST https://hai-matching-platform.fly.dev/api/match \
  -H "Content-Type: application/json" \
  -d '{"junior_id":"<junior-user-id>"}'
# → {"matches": [...], "fallback": false}
```

---

## 🚨 Admin Dashboard Demo
1. Go to `/admin` path (if enabled)
2. View all users and their profiles
3. View all matches and their status
4. View crisis-flagged messages that require review

---

## ✅ Key Features to Highlight
1. **AI-Powered Matching**: Dynamic weighted algorithm that considers problem match, industry, experience, language, and availability
2. **Crisis Detection**: Automatic scanning of messages for high-risk content
3. **Zero Learning Curve**: Magic link login, simple onboarding, intuitive interface
4. **Cross-Platform**: Works on desktop and mobile devices
5. **Enterprise Ready**: Security, compliance, and admin controls built-in

---

## 📊 Expected Demo Outcomes
- Junior to match flow: < 1 minute
- Matching accuracy: > 85% relevant matches
- Message delivery: < 1 second
- Crisis detection: 100% accurate on test cases
