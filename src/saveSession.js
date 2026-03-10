require('dotenv').config();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Opening LinkedIn login...');
  await page.goto('https://www.linkedin.com/login');

  console.log('');
  console.log('👉 Please log in manually in the browser window.');
  console.log('👉 Complete any verification/captcha if asked.');
  console.log('👉 Once you are on the LinkedIn feed, come back here and press ENTER.');
  console.log('');

  // Wait for you to press Enter
  await new Promise(resolve => process.stdin.once('data', resolve));

  // Save the session
  await context.storageState({ path: './session.json' });
  console.log('✅ Session saved to session.json');
  console.log('The bot will reuse this session from now on.');

  await browser.close();
  process.exit(0);
})();