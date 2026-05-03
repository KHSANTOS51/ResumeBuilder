const express = require('express');
const { getDatabase } = require('../database');
const { saveEnvValue } = require('../envFile');
const { cleanText, sendDatabaseError } = require('./routeHelpers');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const arrSettings = getDatabase().prepare(`
      SELECT key, CASE WHEN key = 'geminiApiKey' AND value <> '' THEN 'saved' ELSE value END AS value
      FROM settings
      ORDER BY key
    `).all();

    res.status(200).json(arrSettings);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.put('/', (req, res) => {
  const strGeminiApiKey = cleanText(req.body.geminiApiKey);
  const strResumeStyle = cleanText(req.body.resumeStyle);

  try {
    if (strGeminiApiKey) {
      getDatabase().prepare(`
        INSERT INTO settings (key, value)
        VALUES ('geminiApiKey', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(strGeminiApiKey);
      saveEnvValue('GEMINI_API_KEY', strGeminiApiKey);
    }

    if (strResumeStyle) {
      getDatabase().prepare(`
        INSERT INTO settings (key, value)
        VALUES ('resumeStyle', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(strResumeStyle);
    }

    res.status(200).json({ message: 'Settings saved.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
