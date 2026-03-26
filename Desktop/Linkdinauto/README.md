# LinkedIn Auto Apply Bot

Automated LinkedIn job application bot with AI-powered form filling.

## Quick Start

```bash
# Start both servers
./start.sh

# Then open http://localhost:5173 in your browser
```

## Setup Flow (4 Steps)

### Step 1: LinkedIn Credentials
- Enter your LinkedIn email and password
- These are stored locally on your machine only
- Click **Next**

### Step 2: Your Profile
- Fill in your personal details (name, phone, location, etc.)
- Add work preferences (salary, notice period, etc.)
- Paste your resume text (used by AI for cover letters)
- Most fields are auto-filled from your LinkedIn profile when possible
- Click **Next**

### Step 3: Job Search Settings
- **Search Keywords**: What jobs to search for (e.g., "Software Engineer", "React Developer")
- **Locations**: Where to search (e.g., "India", "Mumbai")
- **Filters**: Max applications per run, date posted, experience level
- **Whitelist**: Job titles that MUST be in the title to apply
- **Blacklist**: Keywords that will SKIP the job
- Click **Next**

### Step 4: API Keys
- **Groq API Key** (Required, FREE):
  1. Go to https://console.groq.com/keys
  2. Sign up with Google/GitHub (no credit card needed)
  3. Click "Create API Key"
  4. Copy the key (starts with `gsk_...`)
  5. Paste it in the form
  
- **Google Sheets** (Optional):
  - If you want to log jobs to a Google Sheet
  - Enter the Sheet ID from the URL
  - Requires Google Cloud service account setup (see below)

- Click **Start Applying** → Bot starts immediately

## How It Works

1. A Chrome browser opens on your machine (don't close it!)
2. Bot logs into LinkedIn with your credentials
3. Searches for jobs based on your keywords and locations
4. Filters jobs by title whitelist/blacklist
5. Clicks "Easy Apply" on matching jobs
6. AI answers application questions using your profile
7. Submits applications automatically
8. Logs everything in real-time

## Live Logs Page

- **Applied** ✅: Successfully submitted applications
- **Failed** ❌: Applications that couldn't be completed
- **Skipped** ⚠️: Jobs filtered out by your settings
- **Stop Bot**: Stops the bot gracefully
- **Auto-scroll**: Keeps logs scrolled to bottom

## Cost

**100% FREE** for normal usage:
- Groq: 14,400 free requests/day
- For 10 applications with ~5 AI questions each = ~50 calls
- Well within free limits

## Google Sheets Setup (Optional)

1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create a service account
4. Download credentials.json
5. Share your sheet with the service account email
6. Put the Sheet ID in Step 4

## Files

```
Linkdinauto/
├── backend/          # Express + Socket.io server
│   ├── server.js
│   └── data/
│       ├── config.json      # Your settings
│       ├── history.json     # Application history
│       └── session.json     # LinkedIn session
├── frontend/         # React + Tailwind UI
│   └── src/
│       ├── steps/    # 4-step wizard
│       └── pages/    # Logs page
├── linkedin-bot/     # Core automation
│   └── src/
│       ├── bot.js    # Main bot logic
│       ├── ai.js     # AI question answering
│       └── config.js # Config loader
└── start.sh          # Starts both servers
```

## Troubleshooting

**Bot won't start:**
- Make sure you completed all 4 setup steps
- Check that your LinkedIn credentials are correct
- Verify your Groq API key is valid

**LinkedIn asks for verification:**
- Complete it manually in the browser window
- The bot will wait for you to finish

**AI not answering questions:**
- Check that your Groq API key is set in Step 4
- Verify you have free API quota remaining

**Jobs not being applied to:**
- Check your whitelist/blacklist in Step 3
- Make sure keywords match actual job titles
- Try broader search keywords

## Support

For issues, check the logs page for error messages. The bot will show detailed logs of what it's doing.
