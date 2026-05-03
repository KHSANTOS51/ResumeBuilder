const express = require('express');
const { getDatabase } = require('../database');
const { cleanText, sendDatabaseError, validateLength } = require('./routeHelpers');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const objProfile = getDatabase().prepare('SELECT * FROM profile WHERE id = 1').get();
    res.status(200).json([objProfile]);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.put('/', (req, res) => {
  const arrFields = ['fullName', 'headline', 'email', 'phone', 'location', 'website', 'summary'];
  const strLengthError = validateLength(req.body, arrFields);

  if (strLengthError) {
    return res.status(400).json({ error: strLengthError });
  }

  try {
    const objProfile = {
      fullName: cleanText(req.body.fullName),
      headline: cleanText(req.body.headline),
      email: cleanText(req.body.email),
      phone: cleanText(req.body.phone),
      location: cleanText(req.body.location),
      website: cleanText(req.body.website),
      summary: cleanText(req.body.summary)
    };

    getDatabase().prepare(`
      UPDATE profile
      SET fullName = ?, headline = ?, email = ?, phone = ?, location = ?, website = ?, summary = ?
      WHERE id = 1
    `).run(objProfile.fullName, objProfile.headline, objProfile.email, objProfile.phone, objProfile.location, objProfile.website, objProfile.summary);

    res.status(200).json(objProfile);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
