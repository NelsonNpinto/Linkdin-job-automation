require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const { getAIAnswer, PROFILE } = require('./ai');
const { logApplication, isAlreadyApplied, isCompanyAlreadyApplied } = require('./sheets');
// const { notifyJobApplied, notifyError, notifyBotStarted, notifyRunComplete } = require('./telegram');
const { sleep, log, sanitize } = require('./helpers');
const CONFIG = require('./config');
const failedJobs = new Set();

const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL;
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD;

// Build all search combinations: each keyword × each location
const buildAllSearches = () => {
  const searches = [];
  for (const keywords of CONFIG.jobSearchKeywords) {
    for (const location of CONFIG.jobLocations) {
      searches.push({ keywords, location });
    }
  }
  return searches;
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
const loginToLinkedIn = async (page) => {
  if (fs.existsSync('./session.json')) {
    log('Session found — going directly to feed');
    await page.goto('https://www.linkedin.com/feed', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000, 3000);
    const url = page.url();
    if (url.includes('/feed') || url.includes('/mynetwork')) {
      log('Session valid — already logged in');
      return;
    }
    log('Session expired — need to login again');
  }

  log('Navigating to LinkedIn login...');
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000, 5000);

  const currentUrl = page.url();
  if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
    log('Already logged in');
    return;
  }

  // Wait for login form to be visible — try multiple selectors
  const loginSelectors = ['#username', 'input[name="session_key"]', 'input[autocomplete="username"]', 'input[type="email"]'];
  let usernameField = null;
  try {
    for (const sel of loginSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 15000, state: 'visible' });
        usernameField = sel;
        break;
      } catch { continue; }
    }
    if (!usernameField) throw new Error('No username field found');
    log('Login form loaded');
  } catch (err) {
    // Try reloading once
    log('Login form not found — reloading page...', 'WARN');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000, 5000);
    try {
      await page.waitForSelector('#username, input[name="session_key"]', { timeout: 15000, state: 'visible' });
      usernameField = '#username';
      log('Login form loaded after reload');
    } catch {
      log(`Login form not found — current URL: ${page.url()}`, 'ERROR');
      throw new Error('Could not find login form. LinkedIn might have changed or is showing a different page.');
    }
  }

  await page.fill(usernameField, LINKEDIN_EMAIL);
  await sleep(500, 1000);
  const passwordSelectors = ['#password', 'input[name="session_password"]', 'input[type="password"]'];
  for (const sel of passwordSelectors) {
    try { await page.fill(sel, LINKEDIN_PASSWORD); break; } catch { continue; }
  }
  await sleep(500, 1000);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await sleep(3000, 5000);

  const afterUrl = page.url();
  if (afterUrl.includes('checkpoint') || afterUrl.includes('challenge')) {
    throw new Error('LinkedIn is asking for verification — solve it manually first');
  }
  log('Logged in successfully');
};

// ─────────────────────────────────────────────
// BUILD SEARCH URL
// ─────────────────────────────────────────────
const buildSearchUrl = (keywords, location) => {
  const params = new URLSearchParams({
    keywords,
    location,
    f_AL: 'true',                           // Easy Apply only
    f_TPR: CONFIG.datePostedFilter,         // Last 24 hours
    f_E: CONFIG.experienceLevelFilter,      // Experience level
    f_WT: '1,2,3',                          // On-site, Remote, Hybrid
    sortBy: 'R',                            // Most RELEVANT first (not DD=date)
  });
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
};

// ─────────────────────────────────────────────
// TITLE FILTER
// ─────────────────────────────────────────────
const isJobRelevant = (title) => {
  const t = title.toLowerCase();

  // Check blacklist — word-boundary matching so 'java' doesn't block 'javascript'
  const isBlocked = CONFIG.blockedTitles.some(word => {
    const w = word.toLowerCase();
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`).test(t);
    } catch {
      return t.includes(w);
    }
  });
  if (isBlocked) return false;

  // Check whitelist
  const isAllowed = CONFIG.allowedTitles.some(word => t.includes(word.toLowerCase()));
  return isAllowed;
};

// ─────────────────────────────────────────────
// GET JOB LISTINGS
// ─────────────────────────────────────────────
const getJobListings = async (page) => {
  try {
    await page.waitForSelector(
      '.jobs-search__results-list, .scaffold-layout__list, ul.jobs-search-results__list',
      { timeout: 10000 }
    );
  } catch {
    log('No job listings container found', 'WARN');
    return [];
  }

  await sleep(2000, 3000);

  // Progressive scroll to load ALL jobs on current page
  let previousHeight = 0;
  let scrollAttempts = 0;
  const MAX_SCROLL_ATTEMPTS = 5;

  while (scrollAttempts < MAX_SCROLL_ATTEMPTS) {
    const currentHeight = await page.evaluate(() => {
      const list = document.querySelector('.jobs-search__results-list, ul.jobs-search-results__list');
      if (list) {
        list.scrollTo(0, list.scrollHeight);
        return list.scrollHeight;
      }
      return 0;
    });

    await sleep(1500, 2000);

    // If height hasn't changed, all jobs are loaded
    if (currentHeight === previousHeight) {
      log(`All jobs loaded on page (height: ${currentHeight}px)`);
      break;
    }

    previousHeight = currentHeight;
    scrollAttempts++;
  }

  const jobs = await page.evaluate(() => {
    const cards = document.querySelectorAll(
      'li.jobs-search-results__list-item, .job-card-container--clickable'
    );
    return Array.from(cards).map(card => {
      const titleEl = card.querySelector(
        '.job-card-list__title--link, .job-card-container__link, a[data-control-name="job_card_title"]'
      );
      const companyEl = card.querySelector(
        '.job-card-container__company-name, .artdeco-entity-lockup__subtitle span'
      );
      const locationEl = card.querySelector(
        '.job-card-container__metadata-item, .artdeco-entity-lockup__caption li'
      );
      const linkEl = card.querySelector('a[href*="/jobs/view/"]');

      return {
        title: titleEl?.innerText?.trim() || titleEl?.textContent?.trim() || 'Unknown Role',
        company: companyEl?.innerText?.trim() || 'Unknown Company',
        location: locationEl?.innerText?.trim() || 'Unknown Location',
        url: linkEl?.href?.split('?')[0] || '',
      };
    });
  });

  const validJobs = jobs.filter(j => j.url.includes('/jobs/view/'));
  log(`Found ${validJobs.length} job listings`);
  return validJobs;
};

// ─────────────────────────────────────────────
// HANDLE SINGLE FORM FIELD
// ─────────────────────────────────────────────
const handleFormField = async (page, field, jobTitle, company) => {
  try {
    // Try label/legend first, then LinkedIn's span-based labels, then aria-label on the input
    let questionText = '';
    const labelEl = await field.$('label, legend, .fb-form-element__label-title, .jobs-easy-apply-form-element__label, span[data-test-form-label]');
    if (labelEl) {
      questionText = (await labelEl.innerText()).trim();
    }
    if (!questionText) {
      // Fallback: aria-label on the first interactive element
      const anyInput = await field.$('select, input, textarea');
      if (anyInput) questionText = (await anyInput.getAttribute('aria-label') || '').trim();
    }
    if (!questionText) return;

    log(`Field: "${questionText.substring(0, 70)}"`);

    const dateInput   = await field.$('input[type="date"]');
    const checkboxes  = await field.$$('input[type="checkbox"]');
    const radioButtons = await field.$$('input[type="radio"]');
    const select      = await field.$('select');
    const textarea    = await field.$('textarea');
    const textInput   = await field.$('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], input:not([type])');

    if (dateInput) {
      // ── Date fields ──────────────────────────────────────────
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      await dateInput.fill(today);
      await dateInput.dispatchEvent('input');
      await dateInput.dispatchEvent('change');
      await sleep(300, 500);

    } else if (checkboxes.length > 0) {
      // ── Checkboxes (consent, terms, agreements) ──────────────
      for (const cb of checkboxes) {
        const isChecked = await cb.isChecked().catch(() => false);
        if (!isChecked) {
          await cb.check().catch(() => cb.click());
          await sleep(200, 400);
        }
      }

    } else if (radioButtons.length > 0) {
      // ── Radio buttons ────────────────────────────────────────
      const { answer } = await getAIAnswer(questionText, jobTitle, company);
      const answerLower = answer.toLowerCase();
      let clicked = false;

      for (const radio of radioButtons) {
        const radioId = await radio.getAttribute('id');
        const radioLabel = radioId ? await page.$(`label[for="${radioId}"]`) : null;
        const labelText = radioLabel ? (await radioLabel.innerText()).toLowerCase() : '';
        if (labelText && (labelText.includes(answerLower) || answerLower.includes(labelText))) {
          // Use JS click to bypass label pointer-event intercept
          await radio.evaluate(el => el.click());
          clicked = true;
          await sleep(300, 500);
          break;
        }
      }
      if (!clicked) {
        await radioButtons[0].evaluate(el => el.click());
        await sleep(300, 500);
      }

    } else if (select) {
      // ── Native <select> dropdowns ────────────────────────────
      // Skip only if a real (non-placeholder) option is selected
      const currentSelectVal = await select.inputValue().catch(() => '');
      if (currentSelectVal && currentSelectVal.trim() !== '') {
        const selectedText = await select.$eval(
          'option:checked', el => el.textContent.trim().toLowerCase()
        ).catch(() => '');
        const isPlaceholder = !selectedText ||
          selectedText.includes('select') || selectedText.includes('choose') || selectedText.includes('pick');
        if (!isPlaceholder) {
          log(`Skipping pre-filled select: "${questionText.substring(0, 40)}"`);
          return;
        }
      }

      const options = await select.$$eval('option', opts =>
        opts.map(o => ({ value: o.value, text: o.innerText.trim() })).filter(o => {
          const t = o.text.toLowerCase();
          return o.value && o.value !== '' &&
            !t.includes('select') && !t.includes('choose') && !t.includes('pick') && t !== '';
        })
      );
      if (options.length > 0) {
        const { answer } = await getAIAnswer(questionText, jobTitle, company);
        const answerLower = answer.toLowerCase();
        const match = options.find(o =>
          o.text.toLowerCase().includes(answerLower) || answerLower.includes(o.text.toLowerCase())
        );
        // Default to first real option (not placeholder) if no match found
        const selectedValue = match ? match.value : options[0].value;
        log(`Select option: "${match ? match.text : options[0].text}"`);
        await select.selectOption(selectedValue);
        // Fire native bubbling events so React/LinkedIn's validation triggers
        await select.evaluate(el => {
          el.dispatchEvent(new Event('input',  { bubbles: true, cancelable: true }));
          el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          el.dispatchEvent(new Event('blur',   { bubbles: true, cancelable: true }));
        });
        await sleep(300, 600);
      }

    } else if (textInput || textarea) {
      // ── Text / number / textarea ─────────────────────────────
      const el = textInput || textarea;
      const inputType = await el.getAttribute('type');
      const role = await el.getAttribute('role');

      // Skip pre-filled ONLY for personal contact info — not experience/skill/rating fields
      const qLower = questionText.toLowerCase();
      const isPersonalInfo = (
        qLower.includes('first name') || qLower.includes('last name') || qLower.includes('full name') ||
        qLower.includes('email') || qLower.includes('phone') || qLower.includes('mobile')
      );
      const isExperienceOrSkill = (
        qLower.includes('years') || qLower.includes('experience') || qLower.includes('how many') ||
        qLower.includes('rate') || qLower.includes('how long') || qLower.includes('how soon') ||
        qLower.includes('notice') || qLower.includes('salary') || qLower.includes('ctc') || qLower.includes('offer')
      );
      if (!textarea && inputType !== 'number' && isPersonalInfo && !isExperienceOrSkill) {
        const currentValue = await el.inputValue().catch(() => '');
        if (currentValue && currentValue.trim() !== '') {
          log(`Skipping pre-filled: "${questionText.substring(0, 40)}" = "${currentValue.substring(0, 30)}"`);
          return;
        }
      }

      // Structured fields (experience/salary/notice/rating) → rules first, AI fallback if no rule matches
      // Open-ended fields (non-structured, non-personal) → AI reads question and answers from resume
      // Personal info → rules only (exact values from profile)
      const useAI = textarea || (!isPersonalInfo && !isExperienceOrSkill);
      const { answer, aiUsed } = await getAIAnswer(questionText, jobTitle, company, useAI);
      log(`Answer (${aiUsed}): "${answer}"`);

      let finalAnswer = String(answer);

      if (inputType === 'number') {
        const numericMatch = finalAnswer.match(/[\d.]+/);
        finalAnswer = numericMatch ? numericMatch[0] : String(PROFILE.experienceYears);
      }

      await el.click({ clickCount: 3 });
      await sleep(200, 400);
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');
      await sleep(100, 200);
      await el.fill(finalAnswer);
      await el.dispatchEvent('input');
      await el.dispatchEvent('change');
      await sleep(400, 700);

      // ── Typeahead / combobox — pick first suggestion if it appears ──
      if (role === 'combobox' || inputType === 'text') {
        try {
          const suggestion = await page.waitForSelector(
            '[role="option"], [role="listbox"] li, .basic-typeahead__selectable',
            { timeout: 1500 }
          );
          if (suggestion) {
            await suggestion.click();
            await sleep(300, 500);
          }
        } catch {
          // No dropdown appeared — typed value is fine
        }
      }
    }

  } catch (err) {
    log(`Field error: ${err.message}`, 'WARN');
  }
};

// ─────────────────────────────────────────────
// UNCHECK FOLLOW COMPANY CHECKBOX
// ─────────────────────────────────────────────
const uncheckFollowCompany = async (page) => {
  try {
    // Use JS evaluate to bypass label pointer-event intercept
    const unchecked = await page.evaluate(() => {
      const cb =
        document.querySelector('#follow-company-checkbox') ||
        document.querySelector('input[type="checkbox"][id*="follow"]') ||
        document.querySelector('input[type="checkbox"][name*="follow"]');
      if (cb && cb.checked) {
        cb.checked = false;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
        cb.dispatchEvent(new Event('input',  { bubbles: true }));
        return true;
      }
      return false;
    });
    if (unchecked) log('Unchecked follow company checkbox');
  } catch (err) {
    log(`Could not uncheck follow: ${err.message}`, 'WARN');
  }
};

// ─────────────────────────────────────────────
// CLICK EASY APPLY BUTTON
// ─────────────────────────────────────────────
const clickEasyApply = async (page, jobTitle) => {
  const selectors = [
    'button.jobs-apply-button',
    'button[aria-label*="Easy Apply"]',
    'button[aria-label*="easy apply"]',
    '.jobs-apply-button--top-card',
    'button:has-text("Easy Apply")',
  ];

  for (const selector of selectors) {
    try {
      const btn = await page.waitForSelector(selector, { timeout: 4000, state: 'visible' });
      if (btn) {
        await btn.scrollIntoViewIfNeeded();
        await sleep(500, 1000);
        await btn.click();
        log(`Clicked Easy Apply: ${jobTitle}`);
        return true;
      }
    } catch {
      continue;
    }
  }

  log(`No Easy Apply button: ${jobTitle}`, 'WARN');
  return false;
};

// ─────────────────────────────────────────────
// APPLY TO A SINGLE JOB
// ─────────────────────────────────────────────
const applyToJob = async (page, job) => {
  log(`\n--- Applying: ${job.title} at ${job.company} (${job.location}) ---`);

  await page.goto(job.url, { waitUntil: 'domcontentloaded' });
  await sleep(2000, 4000);

  const clicked = await clickEasyApply(page, job.title);
  if (!clicked) return { success: false };

  await sleep(2000, 3000);

  let aiUsed = 'Rules';
  let stepCount = 0;
  const MAX_STEPS = 8;

  while (stepCount < MAX_STEPS) {
    stepCount++;
    await sleep(1000, 1500);

    // Check if submitted
    const submitted = await page.$(
      [
        'h3:has-text("application was sent")',
        'h3:has-text("Your application was sent")',
        '[aria-label*="submitted"]',
        '.artdeco-inline-feedback--success',
        '.jobs-easy-apply-content--submitted',
        'div:has-text("Application submitted")',
        'span:has-text("application was sent")',
      ].join(', ')
    ).catch(() => null);
    if (submitted) {
      await uncheckFollowCompany(page);
      await sleep(500, 800);
      log(`✅ Submitted: ${job.title} at ${job.company}`);
      return { success: true, aiUsed };
    }

    // Fill all fields on current step
    const formGroups = await page.$$(
      '.jobs-easy-apply-form-section__grouping, ' +
      '.fb-form-element, ' +
      '.jobs-easy-apply-form-element, ' +
      '[data-test-form-element], ' +
      '.fb-dash-form-element, ' +
      '.jobs-easy-apply-form-section__grouping'
    );
    for (const field of formGroups) {
      await handleFormField(page, field, job.title, job.company);
    }

    // Uncheck follow company on every step (it appears on review/final step)
    await uncheckFollowCompany(page);

    await sleep(500, 1000);

    // Navigate
    const submitBtn = await page.$('button[aria-label="Submit application"]').catch(() => null);
    const reviewBtn = await page.$('button[aria-label="Review your application"]').catch(() => null);
    const nextBtn = await page.$('button[aria-label="Continue to next step"]').catch(() => null);

    if (submitBtn) {
      await submitBtn.click();
      await sleep(2000, 3000);
      await uncheckFollowCompany(page);
      await sleep(500, 800);
      return { success: true, aiUsed };
    } else if (reviewBtn) {
      await reviewBtn.click();
      await sleep(1500, 2500);
    } else if (nextBtn) {
      await nextBtn.click();
      await sleep(1500, 2500);
      // Check for validation errors — if still on same step, stop
      const hasError = await page.$('.artdeco-inline-feedback--error, [data-test-form-element-error], .fb-form-element__error-text').catch(() => null);
      if (hasError) {
        log(`Validation error on step ${stepCount} — cannot advance, marking as failed`, 'WARN');
        break;
      }
    } else {
      try {
        await page.click('button:has-text("Submit application")', { timeout: 2000 });
        await sleep(2000, 3000);
        await uncheckFollowCompany(page);
        await sleep(500, 800);
        return { success: true, aiUsed };
      } catch {
        try {
          await page.click('button:has-text("Next")', { timeout: 2000 });
          await sleep(1500, 2000);
        } catch {
          log('No navigation button — ending application', 'WARN');
          break;
        }
      }
    }
  }

  return { success: false, aiUsed };
};

// ─────────────────────────────────────────────
// PAGINATION HELPER
// ─────────────────────────────────────────────
const hasNextPage = async (page) => {
  const nextBtn = await page.$('button[aria-label="View next page"], li.artdeco-pagination__indicator--number.active + li button').catch(() => null);
  return nextBtn !== null;
};

const goToNextPage = async (page) => {
  try {
    const nextBtn = await page.$('button[aria-label="View next page"], li.artdeco-pagination__indicator--number.active + li button');
    if (nextBtn) {
      await nextBtn.scrollIntoViewIfNeeded();
      await sleep(500, 1000);
      await nextBtn.click();
      await sleep(3000, 5000);
      return true;
    }
  } catch (err) {
    log(`Pagination error: ${err.message}`, 'WARN');
  }
  return false;
};

// ─────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────
const run = async () => {
  const allSearches = buildAllSearches();
  log('=== LinkedIn Bot Starting ===');
  log(`Searches: ${allSearches.length} combinations (${CONFIG.jobSearchKeywords.length} keywords × ${CONFIG.jobLocations.length} cities)`);
  // await notifyBotStarted();

  const sessionExists = fs.existsSync('./session.json');
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    ...(sessionExists && { storageState: './session.json' }),
  });

  const page = await context.newPage();
  let totalApplied = 0;

  try {
    await loginToLinkedIn(page);

    for (const search of allSearches) {
      if (totalApplied >= CONFIG.maxApplicationsPerRun) {
        log(`Reached max applications: ${CONFIG.maxApplicationsPerRun}`);
        break;
      }

      log(`\n=== Searching: "${search.keywords}" in ${search.location} ===`);
      await page.goto(buildSearchUrl(search.keywords, search.location), { waitUntil: 'domcontentloaded' });
      await sleep(3000, 5000);

      let pageNum = 1;
      const MAX_PAGES = 10;

      while (pageNum <= MAX_PAGES && totalApplied < CONFIG.maxApplicationsPerRun) {
        log(`\n--- Page ${pageNum} ---`);
        const jobs = await getJobListings(page);

        for (const job of jobs) {
          if (totalApplied >= CONFIG.maxApplicationsPerRun) break;
          if (!job.url) continue;

          // Title filter
          if (!isJobRelevant(job.title)) {
            log(`Skipping irrelevant: "${job.title}"`);
            continue;
          }

          // Duplicate check (URL)
          const alreadyDone = await isAlreadyApplied(job.url);
          if (alreadyDone) {
            log(`Already applied: "${job.title}" — skipping`);
            continue;
          }

          // Duplicate check (Company)
          const companyDone = await isCompanyAlreadyApplied(job.company);
          if (companyDone) {
            log(`Already applied to company: "${job.company}" — skipping`);
            continue;
          }

          // Skip if previously failed
          if (failedJobs.has(job.url)) {
            log(`Skipping previously failed job: "${job.title}"`);
            continue;
          }

          let result;
          try {
            // Timeout the entire application after 90 seconds
            result = await Promise.race([
              applyToJob(page, job),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Application timeout — took too long')), 90000)
              )
            ]);
          } catch (applyError) {
            log(`Job failed/timed out: "${job.title}" — ${applyError.message}`, 'WARN');
            failedJobs.add(job.url);

            // Persist failed job to Sheets so it's skipped in future runs
            await logApplication({
              date: new Date().toLocaleDateString('en-IN'),
              company: job.company,
              role: job.title,
              location: job.location,
              jobUrl: job.url,
              status: 'Failed',
              aiUsed: 'N/A',
              notes: `Failed: ${applyError.message}`,
            }).catch(() => {});

            // Close any open modal before moving to next job
            try {
              const dismissBtn = await page.$('button[aria-label="Dismiss"], button[aria-label="Cancel"]');
              if (dismissBtn) {
                await dismissBtn.click();
                await sleep(1000, 2000);
                // Confirm discard if LinkedIn asks
                const discardBtn = await page.$('button[data-control-name="discard_application_confirm_btn"], button:has-text("Discard")');
                if (discardBtn) await discardBtn.click();
              }
            } catch {
              // If modal close fails, navigate away to reset state
              await page.goto('https://www.linkedin.com/jobs', { waitUntil: 'domcontentloaded' });
            }

            await sleep(2000, 3000);
            continue; // Move to next job
          }

          if (result && !result.success) {
            log(`Application unsuccessful: "${job.title}" at ${job.company} — logging as Failed`);
            await logApplication({
              date: new Date().toLocaleDateString('en-IN'),
              company: job.company,
              role: job.title,
              location: job.location,
              jobUrl: job.url,
              status: 'Failed',
              aiUsed: result.aiUsed || 'N/A',
              notes: 'Application did not complete',
            }).catch(() => {});
          }

          if (result?.success) {
            totalApplied++;
            log(`Session total: ${totalApplied}/${CONFIG.maxApplicationsPerRun}`);

            await logApplication({
              date: new Date().toLocaleDateString('en-IN'),
              company: job.company,
              role: job.title,
              location: job.location,
              jobUrl: job.url,
              status: 'Applied',
              aiUsed: result.aiUsed,
              notes: `${search.keywords} | ${search.location}`,
            });

            // await notifyJobApplied({
            //   title: job.title,
            //   company: job.company,
            //   location: job.location,
            //   jobUrl: job.url,
            //   aiUsed: result.aiUsed,
            // });

            await sleep(8000, 15000); // Human-like gap
          }
        }

        // Check if we've hit the limit
        if (totalApplied >= CONFIG.maxApplicationsPerRun) {
          log(`Reached ${CONFIG.maxApplicationsPerRun} applications — stopping pagination`);
          break;
        }

        // Try to go to next page
        if (await hasNextPage(page)) {
          log('Moving to next page...');
          const moved = await goToNextPage(page);
          if (moved) {
            pageNum++;
          } else {
            log('Could not navigate to next page — ending search', 'WARN');
            break;
          }
        } else {
          log('No more pages available');
          break;
        }
      }

      await sleep(3000, 6000); // Gap between searches
    }

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'ERROR');
    // await notifyError(error.message);
  } finally {
    // await notifyRunComplete(totalApplied);
    await browser.close();
    log(`\n=== Done. Applied to ${totalApplied} jobs this session ===`);
  }
};

run();