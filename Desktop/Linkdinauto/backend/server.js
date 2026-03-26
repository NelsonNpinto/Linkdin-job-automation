const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const botProcesses = {};

// ── CONFIG ─────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  if (!fs.existsSync(CONFIG_FILE)) return res.json({});
  res.json(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')));
});

app.post('/api/config', (req, res) => {
  const existing = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) : {};
  const updated = { ...existing, ...req.body };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
  res.json({ success: true });
});

// ── BOT ────────────────────────────────────────────────
app.post('/api/bot/start', (req, res) => {
  if (botProcesses['single']) {
    return res.status(400).json({ error: 'Bot already running' });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    return res.status(404).json({ error: 'Config not found. Please complete setup first.' });
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return res.status(500).json({ error: 'Failed to read config' });
  }

  if (!config.linkedinEmail || !config.linkedinPassword) {
    return res.status(400).json({ error: 'LinkedIn credentials not set. Please complete Step 1.' });
  }

  const botPath = path.join(__dirname, '../linkedin-bot/src/bot.js');
  const botCwd = path.join(__dirname, '../linkedin-bot');
  const sessionPath = path.join(DATA_DIR, 'session.json');

  const child = spawn('node', [botPath], {
    env: {
      ...process.env,
      LINKEDIN_EMAIL: config.linkedinEmail,
      LINKEDIN_PASSWORD: config.linkedinPassword,
      GROQ_API_KEY: config.groqApiKey || '',
      GEMINI_API_KEY: config.geminiApiKey || '',
      PHONE_NUMBER: config.profile?.phone || '',
      LINKEDIN_URL: config.profile?.linkedinUrl || '',
      PORTFOLIO_URL: config.profile?.portfolioUrl || '',
      GOOGLE_SHEET_ID: config.googleSheetId || '',
      GOOGLE_CREDENTIALS_PATH: config.googleCredentialsPath || '',
      USER_CONFIG_PATH: CONFIG_FILE,
      SESSION_FILE: sessionPath,
      BOT_SINGLE_USER: 'true',
    },
    cwd: botCwd,
  });

  botProcesses['single'] = { process: child, startedAt: new Date().toISOString() };

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    for (const line of lines) {
      if (line.startsWith('HISTORY_LOG:')) {
        try {
          const entry = JSON.parse(line.slice('HISTORY_LOG:'.length));
          saveHistory(entry);
        } catch { /* ignore parse errors */ }
      } else {
        io.to('bot').emit('log', { message: line });
      }
    }
  });

  child.stderr.on('data', (data) => {
    io.to('bot').emit('log', { message: data.toString(), type: 'error' });
  });

  child.on('close', (code) => {
    delete botProcesses['single'];
    io.to('bot').emit('bot-stopped', { code });
  });

  child.on('error', (err) => {
    delete botProcesses['single'];
    io.to('bot').emit('log', { message: `Failed to start bot: ${err.message}`, type: 'error' });
    io.to('bot').emit('bot-stopped', { code: 1 });
  });

  res.json({ success: true });
});

app.post('/api/bot/stop', (req, res) => {
  if (botProcesses['single']) {
    botProcesses['single'].process.kill('SIGTERM');
    delete botProcesses['single'];
  }
  res.json({ success: true });
});

app.get('/api/bot/status', (req, res) => {
  const proc = botProcesses['single'];
  res.json({
    running: !!proc,
    startedAt: proc?.startedAt || null,
  });
});

// ── HISTORY ────────────────────────────────────────────
const saveHistory = (entry) => {
  const existing = fs.existsSync(HISTORY_FILE)
    ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    : [];
  existing.unshift({ ...entry, savedAt: new Date().toISOString() });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(existing, null, 2));
  io.to('bot').emit('history-update', entry);
};

app.get('/api/history', (req, res) => {
  if (!fs.existsSync(HISTORY_FILE)) return res.json([]);
  res.json(JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')));
});

app.delete('/api/history', (req, res) => {
  if (fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]');
  res.json({ success: true });
});

// ── SOCKET.IO ──────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-bot', () => socket.join('bot'));
  socket.on('leave-bot', () => socket.leave('bot'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`LinkedIn Bot Backend running on http://localhost:${PORT}`);
});
