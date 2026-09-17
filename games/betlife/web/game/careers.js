// The career catalog: every career is a path with a ladder of positions. Original BetLife content.
//
// requires: { minAge, diploma: true/false, degree: [majors] or null, trade: [trades] or null,
//             smartsInstead: a Smarts level that can replace the degree (0 = never) }
// ladder: positions from entry level upward; minYears is the tenure needed at that rung before
// a promotion to the next one can happen.

function path(id, name, category, employer, requires, ladder, extra = {}) {
  return { id, name, category, employer, requires: { minAge: 18, diploma: true, degree: null, trade: null, credential: null, smartsInstead: 0, smarts: 0, looks: 0, health: 0, ...requires },
    ladder: ladder.map(([title, salary, minYears = 3]) => ({ title, salary, minYears })), partTime: false, ...extra };
}

export const CAREERS = [
  // Part-time work for students (no ladder, hourly work summed into a yearly amount)
  path('babysitter', 'Babysitting', 'Part-time', 'Neighborhood families', { minAge: 15, diploma: false }, [['Babysitter', 3500]], { partTime: true }),
  path('cashier', 'Cashier', 'Part-time', 'Maple Street Market', { minAge: 16, diploma: false }, [['Part-time Cashier', 6000]], { partTime: true }),
  path('tutor', 'Tutoring', 'Part-time', 'Bright Owl Tutoring', { minAge: 16, diploma: false, smartsInstead: 65 }, [['Peer Tutor', 5000]], { partTime: true }),
  path('lifeguard', 'Lifeguard', 'Part-time', 'Sunny Cove Pool', { minAge: 16, diploma: false }, [['Lifeguard', 5500]], { partTime: true }),

  // No diploma required
  path('retail', 'Retail', 'Retail', 'Maple Street Market', { minAge: 16, diploma: false },
    [['Retail Associate', 23000, 2], ['Shift Supervisor', 29000, 3], ['Store Manager', 41000, 4], ['District Manager', 58000]]),
  path('food', 'Food Service', 'Restaurant', 'Copper Kettle Diner', { minAge: 16, diploma: false },
    [['Line Cook', 24000, 2], ['Kitchen Lead', 31000, 3], ['Restaurant Manager', 44000]]),
  path('delivery', 'Delivery', 'Logistics', 'Northwind Logistics', { minAge: 18, diploma: false },
    [['Delivery Driver', 27000, 2], ['Route Supervisor', 35000, 3], ['Fleet Manager', 49000]]),
  path('warehouse', 'Warehouse', 'Logistics', 'Northwind Logistics', { minAge: 18, diploma: false },
    [['Warehouse Worker', 26000, 2], ['Team Lead', 33000, 3], ['Operations Manager', 52000]]),
  path('fitness', 'Fitness', 'Recreation', 'Ridgeline Fitness', { minAge: 18, diploma: false },
    [['Gym Attendant', 22000, 2], ['Personal Trainer', 34000, 3], ['Head Coach', 47000]]),

  // High school diploma
  path('office', 'Office Administration', 'Corporate', 'Summit Partners', { minAge: 18 },
    [['Office Assistant', 29000, 2], ['Administrative Coordinator', 37000, 3], ['Office Manager', 50000, 4], ['Operations Director', 72000]]),
  path('sales', 'Sales', 'Corporate', 'Lumen Solar', { minAge: 18 },
    [['Sales Associate', 30000, 2], ['Account Executive', 44000, 3], ['Sales Manager', 63000, 4], ['Regional Sales Director', 90000]]),
  path('publicService', 'City Services', 'Public Service', 'City of Harborview', { minAge: 18 },
    [['City Clerk', 31000, 2], ['Program Coordinator', 41000, 3], ['Department Supervisor', 56000, 4], ['City Administrator', 78000]]),
  path('firefighter', 'Fire Service', 'Public Service', 'Harborview Fire Department', { minAge: 19 },
    [['Firefighter', 38000, 3], ['Fire Lieutenant', 50000, 4], ['Fire Captain', 66000, 5], ['Battalion Chief', 84000]]),
  path('hospitality', 'Hospitality', 'Hospitality', 'Grand Lantern Hotel', { minAge: 18 },
    [['Front Desk Agent', 27000, 2], ['Guest Services Lead', 35000, 3], ['Hotel Manager', 55000]]),

  // Trades (trade certificate, or plenty of hands-on smarts)
  path('electrician', 'Electrical', 'Trades', 'Volt & Vine Electric', { minAge: 18, trade: ['Electrical'], smartsInstead: 70 },
    [['Apprentice Electrician', 32000, 2], ['Electrician', 47000, 4], ['Master Electrician', 66000, 4], ['Electrical Contractor', 88000]]),
  path('chef', 'Culinary Arts', 'Restaurant', 'The Saffron Table', { minAge: 18, trade: ['Culinary'], smartsInstead: 60 },
    [['Prep Cook', 26000, 2], ['Sous Chef', 40000, 3], ['Head Chef', 58000, 4], ['Executive Chef', 80000]]),
  path('mechanic', 'Automotive', 'Trades', 'Piston Brothers Garage', { minAge: 18, trade: ['Automotive'], smartsInstead: 65 },
    [['Apprentice Mechanic', 30000, 2], ['Mechanic', 43000, 3], ['Master Technician', 58000, 4], ['Shop Owner', 76000]]),

  // Degrees
  path('software', 'Software', 'Technology', 'Pixel Harbor Software', { degree: ['Computer Science', 'Engineering'], smartsInstead: 92 },
    [['Junior Developer', 52000, 2], ['Developer', 68000, 3], ['Senior Developer', 92000, 4], ['Lead Developer', 118000, 4], ['Engineering Manager', 145000]]),
  path('data', 'Data Analysis', 'Technology', 'Bluefield Analytics', { degree: ['Computer Science', 'Business', 'Engineering'], smartsInstead: 90 },
    [['Junior Analyst', 46000, 2], ['Data Analyst', 60000, 3], ['Senior Analyst', 80000, 4], ['Head of Analytics', 110000]]),
  path('accounting', 'Accounting', 'Finance', 'Ledger & Lane', { degree: ['Business'], smartsInstead: 88 },
    [['Junior Accountant', 44000, 2], ['Accountant', 58000, 3], ['Senior Accountant', 76000, 4], ['Finance Director', 105000]]),
  path('marketing', 'Marketing', 'Corporate', 'Brightwave Media', { degree: ['Business', 'Communications', 'Arts'], smartsInstead: 85 },
    [['Marketing Assistant', 38000, 2], ['Marketing Specialist', 50000, 3], ['Marketing Manager', 70000, 4], ['Marketing Director', 98000]]),
  path('teaching', 'Teaching', 'Education', 'Riverside School District', { degree: ['Education', 'Arts', 'Biology'] },
    [['Teaching Assistant', 32000, 2], ['Teacher', 46000, 4], ['Senior Teacher', 58000, 5], ['Principal', 82000]]),
  path('nursing', 'Nursing', 'Healthcare', 'Cedar Grove Hospital', { degree: ['Nursing', 'Biology'] },
    [['Nursing Assistant', 36000, 2], ['Registered Nurse', 60000, 4], ['Charge Nurse', 76000, 4], ['Nursing Director', 98000]]),
  path('research', 'Laboratory Research', 'Science', 'Bluefield Labs', { degree: ['Biology', 'Engineering'], smartsInstead: 90 },
    [['Lab Assistant', 37000, 2], ['Research Associate', 52000, 3], ['Scientist', 74000, 4], ['Principal Scientist', 104000]]),
  path('civil', 'Civil Engineering', 'Engineering', 'Keystone Infrastructure', { degree: ['Engineering'] },
    [['Engineer I', 50000, 2], ['Engineer II', 64000, 3], ['Senior Engineer', 86000, 4], ['Chief Engineer', 115000]]),
  path('design', 'Graphic Design', 'Creative', 'Lantern Studio', { degree: ['Arts', 'Communications'], smartsInstead: 80 },
    [['Junior Designer', 36000, 2], ['Designer', 48000, 3], ['Art Director', 70000, 4], ['Creative Director', 95000]]),
  path('journalism', 'Journalism', 'Media', 'The Harbor Herald', { degree: ['Communications', 'Arts'], smartsInstead: 84 },
    [['Junior Reporter', 34000, 2], ['Reporter', 45000, 3], ['Senior Correspondent', 62000, 4], ['Editor-in-Chief', 88000]]),
  path('library', 'Library Science', 'Education', 'Harborview Public Library', { degree: ['Education', 'Arts', 'Communications'] },
    [['Library Assistant', 30000, 2], ['Librarian', 44000, 4], ['Head Librarian', 60000]]),

  // Professional schools (a credential from Graduate, Law, Medical or Business school)
  path('law', 'Law', 'Law Firm', 'Halloran & Reyes LLP', { credential: ['Law'] },
    [['Junior Associate', 78000, 2], ['Associate', 105000, 3], ['Senior Associate', 140000, 4], ['Partner', 210000]]),
  path('medicine', 'Medicine', 'Healthcare', 'Cedar Grove Hospital', { credential: ['Medicine'] },
    [['Resident Physician', 62000, 3], ['Attending Physician', 160000, 4], ['Senior Physician', 210000, 5], ['Chief of Medicine', 260000]]),
  path('executive', 'Management', 'Corporate', 'Summit Partners', { credential: ['MBA'] },
    [['Management Associate', 70000, 2], ['Department Manager', 95000, 3], ['Vice President', 140000, 4], ['Chief Operating Officer', 200000]]),
  path('professor', 'Academia', 'Education', 'Harborview University', { credential: ['Master\'s'] },
    [['Lecturer', 52000, 3], ['Assistant Professor', 68000, 4], ['Professor', 92000, 5], ['Department Chair', 115000]]),

  // Military branches: enlist from 18 with a diploma and decent health
  path('army', 'Army', 'Military', 'Harbor Republic Army', { health: 55 },
    [['Private', 28000, 2], ['Corporal', 34000, 3], ['Sergeant', 42000, 4], ['Lieutenant', 56000, 4], ['Captain', 72000, 5], ['Major', 90000]], { military: true, tagline: 'Defend the land' }),
  path('airForce', 'Air Force', 'Military', 'Harbor Republic Air Force', { health: 55, smarts: 50 },
    [['Airman', 29000, 2], ['Senior Airman', 35000, 3], ['Technical Sergeant', 44000, 4], ['Flight Lieutenant', 60000, 4], ['Squadron Leader', 78000, 5], ['Wing Commander', 96000]], { military: true, tagline: 'Defend the skies' }),
  path('navy', 'Navy', 'Military', 'Harbor Republic Navy', { health: 55 },
    [['Seaman', 28000, 2], ['Petty Officer', 35000, 3], ['Chief Petty Officer', 45000, 4], ['Lieutenant', 58000, 4], ['Commander', 76000, 5], ['Captain', 95000]], { military: true, tagline: 'Defend the sea' }),
  path('marines', 'Marines', 'Military', 'Harbor Republic Marines', { health: 65 },
    [['Private', 28000, 2], ['Lance Corporal', 33000, 3], ['Sergeant', 43000, 4], ['Lieutenant', 57000, 4], ['Major', 88000]], { military: true, tagline: 'First on the beach' }),
  path('coastGuard', 'Coast Guard', 'Military', 'Harbor Republic Coast Guard', { health: 50 },
    [['Seaman Recruit', 27000, 2], ['Boatswain', 34000, 3], ['Chief', 44000, 4], ['Lieutenant', 56000, 4], ['Commander', 74000]], { military: true, tagline: 'Guard the coastline' }),

  // Dream careers: rare paths that need talent (stats) rather than a diploma
  path('actor', 'Acting', 'Dream', 'Lantern Street Theatre', { diploma: false, minAge: 16, looks: 60 },
    [['Extra', 12000, 2], ['Supporting Actor', 30000, 3], ['Lead Actor', 90000, 4], ['Screen Star', 260000]], { dream: true, tagline: 'Lights, camera, action' }),
  path('athlete', 'Athletics', 'Dream', 'Harborview Comets', { diploma: false, minAge: 16, health: 80 },
    [['Rookie', 24000, 2], ['Starter', 60000, 3], ['Team Captain', 140000, 4], ['League All-Star', 300000]], { dream: true, tagline: 'Play for the Harborview Comets' }),
  path('musician', 'Music', 'Dream', 'Clef & Fret Records', { diploma: false, minAge: 16, smarts: 45 },
    [['Session Musician', 15000, 2], ['Touring Musician', 36000, 3], ['Recording Artist', 95000, 4], ['Headliner', 220000]], { dream: true, tagline: 'Make a living from music' }),
  path('writer', 'Writing', 'Dream', 'Harbor Herald Press', { diploma: false, minAge: 18, smarts: 70 },
    [['Columnist', 22000, 2], ['Author', 45000, 4], ['Bestselling Author', 120000]], { dream: true, tagline: 'Write for a living' }),
  path('astronaut', 'Space Program', 'Dream', 'Harbor Space Agency', { degree: ['Engineering', 'Computer Science', 'Biology'], smarts: 85, health: 75 },
    [['Astronaut Candidate', 70000, 3], ['Mission Specialist', 105000, 4], ['Mission Commander', 150000]], { dream: true, tagline: 'Reach for the stars' }),
  path('politician', 'Politics', 'Dream', 'Harborview City Council', { minAge: 25, smarts: 60 },
    [['Council Member', 48000, 4], ['Deputy Mayor', 82000, 4], ['Mayor', 130000]], { dream: true, tagline: 'Run for office' }),
];

export function findCareer(id) {
  return CAREERS.find((c) => c.id === id) || null;
}

export const CATEGORIES = [...new Set(CAREERS.filter((c) => !c.partTime && !c.military && !c.dream).map((c) => c.category))].sort();
export const MILITARY = CAREERS.filter((c) => c.military);
export const DREAM = CAREERS.filter((c) => c.dream);
export const REGULAR = CAREERS.filter((c) => !c.partTime && !c.military && !c.dream);

export function meetsRequirements(career, player, education) {
  const r = career.requires;
  if (player.age < r.minAge) return false;
  if (r.diploma && !education.highSchoolGraduate) return false;
  const smartEnough = r.smartsInstead > 0 && player.smarts >= r.smartsInstead;
  if (r.degree && !(education.degree && r.degree.includes(education.degree)) && !smartEnough) return false;
  if (r.trade && !(education.trade && r.trade.includes(education.trade)) && !smartEnough) return false;
  if (r.credential && !(education.credentials || []).some((c) => r.credential.includes(c))) return false;
  if (r.smarts && player.smarts < r.smarts) return false;
  if (r.looks && player.looks < r.looks) return false;
  if (r.health && player.health < r.health) return false;
  return true;
}

export function requirementText(career) {
  const r = career.requires;
  const parts = [];
  if (r.credential) parts.push(`${r.credential[0]} school`);
  else if (r.degree) parts.push(`${r.degree.length === 1 ? r.degree[0] : 'Related'} degree`);
  else if (r.trade) parts.push(`${r.trade[0]} certificate`);
  else if (r.diploma) parts.push('High school diploma');
  else parts.push(`Age ${r.minAge}+`);
  if (r.smartsInstead > 0 && (r.degree || r.trade)) parts.push(`or Smarts ${r.smartsInstead}+`);
  const stats = [];
  if (r.smarts) stats.push(`Smarts ${r.smarts}+`); if (r.looks) stats.push(`Looks ${r.looks}+`); if (r.health) stats.push(`Health ${r.health}+`);
  if (stats.length) parts.push(`· ${stats.join(', ')}`);
  return parts.join(' ');
}
