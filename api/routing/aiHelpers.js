const { getDatabase } = require('../database');
const { cleanText } = require('./routeHelpers');

const getGeminiApiKey = () => {
  const objStoredKey = getDatabase().prepare("SELECT value FROM settings WHERE key = 'geminiApiKey'").get();
  return cleanText(objStoredKey ? objStoredKey.value : process.env.GEMINI_API_KEY);
};

const requestGeminiText = async (strPrompt, intMaxOutputTokens = 700) => {
  const strApiKey = getGeminiApiKey();

  if (!strApiKey) {
    return {
      status: 400,
      error: 'Save your Gemini API key in Settings before requesting AI help.'
    };
  }

  const objResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': strApiKey
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: strPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: intMaxOutputTokens
      }
    })
  });

  const objData = await objResponse.json();

  if (!objResponse.ok) {
    return {
      status: objResponse.status,
      error: objData.error?.message || 'Gemini could not generate a response.'
    };
  }

  return {
    status: 200,
    finishReason: objData.candidates?.[0]?.finishReason || '',
    text: objData.candidates?.[0]?.content?.parts?.map((objPart) => objPart.text).join('\n').trim() || ''
  };
};

module.exports = {
  getGeminiApiKey,
  requestGeminiText
};
