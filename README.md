# LinkedIn Job Automation Bot

🤖 Automated LinkedIn job applications with AI-powered form filling and pagination support.

## Features

- **Smart Job Filtering**: Automatically finds React Native and React.js positions
- **Pagination Support**: Scans multiple pages until 10 applications are completed  
- **AI-Powered Forms**: Answers experience, salary, and location questions accurately
- **Session Management**: Saves login sessions for faster subsequent runs
- **Telegram Notifications**: Real-time updates on application status
- **Progressive Scrolling**: Loads all jobs on each page before processing

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Configure your profile**
   - Edit `src/config.js` with your:
     - Experience years (currently 2 years)
     - Skills and experience levels
     - Location (Mumbai, India)
     - Salary expectations (6-8 LPA)

4. **Run the bot**
   ```bash
   npm start
   ```

## Environment Variables

```env
# LinkedIn Credentials
LINKEDIN_EMAIL=your_email@example.com
LINKEDIN_PASSWORD=your_password

# AI Services (choose one or both)
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Contact Info
PHONE_NUMBER=9834350501
LINKEDIN_URL=https://linkedin.com/in/yourprofile
PORTFOLIO_URL=https://yourportfolio.com
```

## Configuration

### Job Search Settings (`src/config.js`)

```javascript
// Keywords to search for
jobSearchKeywords: [
  'React Native Developer',
  'React Native Engineer', 
  'Mobile Developer React Native',
  'React Native',
  'Reactjs developer'
],

// Locations to search in
jobLocations: [
  'Mumbai, Maharashtra, India'
],

// Max applications per run
maxApplicationsPerRun: 10
```

### Experience Profile

The bot automatically answers experience questions based on your profile:

```javascript
skillExperience: {
  'react native': { years: 2, months: 0 },
  'react.js': { years: 2, months: 0 },
  'node.js': { years: 2, months: 0 },
  'next.js': { years: 2, months: 0 },
  // ... more skills
}
```

## How It Works

1. **Login**: Uses saved session or logs in with credentials
2. **Search**: Searches for React Native/React.js jobs in Mumbai
3. **Paginate**: Scrolls through all pages, loading jobs progressively
4. **Filter**: Skips irrelevant titles and already applied jobs
5. **Apply**: Fills forms with AI-powered answers
6. **Uncheck**: Automatically unchecks "follow company" checkboxes
7. **Notify**: Sends Telegram updates for each application

## Telegram Notifications

Simplified notifications include:
- 🚀 **Bot Started** - When automation begins
- ✅ **Applied to Company** - After each successful application  
- 🏁 **Bot Stopped** - When run completes with total count

## Troubleshooting

### Login Issues
- Delete `session.json` file if login fails
- Manually complete CAPTCHA if required
- Check LinkedIn credentials in `.env`

### Form Filling Issues
- Verify AI API keys are valid
- Check `src/config.js` skill mappings
- Review screenshots in `screenshots/` folder

### Pagination Issues
- Bot automatically handles LinkedIn pagination
- Searches up to 10 pages per keyword combination
- Stops when 10 applications are completed

## File Structure

```
linkedin-bot/
├── src/
│   ├── bot.js          # Main automation logic
│   ├── ai.js           # AI-powered form answers
│   ├── config.js       # Your profile & settings
│   ├── telegram.js     # Notification system
│   ├── sheets.js       # Google Sheets tracking
│   └── helpers.js      # Utility functions
├── screenshots/        # Error screenshots
├── session.json        # Saved login session
└── .env               # Environment variables
```

## Safety Features

- **Human-like delays**: Random delays between actions
- **Error handling**: Graceful failure recovery
- **Duplicate prevention**: Tracks already applied jobs
- **Session persistence**: Reduces login frequency
- **Screenshot capture**: Saves error states for debugging

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Review screenshots in the `screenshots/` folder
3. Verify all environment variables are set correctly

---

⚡ **Automate your job search while you focus on interview prep!**