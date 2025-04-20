const express = require('express');
const dotenv = require('dotenv');
const noblox = require('noblox.js');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const botSessions = {};

async function loginBots() {
  const bots = JSON.parse(process.env.BOTS_JSON);
  for (const [botId, cookie] of Object.entries(bots)) {
    try {
      const botInstance = new noblox.Noblox();
      await botInstance.setCookie(cookie);
      const user = await botInstance.getCurrentUser();
      botSessions[botId] = botInstance;
      console.log(`✅ Logged in as ${user.UserName} [${botId}]`);
    } catch (err) {
      console.error(`❌ Failed to login bot ${botId}:`, err.message);
    }
  }
}

loginBots();

app.post('/rank', async (req, res) => {
  const { botId, userId, groupId, rankId } = req.body;

  if (!botId || !userId || !groupId || !rankId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const bot = botSessions[botId];

  if (!bot) {
    return res.status(404).json({ error: `Bot "${botId}" is not logged in or doesn’t exist` });
  }

  try {
    await bot.setRank(groupId, userId, rankId);
    res.json({ success: true, message: `Ranked user ${userId} to ${rankId} using ${botId}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔧 Ranking API running on port ${PORT}`);
});
