require('dotenv').config();
const axios = require('axios');
const { log } = require('./helpers');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const sendMessage = async (message) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    log('Telegram notification sent');
  } catch (error) {
    log(`Telegram error: ${error.message}`, 'ERROR');
  }
};

// Called after every successful application
const notifyJobApplied = async ({ title, company }) => {
  const message = `✅ Applied to <b>${company}</b> — ${title}`;
  await sendMessage(message);
};

// Called if bot crashes or hits an error
const notifyError = async (errorMessage) => {
  await sendMessage(`❌ <b>Bot Error:</b> ${errorMessage}`);
};

// Called when bot starts a new run
const notifyBotStarted = async () => {
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  await sendMessage(`🚀 <b>Bot Started</b> — ${time}`);
};

// Called when bot finishes a run
const notifyRunComplete = async (count) => {
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  await sendMessage(`🏁 <b>Bot Stopped</b> — Applied to <b>${count}</b> jobs\n⏰ ${time}`);
};

module.exports = { notifyJobApplied, notifyError, notifyBotStarted, notifyRunComplete };