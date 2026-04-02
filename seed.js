require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function seed() {
  console.log('Starting data seeding...');

  // Clear existing data
  await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('senior_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('junior_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert juniors
  const juniors = [
    { email: 'junior1@test.com', role: 'junior', profile_completed: true },
    { email: 'junior2@test.com', role: 'junior', profile_completed: true },
    { email: 'junior3@test.com', role: 'junior', profile_completed: true },
    { email: 'junior4@test.com', role: 'junior', profile_completed: true },
    { email: 'junior5@test.com', role: 'junior', profile_completed: true }
  ];

  const { data: insertedJuniors, error: juniorError } = await supabase
    .from('users')
    .insert(juniors)
    .select('id, email');

  if (juniorError) {
    console.error('Error inserting juniors:', juniorError);
    return;
  }

  console.log('Inserted juniors:', insertedJuniors.length);

  // Insert junior profiles
  const juniorProfiles = [
    {
      user_id: insertedJuniors.find(u => u.email === 'junior1@test.com').id,
      industry: 'Technology',
      years_experience: 3,
      problem: 'AI is replacing my coding job',
      preferred_language: 'English',
      timezone: 'UTC-8'
    },
    {
      user_id: insertedJuniors.find(u => u.email === 'junior2@test.com').id,
      industry: 'Marketing',
      years_experience: 7,
      problem: 'Worried about AI content tools',
      preferred_language: 'English',
      timezone: 'UTC-5'
    },
    {
      user_id: insertedJuniors.find(u => u.email === 'junior3@test.com').id,
      industry: 'Design',
      years_experience: 5,
      problem: 'Clients using AI art instead of hiring me',
      preferred_language: 'Spanish',
      timezone: 'UTC-6'
    },
    {
      user_id: insertedJuniors.find(u => u.email === 'junior4@test.com').id,
      industry: 'Finance',
      years_experience: 10,
      problem: 'Automation taking over bookkeeping',
      preferred_language: 'English',
      timezone: 'UTC-4'
    },
    {
      user_id: insertedJuniors.find(u => u.email === 'junior5@test.com').id,
      industry: 'Education',
      years_experience: 8,
      problem: 'Students using AI to cheat, questioning my value',
      preferred_language: 'English',
      timezone: 'UTC+1'
    }
  ];

  const { error: juniorProfileError } = await supabase
    .from('junior_profiles')
    .insert(juniorProfiles);

  if (juniorProfileError) {
    console.error('Error inserting junior profiles:', juniorProfileError);
    return;
  }

  console.log('Inserted junior profiles');

  // Insert seniors
  const seniors = [
    { email: 'senior1@test.com', role: 'senior', profile_completed: true },
    { email: 'senior2@test.com', role: 'senior', profile_completed: true },
    { email: 'senior3@test.com', role: 'senior', profile_completed: true },
    { email: 'senior4@test.com', role: 'senior', profile_completed: true },
    { email: 'senior5@test.com', role: 'senior', profile_completed: true }
  ];

  const { data: insertedSeniors, error: seniorError } = await supabase
    .from('users')
    .insert(seniors)
    .select('id, email');

  if (seniorError) {
    console.error('Error inserting seniors:', seniorError);
    return;
  }

  console.log('Inserted seniors:', insertedSeniors.length);

  // Insert senior profiles
  const seniorProfiles = [
    {
      user_id: insertedSeniors.find(u => u.email === 'senior1@test.com').id,
      name: 'John Smith',
      industry: 'Technology',
      years_experience: 15,
      expertise: 'AI transition, upskilling, career pivot',
      bio: 'Senior Engineer with 15 years experience, helping teams transition to AI',
      success_rate: 95,
      available_within: 24,
      languages: ['English']
    },
    {
      user_id: insertedSeniors.find(u => u.email === 'senior2@test.com').id,
      name: 'Sarah Anderson',
      industry: 'Technology',
      years_experience: 18,
      expertise: 'engineering management, AI strategy',
      bio: 'Engineering Manager who led 3 AI transformation initiatives at FAANG',
      success_rate: 92,
      available_within: 48,
      languages: ['English']
    },
    {
      user_id: insertedSeniors.find(u => u.email === 'senior3@test.com').id,
      name: 'Maria Garcia',
      industry: 'Marketing',
      years_experience: 12,
      expertise: 'digital marketing, AI tools adoption',
      bio: 'Marketing director with 12 years experience, helping teams adopt AI tools',
      success_rate: 88,
      available_within: 24,
      languages: ['English', 'Spanish']
    },
    {
      user_id: insertedSeniors.find(u => u.email === 'senior4@test.com').id,
      name: 'David Chen',
      industry: 'Finance',
      years_experience: 20,
      expertise: 'automation, fintech, career reinvention',
      bio: 'CFO with 20 years experience, helping finance professionals navigate automation',
      success_rate: 96,
      available_within: 72,
      languages: ['English', 'Mandarin']
    },
    {
      user_id: insertedSeniors.find(u => u.email === 'senior5@test.com').id,
      name: 'Emily Taylor',
      industry: 'Education',
      years_experience: 14,
      expertise: 'edtech, curriculum design, AI in education',
      bio: 'Education consultant with 14 years experience, helping schools integrate AI',
      success_rate: 90,
      available_within: 24,
      languages: ['English']
    }
  ];

  const { error: seniorProfileError } = await supabase
    .from('senior_profiles')
    .insert(seniorProfiles);

  if (seniorProfileError) {
    console.error('Error inserting senior profiles:', seniorProfileError);
    return;
  }

  console.log('Inserted senior profiles');
  console.log('✅ Seeding completed successfully!');
}

seed().catch(console.error);
