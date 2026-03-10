require('dotenv').config();
const { google } = require('googleapis');
const { log } = require('./helpers');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH;

// Authenticate with Google
const getAuthClient = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return await auth.getClient();
};

// Append a new row when a job is applied
const logApplication = async ({ date, company, role, location, jobUrl, status, aiUsed, notes }) => {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const row = [date, company, role, location, jobUrl, status, aiUsed, notes || ''];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    log(`Logged to Sheets: ${company} — ${role}`);
  } catch (error) {
    log(`Google Sheets error: ${error.message}`, 'ERROR');
  }
};

// Check if a job URL was already applied to (avoid duplicates)
const isAlreadyApplied = async (jobUrl) => {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!E:E', // Job URL column
    });

    const urls = (res.data.values || []).flat();
    return urls.includes(jobUrl);
  } catch (error) {
    log(`Sheets duplicate check error: ${error.message}`, 'ERROR');
    return false;
  }
};

module.exports = { logApplication, isAlreadyApplied };