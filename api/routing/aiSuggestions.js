const express = require('express');
const { cleanText } = require('./routeHelpers');
const { requestGeminiText } = require('./aiHelpers');

const router = express.Router();

router.post('/', async (req, res) => {
  const strText = cleanText(req.body.text);
  const strSection = cleanText(req.body.section) || 'resume entry';

  if (!strText) {
    return res.status(400).json({ error: 'Text is required before requesting AI suggestions.' });
  }

  if (strText.length > 1200) {
    return res.status(400).json({ error: 'Text must be 1200 characters or fewer.' });
  }

  try {
    const objResult = await requestGeminiText(
      `Here is what I have for ${strSection} for my resume how can I make this sound better?

Original ${strSection}:
${strText}

Return only the actual resume improvements. Do not include an introduction, greeting, markdown, bold text, or explanation like "Okay" or "let's transform". Complete every sentence. Keep the revision concise enough to fit on a resume. Use this exact plain-text format:

Suggested Revision:
[write the improved resume-ready wording here]

What Changed:
- [brief change]
- [brief change]
- [brief change]`,
      1200
    );

    if (objResult.error) {
      return res.status(objResult.status).json({ error: objResult.error });
    }

    res.status(200).json({
      finishReason: objResult.finishReason,
      suggestion: objResult.text || 'No suggestion was returned.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to reach Gemini. Check your API key and internet connection.' });
  }
});

module.exports = router;
