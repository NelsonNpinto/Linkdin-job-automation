const fs = require('fs');
const path = require('path');

// Human-like random delay between min and max milliseconds
const sleep = (min, max) => {
  const ms = max ? Math.floor(Math.random() * (max - min + 1)) + min : min;
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Logger — writes to console AND to logs/bot.log file
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${type}] ${message}`;
  console.log(formatted);

  const logPath = path.join(__dirname, '../logs/bot.log');
  fs.appendFileSync(logPath, formatted + '\n');
};

// Save a screenshot with a timestamped filename
const saveScreenshot = async (page, name) => {
  const timestamp = Date.now();
  const filePath = path.join(__dirname, `../screenshots/${name}_${timestamp}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  log(`Screenshot saved: ${filePath}`);
  return filePath;
};

// Sanitize text — remove emojis and special chars that break logs
const sanitize = (text) => {
  return text ? text.replace(/[^\x00-\x7F]/g, '').trim() : '';
};

module.exports = { sleep, log, saveScreenshot, sanitize };