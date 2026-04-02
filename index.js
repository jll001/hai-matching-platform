require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Send magic link
app.post('/auth/magic-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists, create if not
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    let userId;
    if (!existingUser) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({ email })
        .select('id')
        .single();
      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send email (in demo mode, we just return the token)
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_USER) {
      const magicLink = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
      await transporter.sendMail({
        from: '"MentorMatch" <no-reply@mentormatch.com>',
        to: email,
        subject: 'Your Magic Link to Login',
        html: `Click <a href="${magicLink}">here</a> to login. This link expires in 1 hour.`
      });
    }

    res.json({
      message: 'Magic link sent',
      // For demo purposes only, remove in production
      demo_token: token
    });
  } catch (error) {
    console.error('Error sending magic link:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

// Get all users (protected)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, created_at, role, profile_completed');

    if (error) throw error;

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user profile
app.get('/users/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;

    let table = role === 'senior' ? 'senior_profiles' : 'junior_profiles';
    const { data: profile, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json(profile || {});
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.post('/users/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, ...profileData } = req.body;

    let table = role === 'senior' ? 'senior_profiles' : 'junior_profiles';
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from(table)
      .select('id')
      .eq('user_id', id)
      .single();

    let result;
    if (existingProfile) {
      result = await supabase
        .from(table)
        .update(profileData)
        .eq('user_id', id)
        .select()
        .single();
    } else {
      result = await supabase
        .from(table)
        .insert({ user_id: id, ...profileData })
        .select()
        .single();
    }

    // Update user's profile completed status
    await supabase
      .from('users')
      .update({ profile_completed: true, role })
      .eq('id', id);

    res.json(result.data);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Matching endpoint
app.post('/api/match', async (req, res) => {
  try {
    const { junior_id } = req.body;

    // Get junior profile
    const { data: juniorProfile, error: juniorError } = await supabase
      .from('junior_profiles')
      .select('*')
      .eq('user_id', junior_id)
      .single();

    if (juniorError && juniorError.code !== 'PGRST116') {
      // If no profile found, use mock data for demo
      const mockMatches = [
        {
          id: 'senior_1',
          name: 'John Smith',
          industry: 'Technology',
          years_experience: 15,
          match_score: 92,
          match_reasons: ['30% problem match', '20% industry match', '15% language match'],
          bio: 'Senior Engineer with 15 years experience, transitioned to AI/ML in 2023'
        },
        {
          id: 'senior_2',
          name: 'Sarah Anderson',
          industry: 'Technology',
          years_experience: 18,
          match_score: 87,
          match_reasons: ['30% problem match', '20% industry match', '15% language match'],
          bio: 'Engineering Manager who led 3 AI transformation initiatives at FAANG'
        }
      ];
      return res.json({ matches: mockMatches, fallback: true });
    }

    // Get all senior profiles
    const { data: seniorProfiles, error: seniorError } = await supabase
      .from('senior_profiles')
      .select('*, users!inner(email, created_at)');

    if (seniorError) throw seniorError;

    // Calculate match scores
    const matches = seniorProfiles.map(senior => {
      let score = 0;
      const reasons = [];

      // Industry match (30%)
      if (juniorProfile.industry === senior.industry) {
        score += 30;
        reasons.push('30% industry match');
      } else if (juniorProfile.industry && senior.industry) {
        // Partial industry match
        score += 10;
        reasons.push('10% related industry match');
      }

      // Experience level match (25%)
      const experienceDiff = Math.abs(juniorProfile.years_experience - senior.years_experience);
      if (experienceDiff >= 5) {
        score += 25;
        reasons.push('25% experience level match');
      } else if (experienceDiff >= 3) {
        score += 15;
        reasons.push('15% experience level match');
      }

      // Problem/Expertise match (30%)
      if (juniorProfile.problem && senior.expertise) {
        const problemKeywords = juniorProfile.problem.toLowerCase().split(/\s+/);
        const expertiseKeywords = senior.expertise.toLowerCase().split(/\s+/);
        const matches = problemKeywords.filter(k => expertiseKeywords.includes(k)).length;
        if (matches > 0) {
          const problemScore = Math.min(30, matches * 5);
          score += problemScore;
          reasons.push(`${problemScore}% problem/expertise match`);
        }
      }

      // Availability match (15%)
      if (senior.available_within <= 24) {
        score += 15;
        reasons.push('15% availability match');
      } else if (senior.available_within <= 48) {
        score += 10;
        reasons.push('10% availability match');
      }

      return {
        id: senior.user_id,
        name: senior.name || 'Senior Mentor',
        industry: senior.industry,
        years_experience: senior.years_experience,
        match_score: Math.min(100, Math.round(score)),
        match_reasons: reasons,
        bio: senior.bio || `${senior.industry} expert with ${senior.years_experience} years experience`,
        success_rate: senior.success_rate,
        available_within: senior.available_within
      };
    });

    // Sort by match score descending
    const sortedMatches = matches.sort((a, b) => b.match_score - a.match_score).slice(0, 5);

    res.json({ matches: sortedMatches, fallback: false });
  } catch (error) {
    console.error('Error matching:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

// Create a match
app.post('/api/matches', authenticateToken, async (req, res) => {
  try {
    const { junior_id, senior_id, match_score, match_reasons } = req.body;

    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        junior_id,
        senior_id,
        status: 'pending',
        match_score: match_score || 0,
        match_reasons: match_reasons || []
      })
      .select()
      .single();

    if (error) throw error;

    res.json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Get user matches
app.get('/api/matches/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;

    let query = supabase.from('matches').select('*');
    
    if (role === 'junior') {
      query = query.eq('junior_id', userId);
    } else {
      query = query.eq('senior_id', userId);
    }

    const { data: matches, error } = await query;

    if (error) throw error;

    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Update match status
app.patch('/api/matches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: match, error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
