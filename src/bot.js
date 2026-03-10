require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const { getAIAnswer, PROFILE } = require('./ai');
const { logApplication, isAlreadyApplied } = require('./sheets');
const { notifyJobApplied, notifyError, notifyBotStarted, notifyRunComplete } = require('./telegram');
const { sleep, log, saveScreenshot, sanitize } = require('./helpers');
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

  // Wait for login form to be visible
  try {
    await page.waitForSelector('#username', { timeout: 10000, state: 'visible' });
    log('Login form loaded');
  } catch (err) {
    log(`Login form not found — current URL: ${page.url()}`, 'ERROR');
    throw new Error('Could not find login form. LinkedIn might have changed or is showing a different page.');
  }

  await page.fill('#username', LINKEDIN_EMAIL);
  await sleep(500, 1000);
  await page.fill('#password', LINKEDIN_PASSWORD);
  await sleep(500, 1000);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 });
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

  // Check blacklist first
  const isBlocked = CONFIG.blockedTitles.some(word => t.includes(word));
  if (isBlocked) return false;

  // Check whitelist
  const isAllowed = CONFIG.allowedTitles.some(word => t.includes(word));
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
    const labelEl = await field.$('label, legend');
    const questionText = labelEl ? (await labelEl.innerText()).trim() : '';
    if (!questionText) return;

    log(`Field: "${questionText.substring(0, 70)}"`);

    const textInput = await field.$('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], input:not([type])');
    const textarea = await field.$('textarea');
    const select = await field.$('select');
    const radioButtons = await field.$$('input[type="radio"]');

    if (textInput || textarea) {
      const el = textInput || textarea;

      // Clear and fill regardless of current value
      const inputType = await el.getAttribute('type');
      const { answer, aiUsed } = await getAIAnswer(questionText, jobTitle, company);
      log(`Answer (${aiUsed}): "${answer}"`);

      let finalAnswer = String(answer);

      // Force numeric for number inputs
      if (inputType === 'number') {
        const numericMatch = finalAnswer.match(/[\d.]+/);
        finalAnswer = numericMatch ? numericMatch[0] : String(PROFILE.experienceYears);
      }

      // Triple click to select all, then use keyboard to type (works better with React forms)
      await el.click({ clickCount: 3 });
      await sleep(200, 400);
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');
      await sleep(100, 200);
      await el.fill(finalAnswer);
      await el.dispatchEvent('input');   // Trigger LinkedIn's validation
      await el.dispatchEvent('change');  // Trigger LinkedIn's validation
      await sleep(400, 700);
    } else if (select) {
      const options = await select.$$eval('option', opts =>
        opts.map(o => ({ value: o.value, text: o.innerText.trim() })).filter(o => o.value && o.value !== '')
      );
      if (options.length > 0) {
        const { answer } = await getAIAnswer(questionText, jobTitle, company);
        const answerLower = answer.toLowerCase();
        const match = options.find(o =>
          o.text.toLowerCase().includes(answerLower) || answerLower.includes(o.text.toLowerCase())
        );
        await select.selectOption(match ? match.value : options[0].value);
        await sleep(300, 600);
      }

    } else if (radioButtons.length > 0) {
      const { answer } = await getAIAnswer(questionText, jobTitle, company);
      const answerLower = answer.toLowerCase();
      let clicked = false;

      for (const radio of radioButtons) {
        const radioId = await radio.getAttribute('id');
        const radioLabel = radioId ? await page.$(`label[for="${radioId}"]`) : null;
        const labelText = radioLabel ? (await radioLabel.innerText()).toLowerCase() : '';

        if (labelText && (labelText.includes(answerLower) || answerLower.includes(labelText))) {
          await radio.click();
          clicked = true;
          await sleep(300, 500);
          break;
        }
      }

      if (!clicked) await radioButtons[0].click();
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
    const checkbox = await page.$(
      'input[type="checkbox"][name*="follow"], ' +
      'input[type="checkbox"][id*="follow"], ' +
      'label:has-text("Follow") input[type="checkbox"]'
    ).catch(() => null);

    if (checkbox) {
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        await checkbox.uncheck();
        log('Unchecked follow company checkbox');
      }
      return;
    }

    // Fallback: find by label text containing "follow"
    const labels = await page.$$('label');
    for (const label of labels) {
      const text = (await label.innerText()).toLowerCase();
      if (text.includes('follow')) {
        const forAttr = await label.getAttribute('for');
        if (forAttr) {
          const cb = await page.$(`#${forAttr}`);
          if (cb && await cb.isChecked()) {
            await cb.uncheck();
            log('Unchecked follow company checkbox (by label)');
          }
        }
        break;
      }
    }
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
      await saveScreenshot(page, `applied_${sanitize(job.company)}`);
      return { success: true, aiUsed };
    }

    // Fill all fields on current step
    const formGroups = await page.$$(
      '.jobs-easy-apply-form-section__grouping, .fb-form-element, .jobs-easy-apply-form-element'
    );
    for (const field of formGroups) {
      await handleFormField(page, field, job.title, job.company);
    }

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
      await saveScreenshot(page, `applied_${sanitize(job.company)}`);
      return { success: true, aiUsed };
    } else if (reviewBtn) {
      await reviewBtn.click();
      await sleep(1500, 2500);
    } else if (nextBtn) {
      await nextBtn.click();
      await sleep(1500, 2500);
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
  await notifyBotStarted();

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

          // Duplicate check
          const alreadyDone = await isAlreadyApplied(job.url);
          if (alreadyDone) {
            log(`Already applied: "${job.title}" — skipping`);
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

            await notifyJobApplied({
              title: job.title,
              company: job.company,
              location: job.location,
              jobUrl: job.url,
              aiUsed: result.aiUsed,
            });

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
    await notifyError(error.message);
    await saveScreenshot(page, 'error');
  } finally {
    await notifyRunComplete(totalApplied);
    await browser.close();
    log(`\n=== Done. Applied to ${totalApplied} jobs this session ===`);
  }
};

run();