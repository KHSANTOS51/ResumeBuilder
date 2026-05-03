const express = require('express');
const { requestGeminiText } = require('./aiHelpers');
const { cleanText } = require('./routeHelpers');

const router = express.Router();

const getStyleDescriptor = (strStyle) => {
  const objDescriptors = {
    classic: 'classic professional',
    modern: 'modern polished',
    compact: 'compact one-page'
  };

  return objDescriptors[strStyle] || 'professional';
};

const extractJson = (strText) => {
  const strCleanText = strText.replace(/```json|```/g, '').trim();
  const intStart = strCleanText.indexOf('{');
  const intEnd = strCleanText.lastIndexOf('}');

  if (intStart === -1 || intEnd === -1) {
    return null;
  }

  try {
    return JSON.parse(strCleanText.slice(intStart, intEnd + 1));
  } catch (error) {
    return null;
  }
};

const getSelectedResumePrompt = (objResumeData, strDescriptor) => `
Here is all the different sections of a resume build me ${strDescriptor} resume.

Use only the facts in the JSON below. Do not invent companies, dates, awards, credentials, or metrics. Improve wording, action verbs, structure, and clarity.

Return valid JSON only. Do not use markdown. The JSON must match this shape:
{
  "profile": {
    "fullName": "",
    "headline": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "summary": ""
  },
  "jobs": [
    {
      "company": "",
      "title": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "responsibilities": [""]
    }
  ],
  "skills": [
    {
      "category": "",
      "name": "",
      "detail": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "dateEarned": "",
      "detail": ""
    }
  ],
  "awards": [
    {
      "name": "",
      "issuer": "",
      "dateReceived": "",
      "detail": ""
    }
  ],
  "improvementNotes": [""]
}

Selected resume sections:
${JSON.stringify(objResumeData, null, 2)}
`;

router.post('/', async (req, res) => {
  const strStyle = cleanText(req.body.style) || 'classic';
  const strDescriptor = cleanText(req.body.descriptor) || getStyleDescriptor(strStyle);
  const objResumeData = req.body.resumeData;

  if (!objResumeData || typeof objResumeData !== 'object') {
    return res.status(400).json({ error: 'Selected resume data is required.' });
  }

  try {
    const objResult = await requestGeminiText(
      getSelectedResumePrompt({ ...objResumeData, style: strStyle }, strDescriptor),
      1600
    );

    if (objResult.error) {
      return res.status(objResult.status).json({ error: objResult.error });
    }

    res.status(200).json({
      draft: objResult.text || 'Gemini did not return a resume draft.',
      resume: extractJson(objResult.text || '')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to reach Gemini. Check your API key and internet connection.' });
  }
});

module.exports = router;
