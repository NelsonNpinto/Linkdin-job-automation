
module.exports = {

  // ─────────────────────────────────────────────
  // JOB SEARCH SETTINGS
  // ─────────────────────────────────────────────

  // Keywords to search on LinkedIn (one search per entry)
  jobSearchKeywords: [
    'React Native Developer',
    'React Native Engineer',
    'Mobile Developer React Native',
    ' React Native',
    ' Reactjs developer',
  ],

  // Locations to search in (one search per location)
  jobLocations: [
    'Mumbai, Maharashtra, India',
  ],

  // Max applications per bot run (across all searches)
  maxApplicationsPerRun: 10,

  // Only apply to jobs posted within this time window
  // r86400 = 24 hours | r604800 = 7 days | r2592000 = 30 days
  datePostedFilter: 'r2592000',

  // Experience level filters (comma separated)
  // 1 = Internship | 2 = Entry level | 3 = Associate | 4 = Mid-Senior | 5 = Director
  experienceLevelFilter: '2,3',

  // ─────────────────────────────────────────────
  // JOB TITLE WHITELIST
  // Bot will ONLY apply if job title contains one of these keywords
  // All lowercase — add/remove as needed
  // ─────────────────────────────────────────────
  allowedTitles: [
    'react native',
    'react-native',
    'mobile developer',
    'mobile engineer',
    'ios developer',
    'android developer',
    'cross platform',
    'cross-platform',
    'ai engineer',
    'gen ai developer',
      'react developer',      // ← add this
  'react engineer',       // ← add this
  'frontend developer',   // ← add this
  'front-end developer',  // ← add this
  'mern', 

  ],

  // ─────────────────────────────────────────────
  // JOB TITLE BLACKLIST
  // Bot will SKIP if job title contains any of these
  // ─────────────────────────────────────────────
  blockedTitles: [
    'salesforce',
    // 'java',
    // 'blockchain',
    // 'wordpress',
    // 'php',
    // 'ruby',
    // 'c++',
    // 'c software',
    // 'vue',
    // 'devops',
    // 'data engineer',
    // 'machine learning',
    // 'qa engineer',
    // 'test engineer',
    // 'astrology',

  ],

  // ─────────────────────────────────────────────
  // YOUR PROFILE — Used by AI to answer questions
  // ─────────────────────────────────────────────
  profile: {
    name: 'Nelson Pinto',
    currentRole: 'React Native Developer',
    experienceYears: 2,

    // Per-skill experience (years, months)
    // Format: { years: X, months: Y }
    skillExperience: {
      'android': { years: 2, months: 0 },
      'Android': { years: 2, months: 0 },
      'android developer': { years: 2, months: 0 },
      'android development': { years: 2, months: 0 },
      'react native': { years: 2, months: 0 },
      'ios': { years: 2, months: 0 },
      'ios developer': { years: 2, months: 0 },
      'ios development': { years: 2, months: 0 },
      'react': { years: 2, months: 0 },
      'react.js': { years: 2, months: 0 },
      'reactjs': { years: 2, months: 0 },
      'javascript': { years: 2, months: 6 },
      'typescript': { years: 1, months: 6 },
      'node.js': { years: 2, months: 0 },
      'nodejs': { years: 2, months: 0 },
      'node': { years: 2, months: 0 },
      'mongodb': { years: 2, months: 0 },
      'aws': { years: 1, months: 6 },
      'amazon web services': { years: 1, months: 6 },
      'python': { years: 1, months: 0 },
      'fastapi': { years: 1, months: 0 },
      'ios': { years: 2, months: 0 },
      'android': { years: 2, months: 0 },
      'git': { years: 2, months: 0 },
      'rest api': { years: 2, months: 0 },
      'firebase': { years: 1, months: 6 },
      'redux': { years: 1, months: 6 },
      'html': { years: 3, months: 0 },
      'css': { years: 3, months: 0 },
      'next.js': { years: 2, months: 0 },
      'nextjs': { years: 2, months: 0 },
      'next': { years: 2, months: 0 },
      'saas': { years: 2, months: 0 },
      'software as a service': { years: 2, months: 0 },
      'express': { years: 2, months: 0 },
      'express.js': { years: 2, months: 0 },
      'angular': { years: 1, months: 0 },
      'vue': { years: 1, months: 0 },
      'flutter': { years: 1, months: 0 },
      'graphql': { years: 1, months: 6 },
      'docker': { years: 1, months: 0 },
      'sql': { years: 2, months: 0 },
      'mysql': { years: 2, months: 0 },
      'postgresql': { years: 1, months: 6 },
      'postgres': { years: 1, months: 6 },
      'tailwind': { years: 2, months: 0 },
      'jest': { years: 1, months: 6 },
      'ci/cd': { years: 1, months: 0 },
      'jira': { years: 2, months: 0 },
    },

    // Contact & personal
    phone: '9834350501',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pinCode: '400001',

    // Work preferences
    noticePeriodDays: 30,
    expectedSalary: 8.0,
    currentSalary: 6.0,
    workPreference: 'Hybrid',
    willingToRelocate: 'Yes',
    authorizedToWork: 'Yes',
    requireSponsorship: 'No',

    // Education
    education: "Bachelor's in Computer Science",
    languages: 'English, Hindi',

    // Links
    linkedinUrl: '',
    portfolioUrl: 'https://nelsportfolio.netlify.app/',
    githubUrl: '',

    // Diversity (shown on some applications)
    gender: 'Male',
    veteran: 'No',
    disability: 'No',
  },
};