require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://dist-one-liard-69.vercel.app',
    'https://*.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Crisis detection function
function detectCrisis(text) {
  const crisisKeywords = ['suicide', 'kill myself', 'want to die', 'harm myself', 'self-harm', 'end my life', 'kill yourself', 'die'];
  const highSeverityKeywords = ['im going to', 'today', 'tonight', 'now', 'have a plan', 'going to do it'];
  
  const lowerText = text.toLowerCase();
  const isCrisis = crisisKeywords.some(keyword => lowerText.includes(keyword));
  const severity = isCrisis && highSeverityKeywords.some(keyword => lowerText.includes(keyword)) ? 'high' : 'medium';
  
  return {
    is_crisis: isCrisis,
    severity: isCrisis ? severity : 'low'
  };
}

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
      .select('id, role, profile_completed')
      .eq('email', email)
      .single();

    let userId;
    let userData;
    if (!existingUser) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({ email })
        .select('id, role, profile_completed')
        .single();
      userId = newUser.id;
      userData = newUser;
    } else {
      userId = existingUser.id;
      userData = existingUser;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send email (in demo mode, we just return the token)
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_USER) {
      const magicLink = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
      await transporter.sendMail({
        from: '"MentorMatch" <no-reply@mentormatch.com>',
        to: email,
        subject: 'Your Magic Link to Login',
        html: `Click <a href="${magicLink}">here</a> to login. This link expires in 24 hours.`
      });
    }

    res.json({
      message: 'Magic link sent',
      demo_token: token,
      user: userData
    });
  } catch (error) {
    console.error('Error sending magic link:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

// Get current user
app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, profile_completed, created_at')
      .eq('id', req.user.userId)
      .single();

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get all users (admin)
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

// Messages endpoint with crisis detection
app.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { match_id, content } = req.body;
    const sender_id = req.user.userId;

    // Run crisis detection
    const crisisResult = detectCrisis(content);

    // Save message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        match_id,
        sender_id,
        content,
        crisis_alert: crisisResult.is_crisis && crisisResult.severity === 'high'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...message,
      crisis_alert: crisisResult.is_crisis && crisisResult.severity === 'high',
      crisis_details: crisisResult
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages for a match
app.get('/messages/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Matching endpoint
app.post('/api/match', async (req, res) => {
  try {
    const { junior_id } = req.body;

    if (!junior_id) {
      return res.status(400).json({ error: 'junior_id is required' });
    }

    // Get junior profile
    const { data: juniorProfile, error: juniorError } = await supabase
      .from('junior_profiles')
      .select('*')
      .eq('user_id', junior_id)
      .single();

    if (juniorError) {
      if (juniorError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Junior profile not found' });
      }
      throw juniorError;
    }

    // Get all senior profiles
    const { data: seniorProfiles, error: seniorError } = await supabase
      .from('senior_profiles')
      .select('*');

    if (seniorError) throw seniorError;

    if (!seniorProfiles || seniorProfiles.length === 0) {
      return res.json({ 
        matches: [], 
        fallback: "no_matches", 
        message: "You're on the waitlist" 
      });
    }

    // Get rejected matches count for this junior
    const { data: rejectedMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('junior_id', junior_id)
      .eq('status', 'rejected');

    const rejectedCount = rejectedMatches?.length || 0;

    if (rejectedCount >= 2) {
      return res.json({ 
        matches: [], 
        fallback: "admin_escalation", 
        message: "Your matches require manual review" 
      });
    }

    // Calculate match scores
    const matches = seniorProfiles.map(senior => {
      let rawScore = 0;
      const reasons = [];

      // Problem match (30%)
      if (juniorProfile.problem && senior.expertise) {
        const problemKeywords = juniorProfile.problem.toLowerCase().split(/\s+/);
        const expertiseKeywords = senior.expertise.toLowerCase().split(/\s+/);
        const matchCount = problemKeywords.filter(k => expertiseKeywords.includes(k)).length;
        const problemScore = Math.min(30, matchCount * 10);
        rawScore += problemScore;
        if (problemScore > 0) {
          reasons.push(`${problemScore}% problem match`);
        }
      }

      // Industry match (20%)
      if (juniorProfile.industry === senior.industry) {
        rawScore += 20;
        reasons.push('20% industry match');
      } else if (juniorProfile.industry && senior.industry) {
        rawScore += 5;
        reasons.push('5% related industry match');
      }

      // Timezone/language match (15%)
      const languageMatch = juniorProfile.preferred_language && senior.languages?.includes(juniorProfile.preferred_language);
      if (languageMatch) {
        rawScore += 15;
        reasons.push('15% language match');
      }

      // Success rate (15%)
      const successScore = Math.round((senior.success_rate / 100) * 15;
      rawScore += successScore;
      reasons.push(`${successScore}% success rate match`);

      // Experience match (10%)
      const experienceDiff = Math.abs(juniorProfile.years_experience - senior.years_experience);
      if (experienceDiff >= 10) {
        rawScore += 10;
        reasons.push('10% experience level match');
      } else if (experienceDiff >= 5) {
        rawScore += 5;
        reasons.push('5% experience level match');
      }

      // Preferences match (10%)
      rawScore += 10;
      reasons.push('10% preferences match');

      // Apply availability multiplier
      const availabilityMultiplier = 
        senior.available_within <= 24 ? 1.0 :
        senior.available_within <= 72 ? 0.7 : 0.3;
      
      const totalScore = Math.min(100, Math.round(rawScore * availabilityMultiplier));

      return {
        id: senior.user_id,
        name: senior.name || 'Senior Mentor',
        industry: senior.industry,
        years_experience: senior.years_experience,
        match_score: totalScore,
        match_reasons: reasons,
        bio: senior.bio || `${senior.industry} expert with ${senior.years_experience} years experience`,
        success_rate: senior.success_rate,
        available_within: senior.available_within
      };
    });

    // Sort by match score descending
    const sortedMatches = matches.sort((a, b) => b.match_score - a.match_score).slice(0, 5);

    // Check for low confidence
    const topScore = sortedMatches[0]?.match_score || 0;
    if (topScore < 70) {
      return res.json({ 
        matches: sortedMatches, 
        fallback: "low_confidence" 
      });
    }

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
