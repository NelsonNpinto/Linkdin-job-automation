require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { log } = require('./helpers');
const CONFIG = require('../src/config');

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROFILE = CONFIG.profile;

// ─────────────────────────────────────────────
// ANSWER CACHE
// ─────────────────────────────────────────────
const answerCache = new Map();

// ─────────────────────────────────────────────
// EXPERIENCE HELPER
// Returns "2 years 0 months" or just "2" based on question format
// ─────────────────────────────────────────────
const getExperienceAnswer = (question) => {
  const q = question.toLowerCase();
  const skillMap = PROFILE.skillExperience;

  // Find which skill is being asked about
  let matchedExp = null;
  for (const [skill, exp] of Object.entries(skillMap)) {
    if (q.includes(skill)) {
      matchedExp = exp;
      break;
    }
  }

  // Default to total experience if no specific skill matched
  if (!matchedExp) {
    matchedExp = { years: PROFILE.experienceYears, months: 0 };
  }

  // Detect answer format expected
  const wantsMonths = q.includes('month') || q.includes('months');
  const wantsYearsAndMonths = q.includes('year') && q.includes('month');

  if (wantsYearsAndMonths) {
    return `${matchedExp.years} years ${matchedExp.months} months`;
  } else if (wantsMonths) {
    // Convert to total months
    return String((matchedExp.years * 12) + matchedExp.months);
  } else {
    // Just years
    return String(matchedExp.years);
  }
};

// ─────────────────────────────────────────────
// RULE-BASED ANSWERS — zero API calls needed
// ─────────────────────────────────────────────
const getRuleBasedAnswer = (question) => {
  const q = question.toLowerCase().trim();

  // Experience questions — smart detection
  if (
    q.includes('years of experience') ||
    q.includes('years experience') ||
    q.includes('years of work experience') ||
    q.includes('years of professional') ||
    q.includes('professional work experience') ||
    q.includes('number of years') ||
    q.includes('how many years') ||
    q.includes('how long have you') ||
    (q.includes('experience') && q.includes('with'))
  ) {
    return getExperienceAnswer(question);
  }

  // Name fields — must be before catch-all
  if (q === 'first name' || q.includes('first name')) return PROFILE.name.split(' ')[0];
  if (q === 'last name'  || q.includes('last name'))  return PROFILE.name.split(' ').slice(-1)[0];
  if (q === 'full name'  || q.includes('full name'))  return PROFILE.name;

  // Contact / personal info
  if (q.includes('email')) return process.env.LINKEDIN_EMAIL || '';
  if (q.includes('phone country code') || q.includes('country code')) return 'India (+91)';
  if (q.includes('phone') || q.includes('mobile') || q.includes('contact number')) {
    return process.env.PHONE_NUMBER || PROFILE.phone || '';
  }
  if (q.includes('current city') || q.includes('your city')) return PROFILE.city;
  if (q.includes('location (city)') || q.includes('location(city)')) return PROFILE.city;
  if (q.includes('city') && !q.includes('which city')) return PROFILE.city;
  if (q.includes('state') && !q.includes('united states')) return PROFILE.state;
  if (q.includes('country')) return PROFILE.country;
  if (q.includes('pin code') || q.includes('zip') || q.includes('postal')) return PROFILE.pinCode;

  // Consent / privacy policy agreement
  if (
    q.includes('privacy policy') ||
    q.includes('data processing') ||
    q.includes('by clicking') ||
    q.includes('agree to our') ||
    q.includes('i agree') ||
    q.includes('accurate information') ||
    (q.includes('agree') && q.includes('policy'))
  ) return 'Yes';

  // Citizenship / nationality
  if (q.includes('indian citizen') || q.includes('citizen of india') || q.includes('are you a citizen')) return 'Yes';

  // Location acceptance
  if (
    (q.includes('ok with') && q.includes('location')) ||
    (q.includes('okay with') && q.includes('location')) ||
    q.includes('specified job location') ||
    q.includes('comfortable with the location') ||
    (q.includes('location') && q.includes('relocation'))
  ) return 'Yes';

  // Preferred work location
  if (q.includes('preferred location') || q.includes('preferred work location') || q.includes('location to work')) return PROFILE.city;

  // Work authorization
  if (q.includes('authorized to work') || q.includes('work authorization') || q.includes('legally authorized')) return 'Yes';
  if (q.includes('require') && q.includes('sponsorship')) return 'No';
  if (q.includes('visa') && q.includes('sponsor')) return 'No';
  if (q.includes('work permit')) return 'Yes';

  // Salary & notice — always return as decimal numbers
  if (q.includes('expected salary') || q.includes('salary expectation') || q.includes('desired salary') ||
      q.includes('expected ctc') || q.includes('salary range') || q.includes('annual salary') ||
      q.includes('salary expectations') || q.includes('what is your salary') || q.includes('ctc expectation')) {
    return String(PROFILE.expectedSalary);
  }
  if (q.includes('current salary') || q.includes('current ctc') || q.includes('current compensation') ||
      (q.includes('current') && q.includes('ctc')) || (q.includes('current') && q.includes('salary'))) {
    return String(PROFILE.currentSalary);
  }
  if (
    q.includes('notice period') || q.includes('notice (in days)') || q.includes('notice(days)') ||
    q.includes('days is your notice') || q.includes('how soon can you') || q.includes('when can you join') ||
    q.includes('available to join') || q.includes('available to start') || q.includes('joining time') ||
    q.includes('when are you available') || (q.includes('join') && q.includes('days'))
  ) {
    return String(PROFILE.noticePeriodDays);
  }

  // Remote / relocation / commuting
  if (q.includes('willing to relocate') || q.includes('open to relocation')) return PROFILE.willingToRelocate;
  if (q.includes('remote') && (q.includes('work') || q.includes('comfortable') || q.includes('open'))) return 'Yes';
  if (q.includes('work from home') || q.includes('wfh')) return 'Yes';
  if (q.includes('hybrid')) return 'Yes';
  if (q.includes('commut') || q.includes('onsite') || q.includes('on-site') || q.includes('on site')) return 'Yes';

  // Skills / tools
  if (q.includes('familiar with') || q.includes('experience with') || q.includes('worked with')) return 'Yes';
  if (q.includes('proficient') || q.includes('knowledge of')) return 'Yes';
  if (q.includes('git') || q.includes('github') || q.includes('version control')) return 'Yes';
  if (q.includes('agile') || q.includes('scrum')) return 'Yes';

  // Education
  if (q.includes('bachelor') || q.includes('degree') || q.includes('graduate')) return 'Yes';
  if (q.includes('highest education') || q.includes('qualification')) return PROFILE.education;

  // Diversity
  if (q.includes('gender')) return PROFILE.gender;
  if (q.includes('veteran') || q.includes('military')) return PROFILE.veteran;
  if (q.includes('disability') || q.includes('disabled')) return PROFILE.disability;

  // Links
  if (q.includes('linkedin') && (q.includes('url') || q.includes('profile'))) {
    return process.env.LINKEDIN_URL || PROFILE.linkedinUrl || '';
  }
  if (q.includes('portfolio') || q.includes('website')) {
    return process.env.PORTFOLIO_URL || PROFILE.portfolioUrl || '';
  }
  if (q.includes('github')) return PROFILE.githubUrl || '';

  // Offer / competing offers
  if (q.includes('offer in hand') || q.includes('offer amount') || q.includes('competing offer') || q.includes('other offer')) return 'No';

  // Ratings out of 10 — return a confident number
  if ((q.includes('rate') || q.includes('rating') || q.includes('score')) &&
      (q.includes('out of 10') || q.includes('/10') || q.includes('out of ten'))) return '8';
  if (q.includes('rate') && (q.includes('skill') || q.includes('proficiency') || q.includes('expertise'))) return '8';

  // Generic yes/no
  if (q.includes('are you available') || q.includes('immediately available')) return 'Yes';
  if (q.includes('full time') || q.includes('full-time')) return 'Yes';
  if (q.includes('part time') || q.includes('part-time')) return 'No';
  if (q.includes('background check') || q.includes('drug test')) return 'Yes';
  if (q.includes('18 years') || q.includes('above 18')) return 'Yes';
  if (q.includes('currently employed')) return 'Yes';

  // ── Smart keyword fallback (no AI needed) ──────────────────
  // Experience / years keywords → return experience years
  if (
    q.includes('experience') ||
    q.includes('work exp') ||
    q.includes('years') ||
    q.includes('how long') ||
    q.includes('duration')
  ) {
    return String(PROFILE.experienceYears);
  }

  // Location / city / address keywords → return city
  if (
    q.includes('location') ||
    q.includes('city') ||
    q.includes('place') ||
    q.includes('address') ||
    q.includes('where') ||
    q.includes('based')
  ) {
    return PROFILE.city;
  }

  // Default → Yes (covers any remaining yes/no or consent questions)
  return 'Yes';
};

// ─────────────────────────────────────────────
// BUILD AI PROMPT
// ─────────────────────────────────────────────
const buildPrompt = (question, jobTitle, company) => `
You are filling out a job application on behalf of ${PROFILE.name} for a "${jobTitle}" role at "${company}".

=== RESUME ===
${PROFILE.resumeSummary}

=== ADDITIONAL DETAILS ===
- Current city: ${PROFILE.city}, ${PROFILE.country}
- Notice period: ${PROFILE.noticePeriodDays} days
- Expected salary: ${PROFILE.expectedSalary} LPA
- Work preference: ${PROFILE.workPreference}
- Authorized to work in India: ${PROFILE.authorizedToWork}
- Require sponsorship: ${PROFILE.requireSponsorship}
- Portfolio: ${PROFILE.portfolioUrl}
- GitHub: ${PROFILE.githubUrl}
- LinkedIn: ${PROFILE.linkedinUrl}

=== RULES ===
- Yes/No questions: reply ONLY "Yes" or "No"
- Number questions: reply ONLY the number (no units)
- Short text fields: max 2 sentences, first person, professional, based on the resume above
- Long text / cover letter: 3–4 sentences max, highlight relevant experience from the resume
- Never say you are an AI
- Never make up experience not in the resume

Question: "${question}"
Answer:`.trim();

// ─────────────────────────────────────────────
// GROQ (Primary)
// ─────────────────────────────────────────────
const askGroq = async (question, jobTitle, company) => {
  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: buildPrompt(question, jobTitle, company) }],
    max_tokens: 100,
    temperature: 0.3,
  });
  return completion.choices[0].message.content.trim();
};

// ─────────────────────────────────────────────
// GEMINI (Fallback)
// ─────────────────────────────────────────────
const askGemini = async (question, jobTitle, company) => {
  const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(buildPrompt(question, jobTitle, company));
  return result.response.text().trim();
};

// ─────────────────────────────────────────────
// MAIN — Cache → Rules → Groq → Gemini → Fallback
// ─────────────────────────────────────────────
const getAIAnswer = async (question, jobTitle = 'React Native Developer', company = 'the company', skipRules = false) => {
  const cacheKey = question.toLowerCase().trim();

  // 1. Cache
  if (answerCache.has(cacheKey)) {
    log(`Cache hit: "${question.substring(0, 50)}"`);
    return { answer: answerCache.get(cacheKey), aiUsed: 'Cache' };
  }

  // 2. Rules (skipped for open-ended textarea fields)
  if (!skipRules) {
    const ruleAnswer = getRuleBasedAnswer(question);
    if (ruleAnswer !== null && ruleAnswer !== '') {
      log(`Rule match: "${question.substring(0, 50)}" → "${ruleAnswer}"`);
      answerCache.set(cacheKey, ruleAnswer);
      return { answer: ruleAnswer, aiUsed: 'Rules' };
    }
  }

  // 3. Groq
  try {
    log(`Groq API call: "${question.substring(0, 60)}"`);
    const answer = await askGroq(question, jobTitle, company);
    answerCache.set(cacheKey, answer);
    return { answer, aiUsed: 'Groq' };
  } catch (groqError) {
    log(`Groq failed: ${groqError.message} — trying Gemini`, 'WARN');

    // 4. Gemini
    try {
      const answer = await askGemini(question, jobTitle, company);
      answerCache.set(cacheKey, answer);
      return { answer, aiUsed: 'Gemini' };
    } catch {
      log('Both AIs failed — using safe default', 'ERROR');
      return { answer: 'Yes', aiUsed: 'Fallback' };
    }
  }
};

module.exports = { getAIAnswer, PROFILE };