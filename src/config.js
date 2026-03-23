
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
    'India',
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
    'mobile application',
    'app developer',
    'ios developer',
    'android developer',
    'cross platform',
    'cross-platform',
    'ai engineer',
    'gen ai developer',
    'gen ai engineer',
    'react developer',
    'react engineer',
    'react js',
    'reactjs',
    'frontend developer',
    'front-end developer',
    'front end developer',
    'frontend engineer',
    'front-end engineer',
    'front end engineer',
    'software engineer',
    'software developer',
    'fullstack',
    'full stack',
    'full-stack',
    'javascript',
    'web developer',
    'programmer',
    'mern',
  ],

  // ─────────────────────────────────────────────
  // JOB TITLE BLACKLIST
  // Bot will SKIP if job title contains any of these
  // ─────────────────────────────────────────────
  blockedTitles: [
    '/$',
    'salesforce',
    'java',
    'blockchain',
    'wordpress',
    'php',
    'ruby',
    'c++',
    'c software',
    'devops',
    'data engineer',
    'machine learning',
    'qa engineer',
    'test engineer',
    'astrology',
    'go',
    'Senior Program Analyst'
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
      'javascript': { years: 2, months: 0 },
      'typescript': { years: 2, months: 0 },
      'node.js': { years: 2, months: 0 },
      'nodejs': { years: 2, months: 0 },
      'node': { years: 2, months: 0 },
      'mongodb': { years: 2, months: 0 },
      'aws': { years: 2, months: 0 },
      'amazon web services': { years: 2, months: 0 },
      'python': { years: 2, months: 0 },
      'fastapi': { years: 2, months: 0 },
      'git': { years: 2, months: 0 },
      'github': { years: 2, months: 0 },
      'rest api': { years: 2, months: 0 },
      'rest apis': { years: 2, months: 0 },
      'restful': { years: 2, months: 0 },
      'firebase': { years: 2, months: 0 },
      'redux': { years: 2, months: 0 },
      'html': { years: 2, months: 0 },
      'html5': { years: 2, months: 0 },
      'css': { years: 2, months: 0 },
      'css3': { years: 2, months: 0 },
      'next.js': { years: 2, months: 0 },
      'nextjs': { years: 2, months: 0 },
      'next': { years: 2, months: 0 },
      'saas': { years: 2, months: 0 },
      'software as a service': { years: 2, months: 0 },
      'express': { years: 2, months: 0 },
      'express.js': { years: 2, months: 0 },
      'angular': { years: 2, months: 0 },
      'vue': { years: 2, months: 0 },
      'flutter': { years: 2, months: 0 },
      'graphql': { years: 2, months: 0 },
      'docker': { years: 2, months: 0 },
      'sql': { years: 2, months: 0 },
      'mysql': { years: 2, months: 0 },
      'postgresql': { years: 2, months: 0 },
      'postgres': { years: 2, months: 0 },
      'tailwind': { years: 2, months: 0 },
      'jest': { years: 2, months: 0 },
      'ci/cd': { years: 2, months: 0 },
      'jira': { years: 2, months: 0 },
      'openai': { years: 2, months: 0 },
      'gen ai': { years: 2, months: 0 },
      'ai': { years: 2, months: 0 },
      'google cloud': { years: 2, months: 0 },
      'gcp': { years: 2, months: 0 },
      'tailwindcss': { years: 2, months: 0 },
      'material ui': { years: 2, months: 0 },
      'figma': { years: 2, months: 0 },
    },

    // Contact & personal
    phone: '9834350501',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pinCode: '400001',

    // Work preferences
    noticePeriodDays: 30,
    expectedSalary: 13.0,
    currentSalary: 6.0,
    workPreference: 'Hybrid',
    willingToRelocate: 'Yes',
    authorizedToWork: 'Yes',
    requireSponsorship: 'No',

    // Education
    education: "Bachelor of Science in Information Technology, Vedanta College Mumbai (CGPA: 8.81)",
    languages: 'English, Hindi',

    // Links
    linkedinUrl: 'https://linkedin.com/in/nelsonpinto007',
    portfolioUrl: 'https://nelsportfolio.netlify.app/',
    githubUrl: 'https://github.com/NelsonNpinto',

    // Diversity (shown on some applications)
    gender: 'Male',
    veteran: 'No',
    disability: 'No',

    // Full resume context — used by AI for open-ended textarea questions
    resumeSummary: `
Nelson Pinto — Full-Stack Developer | React Native | React.js | iOS & Android | Gen AI | Mumbai

EDUCATION
Bachelor of Science in Information Technology, Vedanta College Mumbai, CGPA: 8.81

WORK EXPERIENCE

Software Engineer — Ai-Tech-Tures-Lab (Feb 2025 – Present)
- Developed and deployed responsive web applications and cross-platform mobile apps (iOS & Android) using React.js, React Native, Tailwind CSS, and Material UI, serving 1,000+ end users.
- Integrated custom RESTful APIs enabling real-time data sync between frontend and server-side systems, reducing data latency by 30%.
- Developed AI-powered chatbots using OpenAI APIs and LLM frameworks, automating 60% of customer interaction workflows and improving user engagement by 45%.

React.js Developer Intern — Daynil Group Solutions Pvt Ltd (Aug 2024 – Nov 2024)
- Designed 20+ modular, reusable React.js components for 4+ client-facing web applications, reducing development time by 35%.
- Converted 15+ Figma mockups into pixel-perfect, responsive UIs using React.js, HTML5, CSS3, Bootstrap, and Ant Design, cutting design-to-code turnaround by 30%.
- Integrated 10+ RESTful APIs using Axios and React Query, reducing API-related bugs by 25%.
- Improved web application performance by 40% through code splitting, lazy loading, and React hooks optimization.

Prior Authorization Specialist — Datamatrix Technologies Inc. (Feb 2023 – Feb 2025)
- Managed end-to-end prior authorization workflows for US healthcare clients with 98% compliance.
- Trained and onboarded 10+ new joiners, reducing ramp-up time by 30%.

PROJECTS

Excel Forecasting Web Application (ReactJS, Redux Toolkit, Recharts, TailwindCSS, Vite)
- Built responsive React dashboard for retail inventory forecasting with dynamic data visualization.
- Implemented Redux Toolkit state management for multi-sheet forecast data and bulk editing interfaces.

OccurAI – Health & Wellness Mobile App (React Native, TypeScript, Firebase, Apple HealthKit, Google Health Connect)
- Built full-featured iOS/Android app integrating Apple HealthKit and Google Health Connect for real-time health data sync.
- Engineered Firebase backend with authentication, real-time messaging, and push notifications achieving 99.9% uptime.

TECHNICAL SKILLS
ReactJS, React Native, JavaScript, TypeScript, Python, AWS, MongoDB, Express.js, Firebase, Gen AI, Redux, Tailwind CSS, Android Studio, Xcode, Git & GitHub, REST APIs, OpenAI APIs, Node.js, FastAPI, GraphQL, Docker, SQL, PostgreSQL

CERTIFICATIONS
- React Developer Certification — NamasteDev.com (Jan 2025)
- MERN Stack Development Certification — Itvedant Education Pvt. Ltd. (Sep 2024)
    `.trim(),
  },
};